"""
Pregenerate summaries at every depth (1-4) for every chapter of a given book.

Idempotent: skips chapters whose summary file already exists, unless --override
is passed. Skips chapters flagged as isNonChapter in metadata.json (except for
depth 1, which is what determines the flag in the first place).

Usage:
    python -m scripts.pregenerate_summaries <book_dir>
    python -m scripts.pregenerate_summaries <book_dir> --override
    python -m scripts.pregenerate_summaries <book_dir> --depths 1 2
    python -m scripts.pregenerate_summaries <book_dir> --workers 4

<book_dir> is the path to a single book folder under backend/books/, e.g.:
    backend/books/Golden\\ Son\\ Red\\ Rising\\ Trilogy\\ 2015_epub_9ac31c75
"""

from __future__ import annotations

import argparse
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

# Allow running as `python scripts/pregenerate_summaries.py` from backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.summarizer import summarize_chapter_file  # noqa: E402

ALL_DEPTHS = (1, 2, 3, 4)


def load_metadata(book_dir: Path) -> dict | None:
    metadata_path = book_dir / "metadata.json"
    if not metadata_path.exists():
        return None
    with open(metadata_path, "r", encoding="utf-8") as f:
        return json.load(f)


def non_chapter_numbers(metadata: dict | None) -> set[int]:
    if not metadata:
        return set()
    return {c["number"] for c in metadata.get("chapters", []) if c.get("isNonChapter")}


def generate_one(
    chapter_path: Path,
    summary_path: Path,
    depth: int,
    override: bool,
) -> tuple[Path, str]:
    if summary_path.exists() and not override:
        return summary_path, "skipped"
    summarize_chapter_file(chapter_path, summary_path, depth)
    return summary_path, "generated"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("book_dir", help="Path to a book directory under backend/books/")
    parser.add_argument(
        "--override",
        action="store_true",
        help="Regenerate summaries even if the output file already exists.",
    )
    parser.add_argument(
        "--depths",
        type=int,
        nargs="+",
        choices=ALL_DEPTHS,
        default=list(ALL_DEPTHS),
        help="Which depth levels to generate (default: 1 2 3 4).",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="Parallel API calls (default: 1). Increase to speed up; mind rate limits.",
    )
    args = parser.parse_args()

    book_dir = Path(args.book_dir).resolve()
    chapters_dir = book_dir / "chapters"
    summaries_dir = book_dir / "summaries"

    if not chapters_dir.is_dir():
        print(f"Error: {chapters_dir} does not exist", file=sys.stderr)
        return 1

    summaries_dir.mkdir(parents=True, exist_ok=True)
    metadata = load_metadata(book_dir)
    skip_numbers = non_chapter_numbers(metadata)

    chapter_files = sorted(
        chapters_dir.glob("chapter-*.txt"),
        key=lambda p: int(p.stem.split("-")[1]),
    )
    if not chapter_files:
        print(f"No chapter files found in {chapters_dir}", file=sys.stderr)
        return 1

    # Build the work list. Depth 1 always runs (it's how non-chapter detection
    # happens). For depths > 1, skip chapters known to be non-story content.
    jobs: list[tuple[Path, Path, int]] = []
    for chapter_path in chapter_files:
        chapter_num = int(chapter_path.stem.split("-")[1])
        for depth in args.depths:
            if depth > 1 and chapter_num in skip_numbers:
                continue
            summary_path = summaries_dir / f"chapter-{chapter_num}-depth-{depth}.txt"
            jobs.append((chapter_path, summary_path, depth))

    print(
        f"Book: {book_dir.name}\n"
        f"Chapters: {len(chapter_files)} | Depths: {args.depths} | "
        f"Jobs: {len(jobs)} | Workers: {args.workers} | Override: {args.override}"
    )

    counts = {"generated": 0, "skipped": 0, "failed": 0}

    def run(job: tuple[Path, Path, int]) -> tuple[Path, str, str | None]:
        chapter_path, summary_path, depth = job
        try:
            path, status = generate_one(chapter_path, summary_path, depth, args.override)
            return path, status, None
        except Exception as e:  # noqa: BLE001
            return summary_path, "failed", str(e)

    if args.workers <= 1:
        for job in jobs:
            path, status, err = run(job)
            counts[status] += 1
            tag = {"generated": "+", "skipped": "=", "failed": "x"}[status]
            print(f"  {tag} {path.name}" + (f"  [{err}]" if err else ""))
    else:
        with ThreadPoolExecutor(max_workers=args.workers) as ex:
            futures = [ex.submit(run, job) for job in jobs]
            for fut in as_completed(futures):
                path, status, err = fut.result()
                counts[status] += 1
                tag = {"generated": "+", "skipped": "=", "failed": "x"}[status]
                print(f"  {tag} {path.name}" + (f"  [{err}]" if err else ""))

    print(
        f"\nDone. generated={counts['generated']} "
        f"skipped={counts['skipped']} failed={counts['failed']}"
    )
    return 0 if counts["failed"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())

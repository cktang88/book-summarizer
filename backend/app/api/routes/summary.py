from fastapi import APIRouter, HTTPException
from ...services.books import BookService
from ...summarizer import summarize_chapter_file
from ...services.queue import ChapterTask, queue
import os
from pathlib import Path

router = APIRouter()

# Initialize services with the same books directory as queue
BOOKS_DIR = os.getenv("BOOKS_DIR", "./books")
book_service = BookService(BOOKS_DIR)


@router.get("/summary/{book_id}")
async def get_book_summary(book_id: str, depth: int = 1, section: str | None = None):
    """Get summary for a book or specific section with configurable depth"""
    try:
        # Get book details to verify it exists
        book = book_service.get_book(book_id)
        book_dir = Path(BOOKS_DIR) / book_id

        # If section is specified, get summary for that section
        if section and section.startswith("chapter-"):
            chapter_num = int(section.split("-")[1])
            chapter_file = book_dir / "chapters" / f"chapter-{chapter_num}.txt"
            summary_file = (
                book_dir / "summaries" / f"chapter-{chapter_num}-depth-{depth}.txt"
            )

            # Check if summary exists
            summary_text = None
            if summary_file.exists():
                with open(summary_file, "r") as f:
                    summary_text = f.read()
            else:
                # Generate and save summary
                summary_text = summarize_chapter_file(
                    chapter_file, summary_file, depth=depth
                )

            return {
                "text": summary_text,
                "id": section,
                "title": f"Chapter {chapter_num}",
                "depth": depth,
            }

        # For initial summary (depth=1), return chapter list with basic summaries
        summaries = []

        # Get all chapters
        chapters_dir = book_dir / "chapters"
        summaries_dir = book_dir / "summaries"
        summaries_dir.mkdir(exist_ok=True)

        # Process each chapter
        for i, chapter in enumerate(book["metadata"]["chapters"], 1):
            chapter_file = chapters_dir / f"chapter-{i}.txt"
            summary_file = summaries_dir / f"chapter-{i}-depth-{depth}.txt"

            # Check if summary exists
            summary_text = None
            if summary_file.exists():
                with open(summary_file, "r") as f:
                    summary_text = f.read()
            else:
                # Generate and save summary
                summary_text = summarize_chapter_file(
                    chapter_file, summary_file, depth=depth
                )

            summaries.append(
                {
                    "id": f"chapter-{i}",
                    "title": chapter["title"],
                    "content": summary_text,
                    "depth": depth,
                }
            )

        return {
            "id": "root",
            "title": book["title"],
            "content": "",  # Root content is empty, chapters contain content
            "depth": 0,
            "sections": summaries,
        }

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/books/{book_id}/non-chapters")
async def get_non_chapters(book_id: str):
    """Get list of chapter IDs that are marked as non-chapters in metadata"""
    try:
        # Get book details to verify it exists
        book = book_service.get_book(book_id)

        # Get non-chapters from metadata
        non_chapters = [
            f"chapter-{chapter['number']}"
            for chapter in book["metadata"]["chapters"]
            if chapter.get("isNonChapter", False)
        ]

        return {"non_chapters": non_chapters}

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/books/{book_id}/chapters/{chapter_id}/summary")
async def delete_chapter_summaries(book_id: str, chapter_id: str):
    """Delete all summaries for a specific chapter"""
    try:
        # Get book details to verify it exists
        book_service.get_book(book_id)
        book_dir = Path(BOOKS_DIR) / book_id
        summaries_dir = book_dir / "summaries"

        # Extract chapter number from chapter_id
        chapter_num = int(chapter_id.split("-")[1])

        # Delete all depth summaries for this chapter
        deleted_files = []
        for depth in range(1, 5):  # Depths 1-4
            summary_file = summaries_dir / f"chapter-{chapter_num}-depth-{depth}.txt"
            if summary_file.exists():
                summary_file.unlink()
                deleted_files.append(str(summary_file))

        # Update the chapter status in the queue to pending
        if book_id in queue.processing:
            if chapter_id in queue.processing[book_id]:
                queue.processing[book_id][chapter_id]["status"] = "pending"

        # Add chapter back to the queue for reprocessing
        queue.queue.append(
            ChapterTask(
                book_id=book_id,
                chapter_id=chapter_id,
                chapter_title=f"Chapter {chapter_num}",
            )
        )

        return {
            "status": "success",
            "message": f"Deleted {len(deleted_files)} summary files",
            "deleted_files": deleted_files,
        }

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

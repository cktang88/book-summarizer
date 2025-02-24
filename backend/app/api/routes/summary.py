from fastapi import APIRouter, HTTPException
from ...services.books import BookService
from ...summarizer import summarize_chapter_file
import os
from pathlib import Path

router = APIRouter()

# Initialize services with the same books directory as queue
BOOKS_DIR = os.getenv("BOOKS_DIR", "./books")
book_service = BookService(BOOKS_DIR)


@router.get("/summary/{book_id}")
async def get_book_summary(book_id: str, depth: int = 1):
    """Get summary for a book or specific section"""
    try:
        # Get book details to verify it exists
        book = book_service.get_book(book_id)
        book_dir = Path(BOOKS_DIR) / book_id

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
                    "sections": [],  # Will be populated when this section is expanded
                }
            )

        return {
            "id": "root",
            "title": book["title"],
            "content": "",  # Root content is empty, chapters contain the content
            "depth": 0,
            "sections": summaries,
        }

    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

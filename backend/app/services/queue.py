from dataclasses import dataclass
from typing import Dict, List
import time
import os
from pathlib import Path
from ..summarizer import summarize_chapter_file


@dataclass
class ChapterTask:
    book_id: str
    chapter_id: str
    chapter_title: str
    depth: int = 1


class ProcessingQueue:
    def __init__(self, books_dir: str, rate_limit: float = 1.0):
        self.books_dir = Path(books_dir)
        self.rate_limit = rate_limit  # seconds between requests
        self.last_process_time = 0.0
        self.queue: List[ChapterTask] = []
        self.processing: Dict[str, Dict[str, str]] = (
            {}
        )  # book_id -> chapter_id -> status

    def add_book(self, book_id: str, chapters: List[dict]) -> None:
        """Add all chapters from a book to the queue"""
        # Reset processing status for this book
        self.processing[book_id] = {}

        # Add each chapter to queue
        for i, chapter in enumerate(chapters, 1):
            chapter_id = f"chapter-{i}"
            self.queue.append(
                ChapterTask(
                    book_id=book_id,
                    chapter_id=chapter_id,
                    chapter_title=chapter["title"],
                )
            )
            # Mark as pending
            self.processing[book_id][chapter_id] = "pending"

    def get_status(self, book_id: str) -> dict:
        """Get processing status for a book"""
        if book_id not in self.processing:
            return {"totalChapters": 0, "completedChapters": 0, "chapters": []}

        chapters = []
        completed = 0
        for chapter_id, status in self.processing[book_id].items():
            if status == "complete":
                completed += 1
            chapters.append(
                {
                    "id": chapter_id,
                    "title": chapter_id,
                    # We could store title in processing dict if needed
                    "status": status,
                    "error": None,
                }
            )

        return {
            "totalChapters": len(chapters),
            "completedChapters": completed,
            "chapters": chapters,
        }

    def process_next(self) -> None:
        """Process the next chapter in queue, respecting rate limit"""
        if not self.queue:
            return

        # Check rate limit
        now = time.time()
        if now - self.last_process_time < self.rate_limit:
            return

        # Get next task
        task = self.queue.pop(0)

        try:
            # Mark as processing
            self.processing[task.book_id][task.chapter_id] = "processing"

            # Get file paths
            chapter_file = (
                self.books_dir / task.book_id / "chapters" / f"{task.chapter_id}.txt"
            )
            summary_file = (
                self.books_dir
                / task.book_id
                / "summaries"
                / f"{task.chapter_id}-depth-{task.depth}.txt"
            )

            # Check cache first
            if summary_file.exists():
                self.processing[task.book_id][task.chapter_id] = "complete"
                return

            # Generate summary
            summarize_chapter_file(chapter_file, summary_file, task.depth)

            # Mark as complete
            self.processing[task.book_id][task.chapter_id] = "complete"

        except Exception as e:
            # Mark as error
            self.processing[task.book_id][task.chapter_id] = "error"
            print("Error processing chapter " f"{task.chapter_id}: {str(e)}")

        finally:
            self.last_process_time = time.time()

    def retry_chapter(self, book_id: str, chapter_id: str) -> None:
        """Retry processing a failed chapter"""
        if book_id not in self.processing:
            raise ValueError(f"Book {book_id} not found")
        if chapter_id not in self.processing[book_id]:
            raise ValueError(f"Chapter {chapter_id} not found")
        if self.processing[book_id][chapter_id] != "error":
            raise ValueError(f"Chapter {chapter_id} is not in error state")

        # Find chapter title from metadata
        chapter_title = chapter_id  # Default to ID if title not found
        metadata_file = self.books_dir / book_id / "metadata.json"
        if metadata_file.exists():
            import json

            with open(metadata_file) as f:
                metadata = json.load(f)
                for chapter in metadata["chapters"]:
                    if f"chapter-{chapter['number']}" == chapter_id:
                        chapter_title = chapter["title"]
                        break

        # Add back to queue
        self.queue.append(
            ChapterTask(
                book_id=book_id, chapter_id=chapter_id, chapter_title=chapter_title
            )
        )
        # Mark as pending
        self.processing[book_id][chapter_id] = "pending"


# Global queue instance
BOOKS_DIR = os.getenv("BOOKS_DIR", "./books")
queue = ProcessingQueue(BOOKS_DIR)

from dataclasses import dataclass
from typing import Dict, List
import time
import os
import logging
from pathlib import Path
from ..summarizer import summarize_chapter_file

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create a formatter that includes timestamp
formatter = logging.Formatter(
    "%(asctime)s - %(levelname)s - %(message)s", datefmt="%Y-%m-%d %H:%M:%S"
)

# Create console handler if not already added
if not logger.handlers:
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)


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
        # Store both status and title for each chapter
        self.processing: Dict[str, Dict[str, dict]] = {}
        logger.info(f"Initialized ProcessingQueue with books_dir={books_dir}")

    def add_book(self, book_id: str, chapters: List[dict]) -> None:
        """Add all chapters from a book to the queue"""
        # Reset processing status for this book
        self.processing[book_id] = {}
        logger.info(f"Adding book {book_id} to queue with {len(chapters)} chapters")

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
            # Store both status and title
            self.processing[book_id][chapter_id] = {
                "status": "pending",
                "title": chapter["title"],
            }
            logger.debug(
                "Queued chapter {}: {} for book {}".format(
                    chapter_id, chapter["title"], book_id
                )
            )

    def get_status(self, book_id: str) -> dict:
        """Get processing status for a book"""
        if book_id not in self.processing:
            logger.warning(f"Status requested for unknown book: {book_id}")
            return {"totalChapters": 0, "completedChapters": 0, "chapters": []}

        chapters = []
        completed = 0
        for chapter_id, info in self.processing[book_id].items():
            if info["status"] == "complete":
                completed += 1
            chapters.append(
                {
                    "id": chapter_id,
                    "title": info["title"],
                    "status": info["status"],
                    "error": None,
                }
            )

        status = {
            "totalChapters": len(chapters),
            "completedChapters": completed,
            "chapters": chapters,
        }
        logger.debug(
            f"Book {book_id} status: {completed}/{len(chapters)} chapters complete"
        )
        return status

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
        book_id = task.book_id
        chapter_id = task.chapter_id

        logger.info(
            "Processing chapter {}: {} for book {}".format(
                chapter_id, task.chapter_title, book_id
            )
        )

        try:
            # Mark as processing
            self.processing[book_id][chapter_id]["status"] = "processing"

            # Get file paths
            chapter_file = self.books_dir / book_id / "chapters" / f"{chapter_id}.txt"
            summary_file = (
                self.books_dir
                / book_id
                / "summaries"
                / f"{chapter_id}-depth-{task.depth}.txt"
            )

            # Check cache first
            if summary_file.exists():
                self.processing[book_id][chapter_id]["status"] = "complete"
                logger.info(f"Chapter {chapter_id} already summarized, using cache")
                return

            # Generate summary
            logger.info(f"Generating summary for chapter {chapter_id}")
            summarize_chapter_file(chapter_file, summary_file, task.depth)

            # Mark as complete
            self.processing[book_id][chapter_id]["status"] = "complete"
            logger.info("Successfully completed chapter {} summary".format(chapter_id))

        except Exception as e:
            # Mark as error
            self.processing[book_id][chapter_id]["status"] = "error"
            logger.error(
                "Error processing chapter {}: {}".format(chapter_id, str(e)),
                exc_info=True,
            )

        finally:
            self.last_process_time = time.time()

    def retry_chapter(self, book_id: str, chapter_id: str) -> None:
        """Retry processing a failed chapter"""
        if book_id not in self.processing:
            msg = f"Book {book_id} not found"
            logger.error(msg)
            raise ValueError(msg)
        if chapter_id not in self.processing[book_id]:
            msg = f"Chapter {chapter_id} not found"
            logger.error(msg)
            raise ValueError(msg)
        if self.processing[book_id][chapter_id]["status"] != "error":
            msg = f"Chapter {chapter_id} is not in error state"
            logger.error(msg)
            raise ValueError(msg)

        logger.info(f"Retrying failed chapter {chapter_id} for book {book_id}")

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
        task = ChapterTask(
            book_id=book_id, chapter_id=chapter_id, chapter_title=chapter_title
        )
        self.queue.append(task)

        # Mark as pending
        self.processing[book_id][chapter_id]["status"] = "pending"
        self.processing[book_id][chapter_id]["title"] = chapter_title
        logger.info(f"Requeued chapter {chapter_id} for processing")


# Global queue instance
BOOKS_DIR = os.getenv("BOOKS_DIR", "./books")
queue = ProcessingQueue(BOOKS_DIR)

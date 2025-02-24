import json
from pathlib import Path
from typing import List
from datetime import datetime
import os


class BookService:
    def __init__(self, books_dir: str | Path):
        self.books_dir = Path(books_dir)
        self.books_dir.mkdir(parents=True, exist_ok=True)

    def list_books(self) -> List[dict]:
        """List all books in the books directory"""
        books = []

        for book_dir in self.books_dir.iterdir():
            if not book_dir.is_dir():
                continue

            metadata_file = book_dir / "metadata.json"
            if not metadata_file.exists():
                continue

            try:
                with open(metadata_file, "r") as f:
                    metadata = json.load(f)

                # Get creation time of the directory as upload time
                upload_time = datetime.fromtimestamp(os.path.getctime(book_dir))

                books.append(
                    {
                        "id": book_dir.name,
                        "title": metadata.get("title", "Untitled"),
                        "uploadedAt": upload_time.isoformat(),
                    }
                )
            except (json.JSONDecodeError, IOError):
                continue

        # Sort by upload time, newest first
        books.sort(key=lambda x: x["uploadedAt"], reverse=True)
        return books

    def get_book(self, book_id: str) -> dict:
        """Get a specific book's details"""
        book_dir = self.books_dir / book_id
        if not book_dir.exists():
            raise FileNotFoundError(f"Book not found: {book_id}")

        metadata_file = book_dir / "metadata.json"
        if not metadata_file.exists():
            raise FileNotFoundError(f"Book metadata not found: {book_id}")

        with open(metadata_file, "r") as f:
            metadata = json.load(f)

        upload_time = datetime.fromtimestamp(os.path.getctime(book_dir))

        return {
            "id": book_id,
            "title": metadata.get("title", "Untitled"),
            "uploadedAt": upload_time.isoformat(),
            "metadata": metadata,
        }

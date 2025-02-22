import os
import subprocess
from pathlib import Path
from typing import Literal, cast
import pypdf
from fastapi import UploadFile

FileType = Literal["pdf", "epub", "mobi"]


class DocumentProcessor:
    def __init__(self, books_dir: str):
        self.books_dir = Path(books_dir)
        self.books_dir.mkdir(parents=True, exist_ok=True)

    def _get_file_type(self, filename: str) -> FileType:
        ext = filename.lower().split(".")[-1]
        if ext not in ["pdf", "epub", "mobi"]:
            raise ValueError(f"Unsupported file type: {ext}")
        return cast(FileType, ext)

    async def process_document(self, file: UploadFile) -> tuple[str, str]:
        """Process uploaded document and return (book_id, text_content)"""
        file_type = self._get_file_type(file.filename)

        # Create unique book directory
        book_id = file.filename.replace(".", "_") + "_" + os.urandom(4).hex()
        book_dir = self.books_dir / book_id
        book_dir.mkdir(parents=True)

        # Save uploaded file
        file_path = book_dir / file.filename
        content = await file.read()
        file_path.write_bytes(content)

        # Convert to text based on file type
        if file_type == "pdf":
            text = self._process_pdf(file_path)
        else:
            text = self._process_epub_mobi(file_path, file_type)

        # Save extracted text
        text_path = book_dir / "book.txt"
        text_path.write_text(text)

        return book_id, text

    def _process_pdf(self, file_path: Path) -> str:
        """Extract text from PDF using PyPDF2"""
        text = []
        with open(file_path, "rb") as file:
            pdf = pypdf.PdfReader(file)
            for page in pdf.pages:
                text.append(page.extract_text())
        return "\n\n".join(text)

    def _process_epub_mobi(self, file_path: Path, file_type: FileType) -> str:
        """Convert epub/mobi to text using pandoc"""
        result = subprocess.run(
            ["pandoc", "-f", file_type, "-t", "plain", str(file_path)],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout

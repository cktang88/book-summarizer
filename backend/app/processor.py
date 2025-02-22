import os
import pypandoc
import subprocess
from pathlib import Path
from typing import Literal, cast, List, Optional, Dict
import PyPDF2 as pypdf
from fastapi import UploadFile
import re
import json
from dataclasses import dataclass

FileType = Literal["pdf", "epub", "mobi"]
OutputFormat = Literal["text", "markdown"]


@dataclass
class Chapter:
    title: str
    content: str
    start_page: int = 0


@dataclass
class ProcessedDocument:
    book_id: str
    title: str
    text_content: str
    markdown_content: str
    metadata: Dict


class DocumentProcessor:
    def __init__(self, books_dir: str):
        self.books_dir = Path(books_dir)
        self.books_dir.mkdir(parents=True, exist_ok=True)

    def _get_file_type(self, filename: str) -> FileType:
        ext = filename.lower().split(".")[-1]
        if ext not in ["pdf", "epub", "mobi"]:
            raise ValueError(f"Unsupported file type: {ext}")
        return cast(FileType, ext)

    def _clean_text(self, text: str) -> str:
        """Clean extracted text"""
        # Remove multiple newlines
        text = re.sub(r"\n{3,}", "\n\n", text)
        # Remove multiple spaces
        text = re.sub(r" +", " ", text)
        # Fix common OCR issues
        text = text.replace("|", "I")  # Common OCR mistake
        return text.strip()

    def _detect_chapters(
        self, text: str, page_numbers: Optional[List[int]] = None
    ) -> List[Chapter]:
        """Basic chapter detection"""
        chapters = []

        # Simple regex for chapter detection
        chapter_pattern = re.compile(
            r"^(?:Chapter|CHAPTER)\s+(?:[0-9]+|[IVXLC]+)[.\s]*(.*?)(?:\n|$)",
            re.MULTILINE,
        )

        # Split text into potential chapters
        matches = list(chapter_pattern.finditer(text))

        for i, match in enumerate(matches):
            start = match.start()
            end = matches[i + 1].start() if i < len(matches) - 1 else len(text)

            title = match.group().strip()
            content = text[start:end].strip()

            chapters.append(Chapter(title=title, content=content))

        # If no chapters found, treat as single chapter
        if not chapters:
            chapters = [Chapter(title="Full Text", content=text)]

        return chapters

    async def process_document(self, file: UploadFile) -> ProcessedDocument:
        """Process uploaded document and return processed content"""
        file_type = self._get_file_type(file.filename)

        # Create unique book directory
        book_id = file.filename.replace(".", "_") + "_" + os.urandom(4).hex()
        book_dir = self.books_dir / book_id
        book_dir.mkdir(parents=True)

        # Save uploaded file
        file_path = book_dir / file.filename
        content = await file.read()
        file_path.write_bytes(content)

        # Convert to both text and markdown
        if file_type == "pdf":
            text_content = self._process_pdf(file_path)
            # For PDF, we'll use pandoc to convert to markdown
            markdown_content = self._convert_to_markdown(file_path)
        else:
            text_content = self._process_epub_mobi(file_path, file_type, "plain")
            markdown_content = self._process_epub_mobi(file_path, file_type, "markdown")

        # Clean text content
        text_content = self._clean_text(text_content)

        # Detect chapters
        chapters = self._detect_chapters(text_content)

        # Save both formats
        text_path = book_dir / "book.txt"
        text_path.write_text(text_content)

        md_path = book_dir / "book.md"
        md_path.write_text(markdown_content)

        # Save basic metadata
        metadata = {
            "title": file.filename,
            "file_type": file_type,
            "formats": ["text", "markdown"],
            "chapters": [
                {"title": ch.title, "length": len(ch.content)} for ch in chapters
            ],
        }
        metadata_path = book_dir / "metadata.json"
        metadata_path.write_text(json.dumps(metadata, indent=2))

        return ProcessedDocument(
            book_id=book_id,
            title=file.filename,
            text_content=text_content,
            markdown_content=markdown_content,
            metadata=metadata,
        )

    def _process_pdf(self, file_path: Path) -> str:
        """Extract text from PDF using PyPDF2"""
        text = []
        with open(file_path, "rb") as file:
            pdf = pypdf.PdfReader(file)
            for page in pdf.pages:
                text.append(page.extract_text())
        return "\n\n".join(text)

    def _convert_to_markdown(self, file_path: Path) -> str:
        """Convert PDF to markdown using pandoc"""
        try:
            return pypandoc.convert_file(
                str(file_path), "markdown", format="pdf", extra_args=["--wrap=none"]
            )
        except Exception as e:
            print(f"Markdown conversion failed: {e}")
            return ""  # Fallback to empty string if conversion fails

    def _process_epub_mobi(
        self, file_path: Path, file_type: FileType, output: str
    ) -> str:
        """Convert epub/mobi to text/markdown using pandoc"""
        try:
            return pypandoc.convert_file(
                str(file_path), output, format=file_type, extra_args=["--wrap=none"]
            )
        except Exception as e:
            print(f"Conversion failed: {e}")
            return ""  # Fallback to empty string if conversion fails

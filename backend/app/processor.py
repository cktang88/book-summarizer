import os
import json
import re
from pathlib import Path
from typing import Literal, cast, List, Optional, Dict
from dataclasses import dataclass

import PyPDF2 as pypdf
import pypandoc
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
from fastapi import UploadFile
import subprocess

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

    def _process_epub(self, file_path: Path) -> tuple[str, str, List[Chapter]]:
        """Process epub file using ebooklib to extract text, markdown and chapters.

        Returns a tuple of (text_content, markdown_content, chapters).
        """
        book = epub.read_epub(str(file_path))

        # Extract metadata
        title = (
            book.get_metadata("DC", "title")[0][0]
            if book.get_metadata("DC", "title")
            else ""
        )

        chapters = []
        text_content = []
        markdown_content = []

        # Process each document in the epub
        for item in book.get_items_of_type(ebooklib.ITEM_DOCUMENT):
            # Convert HTML content to text and markdown
            soup = BeautifulSoup(item.get_content(), "html.parser")

            # Get chapter title if available
            chapter_title = soup.find(["h1", "h2"])
            title = (
                chapter_title.get_text().strip()
                if chapter_title
                else "Untitled Chapter"
            )

            # Get chapter content
            content = soup.get_text().strip()

            if content:  # Only add non-empty chapters
                chapters.append(
                    Chapter(
                        title=title,
                        content=content,
                        start_page=len(chapters),  # Chapter index as page
                    )
                )
                text_content.append(content)
                markdown_content.append(str(soup))

        return ("\n\n".join(text_content), "\n\n".join(markdown_content), chapters)

    async def process_document(self, file: UploadFile) -> ProcessedDocument:
        """Process uploaded document and return processed content"""
        file_type = self._get_file_type(file.filename)

        # Create unique book directory
        book_id = file.filename.replace(".", "_") + "_" + os.urandom(4).hex()
        book_dir = self.books_dir / book_id
        book_dir.mkdir(parents=True)

        # Create chapters and summaries directories
        chapters_dir = book_dir / "chapters"
        chapters_dir.mkdir()
        summaries_dir = book_dir / "summaries"
        summaries_dir.mkdir()

        # Save uploaded file
        file_path = book_dir / file.filename
        content = await file.read()
        file_path.write_bytes(content)

        # Process based on file type
        if file_type == "pdf":
            text_content = self._process_pdf(file_path)
            # For PDF, we'll use pandoc to convert to markdown
            markdown_content = self._convert_to_markdown(file_path)
            # Detect chapters from text content
            chapters = self._detect_chapters(text_content)
        elif file_type == "epub":
            # Use dedicated epub processing
            text_content, markdown_content, chapters = self._process_epub(file_path)
        else:
            # For other formats (mobi), still use pandoc
            text_content = self._process_epub_mobi(file_path, file_type, "plain")
            markdown_content = self._process_epub_mobi(file_path, file_type, "markdown")
            chapters = self._detect_chapters(text_content)

        # Clean text content
        text_content = self._clean_text(text_content)

        # Save chapters individually
        for i, chapter in enumerate(chapters, 1):
            # Save text version
            chapter_path = chapters_dir / f"chapter-{i}.txt"
            chapter_path.write_text(self._clean_text(chapter.content))

        # Save metadata
        metadata = {
            "title": file.filename,
            "file_type": file_type,
            "chapter_count": len(chapters),
            "chapters": [
                {
                    "number": i,
                    "title": ch.title,
                    "length": len(ch.content),
                    "isNonChapter": False,  # Default to False, will be updated when we get N/A summary
                }
                for i, ch in enumerate(chapters, 1)
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

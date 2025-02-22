import os
import shutil
from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile

BOOKS_DIR = Path("books")
ALLOWED_EXTENSIONS = {".pdf", ".epub", ".mobi"}


def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def is_valid_file(filename: str) -> bool:
    return get_file_extension(filename) in ALLOWED_EXTENSIONS


async def save_upload_file(upload_file: UploadFile) -> tuple[str, Path]:
    """
    Save an uploaded file and return its ID and path.
    """
    # Create books directory if it doesn't exist
    BOOKS_DIR.mkdir(exist_ok=True)

    # Generate a unique ID for the file
    file_id = str(uuid4())

    # Get the file extension and create the new filename
    extension = get_file_extension(upload_file.filename or "")
    if not extension:
        raise ValueError("File has no extension")

    if not is_valid_file(upload_file.filename or ""):
        raise ValueError("Invalid file type")

    # Create the file path
    file_path = BOOKS_DIR / f"{file_id}{extension}"

    # Save the file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()

    return file_id, file_path

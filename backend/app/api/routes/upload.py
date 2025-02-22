from fastapi import APIRouter, UploadFile, HTTPException, File
from ...processor import DocumentProcessor
import os

router = APIRouter()

# Initialize document processor
BOOKS_DIR = os.getenv("BOOKS_DIR", "./books")
doc_processor = DocumentProcessor(BOOKS_DIR)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        if not file.filename:
            raise ValueError("No filename provided")

        # Process the document
        result = await doc_processor.process_document(file)

        return {
            "bookId": result.book_id,
            "title": result.title,
            "formats": ["text", "markdown"],
            "metadata": result.metadata,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import APIRouter, HTTPException
from ...services.queue import queue
import logging

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()


@router.get("/books/{book_id}/status")
async def get_book_status(book_id: str):
    """Get the processing status for a book's chapters"""
    try:
        logger.info(f"Status requested for book {book_id}")
        logger.info(f"Current queue processing state: {queue.processing}")

        status = queue.get_status(book_id)
        logger.info(f"Status response for book {book_id}: {status}")

        return status
    except Exception as e:
        logger.error(
            f"Error getting status for book {book_id}: {str(e)}", exc_info=True
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/books/{book_id}/chapters/{chapter_id}/retry")
async def retry_chapter(book_id: str, chapter_id: str):
    """Retry processing a failed chapter"""
    try:
        queue.retry_chapter(book_id, chapter_id)
        return {"status": "queued"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

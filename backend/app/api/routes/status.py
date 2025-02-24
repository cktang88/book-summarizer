from fastapi import APIRouter, HTTPException
from ...services.queue import queue

router = APIRouter()


@router.get("/books/{book_id}/status")
async def get_book_status(book_id: str):
    """Get the processing status for a book's chapters"""
    try:
        return queue.get_status(book_id)
    except Exception as e:
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

from fastapi import APIRouter, HTTPException
from ...services.books import BookService
from ...services.queue import queue
import os
import logging

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()

# Initialize book service with the same books directory as queue
BOOKS_DIR = os.getenv("BOOKS_DIR", "./books")
book_service = BookService(BOOKS_DIR)


@router.get("/books")
async def list_books():
    """List all available books"""
    try:
        return book_service.list_books()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/books/{book_id}")
async def get_book(book_id: str):
    """Get a specific book's details"""
    try:
        logger.info(f"Getting book details for {book_id}")
        book = book_service.get_book(book_id)

        # Initialize processing queue for this book if not already in queue
        logger.info(f"Current queue state before initialization: {queue.processing}")
        if book_id not in queue.processing:
            logger.info(
                f"Book {book_id} not in queue, initializing with {len(book['metadata']['chapters'])} chapters"
            )
            queue.add_book(book_id, book["metadata"]["chapters"])
            logger.info(f"Queue state after initialization: {queue.processing}")
        else:
            logger.info(f"Book {book_id} already in queue")

        return book
    except FileNotFoundError as e:
        logger.error(f"Book not found: {book_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting book {book_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

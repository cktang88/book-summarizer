from fastapi import APIRouter, HTTPException
from ...services.books import BookService
import os

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
        return book_service.get_book(book_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

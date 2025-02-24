from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
import asyncio
from pathlib import Path

from .api.routes.upload import router as upload_router
from .api.routes.books import router as books_router
from .api.routes.summary import router as summary_router
from .api.routes.status import router as status_router
from .services.queue import queue

# Load environment variables
load_dotenv()

app = FastAPI(title="Book Summarizer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite's default dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the books directory for serving uploaded files
books_dir = Path("books")
books_dir.mkdir(exist_ok=True)
app.mount("/books", StaticFiles(directory=str(books_dir)), name="books")

# Include routers
app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(books_router, prefix="/api", tags=["books"])
app.include_router(summary_router, prefix="/api", tags=["summary"])
app.include_router(status_router, prefix="/api", tags=["status"])


# Background task to process queue
async def process_queue():
    while True:
        queue.process_next()
        await asyncio.sleep(1)  # Sleep for rate limit


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_queue())


@app.get("/")
async def root():
    return {"message": "Book Summarizer API is running"}

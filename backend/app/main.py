from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
from pathlib import Path

from .api.routes.upload import router as upload_router

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


@app.get("/")
async def root():
    return {"message": "Book Summarizer API is running"}

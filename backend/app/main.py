from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os
from .processor import DocumentProcessor
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

# Initialize document processor
BOOKS_DIR = os.getenv("BOOKS_DIR", "./books")
doc_processor = DocumentProcessor(BOOKS_DIR)

# Include routers
app.include_router(upload_router, prefix="/api", tags=["upload"])


@app.get("/")
async def root():
    return {"message": "Book Summarizer API is running"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Check file size (limit to 100MB for now)
        file_size = 0
        while chunk := await file.read(8192):
            file_size += len(chunk)
            if file_size > 100 * 1024 * 1024:  # 100MB
                raise HTTPException(status_code=413, detail="File too large")
            await file.seek(0)  # Reset file pointer

        result = await doc_processor.process_document(file)
        return {
            "bookId": result.book_id,
            "title": result.title,
            "size": file_size,
            "formats": ["text", "markdown"],
            "metadata": result.metadata,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

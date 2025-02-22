# Book Summarizer - Technical Specification (MVP)

## Tech Stack

### Frontend

- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind + Shadcn/ui
- **HTTP**: native http fetch

### Backend

- **Runtime**: Python + FastAPI, use `uv` for package manager
- **PDF Processing**: PyPDF2 or pdf2text or pandoc
- **LLM**: Gemini flash 2
- **Storage**: Local filesystem

## Directory Structure

```
/frontend
  /src
    /components      # All React components
    /hooks          # React hooks
    /api            # API client
    App.tsx
    main.tsx

/backend
  /app
    main.py         # FastAPI app
    processor.py    # PDF processing
    summarizer.py   # Gemini integration
  requirements.txt
```

## API Endpoints

```typescript
// Simple REST API
interface API {
  // Upload PDF
  "POST /upload": {
    body: FormData;
    response: {
      bookId: string;
      title: string;
    };
  };

  // Get summary
  "GET /summary/{bookId}": {
    query: {
      depth: number; // 1-4
      section?: string;
    };
    response: {
      text: string;
      sections: Array<{
        id: string;
        title: string;
      }>;
    };
  };
}
```

## Components

### Frontend

1. **FileUpload**

   - Simple drag-drop zone + filepicker

2. **SummaryView**
   - Expandable tree view
   - Loading states

### Backend

1. **PDF Processor**

   - Convert PDF to text
   - Basic chapter detection

2. **Summarizer**
   - Gemini API calls
   - Text chunking
   - Cache results to disk

## Data Storage

Simple file-based storage:

```
/books
  /{book-id}/
    book.txt           # Extracted text
    metadata.json      # Title, chapters
    summaries/
      main.txt
      chapter1.txt
      chapter1-1.txt   # Deeper summaries
```

## Setup

### Requirements

- Node.js
- Python 3.11+
- Gemini API key

### Environment

```
# Backend (.env)
GEMINI_API_KEY=xxx
BOOKS_DIR=./books

# Frontend (.env)
VITE_API_URL=http://localhost:8000
```

### Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
pnpm install
pnpm dev
```

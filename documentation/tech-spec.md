# Book Summarizer - Technical Specification (MVP)

## Tech Stack

### Frontend

- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind + Shadcn/ui
- **HTTP**: native http fetch

### Backend

- **Runtime**: Python + FastAPI, use `uv` for package manager
- **Document Processing**:
  - **PDF**: PyPDF2 for text extraction
  - **EPUB**: EbookLib for native epub parsing
  - **Other**: pandoc for mobi and other formats
- **LLM**: Gemini flash 2
- **Storage**: Local filesystem

## Directory Structure

```
/frontend
  /src
    /components      # Reusable UI components
    /features       # Feature-based code organization
    /pages         # Page components
    /lib           # Shared utilities and config
    /assets        # Static assets
    App.tsx
    main.tsx

/backend
  /app
    /api           # API routes
    /services      # Business logic services
    /utils         # Shared utilities
    main.py        # FastAPI app
    processor.py   # Document processing
    summarizer.py  # Gemini integration
  requirements.txt
```

## API Endpoints

```typescript
// Complete REST API Interface
interface API {
  // Upload document (PDF/EPUB/MOBI)
  "POST /upload": {
    body: FormData; // file field
    response: {
      bookId: string;
      title: string;
      formats: ["text", "markdown"];
      metadata: {
        chapters: Array<{
          title: string;
          sections?: Array<{
            title: string;
            level: number;
          }>;
        }>;
      };
    };
  };

  // List all books
  "GET /books": {
    response: Array<{
      id: string;
      title: string;
      uploadedAt: string;
      metadata: BookMetadata;
    }>;
  };

  // Get specific book details
  "GET /books/{bookId}": {
    response: {
      id: string;
      title: string;
      uploadedAt: string;
      metadata: BookMetadata;
    };
  };

  // Get book summary with configurable depth
  "GET /summary/{bookId}": {
    query: {
      depth: number; // 1-4, controls summary detail level
    };
    response: {
      id: string; // "root" for book, "chapter-N" for chapters
      title: string; // Book/chapter title
      content: string; // Summary text
      depth: number; // Current depth level
      sections: Array<{
        id: string;
        title: string;
        content: string;
        depth: number;
        sections: Array<Section>; // Recursive structure
      }>;
    };
  };
}

interface BookMetadata {
  chapters: Array<{
    title: string;
    sections?: Array<{
      title: string;
      level: number;
    }>;
  }>;
  format: string; // "pdf" | "epub" | "mobi"
  pageCount?: number; // If available
  author?: string; // If available
  publishedDate?: string; // If available
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
    metadata.json      # Book metadata (title, chapters, etc)
    chapters/
      chapter-1.txt   # Individual chapter content
      chapter-2.txt
      chapter-3.txt
      ...
    summaries/
      chapter-1.txt   # Chapter summaries
      chapter-2.txt
      chapter-3.txt
      main.txt        # Overall book summary
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

## Data Models

### Book Storage Structure

```typescript
interface BookStorage {
  metadata: {
    title: string;
    chapters: Chapter[];
    format: string;
    uploadedAt: string;
    // ... other metadata
  };

  chapters: {
    [chapterId: string]: {
      content: string; // Raw chapter text
      markdown?: string; // Markdown version if available
    };
  };

  summaries: {
    [chapterId: string]: {
      [depth: number]: string; // Cached summaries at different depths
    };
  };
}
```

### File System Layout

```
/books/
  /{book-id}/
    metadata.json           # Book metadata
    chapters/
      chapter-1.txt        # Chapter content (text)
      chapter-1.md         # Chapter content (markdown)
      chapter-2.txt
      chapter-2.md
      ...
    summaries/
      chapter-1-depth-1.txt  # Chapter summary level 1
      chapter-1-depth-2.txt  # Chapter summary level 2
      chapter-2-depth-1.txt
      ...
```

## Processing Pipeline

1. **Document Upload**

   - Validate file type and size
   - Extract text based on format:
     - PDF: PyPDF2 text extraction
     - EPUB: Native chapter structure
     - MOBI: Convert to EPUB then process
   - Detect chapters and sections
   - Generate both text and markdown versions
   - Store metadata and content

2. **Summary Generation**

   - Chunk text into manageable sections
   - Use Gemini flash 2 for summarization
   - Cache results at each depth level
   - Support incremental loading of deeper summaries

3. **Error Handling**
   - Graceful fallbacks for text extraction
   - Retry logic for API calls
   - Proper HTTP status codes
   - Detailed error messages

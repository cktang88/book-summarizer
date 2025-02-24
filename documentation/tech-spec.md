# Book Summarizer - Technical Specification (MVP)

## Tech Stack

### Frontend

- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind + Shadcn/ui
- **HTTP**: TanStack Query (React Query) for data fetching, caching, and polling
  - Simple 2-second polling interval
  - Auto-stop polling when processing complete
  - Automatic cache invalidation on mutations
  - Configurable stale time (5 minutes)
  - Retry failed requests (2 times)

### Backend

- **Runtime**: Python + FastAPI, use `uv` for package manager
- **Document Processing**:
  - **PDF**: PyPDF2 for text extraction
  - **EPUB**: EbookLib for native epub parsing
  - **Other**: pandoc for mobi and other formats
- **LLM**: Gemini flash 2
- **Storage**: Local filesystem
- **Processing**: Single-threaded queue with rate limiting

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
      metadata: BookMetadata;
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

  // Get chapter processing status
  "GET /books/{bookId}/status": {
    response: {
      totalChapters: number;
      completedChapters: number;
      chapters: Array<{
        id: string;
        title: string;
        status: "pending" | "processing" | "complete" | "error";
        error?: string;
      }>;
    };
  };

  // Get specific chapter summary
  "GET /books/{bookId}/chapters/{chapterId}/summary": {
    response: {
      id: string;
      title: string;
      content: string | null; // null if not yet processed
      status: "pending" | "processing" | "complete" | "error";
      error?: string;
    };
  };

  // Retry failed chapter
  "POST /books/{bookId}/chapters/{chapterId}/retry": {
    response: {
      status: "queued";
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
   - Upload progress tracking
   - Error handling with toast notifications

2. **SummaryView**

   - Expandable tree view
   - Simple status badges with loading animation
   - React Query integration for polling (2s interval)
   - Manual retry for failed chapters
   - Auto-stop polling when complete

3. **ProcessingStatus**
   - Overall progress indicator
   - Per-chapter status badges
   - Auto-refresh via React Query
   - Manual retry support for failed chapters

### Backend

1. **PDF Processor**

   - Convert PDF to text
   - Basic chapter detection

2. **Summarizer**

   - Gemini API calls with configurable rate limiting
   - Text chunking
   - Simple file-based cache
   - Background processing queue

3. **ProcessingQueue**
   - Single-threaded chapter processing
   - Configurable rate limiting (default: 1 request/second)
   - Cache checking before API calls
   - Manual retry support for failed chapters
   - Status tracking per chapter

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

### Processing Status

```typescript
interface ProcessingStatus {
  bookId: string;
  totalChapters: number;
  completedChapters: number;
  chapters: Array<{
    id: string;
    title: string;
    status: "pending" | "processing" | "complete";
    error?: string;
    startedAt?: string;
    completedAt?: string;
  }>;
}

interface ChapterSummary {
  id: string;
  title: string;
  content: string | null;
  status: "pending" | "processing" | "complete";
  error?: string;
}
```

## Processing Pipeline

1. **Book Upload**

   - Process book structure
   - Extract chapters
   - Return immediate response with chapter list
   - Queue chapters for background processing

2. **Background Processing**

   - Queue chapters for processing
   - Process at configured rate (default: 1/second)
   - Check file cache before API calls
   - Support manual retry of failed chapters
   - Track processing status

3. **Frontend Integration**
   - Display immediate chapter list
   - Poll status endpoint every 2 seconds
   - Show simple status badges with loading animation
   - Stop polling once all chapters complete
   - Support manual retry of failed chapters

## Error Handling

1. **Backend**

   - Rate limit configuration for API calls
   - File-based caching to prevent redundant processing
   - Proper error states for failed chapters
   - Manual retry support
   - Comprehensive error logging

2. **Frontend**
   - Toast notifications for user feedback
   - Loading states and animations
   - Error boundaries for component failures
   - Retry buttons for failed operations
   - Clear error messages

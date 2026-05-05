# Book Summarizer

An interactive web application that generates AI-powered summaries of books with expandable sections for varying levels of detail.

## Features

- Upload PDF/epub/mobi books
- AI-powered summary generation via OpenRouter (default model: Google Gemini)
- Interactive, expandable summary interface with multiple depth levels (1–4)
- Pregenerate summaries for an entire book in parallel
- Resummarize individual chapters on demand
- Prompt caching to reduce token costs on repeated calls
- Caching system for processed books and summaries on local filesystem

## Tech Stack

### Frontend

- React + TypeScript + Vite
- Tailwind CSS + Shadcn/ui
- Native fetch for HTTP requests

### Backend

- Python + FastAPI
- PyPDF2/pandoc for document processing
- OpenRouter (OpenAI-compatible API) for LLM calls; default model `google/gemini-3.1-flash-lite-preview`
- Local filesystem storage

## Development Setup

### Prerequisites

- Node.js
- Python 3.11+
- OpenRouter API key (https://openrouter.ai/)
- Make (for running development commands)
- pnpm (for frontend package management)

### Quick Start

```bash
# Install all dependencies
make install

# Run both frontend and backend in development mode
make dev
```

### Manual Setup

#### Frontend Setup

```bash
cd frontend
pnpm install
pnpm dev
```

#### Backend Setup

```bash
cd backend
# Install uv package manager if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh
uv pip install -r requirements.txt
# Set up your .env file with your OpenRouter API key
uvicorn app.main:app --reload
```

### Available Make Commands

- `make install` - Install all dependencies
- `make install-frontend` - Install frontend dependencies only
- `make install-backend` - Install backend dependencies only
- `make dev` - Run both frontend and backend in development mode
- `make dev-frontend` - Run frontend only
- `make dev-backend` - Run backend only
- `make clean` - Clean up generated files and dependencies
- `make test-summarizer CHAPTER_FILE=...` - Run the summarizer at all depth levels for a single chapter

### Pregenerating Summaries

Pregenerate summaries at every depth (1–4) for every chapter of a book:

```bash
cd backend
. .venv/bin/activate
python -m scripts.pregenerate_summaries "books/<book-folder>" --workers 4
# Optional flags: --override (regenerate existing), --depths 1 2 (subset)
```

### Environment Variables

Frontend (.env):

```
VITE_API_URL=http://localhost:8000
```

Backend (.env):

```
OPENROUTER_API_KEY=your-api-key-here
BOOKS_DIR=./books
```

## Project Structure

```
/frontend
  /src
    /components      # Reusable UI components
    /features       # Feature-based code organization
    /lib           # Utilities and helpers
    App.tsx
    main.tsx

/backend
  /app
    /api            # FastAPI route handlers
    /services       # Business logic
    /utils          # Shared helpers
    main.py         # FastAPI application
    processor.py    # PDF/epub processing
    summarizer.py   # OpenRouter LLM integration
  /scripts
    pregenerate_summaries.py  # Bulk pregeneration script
  /books            # Book storage (chapters, summaries, metadata)
  requirements.txt
```

## Development

The frontend runs on http://localhost:5173 and the backend API on http://localhost:8000.

## License

MIT

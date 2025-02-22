# Book Summarizer

An interactive web application that generates AI-powered summaries of books with expandable sections for varying levels of detail.

## Features

- Upload PDF/epub/mobi books
- AI-powered summary generation using Gemini
- Interactive, expandable summary interface
- Caching system for processed books and summaries

## Tech Stack

### Frontend

- React + TypeScript + Vite
- Tailwind CSS + Shadcn/ui
- Native fetch for HTTP requests

### Backend

- Python + FastAPI
- PyPDF2/pandoc for document processing
- Google Gemini for AI summaries
- Local filesystem storage

## Development Setup

### Prerequisites

- Node.js
- Python 3.11+
- Google Gemini API key
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
# Set up your .env file with your Gemini API key
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

### Environment Variables

Frontend (.env):

```
VITE_API_URL=http://localhost:8000
```

Backend (.env):

```
GEMINI_API_KEY=your-api-key-here
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
    main.py         # FastAPI application
    processor.py    # PDF processing
    summarizer.py   # Gemini integration
  /books           # Book storage
  requirements.txt
```

## Development

The frontend runs on http://localhost:5173 and the backend API on http://localhost:8000.

## License

MIT

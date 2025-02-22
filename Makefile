.PHONY: install install-frontend install-backend dev dev-frontend dev-backend clean

# Install all dependencies
install: install-frontend install-backend

# Install frontend dependencies
install-frontend:
	cd frontend && pnpm install

# Install backend dependencies
install-backend:
	cd backend && uv venv && . .venv/bin/activate && uv pip install -r requirements.txt

# Run both frontend and backend in development mode
dev:
	make -j2 dev-frontend dev-backend

# Run frontend in development mode
dev-frontend:
	cd frontend && pnpm dev

# Run backend in development mode
dev-backend:
	cd backend && . .venv/bin/activate && uvicorn app.main:app --reload

# Clean up generated files and dependencies
clean:
	rm -rf frontend/node_modules
	rm -rf frontend/dist
	rm -rf backend/__pycache__
	rm -rf backend/app/__pycache__
	rm -rf backend/.venv
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 
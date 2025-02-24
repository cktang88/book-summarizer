const API_URL = import.meta.env.VITE_API_URL;

export interface Book {
  id: string;
  title: string;
  uploadedAt: string;
}

export async function fetchBooks(): Promise<Book[]> {
  const response = await fetch(`${API_URL}/api/books`);

  if (!response.ok) {
    throw new Error("Failed to fetch books");
  }

  return response.json();
}

export async function fetchBook(bookId: string): Promise<Book> {
  const response = await fetch(`${API_URL}/api/books/${bookId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch book");
  }

  return response.json();
}

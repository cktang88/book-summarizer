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
  console.log(`[fetchBook] Fetching details for book ${bookId}`);
  const response = await fetch(`${API_URL}/api/books/${bookId}`);

  if (!response.ok) {
    const error = `Failed to fetch book: ${response.statusText}`;
    console.error(`[fetchBook] ${error}`);
    throw new Error(error);
  }

  const data = await response.json();
  console.log(`[fetchBook] Received book details:`, data);
  return data;
}

export async function deleteBook(bookId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/books/${bookId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = `Failed to delete book: ${response.statusText}`;
    console.error(`[deleteBook] ${error}`);
    throw new Error(error);
  }
}

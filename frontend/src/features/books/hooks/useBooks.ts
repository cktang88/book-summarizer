import { useState, useEffect } from "react";
import { Book, fetchBooks } from "../api/books-service";

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchBooks();
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load books");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const addBook = (book: Book) => {
    setBooks((prev) => [book, ...prev]);
  };

  return {
    books,
    isLoading,
    error,
    refresh: loadBooks,
    addBook,
  };
}

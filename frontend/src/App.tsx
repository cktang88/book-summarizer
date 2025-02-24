import { useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Providers } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/features/upload/components/file-upload";
import { uploadFile } from "@/features/upload/api/upload-service";
import { SummaryPage } from "@/features/summary/pages/SummaryPage";
import { BookList } from "@/features/books/components/BookList";
import { useBooks } from "@/features/books/hooks/useBooks";
import { Toaster } from "sonner";
import { ThemeToggle } from "@/components/theme-toggle";

function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const { books, isLoading, error, addBook, removeBook } = useBooks();

  const handleFileSelect = async (file: File) => {
    try {
      setIsUploading(true);
      const result = await uploadFile(file);
      addBook({
        id: result.bookId,
        title: result.title,
        uploadedAt: new Date().toISOString(),
      });
      setSelectedBookId(result.bookId);
      setShowUpload(false);
      toast.success(`Successfully processed book: ${result.title}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedBookId(null);
  };

  const handleSelectBook = (bookId: string) => {
    setSelectedBookId(bookId);
  };

  if (selectedBookId) {
    return (
      <Providers>
        <main className="container mx-auto flex min-h-screen flex-col items-center p-4">
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleReset}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back to books
              </button>
              <ThemeToggle />
            </div>
            <SummaryPage bookId={selectedBookId} />
          </div>
        </main>
        <Toaster />
      </Providers>
    );
  }

  return (
    <Providers>
      <main className="container mx-auto flex min-h-screen flex-col items-center p-4">
        <div className="w-full max-w-5xl">
          <div className="flex items-center justify-end mb-8">
            <ThemeToggle />
          </div>
          <div className="text-center mb-8">
            <h1 className="mb-2 text-4xl font-bold">Book Summarizer</h1>
            <p className="text-lg text-muted-foreground">
              Get AI-powered summaries of your books
            </p>
          </div>

          {showUpload ? (
            <div className="w-full max-w-xl">
              <div className="mb-4 flex items-center justify-between">
                <button
                  onClick={() => setShowUpload(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Back to books
                </button>
              </div>
              <FileUpload
                onFileSelect={handleFileSelect}
                className={isUploading ? "opacity-50 pointer-events-none" : ""}
              />
            </div>
          ) : (
            <div className="w-full max-w-5xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Your Books</h2>
                <Button onClick={() => setShowUpload(true)}>
                  <Plus className="h-4 w-4" />
                  Add Book
                </Button>
              </div>
              {isLoading ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center text-destructive">
                  <p>{error}</p>
                </div>
              ) : (
                <BookList
                  books={books}
                  onSelectBook={handleSelectBook}
                  onDeleteBook={removeBook}
                />
              )}
            </div>
          )}
        </div>
      </main>
      <Toaster />
    </Providers>
  );
}

export default App;

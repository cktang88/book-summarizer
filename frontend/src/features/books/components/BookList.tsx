import { Book, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BookListProps {
  books: Array<{
    id: string;
    title: string;
    uploadedAt: string;
  }>;
  onSelectBook: (bookId: string) => void;
  onDeleteBook: (bookId: string) => Promise<void>;
}

export function BookList({ books, onSelectBook, onDeleteBook }: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        <p>No books available. Upload your first book to get started!</p>
      </div>
    );
  }

  const handleDelete = async (e: React.MouseEvent, bookId: string) => {
    e.stopPropagation(); // Prevent card click when clicking delete
    try {
      await onDeleteBook(bookId);
      toast.success("Book deleted successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete book"
      );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <Card
          key={book.id}
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => onSelectBook(book.id)}
        >
          <CardHeader className="space-y-0 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{book.title}</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={(e) => handleDelete(e, book.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                <span>View Summary</span>
              </div>
              <time dateTime={book.uploadedAt}>
                {new Date(book.uploadedAt).toLocaleDateString()}
              </time>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

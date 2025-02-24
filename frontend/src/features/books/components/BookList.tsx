import { Book } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookListProps {
  books: Array<{
    id: string;
    title: string;
    uploadedAt: string;
  }>;
  onSelectBook: (bookId: string) => void;
}

export function BookList({ books, onSelectBook }: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        <p>No books available. Upload your first book to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <Card
          key={book.id}
          className="cursor-pointer transition-colors hover:bg-muted/50"
          onClick={() => onSelectBook(book.id)}
        >
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-base">{book.title}</CardTitle>
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

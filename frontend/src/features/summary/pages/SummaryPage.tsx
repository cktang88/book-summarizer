import { Loader2 } from "lucide-react";
import { useSummary } from "../hooks/useSummary";
import { SummaryViewer } from "../components/SummaryViewer";

interface SummaryPageProps {
  bookId: string;
}

export function SummaryPage({ bookId }: SummaryPageProps) {
  const { isLoading, error, summary } = useSummary(bookId);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive">Error</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">No summary available</p>
      </div>
    );
  }

  return <SummaryViewer bookId={bookId} initialSummary={summary} />;
}

import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SummarySection } from "../types";
import { fetchSummary } from "../api";
import { summaryCache } from "../cache";

interface SectionProps {
  bookId: string;
  section: SummarySection;
  level: number;
}

function Section({ bookId, section: initialSection, level }: SectionProps) {
  const [section, setSection] = useState(initialSection);
  const [isLoading, setIsLoading] = useState(false);

  const handleExpand = useCallback(async () => {
    // If we're at max depth (4), do nothing
    if (section.depth >= 4) {
      return;
    }

    if (section.isExpanded) {
      setSection((prev) => ({ ...prev, isExpanded: false }));
      return;
    }

    // Set loading state
    setIsLoading(true);

    try {
      const response = await fetchSummary(
        bookId,
        section.depth + 1,
        section.id
      );

      // Cache the new summary
      summaryCache.set(
        bookId,
        section.id,
        section.depth + 1,
        response.text || response.content || ""
      );

      // Update with new content
      setSection((prev) => ({
        ...prev,
        isExpanded: true,
        content: response.text || response.content || "",
        depth: response.depth,
      }));
    } catch (error) {
      console.error("[Section] Failed to fetch deeper summary:", error);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, section.depth, section.id, section.isExpanded]);

  const hasContent = section.content?.trim().length > 0;

  return (
    <div key={section.id} className={cn("space-y-2", level > 0 && "ml-6 mt-2")}>
      <div
        className={cn(
          "flex items-start gap-2 rounded-lg p-3 transition-colors",
          "hover:bg-muted cursor-pointer group"
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleExpand();
        }}
      >
        <div className="h-6 w-6 flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : section.isExpanded ? (
            <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-100" />
          ) : (
            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{section.title}</h3>
          {hasContent && (
            <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {section.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface SummaryViewerProps {
  bookId: string;
  initialSummary: SummarySection;
}

export function SummaryViewer({ bookId, initialSummary }: SummaryViewerProps) {
  return (
    <div className="space-y-4">
      <Section bookId={bookId} section={initialSummary} level={0} />
    </div>
  );
}

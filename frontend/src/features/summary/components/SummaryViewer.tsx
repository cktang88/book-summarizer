import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SummarySection } from "../types";
import { fetchSummary } from "../api";
import { summaryCache } from "../cache";

interface SummaryViewerProps {
  bookId: string;
  initialSummary: SummarySection;
}

export function SummaryViewer({ bookId, initialSummary }: SummaryViewerProps) {
  const [summary, setSummary] = useState<SummarySection>(initialSummary);

  const handleExpand = useCallback(
    async (section: SummarySection) => {
      if (section.isExpanded) {
        // Collapse the section
        setSummary((prev) => ({
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === section.id ? { ...s, isExpanded: false } : s
          ),
        }));
        return;
      }

      // Check cache first
      const cachedContent = summaryCache.get(
        bookId,
        section.id,
        section.depth + 1
      );
      if (cachedContent) {
        setSummary((prev) => ({
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === section.id
              ? {
                  ...s,
                  isExpanded: true,
                  content: cachedContent,
                }
              : s
          ),
        }));
        return;
      }

      // Set loading state
      setSummary((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === section.id ? { ...s, isLoading: true } : s
        ),
      }));

      try {
        const response = await fetchSummary(
          bookId,
          section.depth + 1,
          section.id
        );

        // Cache the new summary
        summaryCache.set(bookId, section.id, section.depth + 1, response.text);

        // Update the section with new content
        setSummary((prev) => ({
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === section.id
              ? {
                  ...s,
                  isExpanded: true,
                  isLoading: false,
                  content: response.text,
                  sections: response.sections.map((newSection) => ({
                    ...newSection,
                    content: "",
                    depth: section.depth + 1,
                    sections: [],
                    isExpanded: false,
                  })),
                }
              : s
          ),
        }));
      } catch (error) {
        console.error("Failed to fetch deeper summary:", error);
        setSummary((prev) => ({
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === section.id ? { ...s, isLoading: false } : s
          ),
        }));
      }
    },
    [bookId]
  );

  const renderSection = (section: SummarySection, level: number = 0) => {
    const hasContent = section.content?.trim().length > 0;
    const hasSections = section.sections.length > 0;

    return (
      <div
        key={section.id}
        className={cn("space-y-2", level > 0 && "ml-6 mt-2")}
      >
        <div className="flex items-start gap-2">
          {hasSections && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-accent"
              onClick={() => handleExpand(section)}
            >
              {section.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : section.isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          <div className="flex-1">
            {level > 0 && <h3 className="font-medium">{section.title}</h3>}
            {hasContent && (
              <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                {section.content}
              </p>
            )}
          </div>
        </div>
        {section.isExpanded && hasSections && (
          <div className="border-l pl-4">
            {section.sections.map((subSection) =>
              renderSection(subSection, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return <div className="space-y-4">{renderSection(summary)}</div>;
}

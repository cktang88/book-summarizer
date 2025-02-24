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
    console.log("[Section] Expanding section:", {
      id: section.id,
      depth: section.depth,
      isExpanded: section.isExpanded,
      title: section.title,
      currentContent: section.content?.slice(0, 50) + "...",
    });

    // If we're at max depth (4), just toggle collapse
    if (section.depth >= 4) {
      console.log("[Section] Max depth reached, toggling collapse");
      setSection((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
      return;
    }

    if (section.isExpanded) {
      console.log("[Section] Collapsing section");
      setSection((prev) => ({ ...prev, isExpanded: false }));
      return;
    }

    // Set loading state
    console.log("[Section] Fetching deeper summary");
    setIsLoading(true);

    try {
      const response = await fetchSummary(
        bookId,
        section.depth + 1,
        section.id
      );
      console.log("[Section] Received response:", {
        id: section.id,
        newContent: response.text?.slice(0, 50) + "...",
        numNewSections: response.sections.length,
        newSections: response.sections.map((s) => s.title),
      });

      // Cache the new summary
      summaryCache.set(bookId, section.id, section.depth + 1, response.text);

      // Update with new content and sections
      setSection((prev) => ({
        ...prev,
        isExpanded: true,
        content: response.text,
        sections: response.sections.map((newSection) => ({
          ...newSection,
          content: "",
          depth: section.depth + 1,
          sections: [],
          isExpanded: false,
        })),
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
      {section.isExpanded && section.sections.length > 0 && (
        <div className="border-l pl-4">
          {section.sections.map((subSection) => (
            <Section
              key={subSection.id}
              bookId={bookId}
              section={subSection}
              level={level + 1}
            />
          ))}
        </div>
      )}
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

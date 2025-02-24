import { useState, useCallback } from "react";
import { Plus, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SummarySection } from "../types";
import { fetchSummary } from "../api";
import { summaryCache } from "../cache";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

interface SectionProps {
  bookId: string;
  section: SummarySection;
  level: number;
}

function Section({ bookId, section: initialSection, level }: SectionProps) {
  const [section, setSection] = useState(initialSection);
  const [isLoading, setIsLoading] = useState(false);

  const handleDepthChange = useCallback(
    async (increase: boolean) => {
      // If we're at max depth (4) or min depth (1), do nothing
      if (
        (increase && section.depth >= 4) ||
        (!increase && section.depth <= 1)
      ) {
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetchSummary(
          bookId,
          increase ? section.depth + 1 : section.depth - 1,
          section.id
        );

        // Cache the new summary
        summaryCache.set(
          bookId,
          section.id,
          increase ? section.depth + 1 : section.depth - 1,
          response.text || response.content || ""
        );

        // Update with new content
        setSection((prev) => ({
          ...prev,
          content: response.text || response.content || "",
          depth: response.depth,
        }));
      } catch (error) {
        console.error("[Section] Failed to fetch summary:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [bookId, section.depth, section.id]
  );

  const hasContent = section.content?.trim().length > 0;
  const canIncreaseDepth = section.depth < 4;
  const canDecreaseDepth = section.depth > 1;

  return (
    <div key={section.id} className={cn("space-y-2", level > 0 && "ml-6 mt-2")}>
      <div
        className={cn(
          "flex items-start gap-4 rounded-lg p-4 transition-colors relative",
          "hover:bg-muted group"
        )}
      >
        <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
          <h3 className="text-base font-medium mb-3">{section.title}</h3>
          {hasContent && (
            <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {section.content}
            </div>
          )}
        </div>

        {/* Depth controls */}
        <div className="flex items-center gap-2 absolute right-4 top-4">
          <Tooltip content="Show less detail">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                !canDecreaseDepth && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => canDecreaseDepth && handleDepthChange(false)}
              disabled={!canDecreaseDepth || isLoading}
            >
              <Minus className="h-4 w-4" />
            </Button>
          </Tooltip>

          {isLoading && (
            <div className="w-8 h-8 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          <Tooltip content="Show more detail">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                !canIncreaseDepth && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => canIncreaseDepth && handleDepthChange(true)}
              disabled={!canIncreaseDepth || isLoading}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </Tooltip>
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

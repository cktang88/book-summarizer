export interface SummarySection {
  id: string;
  title: string;
  content: string;
  depth: number;
  isLoading?: boolean;
  isExpanded?: boolean;
}

export interface SummaryResponse {
  id: string;
  title: string;
  text?: string;
  content?: string;
  depth: number;
}

export interface SummaryCacheEntry {
  content: string;
  timestamp: number;
  depth: number;
}

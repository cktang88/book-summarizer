export interface SummarySection {
  id: string;
  title: string;
  content: string;
  depth: number;
  sections: SummarySection[];
  isLoading?: boolean;
  isExpanded?: boolean;
}

export interface SummaryResponse {
  text: string;
  sections: Array<{
    id: string;
    title: string;
  }>;
}

export interface SummaryCacheEntry {
  content: string;
  timestamp: number;
  depth: number;
}

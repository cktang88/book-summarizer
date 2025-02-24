import { Badge } from "./badge";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "pending" | "processing" | "complete" | "error";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    pending:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    complete:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <Badge variant="outline" className={cn(variants[status], className)}>
      {status === "processing" && (
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

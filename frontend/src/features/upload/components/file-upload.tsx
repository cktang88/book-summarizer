import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number; // in bytes
  className?: string;
}

export function FileUpload({
  onFileSelect,
  accept = {
    "application/pdf": [".pdf"],
    "application/epub+zip": [".epub"],
    "application/x-mobipocket-ebook": [".mobi"],
  },
  maxSize = 100 * 1024 * 1024, // 100MB default
  className,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0];
      if (selectedFile) {
        if (selectedFile.size > maxSize) {
          setError("File is too large");
          toast.error("File is too large");
          return;
        }
        setFile(selectedFile);
        setError(null);
        onFileSelect(selectedFile);
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          setUploadProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
            toast.success("File uploaded successfully");
          }
        }, 200);
      }
    },
    [maxSize, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  return (
    <div className={cn("w-full max-w-xl", className)}>
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed",
          isDragActive && "border-primary bg-muted/50",
          error && "border-destructive"
        )}
      >
        <CardContent className="flex flex-col items-center justify-center gap-4 p-6">
          <Input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
            {file ? (
              <div className="flex items-center gap-2">
                <File className="h-6 w-6" />
                <span className="text-sm">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <p className="text-lg font-medium">
                  Drop your file here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF, EPUB, or MOBI (max {Math.round(maxSize / 1024 / 1024)}MB)
                </p>
              </>
            )}
          </div>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <Progress value={uploadProgress} className="w-full" />
          )}
        </CardContent>
      </Card>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

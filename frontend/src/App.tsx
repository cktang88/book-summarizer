import { useState } from "react";
import { toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { FileUpload } from "@/features/upload/components/file-upload";
import { uploadFile } from "@/features/upload/api/upload-service";

function App() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedBook, setUploadedBook] = useState<{
    bookId: string;
    title: string;
    metadata: {
      chapters: Array<{ title: string; length: number }>;
    };
  } | null>(null);

  const handleFileSelect = async (file: File) => {
    try {
      setIsUploading(true);
      const result = await uploadFile(file);
      setUploadedBook(result);
      toast.success(`Successfully processed book: ${result.title}`);
      console.log("Upload result:", result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ThemeProvider>
      <Providers>
        <main className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-4xl font-bold">Book Summarizer</h1>
            <p className="text-lg text-muted-foreground">
              Upload your book and get an AI-powered summary
            </p>
          </div>
          <FileUpload
            onFileSelect={handleFileSelect}
            className={isUploading ? "opacity-50 pointer-events-none" : ""}
          />
          {uploadedBook && (
            <div className="mt-8 w-full max-w-xl">
              <h2 className="mb-4 text-2xl font-semibold">
                {uploadedBook.title}
              </h2>
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-lg font-medium">Chapters</h3>
                <ul className="space-y-2">
                  {uploadedBook.metadata.chapters.map((chapter, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{chapter.title}</span>
                      <span className="text-muted-foreground">
                        {Math.round(chapter.length / 1000)}k chars
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </main>
      </Providers>
    </ThemeProvider>
  );
}

export default App;

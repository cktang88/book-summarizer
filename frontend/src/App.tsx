import { useState } from "react";
import { toast } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers";
import { FileUpload } from "@/features/upload/components/file-upload";
import { uploadFile } from "@/features/upload/api/upload-service";

function App() {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    try {
      setIsUploading(true);
      const result = await uploadFile(file);
      toast.success("File uploaded successfully!");
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
        </main>
      </Providers>
    </ThemeProvider>
  );
}

export default App;

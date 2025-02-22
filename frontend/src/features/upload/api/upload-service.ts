const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function uploadFile(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ id: string; url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header, let the browser set it with the boundary
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to upload file");
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error("Upload failed");
  }
}

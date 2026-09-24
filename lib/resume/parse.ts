/**
 * Extracts plain text from an uploaded resume file. Supports PDF and plain
 * text; other formats (e.g. .docx) are rejected upstream in the upload route.
 */
export async function extractResumeText(
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (contentType === "application/pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  // text/plain and anything else falls back to a direct UTF-8 read.
  return buffer.toString("utf-8");
}

/**
 * Normalized bounding box represented as relative floats in the range [0.0, 1.0].
 * x: left position / total width
 * y: top position / total height
 * width: box width / total width
 * height: box height / total height
 */
export interface NormalizedBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrToken {
  text: string;
  box: NormalizedBoundingBox;
  confidence?: number;
}

export interface OcrPageResult {
  page: number;
  text: string;
  confidence: number;
  tokens?: OcrToken[];
  boundingBoxes?: Array<{ text: string; box: NormalizedBoundingBox }>;
}

export interface OcrResultData {
  text: string;
  pageCount: number;
  pages: OcrPageResult[];
  engine: string;
  engineVersion?: string;
  extractionMethod: "NATIVE_PDF" | "IMAGE_OCR" | "HYBRID_OCR";
  language?: string;
  confidence: number;
}

export interface OcrProvider {
  extractText(buffer: Buffer, fileName: string, mimeType: string): Promise<OcrResultData>;
}

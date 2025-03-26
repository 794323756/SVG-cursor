export interface ProcessingResult {
  layers: Array<{
    color: string;
    path: string;
  }>;
  gradients: Array<{
    id: string;
    type: 'linear' | 'radial';
    stops: Array<{
      offset: number;
      color: string;
    }>;
  }>;
  metadata: {
    width: number;
    height: number;
    colorCount: number;
  };
}

export interface ImageProcessingOptions {
  colorPrecision: number;
  pathPrecision: number;
  lineThreshold: number;
  pathSmoothing: 'high' | 'balanced' | 'minimal';
  gradientOptimization: boolean;
}

export interface ImageState {
  original: string | null
  svg: string | null
  processing: boolean
  error: string | null
}

export interface ImageProcessor {
  processImage: (
    imageData: string,
    options?: Partial<ImageProcessingOptions>
  ) => Promise<string>
} 
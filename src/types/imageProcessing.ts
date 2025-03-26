export interface ImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface ColorAnalysisResult {
  dominantColors: string[];
  colorDistribution: Record<string, number>;
  colorSegments: {
    color: string;
    mask: ImageData;
  }[];
}

export interface VectorizationResult {
  paths: string[];
  metadata: {
    complexity: number;
    pathCount: number;
    totalLength: number;
  };
}

export interface ProcessingResult {
  layers: {
    color: string;
    paths: string[];
  }[];
  gradients: {
    id: string;
    type: 'linear' | 'radial';
    stops: {
      offset: number;
      color: string;
    }[];
  }[];
  metadata: {
    processingTime: number;
    originalSize: {
      width: number;
      height: number;
    };
    outputSize: {
      width: number;
      height: number;
    };
  };
} 
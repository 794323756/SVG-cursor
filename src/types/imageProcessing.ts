export interface ImageData {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  colorSpace: 'srgb' | 'display-p3';
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
  layers: ColorLayer[];
  gradients: Gradient[];
  metadata: {
    width: number;
    height: number;
    colorPrecision: number;
    pathPrecision: number;
    lineThreshold: number;
    pathSmoothing: 'high' | 'balanced' | 'minimal';
    gradientOptimization: boolean;
  };
}

export interface ImageProcessingOptions {
  colorPrecision?: number;
  pathPrecision?: number;
  lineThreshold?: number;
  pathSmoothing?: 'high' | 'balanced' | 'minimal';
  gradientOptimization?: boolean;
}

export interface ColorLayer {
  color: string;
  paths: string[];
  mask?: ImageData;
}

export interface Gradient {
  type: 'linear' | 'radial';
  colors: Array<{
    color: string;
    offset: number;
  }>;
  id: string;
} 
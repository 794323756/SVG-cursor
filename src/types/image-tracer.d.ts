declare module '@vectormage/image-tracer' {
  export interface TraceOptions {
    ltres: number;
    qtres: number;
    pathomit: number;
    colorsampling: number;
    numberofcolors: number;
    mincolorratio: number;
    colorquantcycles: number;
    layering: number;
    strokewidth: number;
    linefilter: boolean;
    curvefitting: boolean;
    csp: number;
    colorsampling: number;
    numberofcolors: number;
    mincolorratio: number;
    colorquantcycles: number;
    layering: number;
    strokewidth: number;
    linefilter: boolean;
    curvefitting: boolean;
    csp: number;
  }

  export interface TraceResult {
    layers: {
      color: string;
      paths: string[];
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

  export function trace(imageData: ImageData, options?: Partial<TraceOptions>): Promise<TraceResult>;
} 
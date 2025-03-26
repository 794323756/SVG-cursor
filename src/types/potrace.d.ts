declare module 'potrace' {
  interface TraceOptions {
    turdSize?: number;
    turnPolicy?: 'black' | 'white' | 'left' | 'right' | 'minority' | 'majority';
    alphaMax?: number;
    optCurve?: boolean;
    threshold?: number;
    blackOnWhite?: boolean;
    color?: string;
    background?: string;
  }

  interface TraceResult {
    path: string;
    width: number;
    height: number;
  }

  function trace(
    image: ImageData | string | Buffer,
    options?: TraceOptions
  ): Promise<TraceResult>;

  function trace(
    image: ImageData | string | Buffer,
    options: TraceOptions,
    callback: (err: Error | null, result: TraceResult) => void
  ): void;

  export = trace;
} 
import { expose } from 'comlink'
import { trace } from '@vectormage/image-tracer'
import { ImageData, ImageProcessingOptions, ColorLayer, VectorizationResult } from '../types/imageProcessing'

const worker = {
  async vectorizeLayer(layer: ColorLayer, options: Partial<ImageProcessingOptions> = {}): Promise<VectorizationResult> {
    const {
      pathPrecision = 2,
      lineThreshold = 0.1,
      pathSmoothing = 'balanced'
    } = options;

    // 配置追踪选项
    const traceOptions = {
      ltres: lineThreshold,
      qtres: pathPrecision,
      pathomit: 8,
      colorsampling: 0,
      numberofcolors: 2,
      mincolorratio: 0,
      colorquantcycles: 3,
      layering: 0,
      strokewidth: 1,
      linefilter: true,
      curvefitting: pathSmoothing === 'high',
      csp: pathSmoothing === 'minimal' ? 0 : 2
    };

    // 执行矢量追踪
    const result = await trace(layer.mask, traceOptions);

    return {
      paths: result.layers[0].paths,
      metadata: {
        complexity: result.metadata.processingTime,
        pathCount: result.layers[0].paths.length,
        totalLength: result.layers[0].paths.reduce((acc, path) => acc + path.length, 0)
      }
    };
  }
};

expose(worker) 
import { expose } from 'comlink'
import { ImageProcessingOptions, ColorLayer, VectorizationResult } from '../types/imageProcessing'
import potraceLib from 'potrace'

// 仅保留一个 worker 对象，使用 potrace 库
const worker = {
  async vectorizeLayer(layer: ColorLayer, options: Partial<ImageProcessingOptions> = {}): Promise<VectorizationResult> {
    const {
      lineThreshold = 0.1,
    } = options;

    if (!layer.mask) {
      throw new Error('Layer mask is required for vectorization');
    }

    // 确保 mask 存在后再使用
    const mask = layer.mask;

    // 使用 potrace 库处理图像
    const traceOptions = {
      turdSize: 2,
      turnPolicy: 'minority' as const,
      alphaMax: 1,
      optCurve: true,
      threshold: lineThreshold,
      blackOnWhite: false
    };

    // 使用 Promise 封装 potrace 回调函数
    const result = await new Promise<{path: string; width: number; height: number}>((resolve, reject) => {
      potraceLib(mask, traceOptions, (err: Error | null, res: any) => {
        if (err) reject(err);
        else if (res) resolve(res);
        else reject(new Error('Failed to trace image'));
      });
    });

    return {
      paths: [result.path],
      metadata: {
        complexity: 1,
        pathCount: 1,
        totalLength: result.path.length
      }
    };
  }
};

// 处理消息事件
self.onmessage = async (e: MessageEvent) => {
  const { layer, options } = e.data as { layer: ColorLayer; options: ImageProcessingOptions };

  try {
    // 使用 worker 对象中的方法处理图像
    const vectorizationResult = await worker.vectorizeLayer(layer, options);
    self.postMessage({ success: true, result: vectorizationResult });
  } catch (error: unknown) {
    if (error instanceof Error) {
      self.postMessage({ success: false, error: error.message });
    } else {
      self.postMessage({ success: false, error: 'An unknown error occurred' });
    }
  }
};

expose(worker) 
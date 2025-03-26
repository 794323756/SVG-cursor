import { ImageProcessingOptions, ProcessingResult } from '../types/imageProcessing'
import potrace from 'potrace'

self.onmessage = async (e: MessageEvent) => {
  const { imageData, options } = e.data

  try {
    const {
      colorPrecision = 8,
      pathPrecision = 2,
      lineThreshold = 0.1,
      pathSmoothing = 'balanced',
      gradientOptimization = true
    } = options as ImageProcessingOptions

    // 使用传入的参数进行图像处理
    const result: ProcessingResult = {
      layers: [],
      gradients: [],
      metadata: {
        width: imageData.width,
        height: imageData.height,
        colorPrecision,
        pathPrecision,
        lineThreshold,
        pathSmoothing,
        gradientOptimization
      }
    }

    // 处理图像并生成结果
    const traceResult = await potrace(imageData, {
      turdSize: 2,
      turnPolicy: 'minority',
      alphaMax: 1,
      optCurve: true,
      threshold: lineThreshold,
      blackOnWhite: false
    })

    result.layers.push({
      color: '#000000',
      paths: [traceResult.path]
    })

    self.postMessage({ success: true, result })
  } catch (error: unknown) {
    if (error instanceof Error) {
      self.postMessage({ success: false, error: error.message })
    } else {
      self.postMessage({ success: false, error: 'An unknown error occurred' })
    }
  }
} 
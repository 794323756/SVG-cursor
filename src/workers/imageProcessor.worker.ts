import { expose } from 'comlink'
import * as potrace from 'potrace'
import { ImageData, ProcessingResult, ImageProcessingOptions } from '../types/imageProcessing'

const worker = {
  async processImage(imageData: ImageData, options: Partial<ImageProcessingOptions> = {}): Promise<ProcessingResult> {
    const startTime = performance.now()

    // 配置处理选项
    const {
      colorPrecision = 8,
      pathPrecision = 2,
      lineThreshold = 0.1,
      pathSmoothing = 'balanced',
      gradientOptimization = true
    } = options

    // 执行图像处理
    const result = await new Promise<ProcessingResult>((resolve, reject) => {
      potrace.trace(imageData, {
        turdSize: 2,
        turnPolicy: 'minority',
        alphaMax: 1,
        optCurve: true,
        threshold: lineThreshold,
        blackOnWhite: false
      }, (err: Error | null, svg: string) => {
        if (err) {
          reject(err)
          return
        }

        resolve({
          layers: [{
            color: '#000000',
            paths: [svg]
          }],
          gradients: [],
          metadata: {
            processingTime: performance.now() - startTime,
            originalSize: {
              width: imageData.width,
              height: imageData.height
            },
            outputSize: {
              width: imageData.width,
              height: imageData.height
            }
          }
        })
      })
    })

    return result
  }
}

expose(worker) 
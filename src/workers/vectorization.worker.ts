import { expose } from 'comlink'
import { trace } from '@vectormage/image-tracer'
import type { ColorLayer, ImageProcessingOptions } from '../types/imageProcessing'

async function vectorizeLayer(
  imageData: ImageData,
  mask: Uint8Array,
  options: Partial<ImageProcessingOptions> = {}
): Promise<ColorLayer> {
  const {
    pathPrecision = 2,
    lineThreshold = 0.05,
    pathSmoothing = 'balanced',
  } = options

  // 应用掩码
  const maskedData = new Uint8ClampedArray(imageData.data.length)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const maskIndex = i / 4
    if (mask[maskIndex]) {
      maskedData[i] = imageData.data[i]
      maskedData[i + 1] = imageData.data[i + 1]
      maskedData[i + 2] = imageData.data[i + 2]
      maskedData[i + 3] = imageData.data[i + 3]
    } else {
      maskedData[i] = maskedData[i + 1] = maskedData[i + 2] = maskedData[i + 3] = 0
    }
  }

  const maskedImageData = new ImageData(
    maskedData,
    imageData.width,
    imageData.height
  )

  // 执行矢量化
  const svgPath = await trace(maskedImageData, {
    pathPrecision,
    lineThreshold,
    gradientOptimize: true,
  })

  // 路径优化
  const optimizedPath = optimizeSVGPath(svgPath, pathSmoothing)

  // 计算平均颜色
  const color = calculateAverageColor(maskedImageData)

  return {
    color,
    path: optimizedPath,
    opacity: 1,
  }
}

function optimizeSVGPath(path: string, smoothing: 'high' | 'balanced' | 'minimal'): string {
  // 使用 Ramer-Douglas-Peucker 算法简化路径
  const tolerance = {
    high: 0.1,
    balanced: 0.5,
    minimal: 1.0,
  }[smoothing]

  // TODO: 实现路径简化算法
  return path
}

function calculateAverageColor(imageData: ImageData) {
  let r = 0
  let g = 0
  let b = 0
  let count = 0

  for (let i = 0; i < imageData.data.length; i += 4) {
    if (imageData.data[i + 3] > 0) {
      r += imageData.data[i]
      g += imageData.data[i + 1]
      b += imageData.data[i + 2]
      count++
    }
  }

  if (count === 0) {
    return { r: 0, g: 0, b: 0 }
  }

  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count),
  }
}

const worker = {
  vectorizeLayer,
}

expose(worker) 
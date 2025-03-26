import { expose } from 'comlink'
import * as cv from 'opencv.js'
import { rgb } from 'd3-color'
import type { ColorAnalysisResult, ImageProcessingOptions } from '../types/imageProcessing'

async function analyzeColors(
  imageData: ImageData,
  options: Partial<ImageProcessingOptions> = {}
): Promise<ColorAnalysisResult> {
  const { colorPrecision = 8 } = options
  const { width, height, data } = imageData

  // 创建OpenCV矩阵
  const mat = cv.matFromImageData(imageData)
  const labMat = new cv.Mat()
  cv.cvtColor(mat, labMat, cv.COLOR_RGBA2Lab)

  // 准备K-means输入数据
  const samples = labMat.reshape(1, width * height)
  const labels = new cv.Mat()
  const centers = new cv.Mat()
  const criteria = new cv.TermCriteria(
    cv.TermCriteria_EPS + cv.TermCriteria_MAX_ITER,
    10,
    1.0
  )

  // 执行K-means聚类
  cv.kmeans(
    samples,
    colorPrecision,
    labels,
    criteria,
    5,
    cv.KMEANS_PP_CENTERS,
    centers
  )

  // 提取颜色调色板
  const palette = Array.from({ length: colorPrecision }, (_, i) => {
    const lab = centers.row(i).data
    const rgbColor = cv.cvtColor(
      new cv.Mat(1, 1, cv.CV_8UC3, new Uint8Array([lab[0], lab[1], lab[2]])),
      cv.COLOR_Lab2RGB
    )
    const [r, g, b] = rgbColor.data
    return rgb(r, g, b)
  })

  // 创建颜色掩码
  const masks = Array.from({ length: colorPrecision }, (_, i) => {
    const mask = new cv.Mat()
    cv.compare(labels, new cv.Mat(1, 1, cv.CV_32S, new Int32Array([i])), mask, cv.CMP_EQ)
    return mask.data
  })

  // 检测渐变
  const gradients = detectGradients(mat, labels)

  // 清理资源
  mat.delete()
  labMat.delete()
  samples.delete()
  labels.delete()
  centers.delete()

  return {
    palette,
    masks,
    gradients,
  }
}

function detectGradients(mat: cv.Mat, labels: cv.Mat) {
  const gradientMat = new cv.Mat()
  cv.Sobel(mat, gradientMat, cv.CV_8U, 1, 1)

  // 使用霍夫变换检测直线
  const lines = new cv.Mat()
  cv.HoughLinesP(
    gradientMat,
    lines,
    1,
    Math.PI / 180,
    50,
    30,
    10
  )

  const gradients = []
  for (let i = 0; i < lines.rows; i++) {
    const [x1, y1, x2, y2] = lines.row(i).data
    const gradient = analyzeGradientAlongLine(mat, x1, y1, x2, y2)
    if (gradient) {
      gradients.push({
        type: 'linear',
        stops: gradient,
        bounds: { x1, y1, x2, y2 },
      })
    }
  }

  gradientMat.delete()
  lines.delete()

  return gradients
}

function analyzeGradientAlongLine(
  mat: cv.Mat,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  const steps = Math.min(Math.floor(length), 10)
  const stops = []

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = Math.round(x1 + (x2 - x1) * t)
    const y = Math.round(y1 + (y2 - y1) * t)
    
    if (x >= 0 && x < mat.cols && y >= 0 && y < mat.rows) {
      const pixel = mat.ucharPtr(y, x)
      stops.push({
        offset: t * 100,
        color: rgb(pixel[0], pixel[1], pixel[2]),
      })
    }
  }

  return stops.length > 1 ? stops : null
}

const worker = {
  analyzeColors,
}

expose(worker) 
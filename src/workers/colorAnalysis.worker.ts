import { expose } from 'comlink'
import cv from 'opencv.js'
import { ImageData, ColorAnalysisResult } from '../types/imageProcessing'

const worker = {
  async analyzeColors(imageData: ImageData, numColors: number): Promise<ColorAnalysisResult> {
    // 创建 OpenCV Mat 对象
    const src = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC4)
    const dst = new cv.Mat(imageData.height, imageData.width, cv.CV_8UC3)
    
    // 复制图像数据
    src.data.set(imageData.data)
    
    // 转换到 LAB 颜色空间
    cv.cvtColor(src, dst, cv.COLOR_RGBA2Lab)
    
    // 准备 k-means 聚类数据
    const data = dst.reshape(1, imageData.width * imageData.height)
    const labels = new cv.Mat(imageData.width * imageData.height, 1, cv.CV_32F)
    const centers = new cv.Mat(numColors, 3, cv.CV_32F)
    
    // 设置终止条件
    const criteria = new cv.TermCriteria(
      cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_MAX_ITER,
      100,
      0.2
    )
    
    // 执行 k-means 聚类
    cv.kmeans(data, numColors, labels, criteria, 10, cv.KMEANS_RANDOM_CENTERS, centers)
    
    // 处理结果
    const dominantColors: string[] = []
    const colorDistribution: Record<string, number> = {}
    const colorSegments: { color: string; mask: ImageData }[] = []
    
    // 清理资源
    src.delete()
    dst.delete()
    data.delete()
    labels.delete()
    centers.delete()
    
    return {
      dominantColors,
      colorDistribution,
      colorSegments
    }
  }
}

expose(worker) 
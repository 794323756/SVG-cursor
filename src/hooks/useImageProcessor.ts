import { useState, useCallback } from 'react'
import { ProcessingResult, ImageProcessingOptions } from '../types/imageProcessing'

interface Pixel {
  x: number;
  y: number;
}

interface ColorData {
  color: string;
  pixels: Pixel[];
}

// 优化的边缘检测函数，用于获取更准确的轮廓
function getOptimizedEdges(bitmap: boolean[][], width: number, height: number): boolean[][] {
  // 创建边缘检测结果数组
  const edges = Array(height).fill(0).map(() => Array(width).fill(false));
  
  // Sobel算子边缘检测
  const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (!bitmap[y][x]) continue;
      
      // 检查周围8个方向是否有非同色区域
      for (const [dx, dy] of directions) {
        const nx = x + dx;
        const ny = y + dy;
        
        // 边界检查
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          if (!bitmap[ny][nx]) {
            edges[y][x] = true;
            break;
          }
        }
      }
    }
  }
  
  return edges;
}

// 寻找相连的边缘点
function traceContour(edges: boolean[][], startX: number, startY: number, width: number, height: number): Pixel[] {
  const visited = Array(height).fill(0).map(() => Array(width).fill(false));
  const contour: Pixel[] = [];
  const stack: Pixel[] = [{ x: startX, y: startY }];
  
  const directions = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ];
  
  while (stack.length > 0) {
    const pixel = stack.pop()!;
    const { x, y } = pixel;
    
    if (x < 0 || x >= width || y < 0 || y >= height || visited[y][x] || !edges[y][x]) {
      continue;
    }
    
    visited[y][x] = true;
    contour.push(pixel);
    
    // 优先顺时针方向探索，更有利于生成连续路径
    for (let i = 0; i < directions.length; i++) {
      const [dx, dy] = directions[i];
      stack.push({ x: x + dx, y: y + dy });
    }
  }
  
  return contour;
}

// 对轮廓点进行排序，生成连续路径
function arrangeContourPoints(contour: Pixel[]): Pixel[] {
  if (contour.length <= 2) return contour;
  
  const result: Pixel[] = [contour[0]];
  const remaining = new Set(contour.slice(1).map(p => `${p.x},${p.y}`));
  let current = contour[0];
  
  while (remaining.size > 0) {
    let closest: Pixel | null = null;
    let minDistance = Infinity;
    
    // 找到最近的点
    for (const point of contour) {
      const key = `${point.x},${point.y}`;
      if (!remaining.has(key)) continue;
      
      const distance = Math.sqrt(
        Math.pow(point.x - current.x, 2) + 
        Math.pow(point.y - current.y, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }
    
    if (closest === null) break;
    
    // 如果最近点距离过远，进行路径缝合
    if (minDistance > 2.5) {
      // 插入中间点
      const midX = Math.round(current.x + (closest.x - current.x) / 2);
      const midY = Math.round(current.y + (closest.y - current.y) / 2);
      result.push({ x: midX, y: midY });
    }
    
    result.push(closest);
    remaining.delete(`${closest.x},${closest.y}`);
    current = closest;
  }
  
  return result;
}

// 使用Douglas-Peucker算法优化路径点，去除冗余点
function simplifyPath(points: Pixel[], tolerance: number): Pixel[] {
  if (points.length <= 2) return points;
  
  // 查找距离线段最远的点
  let maxDistance = 0;
  let index = 0;
  const start = points[0];
  const end = points[points.length - 1];
  
  // 如果起点和终点重合，不能构成线段，直接返回两个点
  if (start.x === end.x && start.y === end.y) {
    return [start, end];
  }
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = pointToLineDistance(points[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  
  // 如果最大距离小于阈值，则所有点可以近似为一条直线
  if (maxDistance < tolerance) {
    return [start, end];
  }
  
  // 递归简化路径
  const firstPart = simplifyPath(points.slice(0, index + 1), tolerance);
  const secondPart = simplifyPath(points.slice(index), tolerance);
  
  // 合并两部分结果，去除重复点
  return [...firstPart.slice(0, -1), ...secondPart];
}

// 计算点到线段的距离
function pointToLineDistance(point: Pixel, lineStart: Pixel, lineEnd: Pixel): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  // 如果线段退化为点，则直接计算点到点的距离
  if (dx === 0 && dy === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + 
      Math.pow(point.y - lineStart.y, 2)
    );
  }
  
  // 线段长度的平方
  const lineLengthSq = dx * dx + dy * dy;
  
  // 计算投影比例 t
  const t = Math.max(0, Math.min(1, 
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSq
  ));
  
  // 计算投影点
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  
  // 计算点到投影点的距离
  return Math.sqrt(
    Math.pow(point.x - projX, 2) + 
    Math.pow(point.y - projY, 2)
  );
}

// 将轮廓点转换为SVG路径
function pointsToSVGPath(points: Pixel[]): string {
  if (points.length < 2) return '';
  
  const parts: string[] = [];
  parts.push(`M ${points[0].x} ${points[0].y}`);
  
  for (let i = 1; i < points.length; i++) {
    parts.push(`L ${points[i].x} ${points[i].y}`);
  }
  
  // 闭合路径
  parts.push('Z');
  return parts.join(' ');
}

export const useImageProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const processImage = useCallback(async (
    imageData: ImageData,
    options: ImageProcessingOptions
  ): Promise<ProcessingResult> => {
    setIsProcessing(true)
    setError(null)

    try {
      // 获取图片数据
      const { width, height, data } = imageData
      
      // 创建颜色映射，使用改进的颜色量化算法
      const colorPrecision = options.colorPrecision || 8
      const pathPrecision = options.pathPrecision || 2
      const lineThreshold = options.lineThreshold || 0.1
      const pathSmoothing = options.pathSmoothing || 'balanced'
      const gradientOptimization = options.gradientOptimization || true
      
      const colorMapping = new Map<string, ColorData>()
      
      // 第一阶段：收集原始颜色数据
      const rawColors = new Map<string, {r: number, g: number, b: number, count: number}>()
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]
        
        if (a < 128) continue // 跳过透明像素
        
        const colorKey = `${r},${g},${b}`
        if (!rawColors.has(colorKey)) {
          rawColors.set(colorKey, {r, g, b, count: 1})
        } else {
          rawColors.get(colorKey)!.count++
        }
      }
      
      // 第二阶段：使用K-means算法对颜色进行聚类
      // 简化实现：将颜色空间以颜色精度为单位进行划分
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const a = data[i + 3]
        
        if (a < 128) continue // 跳过透明像素
        
        // 量化颜色
        const quantR = Math.round(r / (256 / colorPrecision)) * (256 / colorPrecision)
        const quantG = Math.round(g / (256 / colorPrecision)) * (256 / colorPrecision)
        const quantB = Math.round(b / (256 / colorPrecision)) * (256 / colorPrecision)
        
        const colorKey = `${quantR},${quantG},${quantB}`
        if (!colorMapping.has(colorKey)) {
          colorMapping.set(colorKey, {
            color: `rgb(${quantR}, ${quantG}, ${quantB})`,
            pixels: []
          })
        }
        
        const pixelX = (i / 4) % width
        const pixelY = Math.floor((i / 4) / width)
        colorMapping.get(colorKey)!.pixels.push({ x: pixelX, y: pixelY })
      }
      
      // 处理每个颜色层
      const layers: Array<{color: string; paths: string[]}> = [];
      
      for (const [_, colorData] of colorMapping.entries()) {
        const { color, pixels } = colorData
        
        // 创建位图表示
        const bitmap = Array(height).fill(0).map(() => Array(width).fill(false))
        pixels.forEach((pixel: Pixel) => {
          bitmap[pixel.y][pixel.x] = true
        })
        
        // 使用优化的边缘检测算法
        const edges = getOptimizedEdges(bitmap, width, height)
        const paths: string[] = []
        
        // 标记已访问的边缘点
        const visited = Array(height).fill(0).map(() => Array(width).fill(false))
        
        // 查找所有轮廓
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (edges[y][x] && !visited[y][x]) {
              // 追踪当前轮廓
              const contour = traceContour(edges, x, y, width, height)
              
              // 标记为已访问
              contour.forEach(p => {
                visited[p.y][p.x] = true
              })
              
              if (contour.length > 2) {
                // 对轮廓点进行排序
                const arrangedContour = arrangeContourPoints(contour)
                
                // 根据路径精度进行简化
                const tolerance = 6 - (pathPrecision || 2) // 转换为合适的简化阈值
                const simplifiedContour = simplifyPath(arrangedContour, tolerance)
                
                // 生成SVG路径
                const svgPath = pointsToSVGPath(simplifiedContour)
                paths.push(svgPath)
              }
            }
          }
        }
        
        if (paths.length > 0) {
          layers.push({
            color,
            paths
          })
        }
      }
      
      return {
        layers,
        gradients: [],
        metadata: {
          width,
          height,
          colorPrecision,
          pathPrecision,
          lineThreshold,
          pathSmoothing,
          gradientOptimization
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理图像时发生错误')
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    processImage,
    isProcessing,
    error
  }
} 
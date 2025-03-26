import { ImageProcessingOptions } from '../types';

/**
 * 计算两个图像之间的结构相似性指数 (SSIM)
 * 用于验证SVG转换的保真度
 */
export function calculateSSIM(original: ImageData, converted: ImageData): number {
  // 确保图像尺寸一致
  if (original.width !== converted.width || original.height !== converted.height) {
    throw new Error('图像尺寸不匹配');
  }

  const { width, height, data: originalData } = original;
  const { data: convertedData } = converted;
  
  // 配置参数
  const windowSize = 8;
  const K1 = 0.01;
  const K2 = 0.03;
  const L = 255; // 像素最大值
  const C1 = (K1 * L) ** 2;
  const C2 = (K2 * L) ** 2;
  
  let ssimSum = 0;
  let windowCount = 0;
  
  // 将图像数据转换为灰度值
  const originalGray = new Uint8Array(width * height);
  const convertedGray = new Uint8Array(width * height);
  
  for (let i = 0; i < originalData.length; i += 4) {
    const index = i / 4;
    // 转换为灰度：0.3R + 0.59G + 0.11B
    originalGray[index] = Math.round(
      0.3 * originalData[i] + 0.59 * originalData[i + 1] + 0.11 * originalData[i + 2]
    );
    convertedGray[index] = Math.round(
      0.3 * convertedData[i] + 0.59 * convertedData[i + 1] + 0.11 * convertedData[i + 2]
    );
  }
  
  // 对每个滑动窗口计算SSIM
  for (let y = 0; y <= height - windowSize; y += windowSize / 2) {
    for (let x = 0; x <= width - windowSize; x += windowSize / 2) {
      let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, sum12 = 0;
      
      // 计算窗口内的统计数据
      for (let wy = 0; wy < windowSize; wy++) {
        for (let wx = 0; wx < windowSize; wx++) {
          const index = (y + wy) * width + (x + wx);
          const p1 = originalGray[index];
          const p2 = convertedGray[index];
          
          sum1 += p1;
          sum2 += p2;
          sum1Sq += p1 * p1;
          sum2Sq += p2 * p2;
          sum12 += p1 * p2;
        }
      }
      
      // 计算均值和方差
      const n = windowSize * windowSize;
      const mu1 = sum1 / n;
      const mu2 = sum2 / n;
      const sigma1Sq = sum1Sq / n - mu1 * mu1;
      const sigma2Sq = sum2Sq / n - mu2 * mu2;
      const sigma12 = sum12 / n - mu1 * mu2;
      
      // 计算SSIM
      const ssim = ((2 * mu1 * mu2 + C1) * (2 * sigma12 + C2)) / 
                   ((mu1 * mu1 + mu2 * mu2 + C1) * (sigma1Sq + sigma2Sq + C2));
      
      ssimSum += ssim;
      windowCount++;
    }
  }
  
  // 返回平均SSIM
  return ssimSum / windowCount;
}

/**
 * 计算图像的信息熵，用于评估图像的复杂度
 */
export function calculateImageEntropy(imageData: ImageData): number {
  const { data, width, height } = imageData;
  const histogramR = new Array(256).fill(0);
  const histogramG = new Array(256).fill(0);
  const histogramB = new Array(256).fill(0);
  const totalPixels = width * height;
  
  // 计算直方图
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue; // 跳过透明像素
    
    histogramR[data[i]]++;
    histogramG[data[i + 1]]++;
    histogramB[data[i + 2]]++;
  }
  
  // 计算各通道的熵
  let entropyR = 0, entropyG = 0, entropyB = 0;
  
  for (let i = 0; i < 256; i++) {
    if (histogramR[i] > 0) {
      const probability = histogramR[i] / totalPixels;
      entropyR -= probability * Math.log2(probability);
    }
    
    if (histogramG[i] > 0) {
      const probability = histogramG[i] / totalPixels;
      entropyG -= probability * Math.log2(probability);
    }
    
    if (histogramB[i] > 0) {
      const probability = histogramB[i] / totalPixels;
      entropyB -= probability * Math.log2(probability);
    }
  }
  
  // 返回三个通道的平均熵
  return (entropyR + entropyG + entropyB) / 3;
}

/**
 * 自动计算最佳颜色量化参数
 */
export function calculateOptimalColorPrecision(imageData: ImageData): number {
  const entropy = calculateImageEntropy(imageData);
  
  // 根据图像熵值动态调整颜色精度
  // 熵值越高，图像越复杂，需要更多的颜色
  if (entropy > 7.5) {
    return Math.min(24, Math.max(16, Math.round(entropy * 1.8)));
  } else if (entropy > 6) {
    return Math.min(16, Math.max(12, Math.round(entropy * 1.5)));
  } else if (entropy > 4.5) {
    return Math.min(12, Math.max(8, Math.round(entropy * 1.2)));
  } else {
    return Math.min(8, Math.max(4, Math.round(entropy)));
  }
}

/**
 * 自动推荐最佳处理参数
 */
export function getOptimalProcessingOptions(imageData: ImageData): ImageProcessingOptions {
  const entropy = calculateImageEntropy(imageData);
  const complexity = entropy / 8; // 归一化为0-1范围
  
  // 根据图像复杂度推荐参数
  return {
    colorPrecision: calculateOptimalColorPrecision(imageData),
    pathPrecision: complexity > 0.7 ? 2.5 : (complexity > 0.5 ? 2 : 1.5),
    lineThreshold: complexity > 0.7 ? 0.05 : (complexity > 0.5 ? 0.08 : 0.1),
    pathSmoothing: complexity > 0.7 ? 'minimal' : (complexity > 0.5 ? 'balanced' : 'high'),
    gradientOptimization: complexity > 0.4 // 复杂图像可能包含更多渐变
  };
}

/**
 * 检测图像是否包含文本
 */
export function detectTextContent(imageData: ImageData): boolean {
  // 简化实现：通过边缘密度评估是否包含文本
  // 文本通常具有高边缘密度和特定的边缘分布模式
  const { width, height, data } = imageData;
  const edgeMap = new Uint8Array(width * height);
  let edgeCount = 0;
  
  // 使用简单的梯度检测生成边缘图
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // 计算周围像素的梯度
      const gx = Math.abs(
        data[idx - 4] - data[idx + 4] +
        data[idx - 4 + width * 4] - data[idx + 4 + width * 4] +
        data[idx - 4 - width * 4] - data[idx + 4 - width * 4]
      ) / 3;
      
      const gy = Math.abs(
        data[idx - width * 4] - data[idx + width * 4] +
        data[idx - width * 4 - 4] - data[idx + width * 4 - 4] +
        data[idx - width * 4 + 4] - data[idx + width * 4 + 4]
      ) / 3;
      
      const gradient = Math.sqrt(gx * gx + gy * gy);
      
      // 边缘检测阈值
      if (gradient > 30) {
        edgeMap[y * width + x] = 1;
        edgeCount++;
      }
    }
  }
  
  // 计算边缘密度
  const edgeDensity = edgeCount / (width * height);
  
  // 分析边缘的垂直/水平分布比例（文本通常有规律的分布）
  let horizontalEdges = 0;
  let verticalEdges = 0;
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (edgeMap[y * width + x] === 0) continue;
      
      // 检查水平方向边缘
      if (
        edgeMap[y * width + x - 1] === 1 || 
        edgeMap[y * width + x + 1] === 1
      ) {
        horizontalEdges++;
      }
      
      // 检查垂直方向边缘
      if (
        edgeMap[(y - 1) * width + x] === 1 || 
        edgeMap[(y + 1) * width + x] === 1
      ) {
        verticalEdges++;
      }
    }
  }
  
  // 计算方向比率
  const directionRatio = horizontalEdges / (verticalEdges || 1);
  
  // 文本特征：边缘密度适中且方向比例接近于1
  return edgeDensity > 0.05 && edgeDensity < 0.3 && directionRatio > 0.7 && directionRatio < 1.5;
}

/**
 * 验证SVG路径的有效性
 */
export function validateSVGPaths(paths: string[]): string[] {
  const errors: string[] = [];
  
  for (const path of paths) {
    // 检查路径是否以M指令开头
    if (!path.trim().startsWith('M')) {
      errors.push(`路径未以M指令开头: ${path.substring(0, 30)}...`);
    }
    
    // 检查路径是否闭合
    if (!path.includes('Z')) {
      errors.push(`路径未闭合: ${path.substring(0, 30)}...`);
    }
    
    // 检查路径中是否有非法指令
    const commands = path.split(' ').filter(cmd => cmd.match(/^[A-Za-z]/));
    const validCommands = ['M', 'L', 'H', 'V', 'C', 'S', 'Q', 'T', 'A', 'Z'];
    
    for (const cmd of commands) {
      if (!validCommands.includes(cmd)) {
        errors.push(`路径包含非法指令 "${cmd}": ${path.substring(0, 30)}...`);
      }
    }
    
    // 检查是否有连续的移动指令
    if (path.match(/M[^L]*M/)) {
      errors.push(`路径包含连续的移动指令: ${path.substring(0, 30)}...`);
    }
  }
  
  return errors;
}

/**
 * 修复SVG路径中的常见问题
 */
export function fixSVGPath(path: string): string {
  let fixedPath = path;
  
  // 确保路径以M指令开头
  if (!fixedPath.trim().startsWith('M')) {
    const firstMIndex = fixedPath.indexOf('M');
    if (firstMIndex > 0) {
      fixedPath = fixedPath.substring(firstMIndex);
    } else {
      // 如果没有M指令，添加一个默认的起点
      fixedPath = 'M 0 0 ' + fixedPath;
    }
  }
  
  // 确保路径闭合
  if (!fixedPath.includes('Z')) {
    fixedPath += ' Z';
  }
  
  // 修复重复的控制点
  fixedPath = fixedPath.replace(/([0-9.-]+) \1 \1 \1/g, '$1 $1');
  
  // 修复数字之间的多余空格
  fixedPath = fixedPath.replace(/([0-9.-]+)\s+([0-9.-]+)/g, '$1 $2');
  
  // 修复缺失的空格
  fixedPath = fixedPath.replace(/([A-Za-z])([0-9.-])/g, '$1 $2');
  
  // 修复可能的NaN
  fixedPath = fixedPath.replace(/NaN/g, '0');
  
  return fixedPath;
}

/**
 * 分析原始图像并推荐最佳处理策略
 */
export function analyzeImage(imageData: ImageData): {
  options: ImageProcessingOptions,
  hasText: boolean,
  complexity: number,
  suggestedMode: 'precise' | 'balanced' | 'fast'
} {
  const entropy = calculateImageEntropy(imageData);
  const hasText = detectTextContent(imageData);
  const complexity = entropy / 8; // 归一化为0-1范围
  
  // 根据图像特性选择最佳模式
  let suggestedMode: 'precise' | 'balanced' | 'fast';
  
  if (hasText || complexity > 0.7) {
    suggestedMode = 'precise';
  } else if (complexity > 0.4) {
    suggestedMode = 'balanced';
  } else {
    suggestedMode = 'fast';
  }
  
  // 根据分析结果调整选项
  const options = getOptimalProcessingOptions(imageData);
  
  // 如果检测到文本，调整文本处理的参数
  if (hasText) {
    options.pathPrecision = Math.min(options.pathPrecision + 0.5, 5);
    options.lineThreshold = Math.max(options.lineThreshold - 0.02, 0.01);
    options.pathSmoothing = 'minimal';
    options.gradientOptimization = false;
  }
  
  return {
    options,
    hasText,
    complexity,
    suggestedMode
  };
}

/**
 * 应用颜色后处理，改善相邻颜色区域的过渡
 */
export function postProcessColorLayers(layers: Array<{ color: string, path: string }>): Array<{ color: string, path: string }> {
  // 将RGB颜色字符串转换为数组
  const parseRGB = (rgb: string): [number, number, number] => {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return [0, 0, 0];
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  };
  
  // 计算两个颜色的相似度 (0-1)
  const colorSimilarity = (color1: string, color2: string): number => {
    const [r1, g1, b1] = parseRGB(color1);
    const [r2, g2, b2] = parseRGB(color2);
    
    // 使用欧氏距离计算颜色差异
    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + 
      Math.pow(g1 - g2, 2) + 
      Math.pow(b1 - b2, 2)
    );
    
    // 归一化为0-1范围
    return 1 - Math.min(distance / 441.67, 1); // 441.67 = sqrt(255^2 * 3)
  };
  
  // 按颜色相似度分组
  const groupedLayers: Array<Array<{ color: string, path: string }>> = [];
  
  for (const layer of layers) {
    let addedToGroup = false;
    
    for (const group of groupedLayers) {
      const similarity = colorSimilarity(layer.color, group[0].color);
      
      if (similarity > 0.9) { // 90%以上的相似度归为一组
        group.push(layer);
        addedToGroup = true;
        break;
      }
    }
    
    if (!addedToGroup) {
      groupedLayers.push([layer]);
    }
  }
  
  // 处理每组：相似颜色层合并
  const processedLayers: Array<{ color: string, path: string }> = [];
  
  for (const group of groupedLayers) {
    if (group.length === 1) {
      processedLayers.push(group[0]);
    } else {
      // 对于相似颜色组，使用第一个颜色，合并所有路径
      const combinedPath = group.map(layer => layer.path).join(' ');
      processedLayers.push({
        color: group[0].color,
        path: combinedPath
      });
    }
  }
  
  return processedLayers;
} 
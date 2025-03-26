import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { saveAs } from 'file-saver'
import { useImageProcessor } from './hooks/useImageProcessor'
import { SVGPreview } from './components/SVGPreview'
import { ControlPanel } from './components/ControlPanel'
import { ImageProcessingOptions } from './types'
import { 
  analyzeImage, 
  validateSVGPaths, 
  fixSVGPath, 
  postProcessColorLayers 
} from './utils/imageProcessingUtils'

export default function App() {
  const { processImage, isProcessing: isProcessorBusy } = useImageProcessor()
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null)
  const [result, setResult] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<any>(null)
  const [processingMode, setProcessingMode] = useState<'auto' | 'manual'>('auto')

  const [options, setOptions] = useState<ImageProcessingOptions>({
    colorPrecision: 8,
    pathPrecision: 2,
    lineThreshold: 0.1,
    pathSmoothing: 'balanced',
    gradientOptimization: true
  })

  useEffect(() => {
    if (originalImageData && processingMode === 'auto') {
      try {
        const analysis = analyzeImage(originalImageData)
        setImageAnalysis(analysis)
        setOptions(analysis.options)
      } catch (err) {
        console.error('图像分析失败:', err)
      }
    }
  }, [originalImageData, processingMode])

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过 10MB')
      return
    }

    try {
      setIsProcessing(true)
      setError(null)
      setResult(null)

      const reader = new FileReader()
      reader.onload = async (e) => {
        const img = new Image()
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            setError('无法创建画布上下文')
            return
          }
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, img.width, img.height)
          
          setOriginalImage(img.src)
          setOriginalImageData(imageData)
          
          if (processingMode === 'auto') {
            await processImageWithErrorHandling(imageData)
          }
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理图片时发生错误')
    } finally {
      setIsProcessing(false)
    }
  }

  const processImageWithErrorHandling = async (imageData: ImageData) => {
    try {
      setIsProcessing(true)
      setError(null)
      
      const rawResult = await processImage(imageData, options)
      
      const allPaths = rawResult.layers.flatMap(layer => layer.paths)
      const pathErrors = validateSVGPaths(allPaths)
      
      if (pathErrors.length > 0) {
        const fixedLayers = rawResult.layers.map(layer => ({
          ...layer,
          paths: layer.paths.map(path => fixSVGPath(path))
        }))
        rawResult.layers = fixedLayers
      }
      
      if (options.gradientOptimization) {
        rawResult.layers = postProcessColorLayers(rawResult.layers)
      }
      
      setResult(rawResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理图像时发生错误')
      console.error('图像处理失败:', err)
    } finally {
      setIsProcessing(false)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp']
    },
    maxFiles: 1
  })

  const handleExport = () => {
    if (!result) return

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${result.metadata.width}" height="${result.metadata.height}" viewBox="0 0 ${result.metadata.width} ${result.metadata.height}" xmlns="http://www.w3.org/2000/svg">
  ${result.gradients.map((gradient) => `
    <defs>
      <${gradient.type}Gradient id="${gradient.id}">
        ${gradient.colors.map((stop) => `
          <stop offset="${stop.offset * 100}%" stop-color="${stop.color}" />
        `).join('')}
      </${gradient.type}Gradient>
    </defs>
  `).join('')}
  ${result.layers.map((layer) => `
    <path d="${layer.paths.join(' ')}" fill="${layer.color}" />
  `).join('')}
</svg>`

    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    saveAs(blob, 'vectorized.svg')
  }

  const toggleProcessingMode = () => {
    const newMode = processingMode === 'auto' ? 'manual' : 'auto'
    setProcessingMode(newMode)
    
    if (newMode === 'auto' && originalImageData) {
      const analysis = analyzeImage(originalImageData)
      setImageAnalysis(analysis)
      setOptions(analysis.options)
    }
  }

  const handleOptionsChange = (newOptions: ImageProcessingOptions) => {
    setOptions(newOptions)
    
    if (originalImageData && !isProcessorBusy) {
      processImageWithErrorHandling(originalImageData)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">位图转 SVG</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
            >
              <input {...getInputProps()} />
              {originalImage ? (
                <img
                  src={originalImage}
                  alt="原始图片"
                  className="max-w-full h-auto mx-auto"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div className="text-gray-500">
                  <svg 
                    className="mx-auto h-24 w-24 text-gray-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                  <p className="text-lg mt-4">拖放图片到这里，或者点击选择图片</p>
                  <p className="text-sm mt-2">支持 PNG、JPG、JPEG、GIF、BMP 格式</p>
                  <p className="text-sm mt-2 text-gray-400">建议图片尺寸不超过 2000×2000 像素，过大可能导致处理卡顿</p>
                </div>
              )}
            </div>
            
            {imageAnalysis && (
              <div className="mt-4 p-4 bg-white rounded-lg shadow">
                <h3 className="font-medium text-gray-900">图像分析</h3>
                <ul className="mt-2 text-sm text-gray-600">
                  <li>复杂度: {Math.round(imageAnalysis.complexity * 100)}%</li>
                  <li>图像特征: {imageAnalysis.hasText ? '包含文本' : '图形为主'}</li>
                  <li>推荐模式: {
                    imageAnalysis.suggestedMode === 'precise' ? '精确' : 
                    imageAnalysis.suggestedMode === 'balanced' ? '平衡' : '快速'
                  }</li>
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="bg-white p-6 rounded-lg shadow mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-medium text-gray-900">处理模式</h2>
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-600">
                      {processingMode === 'auto' ? '自动' : '手动'}
                    </span>
                    <button
                      onClick={toggleProcessingMode}
                      className="px-3 py-1 text-sm bg-primary text-white rounded-md"
                    >
                      切换
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {processingMode === 'auto' 
                    ? '自动模式：系统自动分析图像并选择最佳参数' 
                    : '手动模式：您可以手动调整所有处理参数'}
                </p>
              </div>
              
              <ControlPanel
                options={options}
                onChange={processingMode === 'manual' 
                  ? handleOptionsChange 
                  : () => {/* 自动模式下禁用参数更改 */}}
                disabled={processingMode === 'auto'}
              />
            </div>

            {result && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">预览</h2>
                  <button
                    onClick={handleExport}
                    className="btn btn-primary"
                  >
                    导出 SVG
                  </button>
                </div>
                <div className="rounded-lg">
                  <SVGPreview result={result} />
                </div>
                
                <div className="mt-4 p-4 bg-white rounded-lg shadow">
                  <h3 className="font-medium text-gray-900">转换信息</h3>
                  <ul className="mt-2 text-sm text-gray-600">
                    <li>尺寸: {result.metadata.width} × {result.metadata.height} 像素</li>
                    <li>颜色数量: {result.metadata.colorCount}</li>
                    <li>路径数量: {result.layers.length}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-error/10 border border-error/20 rounded-md">
              <p className="text-error">{error}</p>
            </div>
          )}

          {isProcessing && (
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-md">
              <p className="text-primary">正在处理图片...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 
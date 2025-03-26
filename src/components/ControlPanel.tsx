import { ImageProcessingOptions } from '../types'
import { useState } from 'react'

interface ControlPanelProps {
  options: ImageProcessingOptions
  onChange: (options: ImageProcessingOptions) => void
  disabled?: boolean
}

interface TooltipProps {
  text: string
  children: React.ReactNode
  isLabel?: boolean
  isPathSmoothing?: boolean
}

// 提示气泡组件
function Tooltip({ text, children, isLabel = true, isPathSmoothing = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex items-center"
      >
        {children}
        <div className={`flex items-center justify-center ml-1.5 w-3 h-3 rounded-full border border-[#D6D6D6] text-[#D6D6D6] text-[10px] leading-none cursor-help ${isLabel && isPathSmoothing ? 'translate-y-[-4px]' : isLabel ? 'translate-y-[-3px]' : ''}`}>
          <span>i</span>
        </div>
      </div>
      {isVisible && (
        <div className="absolute z-10 w-64 p-2 -mt-1 text-sm bg-gray-800 text-white rounded shadow-lg left-full ml-2">
          {text}
        </div>
      )}
    </div>
  )
}

export function ControlPanel({ options, onChange, disabled = false }: ControlPanelProps) {
  const handleColorPrecisionChange = (value: number) => {
    if (disabled) return;
    onChange({ ...options, colorPrecision: value })
  }

  const handlePathPrecisionChange = (value: number) => {
    if (disabled) return;
    onChange({ ...options, pathPrecision: value })
  }

  const handleLineThresholdChange = (value: number) => {
    if (disabled) return;
    onChange({ ...options, lineThreshold: value })
  }

  const handlePathSmoothingChange = (value: 'high' | 'balanced' | 'minimal') => {
    if (disabled) return;
    onChange({ ...options, pathSmoothing: value })
  }

  const handleGradientOptimizationChange = (value: boolean) => {
    if (disabled) return;
    onChange({ ...options, gradientOptimization: value })
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow space-y-6 ${disabled ? 'opacity-70' : ''}`}>
      {disabled && (
        <div className="mb-4 p-2 bg-primary/10 text-primary text-sm rounded">
          自动模式已启用，参数已锁定。切换到手动模式可自由调整参数。
        </div>
      )}
      
      <div>
        <Tooltip text="控制输出SVG中使用的颜色数量。值越大，保留的颜色越多，图像细节越丰富；值越小，颜色越少，图像越简洁。推荐范围：4-16（简单图像）或8-24（复杂图像）">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            颜色精度 ({options.colorPrecision})
          </label>
        </Tooltip>
        <input
          type="range"
          value={options.colorPrecision}
          onChange={(e) => handleColorPrecisionChange(Number(e.target.value))}
          min={4}
          max={32}
          step={1}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={disabled}
        />
      </div>

      <div>
        <Tooltip text="控制SVG路径的精细程度。低值会产生更平滑但不太精确的路径，高值会产生更精确但可能锯齿状的路径。推荐范围：1.5-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            路径精度 ({options.pathPrecision})
          </label>
        </Tooltip>
        <input
          type="range"
          value={options.pathPrecision}
          onChange={(e) => handlePathPrecisionChange(Number(e.target.value))}
          min={1}
          max={5}
          step={0.1}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={disabled}
        />
      </div>

      <div>
        <Tooltip text="确定边缘检测的灵敏度。低值可以检测到更多的细微边缘变化，高值只会保留明显的边缘。推荐范围：0.05-0.15">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            线条阈值 ({options.lineThreshold.toFixed(2)})
          </label>
        </Tooltip>
        <input
          type="range"
          value={options.lineThreshold}
          onChange={(e) => handleLineThresholdChange(Number(e.target.value))}
          min={0.01}
          max={0.2}
          step={0.01}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          disabled={disabled}
        />
      </div>

      <div>
        <Tooltip isPathSmoothing text="控制路径曲线的平滑程度。高：最大程度平滑路径；平衡：保持细节和平滑的平衡；最小：保留最多的细节。推荐：平衡">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            路径平滑
          </label>
        </Tooltip>
        <select
          value={options.pathSmoothing}
          onChange={(e) => handlePathSmoothingChange(e.target.value as 'high' | 'balanced' | 'minimal')}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
          disabled={disabled}
        >
          <option value="high">高</option>
          <option value="balanced">平衡</option>
          <option value="minimal">最小</option>
        </select>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="gradientOptimization"
          checked={options.gradientOptimization}
          onChange={(e) => handleGradientOptimizationChange(e.target.checked)}
          className={`h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded ${disabled ? 'cursor-not-allowed bg-gray-100' : ''}`}
          disabled={disabled}
        />
        <Tooltip isLabel={false} text="尝试将相近颜色区域合并为渐变，可以减小文件大小并使过渡更自然。照片建议开启，图标和扁平设计建议关闭。">
          <label htmlFor="gradientOptimization" className={`ml-2 block text-sm text-gray-900 ${disabled ? 'cursor-not-allowed' : ''}`}>
            启用渐变优化
          </label>
        </Tooltip>
      </div>
    </div>
  )
} 
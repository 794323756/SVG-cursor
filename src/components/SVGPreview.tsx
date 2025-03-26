import { useMemo } from 'react'
import { ProcessingResult } from '../types'

interface SVGPreviewProps {
  result: ProcessingResult
  className?: string
}

export function SVGPreview({ result, className = '' }: SVGPreviewProps) {
  const svgContent = useMemo(() => {
    const { width, height } = result.metadata

    return `
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 ${width} ${height}"
        xmlns="http://www.w3.org/2000/svg"
        class="${className}"
        preserveAspectRatio="xMidYMid meet"
      >
        ${result.gradients.map((gradient) => `
          <defs>
            <${gradient.type}Gradient id="${gradient.id}">
              ${gradient.stops.map((stop) => `
                <stop offset="${stop.offset * 100}%" stop-color="${stop.color}" />
              `).join('')}
            </${gradient.type}Gradient>
          </defs>
        `).join('')}
        ${result.layers.map((layer) => `
          <path d="${layer.path}" fill="${layer.color}" />
        `).join('')}
      </svg>
    `
  }, [result, className])

  return (
    <div
      className="w-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8"
      style={{ maxHeight: '600px', overflow: 'auto' }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  )
} 
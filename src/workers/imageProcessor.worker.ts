import { expose } from 'comlink'
import * as potrace from 'potrace'

interface ImageProcessingOptions {
  turdSize: number
  turnPolicy: 'black' | 'white' | 'left' | 'right' | 'minority' | 'majority'
  alphaMax: number
  optCurve: boolean
}

const defaultOptions: ImageProcessingOptions = {
  turdSize: 2,
  turnPolicy: 'minority',
  alphaMax: 1,
  optCurve: true,
}

async function processImage(
  imageData: string,
  options: Partial<ImageProcessingOptions> = {}
): Promise<string> {
  const mergedOptions = { ...defaultOptions, ...options }

  return new Promise((resolve, reject) => {
    potrace.trace(imageData, mergedOptions, (err, svg) => {
      if (err) {
        reject(err)
        return
      }
      resolve(svg)
    })
  })
}

const worker = {
  processImage,
}

expose(worker) 
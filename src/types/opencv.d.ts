declare module 'opencv.js' {
  export interface Mat {
    data32F: Float32Array;
    data32S: Int32Array;
    rows: number;
    delete(): void;
  }

  export interface MatVector {
    size(): number;
    get(index: number): Mat;
    delete(): void;
  }

  export interface TermCriteria {
    type: number;
    maxCount: number;
    epsilon: number;
  }

  export interface Scalar {
    data: number[];
  }

  export function matFromImageData(imageData: ImageData): Mat;
  export function kmeans(
    data: Mat,
    k: number,
    labels: Mat,
    criteria: TermCriteria,
    attempts: number,
    flags: number,
    centers: Mat
  ): void;
  export function inRange(
    src: Mat,
    lowerb: Scalar,
    upperb: Scalar,
    dst: Mat
  ): void;
  export function findContours(
    image: Mat,
    contours: MatVector,
    hierarchy: Mat,
    mode: number,
    method: number
  ): void;
  export function arcLength(curve: Mat, closed: boolean): number;
  export function approxPolyDP(
    curve: Mat,
    approxCurve: Mat,
    epsilon: number,
    closed: boolean
  ): void;

  export const CV_32F: number;
  export const RETR_EXTERNAL: number;
  export const CHAIN_APPROX_SIMPLE: number;
  export const TERM_CRITERIA_EPS: number;
  export const TERM_CRITERIA_COUNT: number;
  export const KMEANS_RANDOM_CENTERS: number;
} 
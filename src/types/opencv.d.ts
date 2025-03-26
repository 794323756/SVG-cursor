declare module 'opencv.js' {
  export class Mat {
    constructor(rows: number, cols: number, type: number);
    constructor(data: Uint8ClampedArray, rows: number, cols: number, type: number);
    delete(): void;
    data: Uint8ClampedArray;
    rows: number;
    cols: number;
    type: number;
    reshape(channels: number, rows: number): Mat;
    row(i: number): Mat;
  }

  export function cvtColor(src: Mat, dst: Mat, code: number): void;
  export function kmeans(data: Mat, K: number, bestLabels: Mat, criteria: TermCriteria, attempts: number, flags: number, centers: Mat): void;

  export class TermCriteria {
    constructor(type: number, maxCount: number, epsilon: number);
    type: number;
    maxCount: number;
    epsilon: number;
  }

  export const COLOR_RGBA2Lab: number;
  export const COLOR_Lab2RGB: number;
  export const TERM_CRITERIA_EPS: number;
  export const TERM_CRITERIA_MAX_ITER: number;
  export const KMEANS_RANDOM_CENTERS: number;
  export const CV_8UC4: number;
  export const CV_8UC3: number;
  export const CV_32F: number;
} 
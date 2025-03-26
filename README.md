# 位图转SVG工具 (Bitmap to SVG Converter)

一个基于Web的位图转SVG工具，支持PNG、JPG等常见位图格式转换为SVG矢量图。

## 核心功能

- 🖼️ 位图上传：支持PNG、JPG、BMP等常见格式
- 🔄 矢量化转换：基于边缘检测的高质量转换
- 👀 实时预览：支持SVG实时渲染和编辑
- 💾 导出功能：支持SVG文件导出

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式方案**：Tailwind CSS
- **核心算法**：Potrace.js
- **图像处理**：WebAssembly + wasm-imagemagick
- **状态管理**：Zustand
- **性能优化**：Web Worker + comlink

## 项目结构

```
/src
├── lib
│   ├── wasm/          # WebAssembly模块
│   ├── trace/         # 矢量化算法封装
│   └── optimizers/    # SVG路径优化器
├── hooks
│   ├── useImageProcessor.ts
│   └── useSVGEditor.ts
├── components
│   ├── ImageCanvas/   # Canvas交互层
│   └── SVGPreview/    # 实时渲染层
```

## 开发环境设置

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 使用限制

- 单文件大小限制：10MB
- 支持的图片格式：PNG、JPG、BMP
- 建议图片分辨率：不超过1080P

## 性能指标

- 首字节时间（TTFB）：< 200ms
- 矢量化计算时间：< 3s（1080P图像）

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 许可证

MIT License 
import type { Product } from "@/types/product";

const presets = [
  {
    id: "aurora",
    name: "极光",
    src: "/presets/aurora.png",
    color: "#34d399",
  },
  {
    id: "badge",
    name: "徽章",
    src: "/presets/badge.png",
    color: "#f59e0b",
  },
  {
    id: "wave",
    name: "海浪",
    src: "/presets/wave.png",
    color: "#38bdf8",
  },
  {
    id: "bloom",
    name: "花境",
    src: "/presets/bloom.png",
    color: "#f472b6",
  },
] as const;

export const product: Product = {
  slug: "signature-circle-tee",
  name: "Signature 圆形定制短袖",
  description: "选择正反面图案，上传图片，添加可拖拽、缩放与样式化的文字。",
  price: 289,
  currency: "CNY",
  views: [
    {
      id: "front",
      label: "正面",
      templateSrc: "/products/front-template.png",
      templateSize: 800,
      region: { x: 435, y: 322, size: 340 },
      presets: [...presets],
    },
    {
      id: "back",
      label: "背面",
      templateSrc: "/products/back-template.png",
      templateSize: 800,
      region: { x: 400, y: 315, size: 360 },
      presets: [...presets],
    },
  ],
};

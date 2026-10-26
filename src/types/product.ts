export type CircularRegion = {
  /** 画布中心在商品模板图内的横坐标 */
  x: number;
  /** 画布中心在商品模板图内的纵坐标 */
  y: number;
  /** 圆形定制区直径，单位与商品模板图保持一致 */
  size: number;
};

export type ImagePreset = {
  id: string;
  name: string;
  src: string;
  color: string;
};

export type ProductView = {
  id: string;
  label: string;
  templateSrc: string;
  /** 商品模板图的边长，用于把定制区映射为百分比 */
  templateSize: number;
  region: CircularRegion;
  presets: ImagePreset[];
};

export type Product = {
  slug: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  views: ProductView[];
};

export type TextStyle = {
  fontFamily: string;
  fontSize: number;
  color: string;
  fontWeight: "400" | "700" | "900";
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
  underline: boolean;
  uppercase: boolean;
  opacity: number;
};

export type TextLayer = TextStyle & {
  id: string;
  content: string;
  x: number;
  y: number;
  rotation: number;
};

export type ViewDesign = {
  imagePresetId: string | null;
  imageSrc: string;
  texts: TextLayer[];
};

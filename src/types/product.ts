export type EllipticalRegion = {
  /** 椭圆中心在商品模板图内的横坐标 */
  x: number;
  /** 椭圆中心在商品模板图内的纵坐标 */
  y: number;
  /** 椭圆水平轴长度，单位与商品模板图保持一致 */
  width: number;
  /** 椭圆垂直轴长度，单位与商品模板图保持一致 */
  height: number;
  /** 椭圆旋转角度，单位为度 */
  angle: number;
  /** 图案与文字的右倾透视强度，单位为度 */
  skewY: number;
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
  region: EllipticalRegion;
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

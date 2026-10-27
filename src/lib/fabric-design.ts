import type { EllipticalRegion, TextLayer } from "@/types/product";

type FabricModule = typeof import("fabric");
type FabricImage = InstanceType<FabricModule["FabricImage"]>;
type FabricTextbox = InstanceType<FabricModule["Textbox"]>;

/** 加载设计图案，并可在导出时把外部图片转为内嵌资源。 */
export async function loadDesignImage(
  fabric: FabricModule,
  imageSrc: string,
  region: EllipticalRegion,
  embedImage = false,
): Promise<FabricImage> {
  const image = await fabric.FabricImage.fromURL(imageSrc, { crossOrigin: "anonymous" });

  if (embedImage && !imageSrc.startsWith("data:")) {
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext("2d")?.drawImage(image.getElement(), 0, 0);
    image.setElement(canvas, { width: canvas.width, height: canvas.height });
  }

  const scale = Math.max(region.width / image.width, region.height / image.height);

  image.set({
    left: region.x,
    top: region.y,
    angle: region.angle,
    skewY: region.skewY,
    originX: "center",
    originY: "center",
    scaleX: scale,
    scaleY: scale,
  });

  return image;
}

/** 按当前视图的透视规则创建文字对象。 */
export function createDesignText(
  fabric: FabricModule,
  text: TextLayer,
  region: EllipticalRegion,
): FabricTextbox {
  return new fabric.Textbox(text.uppercase ? text.content.toLocaleUpperCase() : text.content, {
    left: text.x,
    top: text.y,
    originX: "center",
    originY: "center",
    angle: region.angle + text.rotation,
    skewY: region.skewY,
    opacity: text.opacity,
    width: Math.min(region.width, region.height) * 0.82,
    textAlign: text.textAlign,
    fontFamily: text.fontFamily,
    fontSize: text.fontSize,
    fontWeight: text.fontWeight,
    fontStyle: text.fontStyle,
    underline: text.underline,
    fill: text.color,
    padding: 2,
  });
}

/** 创建椭圆定制区裁剪路径。 */
export function createRegionClipPath(fabric: FabricModule, region: EllipticalRegion) {
  return new fabric.Ellipse({
    left: region.x,
    top: region.y,
    rx: region.width / 2,
    ry: region.height / 2,
    angle: region.angle,
    originX: "center",
    originY: "center",
  });
}

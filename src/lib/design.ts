import type { TextLayer, TextStyle, ViewDesign } from "@/types/product";

let textLayerSeed = 0;

export const defaultTextStyle: TextStyle = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 32,
  color: "#111827",
  fontWeight: "700",
  fontStyle: "normal",
  textAlign: "center",
  underline: false,
  uppercase: false,
  opacity: 1,
};

export function createDefaultText(centerX: number, centerY: number): TextLayer {
  textLayerSeed += 1;

  return {
    ...defaultTextStyle,
    id: `text-${Date.now()}-${textLayerSeed}`,
    content: "自定义文字",
    x: centerX,
    y: centerY,
    rotation: 0,
  };
}

export function getDesignSummary(designs: Record<string, ViewDesign>): string[] {
  return Object.entries(designs).map(([viewId, design]) => {
    const textCount = design.texts.length;
    return `${viewId === "front" ? "正面" : "背面"}：1 个图案，${textCount} 段文字`;
  });
}

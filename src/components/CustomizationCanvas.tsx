"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EllipticalRegion, TextLayer, SvgExportController, ViewDesign, ViewSvgExport } from "@/types/product";
import { createDesignText, createRegionClipPath, loadDesignImage } from "@/lib/fabric-design";

type FabricModule = typeof import("fabric");
type FabricCanvas = InstanceType<FabricModule["Canvas"]>;
type FabricTextbox = InstanceType<FabricModule["Textbox"]>;
type FabricTextWithId = FabricTextbox & { id: string };

type CustomizationCanvasProps = {
  viewId: string;
  design: ViewDesign;
  region: EllipticalRegion;
  templateSize: number;
  selectedTextId: string | null;
  onSelectionChange: (textId: string | null) => void;
  onTextChange: (textId: string, patch: Partial<TextLayer>) => void;
  registerCanvas?: (viewId: string, canvas: SvgExportController | null) => void;
};

export default function CustomizationCanvas({
  viewId,
  design,
  region,
  templateSize,
  selectedTextId,
  onSelectionChange,
  onTextChange,
  registerCanvas,
}: CustomizationCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElementRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<FabricCanvas | null>(null);
  const fabricRef = useRef<FabricModule | null>(null);
  const designRef = useRef(design);
  const selectedTextIdRef = useRef(selectedTextId);
  const isApplyingDesignRef = useRef(false);
  const applyTokenRef = useRef(0);
  const appliedDesignKeyRef = useRef("");
  const [isReady, setIsReady] = useState(false);
  const exportedSvgRef = useRef<ViewSvgExport | null>(null);
  const designKey = useMemo(() => JSON.stringify(design), [design]);

  useEffect(() => {
    designRef.current = design;
    exportedSvgRef.current = null;
  }, [design, region, templateSize]);

  useEffect(() => {
    selectedTextIdRef.current = selectedTextId;
  }, [selectedTextId]);

  const buildSvgExport = useCallback(
    async (fileName: string) => {
      const canvas = canvasRef.current;
      const fabric = fabricRef.current;
      const sourceDesign = designRef.current;

      if (!canvas || !fabric) {
        return null;
      }

      if (exportedSvgRef.current?.fileName === fileName) {
        return exportedSvgRef.current;
      }

      const exportCanvas = new fabric.StaticCanvas(undefined, {
        width: templateSize,
        height: templateSize,
        renderOnAddRemove: false,
      });

      exportCanvas.viewportTransform = [1, 0, 0, 1, 0, 0];
      exportCanvas.clipPath = createRegionClipPath(fabric, region);

      try {
        exportCanvas.backgroundImage = await loadDesignImage(
          fabric,
          sourceDesign.imageSrc,
          region,
          true,
        );
      } catch {
        exportCanvas.backgroundColor = "";
      }

      sourceDesign.texts.forEach((text) => {
        exportCanvas.add(createDesignText(fabric, text, region));
      });

      let svg: string;

      try {
        svg = exportCanvas.toSVG({
          suppressPreamble: true,
          viewBox: { x: 0, y: 0, width: templateSize, height: templateSize },
        });
      } finally {
        void exportCanvas.dispose();
      }

      const exportData: ViewSvgExport = { fileName, svg };
      exportedSvgRef.current = exportData;

      return exportData;
    },
    [region, templateSize],
  );

  const applyDesign = useCallback(async () => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;

    if (!canvas || !fabric) {
      return;
    }

    const applyToken = ++applyTokenRef.current;
    const pendingDesignKey = designKey;
    const pendingSelectedTextId = selectedTextIdRef.current;
    isApplyingDesignRef.current = true;

    try {
      canvas.clear();
      canvas.backgroundImage = undefined;

      try {
        canvas.backgroundImage = await loadDesignImage(fabric, design.imageSrc, region);
      } catch {
        canvas.backgroundColor = "";
      }

      // 连续切换样式时，只允许最后一次请求写入画布。
      if (applyToken !== applyTokenRef.current) {
        return;
      }

      designRef.current = design;

      design.texts.forEach((text) => {
        const textObject = createDesignText(fabric, text, region);
        Object.assign(textObject, { id: text.id });
        canvas.add(textObject);
      });

      canvas.requestRenderAll();
      appliedDesignKeyRef.current = pendingDesignKey;

      const selectedTextObject = canvas
        .getObjects()
        .find((item) => (item as FabricTextWithId).id === pendingSelectedTextId);

      if (selectedTextObject) {
        canvas.setActiveObject(selectedTextObject);
        canvas.requestRenderAll();
      }
    } finally {
      if (applyToken === applyTokenRef.current) {
        isApplyingDesignRef.current = false;
      }
    }
  }, [design, designKey, region]);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    const initialize = async () => {
      const fabric = await import("fabric");
      const canvasElement = canvasElementRef.current;
      const container = containerRef.current;

      if (cancelled || !canvasElement || !container) {
        return;
      }

      const canvas = new fabric.Canvas(canvasElement, {
        selection: false,
        preserveObjectStacking: true,
      });

      canvas.clipPath = createRegionClipPath(fabric, region);

      const updateCanvasSize = () => {
        const cssWidth = container.clientWidth;
        const cssHeight = container.clientHeight;
        const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        if (cssWidth <= 0 || cssHeight <= 0) {
          return;
        }

        canvas.setDimensions(
          { width: cssWidth * devicePixelRatio, height: cssHeight * devicePixelRatio },
          { backstoreOnly: true },
        );
        canvas.setDimensions({ width: cssWidth, height: cssHeight }, { cssOnly: true });
        canvas.setZoom((cssWidth * devicePixelRatio) / templateSize);
        canvas.requestRenderAll();
      };

      const applyTextPatch = (textId: string, patch: Partial<TextLayer>) => {
        const currentDesign = designRef.current;
        const nextDesign = {
          ...currentDesign,
          texts: currentDesign.texts.map((text) =>
            text.id === textId ? { ...text, ...patch } : text,
          ),
        };

        designRef.current = nextDesign;
        appliedDesignKeyRef.current = JSON.stringify(nextDesign);
        onTextChange(textId, patch);
      };

      fabricRef.current = fabric;
      canvasRef.current = canvas;
      registerCanvas?.(viewId, { exportSvg: (fileName) => buildSvgExport(fileName) });
      updateCanvasSize();
      setIsReady(true);

      resizeObserver = new ResizeObserver(updateCanvasSize);
      resizeObserver.observe(container);

      canvas.on("selection:created", ({ selected }) => {
        if (isApplyingDesignRef.current) {
          return;
        }

        const textObject = selected?.[0] as FabricTextWithId | undefined;
        onSelectionChange(textObject?.id ?? null);
      });

      canvas.on("selection:updated", ({ selected }) => {
        if (isApplyingDesignRef.current) {
          return;
        }

        const textObject = selected?.[0] as FabricTextWithId | undefined;
        onSelectionChange(textObject?.id ?? null);
      });

      canvas.on("selection:cleared", () => {
        if (isApplyingDesignRef.current) {
          return;
        }

        onSelectionChange(null);
      });

      canvas.on("text:changed", ({ target }) => {
        const textObject = target as FabricTextWithId;
        if (textObject?.id) {
          applyTextPatch(textObject.id, { content: textObject.text ?? "" });
        }
      });

      canvas.on("object:modified", ({ target }) => {
        const textObject = target as FabricTextWithId;
        const textId = textObject?.id;

        if (!textId) {
          return;
        }

        const scaleFactor = Math.max(textObject.scaleX ?? 1, textObject.scaleY ?? 1);
        const nextLeft = Math.round(textObject.left ?? 0);
        const nextTop = Math.round(textObject.top ?? 0);
        const nextRotation = Math.round((textObject.angle ?? 0) - region.angle);
        const nextFontSize = Math.max(10, Math.round((textObject.fontSize ?? 24) * scaleFactor));

        textObject.set({
          left: nextLeft,
          top: nextTop,
          angle: region.angle + nextRotation,
          fontSize: nextFontSize,
          scaleX: 1,
          scaleY: 1,
        });
        canvas.requestRenderAll();
        applyTextPatch(textId, {
          x: nextLeft,
          y: nextTop,
          rotation: nextRotation,
          fontSize: nextFontSize,
        });
      });
    };

    void initialize();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      applyTokenRef.current += 1;
      setIsReady(false);
      appliedDesignKeyRef.current = "";

      const canvas = canvasRef.current;
      canvasRef.current = null;
      fabricRef.current = null;
      registerCanvas?.(viewId, null);
      void canvas?.dispose();
    };
  }, [buildSvgExport, onSelectionChange, onTextChange, registerCanvas, region, templateSize, viewId]);

  useEffect(() => {
    if (!isReady || appliedDesignKeyRef.current === designKey) {
      return;
    }

    void applyDesign();
  }, [applyDesign, designKey, isReady]);

  useEffect(() => {
    const textObject = canvasRef.current?.getObjects().find((item) => (item as FabricTextWithId).id === selectedTextId);

    if (textObject && canvasRef.current?.getActiveObject() !== textObject) {
      canvasRef.current?.setActiveObject(textObject);
      canvasRef.current?.requestRenderAll();
    }
  }, [isReady, selectedTextId]);

  return (
    <div ref={containerRef} className="customization-canvas">
      <canvas ref={canvasElementRef} aria-label="商品定制画布" />
    </div>
  );
}

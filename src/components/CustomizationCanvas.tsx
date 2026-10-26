"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CircularRegion, TextLayer, ViewDesign } from "@/types/product";

type FabricModule = typeof import("fabric");
type FabricCanvas = InstanceType<FabricModule["Canvas"]>;
type FabricTextbox = InstanceType<FabricModule["Textbox"]>;
type FabricTextWithId = FabricTextbox & { id: string };

type CustomizationCanvasProps = {
  design: ViewDesign;
  region: CircularRegion;
  templateSize: number;
  designSize: number;
  selectedTextId: string | null;
  onSelectionChange: (textId: string | null) => void;
  onTextChange: (textId: string, patch: Partial<TextLayer>) => void;
};

export default function CustomizationCanvas({
  design,
  region,
  templateSize,
  designSize,
  selectedTextId,
  onSelectionChange,
  onTextChange,
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
  const designKey = useMemo(() => JSON.stringify(design), [design]);

  useEffect(() => {
    selectedTextIdRef.current = selectedTextId;
  }, [selectedTextId]);

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
    canvas.clear();
    canvas.backgroundImage = undefined;

    try {
      const image = await fabric.FabricImage.fromURL(design.imageSrc, {
        crossOrigin: "anonymous",
      });
      const scale = Math.max(designSize / image.width, designSize / image.height);

      if (applyTokenRef.current !== applyToken) {
        return;
      }

      image.set({
        left: designSize / 2,
        top: designSize / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });
      canvas.backgroundImage = image;
    } catch {
      canvas.backgroundColor = "#f8fafc";
    }

    designRef.current = design;

    design.texts.forEach((text) => {
      const textObject = new fabric.Textbox(
        text.uppercase ? text.content.toLocaleUpperCase() : text.content,
        {
          left: text.x,
          top: text.y,
          originX: "center",
          originY: "center",
          angle: text.rotation,
          opacity: text.opacity,
          width: designSize * 0.82,
          textAlign: text.textAlign,
          fontFamily: text.fontFamily,
          fontSize: text.fontSize,
          fontWeight: text.fontWeight,
          fontStyle: text.fontStyle,
          underline: text.underline,
          fill: text.color,
          padding: 2,
        },
      );
      Object.assign(textObject, { id: text.id });
      canvas.add(textObject);
    });

    canvas.requestRenderAll();
    appliedDesignKeyRef.current = pendingDesignKey;
    isApplyingDesignRef.current = false;

    const selectedTextObject = canvas
      .getObjects()
      .find((item) => (item as FabricTextWithId).id === pendingSelectedTextId);

    if (selectedTextObject) {
      canvas.setActiveObject(selectedTextObject);
      canvas.requestRenderAll();
    }
  }, [design, designKey, designSize]);

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

      const updateCanvasSize = () => {
        const cssSize = Math.min(container.clientWidth, container.clientHeight);
        const devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        if (cssSize <= 0) {
          return;
        }

        canvas.setDimensions(
          { width: cssSize * devicePixelRatio, height: cssSize * devicePixelRatio },
          { backstoreOnly: true },
        );
        canvas.setDimensions({ width: cssSize, height: cssSize }, { cssOnly: true });
        canvas.setZoom((cssSize * devicePixelRatio) / designSize);
        canvas.clipPath = new fabric.Circle({
          left: designSize / 2,
          top: designSize / 2,
          radius: designSize / 2,
          originX: "center",
          originY: "center",
        });
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
        const nextRotation = Math.round(textObject.angle ?? 0);
        const nextFontSize = Math.max(10, Math.round((textObject.fontSize ?? 24) * scaleFactor));

        textObject.set({
          left: nextLeft,
          top: nextTop,
          angle: nextRotation,
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
      void canvas?.dispose();
    };
  }, [designSize, onSelectionChange, onTextChange]);

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

  const canvasStyle = {
    left: `${((region.x - region.size / 2) / templateSize) * 100}%`,
    top: `${((region.y - region.size / 2) / templateSize) * 100}%`,
    width: `${(region.size / templateSize) * 100}%`,
    height: `${(region.size / templateSize) * 100}%`,
  };

  return (
    <div ref={containerRef} className="customization-canvas" style={canvasStyle}>
      <canvas ref={canvasElementRef} aria-label="商品定制画布" />
    </div>
  );
}

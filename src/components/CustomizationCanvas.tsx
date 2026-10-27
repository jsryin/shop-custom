"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EllipticalRegion, TextLayer, ViewDesign } from "@/types/product";

type FabricModule = typeof import("fabric");
type FabricCanvas = InstanceType<FabricModule["Canvas"]>;
type FabricTextbox = InstanceType<FabricModule["Textbox"]>;
type FabricTextWithId = FabricTextbox & { id: string };

type CustomizationCanvasProps = {
  design: ViewDesign;
  region: EllipticalRegion;
  templateSize: number;
  selectedTextId: string | null;
  onSelectionChange: (textId: string | null) => void;
  onTextChange: (textId: string, patch: Partial<TextLayer>) => void;
};

export default function CustomizationCanvas({
  design,
  region,
  templateSize,
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
      const scale = Math.max(region.width / image.width, region.height / image.height);

      if (applyTokenRef.current !== applyToken) {
        return;
      }

      image.set({
        left: region.x,
        top: region.y,
        angle: region.angle,
        skewY: region.skewY,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });
      canvas.backgroundImage = image;
    } catch {
      canvas.backgroundColor = "";
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

      canvas.clipPath = new fabric.Ellipse({
        left: region.x,
        top: region.y,
        rx: region.width / 2,
        ry: region.height / 2,
        angle: region.angle,
        originX: "center",
        originY: "center",
      });

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
      void canvas?.dispose();
    };
  }, [region, onSelectionChange, onTextChange, templateSize]);

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

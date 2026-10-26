"use client";

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import CustomizationCanvas from "@/components/CustomizationCanvas";
import ImageStylePicker from "@/components/ImageStylePicker";
import TextControls from "@/components/TextControls";
import { createDefaultText, getDesignSummary } from "@/lib/design";
import { formatPrice } from "@/lib/product";
import type { ImagePreset, Product, TextLayer, TextStyle, ViewDesign } from "@/types/product";

const maximumImageSize = 8 * 1024 * 1024;

function createInitialDesigns(product: Product): Record<string, ViewDesign> {
  return Object.fromEntries(
    product.views.map((view) => {
      const preset = view.presets[0];

      return [
        view.id,
        {
          imagePresetId: preset?.id ?? null,
          imageSrc: preset?.src ?? "",
          texts: [],
        },
      ];
    }),
  );
}

export default function ProductCustomizer({ product }: { product: Product }) {
  const [activeViewId, setActiveViewId] = useState(product.views[0].id);
  const [designs, setDesigns] = useState<Record<string, ViewDesign>>(() =>
    createInitialDesigns(product),
  );
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState("");
  const activeViewIdRef = useRef(activeViewId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeView = product.views.find((view) => view.id === activeViewId) ?? product.views[0];
  const activeDesign = designs[activeView.id];
  const selectedText = activeDesign.texts.find((text) => text.id === selectedTextId) ?? null;
  const summary = getDesignSummary(designs);

  const updateActiveDesign = useCallback(
    (update: (design: ViewDesign) => ViewDesign) => {
      setDesigns((current) => {
        const viewId = activeViewIdRef.current;

        return {
          ...current,
          [viewId]: update(current[viewId]),
        };
      });
    },
    [],
  );

  const handleSelectionChange = useCallback((textId: string | null) => {
    setSelectedTextId(textId);
  }, []);

  const handleTextChange = useCallback(
    (textId: string, patch: Partial<TextLayer>) => {
      updateActiveDesign((design) => ({
        ...design,
        texts: design.texts.map((text) =>
          text.id === textId ? { ...text, ...patch } : text,
        ),
      }));
    },
    [updateActiveDesign],
  );

  const handleViewChange = (viewId: string) => {
    activeViewIdRef.current = viewId;
    setActiveViewId(viewId);
    setSelectedTextId(null);
  };

  const handlePresetSelect = (preset: ImagePreset) => {
    updateActiveDesign((design) => ({
      ...design,
      imagePresetId: preset.id,
      imageSrc: preset.src,
    }));
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setCartMessage("请选择图片文件。");
      return;
    }

    if (file.size > maximumImageSize) {
      setCartMessage("图片不能超过 8 MB。");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      updateActiveDesign((design) => ({
        ...design,
        imagePresetId: null,
        imageSrc: String(reader.result),
      }));
      setCartMessage("");
    };
    reader.readAsDataURL(file);
  };

  const handleAddText = () => {
    const newText = createDefaultText(activeView.region.size / 2, activeView.region.size / 2);
    updateActiveDesign((design) => ({ ...design, texts: [...design.texts, newText] }));
    setSelectedTextId(newText.id);
  };

  const handleContentChange = (content: string) => {
    if (!selectedText) {
      return;
    }

    handleTextChange(selectedText.id, { content });
  };

  const handleStyleChange = (patch: Partial<TextStyle>) => {
    if (!selectedText) {
      return;
    }

    const nextPatch: Partial<TextLayer> = { ...patch };
    if (patch.uppercase !== undefined) {
      if (patch.uppercase) {
        nextPatch.content = selectedText.content.toLocaleUpperCase();
      }
    }

    handleTextChange(selectedText.id, nextPatch);
  };

  const handleRemoveText = () => {
    if (!selectedText) {
      return;
    }

    updateActiveDesign((design) => ({
      ...design,
      texts: design.texts.filter((text) => text.id !== selectedText.id),
    }));
    setSelectedTextId(null);
  };

  return (
    <div className="customizer-layout">
      <section className="preview-panel" aria-label="商品预览">
        <div className="view-tabs" role="tablist" aria-label="商品面">
          {product.views.map((view) => (
            <button
              key={view.id}
              type="button"
              role="tab"
              aria-selected={view.id === activeView.id}
              className={`view-tab${view.id === activeView.id ? " is-active" : ""}`}
              onClick={() => handleViewChange(view.id)}
            >
              {view.label}
            </button>
          ))}
        </div>

        <div className="preview-stage">
          <div className="preview-canvas-wrap">
            <CustomizationCanvas
              design={activeDesign}
              region={activeView.region}
              templateSize={activeView.templateSize}
              designSize={activeView.region.size}
              selectedTextId={selectedTextId}
              onSelectionChange={handleSelectionChange}
              onTextChange={handleTextChange}
            />
            <img
              className="preview-template"
              src={activeView.templateSrc}
              alt={`${product.name} ${activeView.label}模板`}
              draggable={false}
            />
          </div>
        </div>

        <div className="text-layers">
          <span>文字图层</span>
          <div className="layer-list">
            {activeDesign.texts.length === 0 ? (
              <small>暂无文字</small>
            ) : (
              activeDesign.texts.map((text) => (
                <button
                  key={text.id}
                  type="button"
                  className={`layer-item${text.id === selectedTextId ? " is-selected" : ""}`}
                  onClick={() => setSelectedTextId(text.id)}
                >
                  {text.uppercase ? text.content.toLocaleUpperCase() : text.content}
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      <aside className="editor-panel" aria-label="定制工具">
        <div className="panel-block">
          <h2>图片样式</h2>
          <ImageStylePicker
            presets={activeView.presets}
            selectedPresetId={activeDesign.imagePresetId}
            onSelect={handlePresetSelect}
          />

          <input
            ref={fileInputRef}
            id="custom-image-upload"
            className="visually-hidden-input"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <label htmlFor="custom-image-upload" className="upload-button">
            上传图片替换
          </label>
          <p className="input-hint">支持 JPG、PNG、WebP 或 SVG，最大 8 MB。</p>
        </div>

        <div className="panel-block">
          <div className="panel-title-row">
            <h2>文字设计</h2>
            <button type="button" className="primary-button" onClick={handleAddText}>
              添加文字
            </button>
          </div>
          <TextControls
            selectedText={selectedText}
            onStyleChange={handleStyleChange}
            onContentChange={handleContentChange}
            onRemove={handleRemoveText}
          />
        </div>

        <div className="panel-block purchase-block">
          <div className="price-row">
            <span>定制价格</span>
            <strong>{formatPrice(product.price, product.currency)}</strong>
          </div>
          <button
            type="button"
            className="purchase-button"
            onClick={() => setCartMessage("定制信息已生成，可接入购物车接口。")}
          >
            加入购物车
          </button>
          <ul className="design-summary">
            {summary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {cartMessage ? <p className="cart-message">{cartMessage}</p> : null}
        </div>
      </aside>
    </div>
  );
}

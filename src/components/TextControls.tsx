"use client";

import type { TextLayer, TextStyle } from "@/types/product";

type TextControlsProps = {
  selectedText: TextLayer | null;
  onStyleChange: (patch: Partial<TextStyle>) => void;
  onContentChange: (content: string) => void;
  onRemove: () => void;
};

const fontFamilies = [
  { label: "现代无衬线", value: "Inter, system-ui, sans-serif" },
  { label: "优雅衬线", value: "Georgia, 'Times New Roman', serif" },
  { label: "等宽设计", value: "'SFMono-Regular', Consolas, monospace" },
  { label: "圆体风格", value: "'Avenir Next', 'PingFang SC', sans-serif" },
];

const colors = ["#111827", "#ffffff", "#dc2626", "#2563eb", "#059669", "#f59e0b"];

export default function TextControls({
  selectedText,
  onStyleChange,
  onContentChange,
  onRemove,
}: TextControlsProps) {
  if (!selectedText) {
    return <p className="empty-hint">请选中画布中的文字，或先添加一段文字。</p>;
  }

  return (
    <div className="control-stack">
      <label className="field">
        <span>文字内容</span>
        <textarea
          value={selectedText.content}
          maxLength={60}
          rows={2}
          onChange={(event) => onContentChange(event.target.value)}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>字体</span>
          <select
            value={selectedText.fontFamily}
            onChange={(event) => onStyleChange({ fontFamily: event.target.value })}
          >
            {fontFamilies.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>字号</span>
          <input
            type="number"
            min={10}
            max={96}
            value={selectedText.fontSize}
            onChange={(event) => onStyleChange({ fontSize: Number(event.target.value) })}
          />
        </label>
      </div>

      <div className="style-actions" role="group" aria-label="文字样式">
        <button
          type="button"
          className={selectedText.fontWeight === "700" ? "is-active" : ""}
          aria-pressed={selectedText.fontWeight === "700"}
          onClick={() => onStyleChange({ fontWeight: selectedText.fontWeight === "700" ? "400" : "700" })}
        >
          粗体
        </button>
        <button
          type="button"
          className={selectedText.fontStyle === "italic" ? "is-active" : ""}
          aria-pressed={selectedText.fontStyle === "italic"}
          onClick={() => onStyleChange({ fontStyle: selectedText.fontStyle === "italic" ? "normal" : "italic" })}
        >
          斜体
        </button>
        <button
          type="button"
          className={selectedText.underline ? "is-active" : ""}
          aria-pressed={selectedText.underline}
          onClick={() => onStyleChange({ underline: !selectedText.underline })}
        >
          下划线
        </button>
        <button
          type="button"
          className={selectedText.uppercase ? "is-active" : ""}
          aria-pressed={selectedText.uppercase}
          onClick={() => onStyleChange({ uppercase: !selectedText.uppercase })}
        >
          大写
        </button>
      </div>

      <div className="field-row">
        <label className="field">
          <span>对齐</span>
          <select
            value={selectedText.textAlign}
            onChange={(event) => onStyleChange({ textAlign: event.target.value as TextStyle["textAlign"] })}
          >
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
          </select>
        </label>

        <label className="field">
          <span>透明度</span>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.05}
            value={selectedText.opacity}
            onChange={(event) => onStyleChange({ opacity: Number(event.target.value) })}
          />
        </label>
      </div>

      <fieldset className="color-group">
        <legend>文字颜色</legend>
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-dot${selectedText.color === color ? " is-active" : ""}`}
            style={{ backgroundColor: color }}
            aria-label={`选择颜色 ${color}`}
            aria-pressed={selectedText.color === color}
            onClick={() => onStyleChange({ color })}
          />
        ))}
      </fieldset>

      <button type="button" className="secondary-button" onClick={onRemove}>
        删除选中文字
      </button>
    </div>
  );
}

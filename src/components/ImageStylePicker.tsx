"use client";

import type { ImagePreset } from "@/types/product";

type ImageStylePickerProps = {
  presets: ImagePreset[];
  selectedPresetId: string | null;
  onSelect: (preset: ImagePreset) => void;
};

export default function ImageStylePicker({
  presets,
  selectedPresetId,
  onSelect,
}: ImageStylePickerProps) {
  return (
    <div className="style-grid" role="group" aria-label="预设图片样式">
      {presets.map((preset) => (
        <button
          key={preset.id}
          type="button"
          className={`style-card${selectedPresetId === preset.id ? " is-selected" : ""}`}
          onClick={() => onSelect(preset)}
          aria-pressed={selectedPresetId === preset.id}
        >
          <img src={preset.src} alt="" width={72} height={72} loading="lazy" />
          <span>{preset.name}</span>
        </button>
      ))}
    </div>
  );
}

/** 通过浏览器下载能力保存生成的文件。 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** 将 Fabric 生成的 SVG 字符串保存为文件。 */
export function downloadSvg(svg: string, fileName: string): void {
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), fileName);
}

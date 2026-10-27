import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "商品定制 | Signature Circle Tee",
  description: "在正面与背面椭圆区域内选择图片样式、上传图片并设计个性化文字。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  );
}

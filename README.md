# 商品定制页面

基于 Next.js、React 与 Fabric.js 实现的商品正反面圆形区域定制功能。

## 功能

- 切换商品正面与背面
- 选择圆形区域内的预设图片
- 上传本地图片替换预设图案
- 添加、选中、拖拽、缩放与删除文字
- 调整字体、字号、颜色、对齐、粗斜体、下划线、大写与透明度

## 开发与构建

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
```

开发与生产服务默认使用 `3040` 端口。

商品、视图区域与预设样式集中配置在 `src/data/product.ts`。

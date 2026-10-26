import { notFound } from "next/navigation";
import ProductCustomizer from "@/components/ProductCustomizer";
import { findProduct, formatPrice } from "@/lib/product";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = findProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="page-container">
      <header className="page-header">
        <a className="brand" href="/">
          CUSTOM STUDIO
        </a>
        <h1>{product.name}</h1>
        <p>{product.description}</p>
        <strong className="page-price">{formatPrice(product.price, product.currency)}</strong>
      </header>
      <ProductCustomizer product={product} />
    </main>
  );
}

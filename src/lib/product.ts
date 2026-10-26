import { product } from "@/data/product";
import type { Product } from "@/types/product";

export function findProduct(slug: string): Product | undefined {
  return product.slug === slug ? product : undefined;
}

export function formatPrice(price: number, currency: string): string {
  return currency === "CNY" ? `￥${price.toFixed(2)}` : `${currency} ${price.toFixed(2)}`;
}

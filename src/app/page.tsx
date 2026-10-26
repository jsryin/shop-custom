import { redirect } from "next/navigation";
import { product } from "@/data/product";

export default function HomePage() {
  redirect(`/products/${product.slug}`);
}

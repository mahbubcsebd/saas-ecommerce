import { Product } from "@/types/product";
import { api } from "./api-client";

export async function getProducts(searchParams?: {
  search?: string;
  category?: string;
  sort?: string;
}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (searchParams?.search) params.append("search", searchParams.search);
  if (searchParams?.category) params.append("category", searchParams.category);
  if (searchParams?.sort) params.append("sort", searchParams.sort);

  const query = params.toString();
  return api.get<Product[]>(`/products?${query}`, {
    revalidate: 60,
    tags: ["products"],
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    return await api.get<Product>(`/products/${slug}`, {
      revalidate: 60,
      tags: ["products", `product-${slug}`],
    });
  } catch (error) {
    return null;
  }
}

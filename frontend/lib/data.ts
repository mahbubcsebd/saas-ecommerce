import { Product } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export async function getProducts(searchParams?: { search?: string; category?: string; sort?: string }): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (searchParams?.search) params.append("search", searchParams.search);
    if (searchParams?.category) params.append("category", searchParams.category);
    if (searchParams?.sort) params.append("sort", searchParams.sort);

    const query = params.toString();
    const res = await fetch(`${API_URL}/products?${query}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 60,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    const data = await res.json();
    return data.data; // Assuming backend returns { success: true, data: [...] }
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_URL}/products/${slug}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching product ${slug}:`, error);
    return null;
  }
}

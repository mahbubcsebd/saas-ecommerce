import { api } from "./api-client";

export async function getHeroSlides() {
  try {
    return await api.get<any[]>("/hero-slides?featured=true&isActive=true", {
      revalidate: 3600,
      tags: ["hero-slides"],
    });
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return [];
  }
}

export async function getFeaturedCategories() {
  try {
    return await api.get<any[]>("/categories?isHomeShown=true", {
      revalidate: 3600,
      tags: ["categories"],
    });
  } catch (error) {
    console.error("Error fetching featured categories:", error);
    return [];
  }
}

export async function getNewArrivals() {
  try {
    return await api.get<any[]>("/products?isNewArrival=true&limit=8", {
      revalidate: 300,
      tags: ["products", "new-arrivals"],
    });
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    return [];
  }
}

export async function getTopSellingProducts() {
  try {
    // Assuming 'sold' or a particular sort parameter exists for Best Selling.
    // The backend product controller handles `sort` params. We will pass a standard string.
    return await api.get<any>("/products?sort=sold_desc&limit=8", {
      revalidate: 3600,
      tags: ["products", "top-selling"],
    });
  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return { data: [], total: 0 };
  }
}

export async function getFlashSale() {
  try {
    return await api.get<any>("/flash-sales/public/active", {
      revalidate: 60, // check frequently for sales turning active
      tags: ["flash-sale"],
    });
  } catch (error) {
    return null;
  }
}

export async function getHomeSections() {
  try {
    return await api.get<any[]>("/homeCategoryWiseProduct", {
      revalidate: 3600,
      tags: ["home-sections"],
    });
  } catch (error) {
    console.error("Error fetching home sections:", error);
    return [];
  }
}

export async function getLandingPageBySlug(slug: string) {
  try {
    return await api.get<any>(`/landing-pages/public/${slug}`, {
      revalidate: 60,
      tags: [`landing-page-${slug}`],
    });
  } catch (error) {
    return null;
  }
}

export async function getProducts(params: Record<string, any>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v as string));
    } else if (value !== undefined && value !== null && value !== '') {
      query.append(key, value as string);
    }
  });

  return api.get<{ data: any[]; total: number }>(`/products?${query.toString()}`, {
    cache: "no-store",
    tags: ["products"],
  });
}

export async function getCategories() {
  try {
    return await api.get<any[]>("/categories", {
      revalidate: 3600,
      tags: ["categories"],
    });
  } catch (error) {
    console.error("Error fetching all categories:", error);
    return [];
  }
}

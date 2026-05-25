import { api, FetchOptions } from './api-client';

export async function getHeroSlides() {
  try {
    return await api.get<any[]>('/hero-slides?featured=true&isActive=true', {
      revalidate: 3600,
      tags: ['hero-slides'],
    });
  } catch (error) {
    console.error('Error fetching hero slides:', error);
    return [];
  }
}

export async function getFeaturedCategories() {
  try {
    return await api.get<any[]>('/categories?isHomeShown=true', {
      revalidate: 3600,
      tags: ['categories'],
    });
  } catch (error) {
    console.error('Error fetching featured categories:', error);
    return [];
  }
}

export async function getNewArrivals() {
  try {
    return await api.get<any[]>('/products?isNewArrival=true&limit=8', {
      revalidate: 300,
      tags: ['products', 'new-arrivals'],
    });
  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    return [];
  }
}

export async function getTopSellingProducts() {
  try {
    // Assuming 'sold' or a particular sort parameter exists for Best Selling.
    // The backend product controller handles `sort` params. We will pass a standard string.
    return await api.get<any>('/products?sort=sold_desc&limit=8', {
      revalidate: 3600,
      tags: ['products', 'top-selling'],
    });
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    return { data: [], total: 0 };
  }
}

export async function getFlashSale() {
  try {
    return await api.get<any>('/flash-sales/public/active', {
      revalidate: 60, // check frequently for sales turning active
      tags: ['flash-sale'],
    });
  } catch (error) {
    return null;
  }
}

export async function getHomeSections() {
  try {
    return await api.get<any[]>('/homeCategoryWiseProduct', {
      revalidate: 3600,
      tags: ['home-sections'],
    });
  } catch (error) {
    console.error('Error fetching home sections:', error);
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
    cache: 'no-store',
    tags: ['products'],
  });
}

export async function getCategories() {
  try {
    return await api.get<any[]>('/categories', {
      revalidate: 3600,
      tags: ['categories'],
    });
  } catch (error) {
    console.error('Error fetching all categories:', error);
    return [];
  }
}

export async function getBrands() {
  try {
    return await api.get<any[]>('/brands?isActive=true', {
      revalidate: 3600,
      tags: ['brands'],
    });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return [];
  }
}

export async function getFeaturedBrands() {
  try {
    let brands = await api.get<any[]>('/brands?isActive=true&isFeatured=true', {
      revalidate: 3600,
      tags: ['brands', 'featured-brands'],
    });

    if (!brands || brands.length === 0) {
      brands = await api.get<any[]>('/brands?isActive=true&limit=6', {
        revalidate: 3600,
        tags: ['brands'],
      });
    }

    return brands;
  } catch (error) {
    console.error('Error fetching featured brands:', error);
    return [];
  }
}

export async function getBrandBySlug(slug: string) {
  try {
    return await api.get<any>(`/brands/${slug}`, {
      revalidate: 60,
      tags: [`brand-${slug}`],
    });
  } catch (error: any) {
    if (error?.status !== 404) {
      console.error(`Error fetching brand ${slug}:`, error);
    }
    return null;
  }
}

export async function getProductBySlug(slug: string) {
  try {
    return await api.get<any>(`/products/${slug}`, {
      revalidate: 60,
      tags: ['products', `product-${slug}`],
    });
  } catch (error: any) {
    if (error?.status !== 404) {
      console.error(`Error fetching product ${slug}:`, error);
    }
    return null;
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    return await api.get<any>(`/categories/${slug}`, {
      revalidate: 60,
      tags: ['categories', `category-${slug}`],
    });
  } catch (error: any) {
    if (error?.status !== 404) {
      console.error(`Error fetching category ${slug}:`, error);
    }
    return null;
  }
}

export async function getPublicSettings(options?: FetchOptions) {
  try {
    return await api.get<any>('/settings/public', {
      revalidate: 3600,
      tags: ['settings'],
      ...options,
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return null;
  }
}

export async function getRelatedProducts(currentProductId: string, limit = 4) {
  try {
    return await api.get<any[]>(`/products/related/${currentProductId}?limit=${limit}`, {
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

export async function getLanguages() {
  try {
    return await api.get<any[]>('/translations/languages', {
      revalidate: 3600,
      tags: ['languages'],
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return [];
  }
}

export async function getBlogPosts(params?: Record<string, any>) {
  try {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return await api.get<any>(`/blog${queryString ? `?${queryString}` : ''}`, {
      revalidate: 300,
      tags: ['blog-posts'],
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return { posts: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    return await api.get<any>(`/blog/${slug}`, {
      revalidate: 60,
      tags: [`blog-post-${slug}`],
    });
  } catch (error) {
    console.error(`Error fetching blog post by slug ${slug}:`, error);
    return null;
  }
}

export async function getCustomPages(params?: Record<string, any>) {
  try {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryString = query.toString();
    return await api.get<any>(`/pages${queryString ? `?${queryString}` : ''}`, {
      revalidate: 300,
      tags: ['custom-pages'],
    });
  } catch (error) {
    console.error('Error fetching custom pages:', error);
    return [];
  }
}

export async function getCustomPageBySlug(slug: string) {
  try {
    return await api.get<any>(`/pages/${slug}`, {
      revalidate: 60,
      tags: [`custom-page-${slug}`],
    });
  } catch (error) {
    console.error(`Error fetching custom page by slug ${slug}:`, error);
    return null;
  }
}



export async function getHeroSlides() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  try {
    const res = await fetch(`${API_URL}/hero-slides?featured=true&isActive=true`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });
    if (!res.ok) throw new Error("Failed to fetch slides");
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching hero slides:", error);
    return [];
  }
}

export async function getFeaturedCategories() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  try {
    const res = await fetch(`${API_URL}/categories?isHomeShown=true`, {
        next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error("Failed to fetch featured categories");
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching featured categories:", error);
    return [];
  }
}

export async function getNewArrivals() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
    try {
        const res = await fetch(`${API_URL}/products?isNewArrival=true&limit=8`, {
             next: { revalidate: 300 } // Revalidate every 5 mins
        });
        if (!res.ok) throw new Error("Failed to fetch new arrivals");
        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error("Error fetching new arrivals:", error);
        return [];
    }
}

export async function getHomeSections() {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
    try {
        const res = await fetch(`${API_URL}/homeCategoryWiseProduct`, {
             next: { revalidate: 3600 }
        });
        if (!res.ok) throw new Error("Failed to fetch home sections");
        const data = await res.json();
        return data.data || [];
    } catch (error) {
        console.error("Error fetching home sections:", error);
      return [];
    }
}

export async function getLandingPageBySlug(slug: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  try {
    const res = await fetch(`${API_URL}/landing-pages/public/${slug}`, {
      next: { revalidate: 60 }, // Cache for 1 min
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (error) {
    console.error(`Error fetching landing page ${slug}:`, error);
    return null;
  }
}

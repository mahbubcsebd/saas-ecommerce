import { Cpu, Dumbbell, Home, Leaf, type LucideIcon, Shirt, ShoppingBag } from "lucide-react";
import Link from "next/link";

// Map string icon names to Lucide icons
const iconMap: Record<string, LucideIcon> = {
  Shirt,
  Cpu,
  Home,
  Dumbbell,
  Leaf,
  ShoppingBag
};

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  icon?: string;
}

interface FeaturedCategoriesProps {
    categories: Category[];
}

export default function FeaturedCategories({ categories }: FeaturedCategoriesProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="container py-12">
      <h2 className="text-2xl font-bold mb-8 text-center md:text-left">Shop by Category</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {categories.map((cat) => {
          const Icon = cat.icon && iconMap[cat.icon] ? iconMap[cat.icon] : ShoppingBag;

          return (
            <Link
              key={cat.id}
              href={`/${cat.slug}`}
              className="flex flex-col items-center justify-center p-6 bg-secondary/20 hover:bg-secondary/40 rounded-xl transition-colors gap-3 group"
            >
              <div className="p-4 bg-background rounded-full shadow-sm group-hover:scale-110 transition-transform">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <span className="font-medium text-sm text-center">{cat.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

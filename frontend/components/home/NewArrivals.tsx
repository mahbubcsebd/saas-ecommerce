"use client";

import { Product } from "@/types/product";
import Link from "next/link";
import ProductCard from "../ProductCard";

interface NewArrivalsProps {
    products: Product[];
}

export default function NewArrivals({ products }: NewArrivalsProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="container py-12 bg-secondary/5">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">New Arrivals</h2>
        <Link href="/products?sort=createdAt_desc" className="text-primary hover:underline">
            View All
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
           <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

"use client";

import ProductForm from "@/components/ProductForm";
import { useParams } from "next/navigation";

export default function EditProductPage() {
  const params = useParams();
  const productId = params.id as string;

  return <ProductForm mode="edit" productId={productId} />;
}

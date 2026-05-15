import * as React from 'react';
import { View, ScrollView, ActivityIndicator, Text } from 'react-native';
import { api } from '../utils/api';
import ProductCard from './ProductCard';
import SectionHeader from './SectionHeader';

interface Product {
  id: string;
  name: string;
  price?: number;
  sellingPrice?: number;
  finalPrice?: number;
  basePrice?: number;
  imageUrl?: string;
  images?: string[];
  discount?: any;
}

interface HorizontalProductListProps {
  title: string;
  endpoint: string;
}

export default function HorizontalProductList({ title, endpoint }: HorizontalProductListProps) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);

  React.useEffect(() => {
    loadProducts();
  }, [endpoint]);

  const loadProducts = async () => {
    try {
      setIsInitialLoading(true);
      const response = await api.get<{ success: boolean; data: Product[] | { data: Product[] } }>(endpoint);
      if (response.success) {
        const data = 'data' in response.data ? (response.data as any).data : response.data;
        setProducts(data);
      }
    } catch (error) {
      console.error(`Failed to load products from ${endpoint}:`, error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View className="mt-8">
        <SectionHeader title={title} showSeeAll={false} />
        <View className="px-5 py-4">
          <ActivityIndicator color="#2563eb" />
        </View>
      </View>
    );
  }

  if (products.length === 0) return null;

  return (
    <View>
      <SectionHeader title={title} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {products.map((product) => (
          <View key={product.id} className="mr-4">
            <ProductCard product={product} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

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

interface CategorySection {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  products: Product[];
}

export default function HomeCategorySections() {
  const [sections, setSections] = React.useState<CategorySection[]>([]);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);

  React.useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setIsInitialLoading(true);
      const response = await api.get<{ success: boolean; data: CategorySection[] }>('/homeCategoryWiseProduct');
      if (response.success) {
        setSections(response.data);
      }
    } catch (error) {
      console.error('Failed to load category sections:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View className="py-10">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  if (sections.length === 0) return null;

  return (
    <View>
      {sections.map((section) => (
        <View key={section.categoryId} className="mt-4">
          <SectionHeader title={section.categoryName} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {section.products.map((product) => (
              <View key={product.id} className="mr-4">
                <ProductCard product={product} />
              </View>
            ))}
          </ScrollView>
        </View>
      ))}
    </View>
  );
}

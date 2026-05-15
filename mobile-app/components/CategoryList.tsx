import * as React from 'react';
import { View, ScrollView, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { api } from '../utils/api';

interface Category {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  slug: string;
}

export default function CategoryList() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsInitialLoading(true);
      const response = await api.get<{ success: boolean; data: Category[] }>('/categories?isHomeShown=true');
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View className="mt-8 px-5">
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }
  if (categories.length === 0) return null;

  return (
    <View className="mt-8">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {categories.map((category) => (
          <TouchableOpacity key={category.id} className="items-center mr-6">
            <View className="w-16 h-16 rounded-full bg-blue-50 items-center justify-center border border-blue-100 shadow-sm overflow-hidden">
              {(category.icon || category.image) ? (
                <Image 
                   source={{ uri: api.getImageUrl(category.icon || category.image) }} 
                   className="w-10 h-10" 
                   resizeMode="contain" 
                />
              ) : (
                <Text className="text-blue-600 font-bold text-lg">{category.name.charAt(0)}</Text>
              )}
            </View>
            <Text className="text-gray-700 font-bold text-xs mt-2 text-center" numberOfLines={1}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

import * as React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useCartStore } from '../../store/useCartStore';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  description: string;
  sellingPrice: number;
  basePrice: number;
  finalPrice: number;
  hasDiscount: boolean;
  discountPercentage: number;
  images: string[];
  stock: number;
  category: { name: string; slug: string };
  avgRating: number;
  reviewCount: number;
}

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);
  
  const [product, setProduct] = React.useState<Product | null>(null);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  
  const handleAddToCart = () => {
    if (product) {
      addItem(product, 1);
      Alert.alert('Success', 'Product added to cart');
      router.push('/(tabs)/cart');
    }
  };

  React.useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setIsInitialLoading(true);
      const response = await api.get<{ success: boolean; data: Product }>(`/products/${id}`);
      if (response.success) {
        setProduct(response.data);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-5">
        <Text className="text-gray-500 text-lg text-center">Product not found</Text>
        <TouchableOpacity 
          className="mt-4 bg-blue-600 px-6 py-2 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="px-5 py-3 border-b border-gray-100 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-gray-900 font-bold text-lg flex-1 text-center" numberOfLines={1}>
          Product Details
        </Text>
        <TouchableOpacity className="p-2 -mr-2">
          <Ionicons name="share-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View className="relative h-96 bg-gray-50">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setActiveImageIndex(Math.round(x / width));
            }}
            scrollEventThrottle={16}
          >
            {product.images && product.images.length > 0 ? (
              product.images.map((img, index) => (
                <Image
                  key={index}
                  source={{ uri: api.getImageUrl(img) }}
                  style={{ width }}
                  className="h-full"
                  resizeMode="contain"
                />
              ))
            ) : (
              <Image
                source={{ uri: 'https://via.placeholder.com/400' }}
                style={{ width }}
                className="h-full"
                resizeMode="contain"
              />
            )}
          </ScrollView>
          
          {/* Image Dots */}
          {product.images && product.images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center space-x-2">
              {product.images.map((_, index) => (
                <View 
                  key={index}
                  className={`h-1.5 rounded-full ${index === activeImageIndex ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-300'}`}
                />
              ))}
            </View>
          )}

          {/* Discount Badge */}
          {product.hasDiscount && (
            <View className="absolute top-4 right-4 bg-red-500 px-3 py-1 rounded-full shadow-md">
              <Text className="text-white font-bold">-{product.discountPercentage}%</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View className="px-5 py-6">
          <View className="flex-row items-center mb-2">
            <View className="bg-blue-50 px-2.5 py-1 rounded-md">
              <Text className="text-blue-600 font-bold text-xs">{product.category?.name || 'Category'}</Text>
            </View>
            <View className="flex-row items-center ml-4">
              <Ionicons name="star" size={14} color="#f59e0b" />
              <Text className="text-gray-900 font-bold text-xs ml-1">{product.avgRating || 0}</Text>
              <Text className="text-gray-400 text-xs ml-1">({product.reviewCount || 0} reviews)</Text>
            </View>
          </View>

          <Text className="text-gray-900 font-extrabold text-2xl leading-tight mb-4">
            {product.name}
          </Text>

          <View className="flex-row items-baseline mb-6">
            <Text className="text-blue-600 font-black text-3xl">৳{product.finalPrice}</Text>
            {product.hasDiscount && (
              <Text className="text-gray-400 text-lg line-through ml-3 font-medium">৳{product.sellingPrice}</Text>
            )}
          </View>

          {/* Stock Status */}
          <View className="flex-row items-center mb-8 p-3 bg-gray-50 rounded-2xl border border-gray-100">
            <View className={`w-2.5 h-2.5 rounded-full ${product.stock > 0 ? 'bg-green-500' : 'bg-red-500'} mr-3`} />
            <Text className="text-gray-700 font-semibold">
              {product.stock > 0 ? `In Stock (${product.stock} items available)` : 'Out of Stock'}
            </Text>
          </View>

          {/* Description */}
          <View className="mb-8">
            <Text className="text-gray-900 font-bold text-lg mb-3">Product Description</Text>
            <Text className="text-gray-600 leading-6 text-base">
              {product.description || 'No description available.'}
            </Text>
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Footer Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-8 border-t border-gray-100 flex-row space-x-4 shadow-2xl">
        <TouchableOpacity 
          className="flex-1 bg-gray-100 py-4 rounded-2xl items-center border border-gray-200"
          onPress={handleAddToCart}
        >
          <Text className="text-gray-900 font-bold text-base">Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-300">
          <Text className="text-white font-bold text-base">Buy Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

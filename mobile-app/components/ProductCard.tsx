import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const cardWidth = (width - 50) / 2; // Two columns with padding

interface Product {
  id: string;
  name: string;
  price?: number;
  sellingPrice?: number;
  finalPrice?: number;
  basePrice?: number;
  originalPrice?: number;
  imageUrl?: string;
  images?: string[];
  discount?: {
    value: number;
    type: 'PERCENTAGE' | 'FIXED';
  };
}

interface ProductCardProps {
  product: Product;
  onPress?: () => void;
}

export default function ProductCard({ product, onPress }: ProductCardProps) {
  const displayPrice = product.finalPrice ?? product.sellingPrice ?? product.price ?? 0;
  const originalPrice = product.basePrice ?? product.originalPrice;
  const imageUrl = api.getImageUrl(product.imageUrl || product.images?.[0]);

  const discountText = product.discount 
    ? product.discount.type === 'PERCENTAGE' 
      ? `-${product.discount.value}%` 
      : `-${product.discount.value}৳`
    : null;

  return (
    <TouchableOpacity 
      className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm w-44"
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
    >
      <View className="h-36 rounded-xl bg-gray-50 overflow-hidden relative">
        <Image 
          source={{ uri: imageUrl }} 
          className="w-full h-full"
          resizeMode="cover"
        />
        {discountText && (
          <View className="absolute top-2 left-2 bg-red-500 px-2 py-0.5 rounded-md">
            <Text className="text-white text-[10px] font-bold">{discountText}</Text>
          </View>
        )}
        <TouchableOpacity className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full">
          <Ionicons name="heart-outline" size={16} color="#4b5563" />
        </TouchableOpacity>
      </View>

      <View className="mt-2 px-1">
        <Text className="text-gray-900 font-bold text-sm" numberOfLines={1}>{product.name}</Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-blue-600 font-extrabold text-base">৳{displayPrice}</Text>
          {originalPrice && originalPrice > displayPrice && (
            <Text className="text-gray-400 text-xs line-through ml-2">৳{originalPrice}</Text>
          )}
        </View>
      </View>

      <TouchableOpacity className="mt-3 bg-gray-50 py-2 rounded-xl items-center flex-row justify-center border border-gray-100">
        <Ionicons name="cart-outline" size={16} color="#2563eb" className="mr-2" />
        <Text className="text-blue-600 font-bold text-xs">Add to Cart</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

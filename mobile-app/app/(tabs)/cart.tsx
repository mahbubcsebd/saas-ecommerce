import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../../store/useCartStore';
import { api } from '../../utils/api';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getSubtotal, getTotalItems } = useCartStore();

  const subtotal = getSubtotal();
  const totalItems = getTotalItems();

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" />
        <View className="px-5 py-6 items-center justify-center flex-1">
          <View className="w-40 h-40 bg-blue-50 rounded-full items-center justify-center mb-6">
            <Ionicons name="cart-outline" size={80} color="#3b82f6" />
          </View>
          <Text className="text-gray-900 font-bold text-2xl mb-2">Your cart is empty</Text>
          <Text className="text-gray-500 text-center text-lg mb-8 px-10">
            Looks like you haven't added anything to your cart yet.
          </Text>
          <TouchableOpacity 
            className="bg-blue-600 px-10 py-4 rounded-2xl shadow-lg shadow-blue-200"
            onPress={() => router.push('/')}
          >
            <Text className="text-white font-bold text-lg">Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center justify-between border-b border-gray-100">
        <Text className="text-gray-900 font-black text-2xl">Shopping Cart</Text>
        <View className="bg-blue-100 px-3 py-1 rounded-full">
          <Text className="text-blue-700 font-bold text-sm">{totalItems} items</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-5 pt-4">
          {items.map((item) => (
            <View key={item.productId} className="bg-white rounded-2xl p-4 mb-4 flex-row shadow-sm border border-gray-50">
              <View className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden mr-4">
                <Image 
                  source={{ uri: api.getImageUrl(item.image) }} 
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              
              <View className="flex-1 justify-between py-1">
                <View className="flex-row justify-between">
                  <Text className="text-gray-900 font-bold text-lg flex-1 mr-2" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeItem(item.productId)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-blue-600 font-black text-xl">৳{item.price}</Text>
                  
                  <View className="flex-row items-center bg-gray-100 rounded-xl p-1">
                    <TouchableOpacity 
                      onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 items-center justify-center bg-white rounded-lg shadow-sm"
                    >
                      <Ionicons name="remove" size={18} color="#1f2937" />
                    </TouchableOpacity>
                    
                    <Text className="px-4 text-gray-900 font-bold text-base">{item.quantity}</Text>
                    
                    <TouchableOpacity 
                      onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 items-center justify-center bg-white rounded-lg shadow-sm"
                    >
                      <Ionicons name="add" size={18} color="#1f2937" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View className="px-5 py-6">
          <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50">
            <Text className="text-gray-900 font-bold text-lg mb-4">Order Summary</Text>
            
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500 text-base">Subtotal</Text>
              <Text className="text-gray-900 font-semibold text-base">৳{subtotal}</Text>
            </View>
            
            <View className="flex-row justify-between mb-5">
              <Text className="text-gray-500 text-base">Shipping</Text>
              <Text className="text-green-600 font-semibold text-base">Calculated at checkout</Text>
            </View>
            
            <View className="h-[1px] bg-gray-100 mb-5" />
            
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-900 font-black text-xl">Total Amount</Text>
              <Text className="text-blue-600 font-black text-2xl">৳{subtotal}</Text>
            </View>
          </View>
        </View>
        
        <View className="h-32" />
      </ScrollView>

      {/* Checkout Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-10 border-t border-gray-100 shadow-2xl">
        <TouchableOpacity 
          className="bg-blue-600 py-4 rounded-2xl items-center shadow-lg shadow-blue-300"
          onPress={() => router.push('/checkout')}
        >
          <View className="flex-row items-center">
            <Text className="text-white font-black text-lg mr-2">Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { orderNumber } = useLocalSearchParams();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 items-center justify-center px-8">
        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-8">
          <Ionicons name="checkmark-circle" size={60} color="#22c55e" />
        </View>
        
        <Text className="text-gray-900 font-black text-3xl text-center mb-4">Order Successful!</Text>
        <Text className="text-gray-500 text-lg text-center mb-10 px-4">
          Thank you for your purchase. We've received your order and are processing it.
        </Text>

        <View className="bg-gray-50 rounded-3xl p-6 w-full mb-10 border border-gray-100">
          <Text className="text-gray-500 text-sm font-semibold text-center mb-2 uppercase tracking-widest">Order Number</Text>
          <Text className="text-gray-900 font-black text-2xl text-center">#{orderNumber}</Text>
        </View>

        <TouchableOpacity 
          className="bg-blue-600 w-full py-4 rounded-2xl items-center shadow-lg shadow-blue-200 mb-4"
          onPress={() => router.dismissAll()}
        >
          <Text className="text-white font-black text-lg">Back to Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          className="w-full py-4 items-center"
          onPress={() => {
            // In a real app, this would go to My Orders
            router.dismissAll();
          }}
        >
          <Text className="text-blue-600 font-bold text-base">View My Orders</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

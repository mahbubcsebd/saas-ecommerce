import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Components
import HeroSlider from '../../components/HeroSlider';
import CategoryList from '../../components/CategoryList';
import FlashSale from '../../components/FlashSale';
import HorizontalProductList from '../../components/HorizontalProductList';
import HomeCategorySections from '../../components/HomeCategorySections';

export default function HomeScreen() {
  console.log('--- HomeScreen Rendering ---');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(() => {
    console.log('--- Refreshing ---');
    setRefreshing(true);
    setRefreshKey(prev => prev + 1); // Re-mount components to fetch data
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ flex: 1 }}>
      {/* Sticky Header */}
      <View className="px-5 pt-4 pb-2 border-b border-gray-100 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="bg-blue-600 p-2 rounded-xl mr-3">
            <Ionicons name="bag-handle" size={20} color="white" />
          </View>
          <View>
            <Text className="text-gray-400 text-xs font-semibold">Welcome back!</Text>
            <Text className="text-gray-900 font-bold text-lg">Mahbub Shop</Text>
          </View>
        </View>
        <TouchableOpacity className="bg-gray-50 p-2.5 rounded-full border border-gray-100 relative">
          <Ionicons name="notifications-outline" size={22} color="#1f2937" />
          <View className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
        }
        key={refreshKey}
      >
        {/* Search Bar */}
        <View className="px-5 mt-4">
          <View className="bg-gray-50 flex-row items-center px-4 py-3.5 rounded-2xl border border-gray-100 shadow-sm">
            <Ionicons name="search-outline" size={20} color="#9ca3af" />
            <TextInput 
              placeholder="Search products, categories..." 
              className="flex-1 ml-3 text-gray-700 font-medium"
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity className="bg-blue-600 p-1.5 rounded-lg ml-2">
              <Ionicons name="options-outline" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Slider */}
        <HeroSlider />

        {/* Categories */}
        <CategoryList />

        {/* Flash Sale */}
        <FlashSale />

        {/* New Arrivals */}
        <HorizontalProductList 
          title="New Arrivals" 
          endpoint="/products?isNewArrival=true&limit=8" 
        />

        {/* Top Selling */}
        <HorizontalProductList 
          title="Top Selling" 
          endpoint="/products?sort=sold_desc&limit=8" 
        />

        {/* Dynamic Category Sections */}
        <HomeCategorySections />

        {/* Category Sections (Dynamic Category Wise Products) */}
        {/* We can add a dynamic section fetcher here later if needed, 
           or just hardcode common ones for now */}
        
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}

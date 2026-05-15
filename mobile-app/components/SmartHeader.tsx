import React from 'react';
import { View, Text, TextInput, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function SmartHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="bg-white/95 border-b border-gray-100 px-5 pb-5 rounded-b-3xl shadow-sm"
      style={{ paddingTop: insets.top + 16 }}
    >
      {/* Top Row: Menu, Greeting, Profile */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center gap-3">
          <Pressable className="p-2.5 bg-gray-50 rounded-full active:bg-gray-100">
            <Ionicons name="grid-outline" size={22} color="#374151" />
          </Pressable>
          <View>
            <Text className="text-[13px] text-gray-500 font-medium uppercase tracking-wider mb-0.5">Good Morning</Text>
            <Text className="text-xl text-gray-900 font-bold">Mahbubur 👋</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <Pressable className="p-2.5 bg-gray-50 rounded-full active:bg-gray-100 relative shadow-sm border border-gray-100">
            <Ionicons name="notifications-outline" size={22} color="#374151" />
            <View className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
          </Pressable>
          <Pressable className="shadow-sm">
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=11' }}
              className="w-11 h-11 rounded-full bg-gray-200 border border-gray-100"
            />
          </Pressable>
        </View>
      </View>

      {/* Bottom Row: Search Navbar */}
      <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-200 shadow-inner">
        <Ionicons name="search-outline" size={22} color="#6b7280" />
        <TextInput
          placeholder="Search for everything..."
          placeholderTextColor="#9ca3af"
          className="flex-1 ml-3 text-base text-gray-900 font-medium"
        />
        <Pressable className="p-1.5 bg-white rounded-xl shadow-sm border border-gray-100 active:bg-gray-50">
          <Ionicons name="options-outline" size={20} color="#374151" />
        </Pressable>
      </View>
    </View>
  );
}

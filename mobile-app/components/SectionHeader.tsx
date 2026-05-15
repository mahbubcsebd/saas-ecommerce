import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  showSeeAll?: boolean;
}

export default function SectionHeader({ title, onSeeAll, showSeeAll = true }: SectionHeaderProps) {
  return (
    <View className="flex-row justify-between items-center px-5 mb-4 mt-8">
      <Text className="text-xl font-bold text-gray-900">{title}</Text>
      {showSeeAll && (
        <TouchableOpacity onPress={onSeeAll} className="flex-row items-center">
          <Text className="text-blue-600 font-semibold mr-1">See All</Text>
          <Ionicons name="chevron-forward" size={16} color="#2563eb" />
        </TouchableOpacity>
      )}
    </View>
  );
}

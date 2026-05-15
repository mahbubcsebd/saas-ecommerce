import * as React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { api } from '../utils/api';
import ProductCard from './ProductCard';
import { Ionicons } from '@expo/vector-icons';

interface FlashSale {
  id: string;
  name: string;
  endDate: string;
  products: {
    product: any;
    salePrice: number;
  }[];
}

export default function FlashSale() {
  const [data, setData] = React.useState<FlashSale | null>(null);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    loadFlashSale();
  }, []);

  React.useEffect(() => {
    if (!data?.endDate) return;

    const timer = setInterval(() => {
      const difference = new Date(data.endDate).getTime() - new Date().getTime();
      if (difference <= 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [data]);

  const loadFlashSale = async () => {
    try {
      setIsInitialLoading(true);
      const response = await api.get<{ success: boolean; data: FlashSale }>('/flash-sales/public/active');
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to load flash sale:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  if (isInitialLoading || !data) return null;

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <View className="bg-red-500 rounded-lg px-2 py-1 items-center min-w-[40px] ml-1">
      <Text className="text-white font-bold text-sm">{String(value).padStart(2, '0')}</Text>
      <Text className="text-white text-[8px] uppercase font-bold">{label}</Text>
    </View>
  );

  return (
    <View className="mt-8 bg-red-50/50 pb-6 rounded-3xl mx-5 border border-red-100 overflow-hidden">
      <View className="flex-row justify-between items-center px-4 py-4 border-b border-red-100 bg-red-50">
        <View className="flex-row items-center">
          <Ionicons name="flash" size={20} color="#ef4444" />
          <Text className="text-red-600 font-bold text-lg ml-2">Flash Sale</Text>
        </View>
        <View className="flex-row items-center">
          <TimeBox value={timeLeft.days} label="D" />
          <TimeBox value={timeLeft.hours} label="H" />
          <TimeBox value={timeLeft.minutes} label="M" />
          <TimeBox value={timeLeft.seconds} label="S" />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 20 }}>
        {data.products.map((item, index) => (
          <View key={index} className="mr-4">
            <ProductCard 
              product={{
                ...item.product,
                finalPrice: item.salePrice,
                basePrice: item.product.sellingPrice,
                imageUrl: item.product.imageUrl || item.product.images?.[0]
              }} 
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

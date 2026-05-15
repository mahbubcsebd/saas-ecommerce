import * as React from 'react';
import { View, ScrollView, Image, Dimensions, ActivityIndicator } from 'react-native';
import { api } from '../utils/api';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  image: string;
  title?: string;
  link?: string;
}

export default function HeroSlider() {
  const [slides, setSlides] = React.useState<Slide[]>([]);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    loadSlides();
  }, []);

  const loadSlides = async () => {
    try {
      setIsInitialLoading(true);
      const response = await api.get<{ success: boolean; data: Slide[] }>('/hero-slides');
      if (response.success) {
        setSlides(response.data);
      }
    } catch (error) {
      console.error('Failed to load slides:', error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  if (isInitialLoading) {
    return (
      <View className="mt-4 px-5">
        <View className="h-44 bg-gray-100 rounded-3xl items-center justify-center">
          <ActivityIndicator color="#2563eb" />
        </View>
      </View>
    );
  }

  if (slides.length === 0) return null;

  return (
    <View className="mt-4 relative">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const x = e.nativeEvent.contentOffset.x;
          setActiveIndex(Math.round(x / (width - 40)));
        }}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {slides.map((slide) => (
          <View key={slide.id} style={{ width: width - 40 }} className="h-44 px-2">
            <Image
              source={{ uri: api.getImageUrl(slide.image) }}
              className="w-full h-full rounded-3xl"
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <View className="flex-row justify-center mt-3 space-x-1.5">
          {slides.map((_, index) => (
            <View
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-300'
              }`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

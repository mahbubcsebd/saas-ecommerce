import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '../store/useCartStore';
import { api } from '../utils/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [form, setForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    zip: '',
  });

  const subtotal = getSubtotal();
  const shippingCost = 60; // Flat rate for now
  const total = subtotal + shippingCost;

  const handlePlaceOrder = async () => {
    // Basic validation
    if (!form.name || !form.phone || !form.street || !form.city) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Phone, Address, City)');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        source: 'ONLINE',
        guestInfo: {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone,
        },
        shippingAddress: {
          street: form.street,
          city: form.city,
          zip: form.zip || '1000',
        },
        paymentMethod: 'CASH_ON_DELIVERY',
        shippingCost,
        total,
        orderItems: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      };

      const response = await api.post<{ success: boolean; data: any }>('/orders', orderData);

      if (response.success) {
        clearCart();
        router.push({
          pathname: '/order-success',
          params: { orderNumber: response.data.orderNumber }
        });
      } else {
        Alert.alert('Error', 'Failed to place order. Please try again.');
      }
    } catch (error: any) {
      console.error('Order Error:', error);
      Alert.alert('Error', error.message || 'Something went wrong while placing your order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View className="bg-white px-5 py-4 flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="chevron-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text className="text-gray-900 font-black text-2xl">Checkout</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-6" showsVerticalScrollIndicator={false}>
        {/* Shipping Information */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 mb-6">
          <Text className="text-gray-900 font-bold text-lg mb-5">Shipping Information</Text>
          
          <View className="space-y-4">
            <View>
              <Text className="text-gray-500 text-sm font-semibold mb-2 ml-1">Full Name *</Text>
              <TextInput
                className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium"
                placeholder="Mahbubur Rahman"
                value={form.name}
                onChangeText={(text) => setForm({ ...form, name: text })}
              />
            </View>

            <View className="flex-row space-x-3">
              <View className="flex-1 mt-4">
                <Text className="text-gray-500 text-sm font-semibold mb-2 ml-1">Phone Number *</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium"
                  placeholder="017XXXXXXXX"
                  keyboardType="phone-pad"
                  value={form.phone}
                  onChangeText={(text) => setForm({ ...form, phone: text })}
                />
              </View>
            </View>

            <View className="mt-4">
              <Text className="text-gray-500 text-sm font-semibold mb-2 ml-1">Email Address (Optional)</Text>
              <TextInput
                className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium"
                placeholder="mahbub@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
              />
            </View>

            <View className="mt-4">
              <Text className="text-gray-500 text-sm font-semibold mb-2 ml-1">Delivery Address *</Text>
              <TextInput
                className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium h-24"
                placeholder="House #12, Road #5, Block-C"
                multiline
                textAlignVertical="top"
                value={form.street}
                onChangeText={(text) => setForm({ ...form, street: text })}
              />
            </View>

            <View className="flex-row space-x-3 mt-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-sm font-semibold mb-2 ml-1">City *</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium"
                  placeholder="Dhaka"
                  value={form.city}
                  onChangeText={(text) => setForm({ ...form, city: text })}
                />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-gray-500 text-sm font-semibold mb-2 ml-1">Post Code</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-gray-900 font-medium"
                  placeholder="1200"
                  keyboardType="number-pad"
                  value={form.zip}
                  onChangeText={(text) => setForm({ ...form, zip: text })}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Order Summary */}
        <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 mb-10">
          <Text className="text-gray-900 font-bold text-lg mb-4">Order Summary</Text>
          
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-500 text-base">Subtotal ({items.length} items)</Text>
            <Text className="text-gray-900 font-semibold text-base">৳{subtotal}</Text>
          </View>
          
          <View className="flex-row justify-between mb-5">
            <Text className="text-gray-500 text-base">Shipping Fee</Text>
            <Text className="text-gray-900 font-semibold text-base">৳{shippingCost}</Text>
          </View>
          
          <View className="h-[1px] bg-gray-100 mb-5" />
          
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-900 font-black text-xl">Total Amount</Text>
            <Text className="text-blue-600 font-black text-2xl">৳{total}</Text>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* Place Order Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-10 border-t border-gray-100 shadow-2xl">
        <TouchableOpacity 
          className={`py-4 rounded-2xl items-center shadow-lg ${isSubmitting ? 'bg-gray-400' : 'bg-blue-600 shadow-blue-300'}`}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-black text-lg">Confirm Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

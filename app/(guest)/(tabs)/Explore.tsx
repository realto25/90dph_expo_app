import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAllPlots, PlotType } from '../../../lib/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // 16px padding on each side
const DEFAULT_IMAGE = 'https://placehold.co/600x400/e2e8f0/64748b?text=Plot+Image';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [plots, setPlots] = useState<PlotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlots();
  }, []);

  const fetchPlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllPlots();
      setPlots(data);
    } catch (err) {
      setError('Failed to load plots. Please try again later.');
      console.log('Error fetching plots:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlots = plots.filter(
    (plot) =>
      plot.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plot.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateToPlot = (plotId: string) => {
    router.push({
      pathname: '/(guest)/plot/[id]' as const,
      params: { id: plotId },
    });
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(price / 100000).toFixed(2)} Lac`;
  };

  const renderPlotItem = ({ item }: { item: PlotType }) => (
    <TouchableOpacity
      onPress={() => navigateToPlot(item.id)}
      className="mb-6"
      style={{ width: CARD_WIDTH }}>
      <View className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-lg">
        {/* Image Container with Gradient Overlay */}
        <View className="relative h-48">
          <Image
            source={{ uri: item.imageUrls?.[0] || DEFAULT_IMAGE }}
            className="h-full w-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            className="absolute bottom-0 left-0 right-0 h-20"
          />

          {/* Status Badge */}
          <View
            className={`absolute right-4 top-4 rounded-full px-3 py-1.5 ${
              item.status.toLowerCase() === 'available' ? 'bg-green-500/90' : 'bg-red-500/90'
            }`}>
            <Text className="text-xs font-semibold capitalize text-white">
              {item.status.toLowerCase() === 'available' ? 'Available' : 'Sold Out'}
            </Text>
          </View>

          {/* Price Tag */}
          <View className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-3 py-1.5">
            <Text className="text-lg font-bold text-orange-600">{formatPrice(item.price)}</Text>
            <Text className="text-xs text-gray-600">Onwards</Text>
          </View>
        </View>

        {/* Content */}
        <View className="p-5">
          {/* Title and Location */}
          <Text className="mb-1 text-xl font-bold text-gray-900">{item.title}</Text>
          <View className="mb-4 flex-row items-center">
            <Ionicons name="location-outline" size={16} color="#FF6B00" />
            <Text className="ml-1 text-sm text-gray-600">{item.location}</Text>
          </View>

          {/* Details Grid */}
          <View className="mb-4 flex-row flex-wrap gap-4">
            <View className="flex-row items-center rounded-lg bg-orange-50 px-3 py-2">
              <Ionicons name="resize-outline" size={16} color="#FF6B00" />
              <Text className="ml-2 text-sm font-medium text-gray-700">{item.dimension}</Text>
            </View>

            <View className="flex-row items-center rounded-lg bg-orange-50 px-3 py-2">
              <Ionicons name="compass-outline" size={16} color="#FF6B00" />
              <Text className="ml-2 text-sm font-medium capitalize text-gray-700">
                {item.facing}
              </Text>
            </View>
          </View>

          {/* Amenities */}
          {item.amenities && item.amenities.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {item.amenities.slice(0, 3).map((amenity, index) => (
                <View key={index} className="rounded-full bg-gray-50 px-2.5 py-1">
                  <Text className="text-xs text-gray-600">{amenity}</Text>
                </View>
              ))}
              {item.amenities.length > 3 && (
                <View className="rounded-full bg-gray-50 px-2.5 py-1">
                  <Text className="text-xs text-gray-600">+{item.amenities.length - 3} more</Text>
                </View>
              )}
            </View>
          )}

          {/* View Details Button */}
          <TouchableOpacity
            onPress={() => navigateToPlot(item.id)}
            className="mt-4 rounded-xl bg-orange-500 py-3">
            <Text className="text-center font-semibold text-white">View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="mt-4 font-medium text-gray-600">Loading plots...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B00" />
        <Text className="mt-4 text-center text-lg font-medium text-gray-700">{error}</Text>
        <TouchableOpacity onPress={fetchPlots} className="mt-6 rounded-xl bg-orange-500 px-6 py-3">
          <Text className="text-lg font-semibold text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Search Bar */}
      <View className="bg-white p-4">
        <View className="flex-row items-center rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5 shadow-sm">
          <Ionicons name="search-outline" size={20} color="#FF6B00" />
          <TextInput
            placeholder="Search by plot name or location"
            className="ml-2 flex-1 text-base text-gray-800"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredPlots}
        renderItem={renderPlotItem}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-10"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Ionicons name="search" size={64} color="#FFB380" />
            <Text className="mt-4 text-xl font-semibold text-gray-700">No plots found</Text>
            <Text className="mt-2 text-center text-gray-500">
              Try searching with different keywords
            </Text>
          </View>
        }
      />
    </View>
  );
}

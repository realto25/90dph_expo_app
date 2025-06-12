import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getProjects, ProjectType } from '../lib/api'; // Import the API function and type

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;

const DEFAULT_IMAGE = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

const ProjectCard = () => {
  const router = useRouter();
  const [featuredProjects, setFeaturedProjects] = useState<ProjectType[]>([]); // State to hold projects
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const projects = await getProjects(); // Fetch projects from API
      setFeaturedProjects(projects); // Update state with fetched data
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const formatPrice = (priceRange?: string) => {
    if (!priceRange) return 'Price on request';
    try {
      // Handle different price range formats
      if (priceRange.includes('-')) {
        const minPrice = priceRange.split('-')[0].trim();
        return minPrice;
      }
      return priceRange.trim();
    } catch (err) {
      console.error('Error formatting price:', err);
      return 'Price on request';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <Text className="font-manrope-medium text-gray-600">{error}</Text>
        <TouchableOpacity
          className="mt-4 rounded-full bg-green-500 px-4 py-2"
          onPress={() => {
            setIsLoading(true);
            setError(null);
            fetchProjects();
          }}>
          <Text className="font-manrope-bold text-white">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (featuredProjects.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-8">
        <Text className="font-manrope-medium text-gray-600">No projects available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      className="px-2 py-4"
      contentContainerStyle={{ paddingBottom: 20 }}>
      {featuredProjects.map((project: ProjectType) => (
        <TouchableOpacity
          key={project.id}
          onPress={() =>
            router.push({
              pathname: '/(guest)/(tabs)/Explore' as const,
            })
          }
          className="mb-6 overflow-hidden rounded-2xl bg-white"
          style={{
            width: CARD_WIDTH,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
          }}>
          {/* Image Container with Gradient Overlay */}
          <View className="relative">
            <Image
              source={{ uri: project.imageUrl || DEFAULT_IMAGE }}
              className="h-72 w-full"
              resizeMode="cover"
              onError={(e) => {
                // If the image fails to load, it will use the DEFAULT_IMAGE
                e.currentTarget.setNativeProps({
                  source: { uri: DEFAULT_IMAGE },
                });
              }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              className="absolute bottom-0 left-0 right-0 h-32"
            />

            {/* Price Tag */}
            <View className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 backdrop-blur-sm">
              <Text className="font-manrope-bold text-base text-green-600">
                {formatPrice(project.priceRange)}
              </Text>
            </View>

            {/* Favorite Button */}
            <TouchableOpacity
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 backdrop-blur-sm"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}>
              <Ionicons name="heart-outline" size={22} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Card Content */}
          <View className="p-4">
            <View className="mb-2 flex-row items-start justify-between">
              <Text
                className="font-manrope-bold mr-2 flex-1 text-xl text-gray-900"
                numberOfLines={1}>
                {project.name || 'Unnamed Project'}
              </Text>
              <View className="flex-row items-center rounded-full bg-gray-100 px-2 py-1">
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text className="font-manrope-medium ml-1 text-sm text-gray-700">
                  {project.rating?.toFixed(1) || 'N/A'}
                </Text>
              </View>
            </View>

            <View className="mb-3 flex-row items-center">
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text className="font-manrope ml-1 text-sm text-gray-600" numberOfLines={1}>
                {project.location || 'Location not specified'}
              </Text>
            </View>

            {/* Amenities */}
            {project.amenities && project.amenities.length > 0 && (
              <View className="flex-row flex-wrap gap-2">
                {project.amenities.slice(0, 3).map((amenity, index) => (
                  <View key={index} className="rounded-full bg-gray-50 px-3 py-1">
                    <Text className="font-manrope-medium text-xs text-gray-600">{amenity}</Text>
                  </View>
                ))}
                {project.amenities.length > 3 && (
                  <View className="rounded-full bg-gray-50 px-3 py-1">
                    <Text className="font-manrope-medium text-xs text-gray-600">
                      +{project.amenities.length - 3} more
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Available Plots */}
            <View className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-2 h-2 w-2 rounded-full bg-green-500" />
                <Text className="font-manrope-medium text-sm text-gray-700">
                  {project.plotsAvailable} Available
                </Text>
              </View>
              <TouchableOpacity
                className="rounded-full bg-green-500 px-4 py-2"
                onPress={() =>
                  router.push({
                    pathname: '/(guest)/(tabs)/Explore' as const,
                  })
                }>
                <Text className="font-manrope-bold text-sm text-white">View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default ProjectCard;

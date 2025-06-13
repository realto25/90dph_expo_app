import ProjectCard from "../../../components/ProjectCard"; // Ensure this path is correct
import { getProjects } from "../../../lib/api"; // Ensure this path is correct
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
  RefreshControl,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { height, width } = Dimensions.get("window");

// Scaling utilities for responsive design
const scaleFont = (size: number) => {
  const guidelineBaseWidth = 375;
  return Math.round((size * width) / guidelineBaseWidth);
};

const scale = (size: number) => {
  const guidelineBaseWidth = 375;
  return Math.round((size * width) / guidelineBaseWidth);
};

// Assuming this interface is defined elsewhere or imported from lib/api
// It's crucial for type safety when working with project data.
interface ProjectType {
  id: string;
  name?: string;
  description?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  priceRange?: string;
  rating?: number;
  location?: string;
  amenities?: string[];
  plotsAvailable?: number;
}

// User metadata for role-based redirection
interface UserMetadata {
  role?: string;
}

export default function Page() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const headerScrollY = useRef(new Animated.Value(0)).current;

  // Animations for initial load and shimmer effect
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const shimmerAnim = useState(new Animated.Value(0))[0];

  // Consistent color palette for the UI
  const colors = {
    primary: '#0F172A',
    secondary: '#1E293B',
    accent: '#6366F1',
    accentLight: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    surface: '#FFFFFF',
    surfaceElevated: '#F8FAFC',
    surfaceHover: '#F1F5F9',
    text: {
      primary: '#0F172A',
      secondary: '#475569',
      tertiary: '#94A3B8',
      inverse: '#FFFFFF',
    },
    border: {
      light: '#E2E8F0',
      medium: '#CBD5E1',
      dark: '#94A3B8'
    }
  };

  // Fetches projects from the API
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projectData = await getProjects();
      setProjects(projectData);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      setError('Failed to load projects. Please try again.');
      console.error("Fetch projects error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handles the pull-to-refresh gesture
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  }, [fetchProjects]);

  // Requests and gets the user's current location
  const getLocation = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      setLocationError(null);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      setLocationError('Unable to get current location');
      console.error("Location error:", err);
    }
  }, []);

  // Lifecycle hook to fetch location and projects on component mount
  useEffect(() => {
    getLocation();
    fetchProjects();
  }, [getLocation, fetchProjects]);

  // Animation for initial project card display
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Animation for skeleton loader shimmer effect
  useEffect(() => {
    const startShimmer = () => {
      shimmerAnim.setValue(0);
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
    };

    if (loading) {
      startShimmer();
    } else {
      shimmerAnim.stopAnimation();
    }
  }, [loading, shimmerAnim]);

  // Skeleton loader component for better perceived performance during loading
  const SkeletonLoader = () => {
    const translateX = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-width, width],
    });

    const ShimmerOverlay = () => (
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateX }],
            backgroundColor: 'rgba(255,255,255,0.3)',
          }
        ]}
      />
    );

    return (
      <View style={{ flex: 1, marginTop: scale(10) }}>
        {[...Array(3)].map((_, index) => (
          <Animated.View
            key={`skeleton-${index}`}
            style={[
              {
                marginBottom: scale(15),
                backgroundColor: colors.surface,
                borderRadius: scale(12),
                overflow: 'hidden',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
                width: width * 0.9 - 20, // Match ProjectCard width
              },
            ]}
          >
            <View style={{
              height: scale(150),
              backgroundColor: colors.surfaceElevated,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <ShimmerOverlay />
            </View>
            <View style={{ padding: scale(12) }}>
              <View style={{
                height: scale(18),
                backgroundColor: colors.surfaceElevated,
                borderRadius: scale(6),
                marginBottom: scale(8),
                width: '75%',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <ShimmerOverlay />
              </View>
              <View style={{
                height: scale(12),
                backgroundColor: colors.surfaceElevated,
                borderRadius: scale(4),
                width: '50%',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <ShimmerOverlay />
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
    );
  };

  // Handles initial authentication and user loading states
  if (!isAuthLoaded || !isUserLoaded) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <LinearGradient
          colors={[colors.accent, colors.accentLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <ActivityIndicator size="large" color={colors.text.inverse} />
          </Animated.View>
          <Text style={{
            marginTop: scale(15),
            color: colors.text.inverse,
            fontSize: scaleFont(14),
            fontWeight: '500',
            textAlign: 'center'
          }}>
            Loading your experience...
          </Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Redirects authenticated users based on their role
  if (isSignedIn) {
    const userRole = (user?.publicMetadata as UserMetadata)?.role;
    if (userRole === "client") return <Redirect href="/(client)/(tabs)/Home" />;
    if (userRole === "manager") return <Redirect href="/(manager)" />;
  } else {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Header animation for scroll effect
  const headerOpacity = headerScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });

  const headerTranslateY = headerScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });

  // Filters projects based on search query, case-insensitive
  const filteredProjects = projects.filter(project =>
    (project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.state?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surfaceElevated }} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.surfaceElevated} translucent />
      <Animated.View
        style={{
          opacity: headerOpacity,
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        <LinearGradient
          colors={[colors.surface, colors.surfaceElevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            paddingHorizontal: scale(15),
            paddingBottom: scale(15),
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: scale(16),
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: scaleFont(24),
                fontWeight: '700',
                color: colors.text.primary,
                letterSpacing: -0.3,
                lineHeight: scale(28),
              }}>
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
              </Text>
              <Text style={{
                fontSize: scaleFont(12),
                fontWeight: '500',
                color: colors.text.secondary,
                marginTop: scale(4),
                letterSpacing: 0.1,
              }}>
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {userLocation ? (
                <TouchableOpacity
                  onPress={getLocation}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.success + '15',
                    paddingHorizontal: scale(10),
                    paddingVertical: scale(6),
                    borderRadius: scale(16),
                    marginBottom: scale(8),
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="location" size={scale(14)} color={colors.success} />
                  <Text style={{
                    fontSize: scaleFont(12),
                    fontWeight: '600',
                    marginLeft: scale(4),
                    color: colors.success,
                  }}>
                    Location Active
                  </Text>
                </TouchableOpacity>
              ) : locationError ? (
                <TouchableOpacity
                  onPress={getLocation}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.error + '15',
                    paddingHorizontal: scale(10),
                    paddingVertical: scale(6),
                    borderRadius: scale(16),
                    marginBottom: scale(8),
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="location-off" size={scale(14)} color={colors.error} />
                  <Text style={{
                    fontSize: scaleFont(12),
                    fontWeight: '600',
                    marginLeft: scale(4),
                    color: colors.error,
                  }}>
                    Enable Location
                  </Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                accessible
                accessibilityLabel="Notifications"
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  Alert.alert("Notifications", "Notification feature coming soon!");
                }}
                style={{
                  width: scale(36),
                  height: scale(36),
                  borderRadius: scale(18),
                  backgroundColor: colors.accent + '10',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: colors.accent,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications" size={scale(18)} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Search Bar */}
          <View style={styles.searchBarContainer}>
            <Ionicons name="search" size={scale(20)} color={colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              clearButtonMode="while-editing" // iOS only
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchButton}>
                <Ionicons name="close-circle" size={scale(20)} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: headerScrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: scale(15),
          paddingBottom: scale(30),
          paddingTop: scale(8),
          // THIS IS THE KEY TO CENTERING THE CARDS!
          alignItems: 'center',
        }}
      >
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="alert-circle-outline" size={scale(40)} color={colors.error} />
            <Text style={[styles.emptyStateText, { fontSize: scaleFont(14) }]}>{error}</Text>
            <TouchableOpacity style={[styles.exploreButton, { paddingHorizontal: scale(20), paddingVertical: scale(10), borderRadius: scale(8) }]} onPress={fetchProjects}>
              <Text style={[styles.exploreButtonText, { fontSize: scaleFont(14) }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProjects.length === 0 && searchQuery !== '' ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="search-outline" size={scale(40)} color={colors.text.tertiary} />
            <Text style={[styles.emptyStateText, { fontSize: scaleFont(14) }]}>No results found for "{searchQuery}".</Text>
            <TouchableOpacity style={[styles.exploreButton, { paddingHorizontal: scale(20), paddingVertical: scale(10), borderRadius: scale(8) }]} onPress={() => setSearchQuery('')}>
              <Text style={[styles.exploreButtonText, { fontSize: scaleFont(14) }]}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="sad-outline" size={scale(40)} color={colors.text.tertiary} />
            <Text style={[styles.emptyStateText, { fontSize: scaleFont(14) }]}>No projects found.</Text>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPress={() => Alert.alert("Project Detail", `Navigating to ${project.name}`)}
                style={{ marginBottom: index === filteredProjects.length - 1 ? 0 : scale(15) }}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(15),
    marginTop: scale(30),
    backgroundColor: '#fff',
    borderRadius: scale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: scaleFont(14),
    color: '#6B7280',
    textAlign: 'center',
    marginTop: scale(10),
    marginBottom: scale(15),
    lineHeight: scale(20),
  },
  exploreButton: {
    backgroundColor: '#3366CC',
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3366CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: scaleFont(14),
    fontWeight: '600',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9', // Use a lighter background for the search bar
    borderRadius: scale(10),
    paddingHorizontal: scale(10),
    marginTop: scale(10), // Adjust margin as needed
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    height: scale(40), // Standard height for input fields
    fontSize: scaleFont(14),
    color: '#0F172A', // Primary text color
  },
  clearSearchButton: {
    marginLeft: scale(8),
    padding: scale(4),
  },
});
import ProjectCard from "../../../components/ProjectCard";
import { getProjects } from "../../../lib/api";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import debounce from "lodash.debounce";
import SearchBar from "../../../components/SearchBar";

const { width, height } = Dimensions.get("window");

// Enhanced scaling utilities with maximum limits
const scaleFont = (size: number) => {
  const guidelineBaseWidth = 375;
  const scaledSize = (size * width) / guidelineBaseWidth;
  return Math.min(scaledSize, size * 1.5); // Limit maximum scaling
};

const scale = (size: number) => {
  const guidelineBaseWidth = 375;
  const scaledSize = (size * width) / guidelineBaseWidth;
  return Math.min(scaledSize, size * 1.5); // Limit maximum scaling
};

// Enhanced color palette with better contrast ratios
const themes = {
  light: {
    primary: "#0F172A",
    secondary: "#1E293B",
    accent: "#4F46E5",
    accentLight: "#6366F1",
    accentLighter: "#C7D2FE",
    success: "#16A34A",
    warning: "#D97706",
    error: "#DC2626",
    surface: "#FFFFFF",
    surfaceElevated: "#F8FAFC",
    surfaceHover: "#F1F5F9",
    text: {
      primary: "#0F172A",
      secondary: "#334155",
      tertiary: "#64748B",
      inverse: "#FFFFFF",
    },
    border: {
      light: "#E2E8F0",
      medium: "#CBD5E1",
      dark: "#94A3B8",
    },
  },
  dark: {
    primary: "#F8FAFC",
    secondary: "#E2E8F0",
    accent: "#818CF8",
    accentLight: "#6366F1",
    accentLighter: "#4F46E5",
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    surface: "#0F172A",
    surfaceElevated: "#1E293B",
    surfaceHover: "#334155",
    text: {
      primary: "#F8FAFC",
      secondary: "#E2E8F0",
      tertiary: "#94A3B8",
      inverse: "#0F172A",
    },
    border: {
      light: "#1E293B",
      medium: "#334155",
      dark: "#475569",
    },
  },
};

// Enhanced shadow styles with better platform adaptation
const commonShadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  android: {
    elevation: 4,
    shadowColor: "#000",
  },
  default: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});

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

interface UserMetadata {
  role?: string;
}

export default function Home() {
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = themes[colorScheme || "light"];
  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const headerScrollY = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const shimmerAnim = useState(new Animated.Value(0))[0];

  // Enhanced debounced search with cleanup
  const debouncedSetSearchQuery = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query);
        if (Platform.OS !== "web") {
          Haptics.selectionAsync();
        }
      }, 300),
    []
  );

  // Enhanced fetch with error handling and caching
  const fetchProjects = useCallback(async (retryCount = 3) => {
    setLoading(true);
    setError(null);
    try {
      const projectData = await getProjects();
      setProjects(projectData);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await fetchProjects(retryCount - 1);
      } else {
        setError("Failed to load projects. Please check your connection and try again.");
        console.error("Fetch projects error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Enhanced pull-to-refresh with timeout
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.race([
        fetchProjects(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000))
      ]);
    } catch (err) {
      setError("Refresh timed out. Please check your connection.");
    } finally {
      setRefreshing(false);
    }
  }, [fetchProjects]);

  // Enhanced location fetching with timeout
  const getLocation = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Location permission required for nearby projects");
        return;
      }
      
      const location = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000))
      ]);
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationError(null);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      setLocationError("Location request timed out. Please try again.");
      console.error("Location error:", err);
    }
  }, []);

  // Initial data loading
  useEffect(() => {
    const init = async () => {
      await Promise.all([getLocation(), fetchProjects()]);
    };
    init();
  }, [getLocation, fetchProjects]);

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => debouncedSetSearchQuery.cancel();
  }, [debouncedSetSearchQuery]);

  // Enhanced filtered projects with location sorting
  const filteredProjects = useMemo(() => {
    let results = projects.filter((project) => {
      const matchesSearch =
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.state?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    // Sort by distance if location is available
    if (userLocation) {
      results = results.sort((a, b) => {
        const distanceA = a.latitude && a.longitude ? 
          Math.sqrt(
            Math.pow(a.latitude - userLocation.latitude, 2) + 
            Math.pow(a.longitude - userLocation.longitude, 2)
          ) : Infinity;
        const distanceB = b.latitude && b.longitude ? 
          Math.sqrt(
            Math.pow(b.latitude - userLocation.latitude, 2) + 
            Math.pow(b.longitude - userLocation.longitude, 2)
          ) : Infinity;
        return distanceA - distanceB;
      });
    }

    return results;
  }, [projects, searchQuery, userLocation]);

  // Skeleton Loader with improved accessibility
  const SkeletonLoader = React.memo(() => {
    const translateX = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-width, width],
    });

    return (
      <View style={styles.skeletonContainer} accessibilityLabel="Loading content">
        {[...Array(4)].map((_, index) => (
          <View
            key={`skeleton-${index}`}
            style={[styles.skeletonCard, { width: width * 0.9 }]}
            accessible={false}
          >
            <View style={styles.skeletonImage}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFillObject,
                  {
                    transform: [{ translateX }],
                    backgroundColor: "rgba(255,255,255,0.2)",
                  },
                ]}
              />
            </View>
            <View style={styles.skeletonContent}>
              <View style={styles.skeletonTitle}>
                <Animated.View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      transform: [{ translateX }],
                      backgroundColor: "rgba(255,255,255,0.2)",
                    },
                  ]}
                />
              </View>
              <View style={styles.skeletonSubtitle}>
                <Animated.View
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      transform: [{ translateX }],
                      backgroundColor: "rgba(255,255,255,0.2)",
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  });

  // Loading state with better visual feedback
  if (!isAuthLoaded || !isUserLoaded) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <LinearGradient
          colors={[colors.accent, colors.accentLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.loadingContainer}
        >
          <ActivityIndicator size="large" color={colors.text.inverse} />
          <Text style={styles.loadingText}>Preparing your dashboard...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Role-based redirection
  if (isSignedIn) {
    const userRole = (user?.publicMetadata as UserMetadata)?.role;
    if (userRole === "client") return <Redirect href="/(client)/(tabs)/Home" />;
    if (userRole === "manager") return <Redirect href="/(manager)/(tabs)/Home" />;
  } else {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Header animations
  const headerOpacity = headerScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  const headerTranslateY = headerScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -10],
    extrapolate: "clamp",
  });

  const headerScale = headerScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.98],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top", "bottom"]}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      
      <Animated.View
        style={[
          styles.header, 
          { 
            opacity: headerOpacity, 
            transform: [
              { translateY: headerTranslateY },
              { scale: headerScale }
            ] 
          }
        ]}
      >
        <LinearGradient
          colors={[colors.surface, colors.surfaceElevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text 
                style={[styles.headerTitle, { color: colors.text.primary }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={getLocation}
                style={[
                  styles.locationButton, 
                  { 
                    backgroundColor: userLocation ? 
                      `${colors.success}15` : `${colors.error}15`,
                    borderColor: userLocation ? 
                      colors.success : colors.error
                  }
                ]}
                accessibilityLabel={userLocation ? "Refresh location" : "Enable location"}
                accessibilityRole="button"
              >
                <Ionicons 
                  name="location" 
                  size={scale(14)} 
                  color={userLocation ? colors.success : colors.error} 
                />
                <Text style={[
                  styles.locationText, 
                  { color: userLocation ? colors.success : colors.error }
                ]}>
                  {userLocation ? "Location Active" : "Enable Location"}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => router.push("/Notifications")}
                style={[
                  styles.notificationButton,
                  { backgroundColor: colors.surface, borderColor: colors.border.light }
                ]}
                accessibilityLabel="Notifications"
                accessibilityRole="button"
              >
                <Ionicons 
                  name="notifications-outline" 
                  size={scale(20)} 
                  color={colors.accent} 
                />
                <View style={[
                  styles.notificationBadge,
                  { backgroundColor: colors.accent }
                ]} />
              </TouchableOpacity>
            </View>
          </View>
          
          <SearchBar
            placeholder="Search projects, locations..."
            value={searchQuery}
            onChangeText={(text) => debouncedSetSearchQuery(text)}
            colors={colors}
          />
        </LinearGradient>
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: headerScrollY } } }],
          {
            useNativeDriver: false,
            listener: (event) => {
              setShowScrollTop(event.nativeEvent.contentOffset.y > height / 3);
            },
          }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent, colors.accentLight]}
            progressBackgroundColor={colors.surface}
          />
        }
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons 
              name="alert-circle-outline" 
              size={scale(40)} 
              color={colors.error} 
            />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={() => fetchProjects()}
              accessibilityLabel="Retry loading projects"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProjects.length === 0 && searchQuery ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons 
              name="search-outline" 
              size={scale(40)} 
              color={colors.text.tertiary} 
            />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              No projects match your search. Try different keywords.
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={() => debouncedSetSearchQuery("")}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>Clear Search</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons 
              name="home-outline" 
              size={scale(40)} 
              color={colors.text.tertiary} 
            />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              No projects available at the moment. Check back later.
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.accent }]}
              onPress={fetchProjects}
              accessibilityLabel="Refresh projects"
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View 
            style={{ 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }],
              width: '100%'
            }}
          >
            <Text style={[
              styles.resultsText, 
              { color: colors.text.secondary }
            ]}>
              Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </Text>
            
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={`${project.id}-${index}`}
                project={{
                  ...project,
                  name: project.name || "Untitled Project",
                  city: project.city || "Unknown City",
                  description: project.description || "No description available",
                  imageUrl: project.imageUrl || "https://via.placeholder.com/300",
                  rating: project.rating ?? 0,
                  plotsAvailable: project.plotsAvailable ?? 0,
                }}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/project/${project.id}`);
                }}
                style={{ 
                  marginBottom: index === filteredProjects.length - 1 ? scale(24) : scale(16),
                  backgroundColor: colors.surfaceElevated,
                }}
                colors={colors}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {showScrollTop && (
        <Animated.View 
          style={[
            styles.fab, 
            { 
              transform: [{ scale: fabAnim }],
              shadowColor: colors.primary,
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              scrollRef.current?.scrollTo({ y: 0, animated: true });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
              styles.fabButton, 
              { 
                backgroundColor: colors.accent,
                shadowColor: colors.primary,
              }
            ]}
            accessibilityLabel="Scroll to top"
            accessibilityRole="button"
          >
            <Ionicons 
              name="arrow-up" 
              size={scale(24)} 
              color={colors.text.inverse} 
            />
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    zIndex: 10,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0, // Removed scale(8) padding
  },
  headerGradient: {
    paddingHorizontal: scale(16),
    paddingTop: scale(4), // Reduced from scale(8) to scale(4)
    paddingBottom: scale(16),
    ...commonShadow,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(16),
    marginTop: 0, // Removed scale(4) margin
  },
  headerTextContainer: {
    flex: 1,
    marginRight: scale(8),
  },
  headerTitle: {
    fontSize: scaleFont(24), // Reduced from 32 back to 24
    fontWeight: "700",
    lineHeight: scale(28), // Reduced from 36 to 28
    marginBottom: scale(4),
  },
  headerSubtitle: {
    fontSize: scaleFont(14), // Reduced from 16 back to 14
    fontWeight: "500",
    opacity: 0.8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(20),
    borderWidth: 1,
  },
  locationText: {
    fontSize: scaleFont(12),
    fontWeight: "600",
    marginLeft: scale(4),
  },
  notificationButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: scale(6),
    right: scale(6),
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(24),
  },
  skeletonContainer: {
    paddingTop: scale(8),
  },
  skeletonCard: {
    marginBottom: scale(16),
    backgroundColor: themes.light.surfaceElevated,
    borderRadius: scale(12),
    overflow: "hidden",
    ...commonShadow,
  },
  skeletonImage: {
    height: scale(180),
    backgroundColor: themes.light.surfaceHover,
    position: "relative",
    overflow: "hidden",
  },
  skeletonContent: {
    padding: scale(16),
  },
  skeletonTitle: {
    height: scale(20),
    backgroundColor: themes.light.surfaceHover,
    borderRadius: scale(4),
    marginBottom: scale(12),
    width: "70%",
    position: "relative",
    overflow: "hidden",
  },
  skeletonSubtitle: {
    height: scale(16),
    backgroundColor: themes.light.surfaceHover,
    borderRadius: scale(4),
    width: "50%",
    position: "relative",
    overflow: "hidden",
  },
  emptyStateContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: scale(32),
    marginTop: scale(24),
    backgroundColor: themes.light.surfaceElevated,
    borderRadius: scale(12),
    ...commonShadow,
  },
  emptyStateText: {
    fontSize: scaleFont(16),
    textAlign: "center",
    marginVertical: scale(16),
    lineHeight: scale(22),
  },
  actionButton: {
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(8),
    ...commonShadow,
  },
  actionButtonText: {
    color: themes.light.text.inverse,
    fontSize: scaleFont(16),
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: scale(24),
    right: scale(16),
    zIndex: 20,
    ...commonShadow,
  },
  fabButton: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(26),
    alignItems: "center",
    justifyContent: "center",
    ...commonShadow,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: scale(16),
    color: themes.light.text.inverse,
    fontSize: scaleFont(16),
    fontWeight: "500",
  },
  resultsText: {
    fontSize: scaleFont(14),
    marginBottom: scale(12),
    marginTop: scale(4),
  },
});
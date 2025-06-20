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
  TextInput,
  useColorScheme,
  AccessibilityInfo,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import debounce from "lodash.debounce";

const { width, height } = Dimensions.get("window");

// Scaling utilities for responsive design
const scaleFont = (size: number) => {
  const guidelineBaseWidth = 375;
  return Math.round((size * width) / guidelineBaseWidth);
};

const scale = (size: number) => {
  const guidelineBaseWidth = 375;
  return Math.round((size * width) / guidelineBaseWidth);
};

// Color palette with light and dark mode support
const themes = {
  light: {
    primary: "#0F172A",
    secondary: "#1E293B",
    accent: "#4F46E5",
    accentLight: "#A5B4FC",
    success: "#F97316",
    warning: "#F59E0B",
    error: "#EF4444",
    surface: "#FFFFFF",
    surfaceElevated: "#F8FAFC",
    surfaceHover: "#F1F5F9",
    text: {
      primary: "#0F172A",
      secondary: "#475569",
      tertiary: "#94A3B8",
      inverse: "#FFFFFF",
    },
    border: {
      light: "#E2E8F0",
      medium: "#CBD5E1",
      dark: "#94A3B8",
    },
  },
  dark: {
    primary: "#1E293B",
    secondary: "#0F172A",
    accent: "#818CF8",
    accentLight: "#C7D2FE",
    success: "#F97316",
    warning: "#F59E0B",
    error: "#F87171",
    surface: "#0F172A",
    surfaceElevated: "#1E293B",
    surfaceHover: "#334155",
    text: {
      primary: "#F8FAFC",
      secondary: "#CBD5E1",
      tertiary: "#94A3B8",
      inverse: "#0F172A",
    },
    border: {
      light: "#475569",
      medium: "#64748B",
      dark: "#94A3B8",
    },
  },
};

// Reusable shadow style
const commonShadow = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 4,
};

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

  const [currentSearchInput, setCurrentSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState(""); // This state will be debounced for filtering
  const [activeFilter, setActiveFilter] = useState<string | null>(null); // State for active location filter

  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const headerScrollY = useRef(new Animated.Value(0)).current;
  const fabAnim = useRef(new Animated.Value(1)).current;

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const shimmerAnim = useState(new Animated.Value(0))[0];

  // Debounced search logic
  const debouncedSetSearchQuery = useMemo(
    () =>
      debounce((query: string) => {
        setSearchQuery(query); // Update the state that filteredProjects depends on
        if (Platform.OS !== "web") {
          Haptics.selectionAsync();
        }
      }, 300),
    []
  );

  // Predefined location filters
  const locationFilters = useMemo(
    () => ["All", "South India", "Salem", "Coimbatore", "Chennai", "Bangalore"],
    []
  );

  // Handle filter button press
  const handleFilterPress = useCallback(
    (filter: string) => {
      if (Platform.OS !== "web") {
        Haptics.selectionAsync();
      }
      setActiveFilter(filter === "All" ? null : filter); // Set to null for "All"
      scrollRef.current?.scrollTo({ y: 0, animated: true }); // Scroll to top on filter change
    },
    [scrollRef]
  );

  // Fetch projects with retry logic
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
        setTimeout(() => fetchProjects(retryCount - 1), 1000);
      } else {
        setError("Failed to load projects. Please check your connection.");
        console.error("Fetch projects error:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  }, [fetchProjects]);

  // Get user location
  const getLocation = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Location permission denied. Enable it in settings.");
        return;
      }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      setLocationError(null);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      setLocationError("Unable to get location. Please try again.");
      console.error("Location error:", err);
    }
  }, []);

  // Lifecycle hooks
  useEffect(() => {
    getLocation();
    fetchProjects();
  }, [getLocation, fetchProjects]);

  // Initial animations
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

  // Shimmer animation for skeleton loader
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        })
      ).start();
    } else {
      shimmerAnim.stopAnimation();
    }
  }, [loading, shimmerAnim]);

  // FAB pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fabAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fabAnim]);

  // Scroll handler for "scroll to top" visibility
  const handleScroll = useCallback(
    Animated.event([{ nativeEvent: { contentOffset: { y: headerScrollY } } }], {
      useNativeDriver: false,
      listener: (event: any) => {
        setShowScrollTop(event.nativeEvent.contentOffset.y > height / 2);
      },
    }),
    []
  );

  // Skeleton loader
  const SkeletonLoader = React.memo(() => {
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
            backgroundColor: "rgba(255,255,255,0.2)",
          },
        ]}
      />
    );

    return (
      <View style={styles.skeletonContainer}>
        {[...Array(3)].map((_, index) => (
          <View
            key={`skeleton-${index}`}
            style={[styles.skeletonCard, { width: width * 0.9 }]}
            accessible={false}
          >
            <View style={styles.skeletonImage}>
              <ShimmerOverlay />
            </View>
            <View style={styles.skeletonContent}>
              <View style={styles.skeletonTitle}>
                <ShimmerOverlay />
              </View>
              <View style={styles.skeletonSubtitle}>
                <ShimmerOverlay />
              </View>
            </View>
          </View>
        ))}
      </View>
    );
  });

  // Filtered projects
  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesSearch =
          project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.state?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesFilter = activeFilter
          ? project.city?.toLowerCase().includes(activeFilter.toLowerCase()) ||
            project.state?.toLowerCase().includes(activeFilter.toLowerCase())
          : true; // If no active filter, all pass

        return matchesSearch && matchesFilter;
      }),
    [projects, searchQuery, activeFilter] // Filter based on debounced searchQuery and activeFilter
  );

  // Loading state
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
          <Text style={styles.loadingText}>Loading your experience...</Text>
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
    outputRange: [1, 0.9],
    extrapolate: "clamp",
  });

  const headerTranslateY = headerScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -20],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top", "bottom"]}>
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.surface}
        translucent
      />
      <Animated.View
        style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}
      >
        <LinearGradient
          colors={[colors.surface, colors.surfaceElevated]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
                {new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.headerActions}>
              {userLocation ? (
                <TouchableOpacity
                  onPress={getLocation}
                  style={[styles.locationButton, { backgroundColor: colors.success + "15" }]}
                  accessibilityLabel="Refresh location"
                  accessibilityRole="button"
                >
                  <Ionicons name="location" size={scale(14)} color={colors.success} />
                  <Text style={[styles.locationText, { color: colors.success }]}>Location Active</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={getLocation}
                  style={[styles.locationButton, { backgroundColor: colors.error + "15" }]}
                  accessibilityLabel="Enable location"
                  accessibilityRole="button"
                >
                  <Ionicons name="location" size={scale(14)} color={colors.error} />
                  <Text style={[styles.locationText, { color: colors.error }]}>Enable Location</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => router.push("/Notifications")}
                style={styles.notificationButton}
                accessibilityLabel="Notifications"
                accessibilityRole="button"
              >
                <Ionicons name="notifications-outline" size={scale(20)} color={colors.accent} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.searchBarContainer, { backgroundColor: colors.surfaceHover }]}>
            <Ionicons name="search" size={scale(20)} color={colors.text.tertiary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder="Search projects..."
              placeholderTextColor={colors.text.tertiary}
              value={currentSearchInput}
              onChangeText={(text) => {
                setCurrentSearchInput(text);
                debouncedSetSearchQuery(text);
                setActiveFilter(null); // Clear filter when searching
              }}
              returnKeyType="search"
              clearButtonMode="never" // We'll handle our own clear button
              accessibilityLabel="Search projects"
              accessibilityRole="search"
            />
            {currentSearchInput.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setCurrentSearchInput("");
                  setSearchQuery("");
                  debouncedSetSearchQuery.cancel();
                }}
                style={styles.clearSearchButton}
                accessibilityLabel="Clear search"
                accessibilityRole="button"
              >
                <Ionicons name="close-circle" size={scale(20)} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
          {/* New: Horizontal Scroll Filter Buttons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterButtonContainer}
          >
            {locationFilters.map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => handleFilterPress(filter)}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      activeFilter === filter || (filter === "All" && activeFilter === null)
                        ? colors.accent
                        : colors.surfaceElevated,
                    borderColor:
                      activeFilter === filter || (filter === "All" && activeFilter === null)
                        ? colors.accent
                        : colors.border.light,
                  },
                ]}
                accessibilityLabel={`Filter by ${filter}`}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    {
                      color:
                        activeFilter === filter || (filter === "All" && activeFilter === null)
                          ? colors.text.inverse
                          : colors.text.secondary,
                    },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent, colors.accentLight]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <SkeletonLoader />
        ) : error ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="alert-circle-outline" size={scale(40)} color={colors.error} />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: colors.success }]}
              onPress={() => fetchProjects()}
              accessibilityLabel="Retry loading projects"
              accessibilityRole="button"
            >
              <Text style={styles.exploreButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProjects.length === 0 && (searchQuery !== "" || activeFilter !== null) ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="search-outline" size={scale(40)} color={colors.text.tertiary} />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>
              No results found. Adjust your search or filters.
            </Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: colors.success }]}
              onPress={() => {
                setCurrentSearchInput("");
                setSearchQuery("");
                debouncedSetSearchQuery.cancel();
                setActiveFilter(null); // Also clear active filter
              }}
              accessibilityLabel="Clear search and filters"
              accessibilityRole="button"
            >
              <Text style={styles.exploreButtonText}>Clear Search & Filters</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="sad-outline" size={scale(40)} color={colors.text.tertiary} />
            <Text style={[styles.emptyStateText, { color: colors.text.secondary }]}>No projects found.</Text>
            <TouchableOpacity
              style={[styles.exploreButton, { backgroundColor: colors.success }]}
              onPress={fetchProjects}
              accessibilityLabel="Refresh projects"
              accessibilityRole="button"
            >
              <Text style={styles.exploreButtonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={{
                  ...project,
                  name: project.name || "Untitled Project",
                  city: project.city || "Unknown City",
                  description: project.description || "No description available",
                  imageUrl: project.imageUrl || "https://via.placeholder.com/150",
                  rating: project.rating ?? 0,
                  plotsAvailable: project.plotsAvailable ?? 0,
                }}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/project/${project.id}`);
                }}
                style={{ marginBottom: index === filteredProjects.length - 1 ? 0 : scale(16) }}
              />
            ))}
          </Animated.View>
        )}
      </ScrollView>

      {showScrollTop && (
        <Animated.View style={[styles.fab, { transform: [{ scale: fabAnim }] }]}>
          <TouchableOpacity
            onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
            style={[styles.fabButton, { backgroundColor: colors.accent }]}
            accessibilityLabel="Scroll to top"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-up" size={scale(24)} color={colors.text.inverse} />
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
  },
  headerGradient: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(16),
    ...commonShadow, // Apply common shadow
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: scale(16),
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: scaleFont(28),
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: scale(32),
  },
  headerSubtitle: {
    fontSize: scaleFont(14),
    fontWeight: "500",
    marginTop: scale(4),
    letterSpacing: 0.2,
  },
  headerActions: {
    alignItems: "flex-end",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    marginBottom: scale(8),
    borderWidth: 1, // Added border for consistency
    borderColor: themes.light.border.medium, // Default border color
  },
  locationText: {
    fontSize: scaleFont(12),
    fontWeight: "600",
    marginLeft: scale(6),
  },
  notificationButton: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: themes.light.surface,
    alignItems: "center",
    justifyContent: "center",
    ...commonShadow, // Apply common shadow
    borderWidth: 1,
    borderColor: themes.light.border.light,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: scale(12),
    paddingHorizontal: scale(12),
    marginTop: scale(12),
    ...commonShadow, // Apply common shadow
    height: scale(48), // Set a fixed height for consistency
  },
  searchIcon: {
    marginRight: scale(8),
  },
  searchInput: {
    flex: 1,
    height: "100%", // Take full height of container
    fontSize: scaleFont(16),
    borderRadius: scale(12),
    paddingVertical: 0, // Remove default vertical padding
    paddingLeft: 0, // Remove default left padding
  },
  clearSearchButton: {
    marginLeft: scale(8),
    padding: scale(4),
  },
  // New styles for filter buttons
  filterButtonContainer: {
    paddingVertical: scale(10),
    paddingHorizontal: scale(0), // No horizontal padding for the container itself
  },
  filterButton: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    marginRight: scale(8), // Space between buttons
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonText: {
    fontSize: scaleFont(14),
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(32),
    alignItems: "center",
  },
  skeletonContainer: {
    flex: 1,
    marginTop: scale(16),
  },
  skeletonCard: {
    marginBottom: scale(16),
    backgroundColor: themes.light.surface,
    borderRadius: scale(12),
    overflow: "hidden",
    ...commonShadow, // Apply common shadow
  },
  skeletonImage: {
    height: scale(160),
    backgroundColor: themes.light.surfaceElevated,
    position: "relative",
    overflow: "hidden",
  },
  skeletonContent: {
    padding: scale(12),
  },
  skeletonTitle: {
    height: scale(20),
    backgroundColor: themes.light.surfaceElevated,
    borderRadius: scale(6),
    marginBottom: scale(8),
    width: "75%",
    position: "relative",
    overflow: "hidden",
  },
  skeletonSubtitle: {
    height: scale(14),
    backgroundColor: themes.light.surfaceElevated,
    borderRadius: scale(4),
    width: "50%",
    position: "relative",
    overflow: "hidden",
  },
  emptyStateContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: scale(24),
    marginTop: scale(32),
    backgroundColor: themes.light.surface,
    borderRadius: scale(12),
    ...commonShadow, // Apply common shadow
  },
  emptyStateText: {
    fontSize: scaleFont(16),
    textAlign: "center",
    marginTop: scale(12),
    marginBottom: scale(16),
    lineHeight: scale(22),
  },
  exploreButton: {
    backgroundColor: themes.light.success,
    paddingHorizontal: scale(24),
    paddingVertical: scale(12),
    borderRadius: scale(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: themes.light.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  exploreButtonText: {
    color: themes.light.text.inverse,
    fontSize: scaleFont(16),
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    bottom: scale(24),
    right: scale(16),
    zIndex: 20,
  },
  fabButton: {
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: themes.light.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    textAlign: "center",
  },
});

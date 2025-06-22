import { useUser } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Animated,
  StatusBar,
  Platform,
  Linking,
  Vibration,
  StyleProp, // For typing component styles
  ViewStyle, // For typing View styles
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";

// --- Configuration Constants ---
const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://90-dph.vercel.app";
const ACCEPTABLE_GPS_ACCURACY_THRESHOLD = 1500; // Meters

// --- Color Palette ---
const colors = {
  primary: "#FF8C00", // Darker orange
  secondary: "#FFA500", // Brighter orange
  background: "#F8F8F8", // Light gray background
  card: "#FFFFFF", // White cards
  text: "#333333", // Dark gray for main text
  subtext: "#666666", // Medium gray for subtext
  error: "#DC3545", // Red for errors
  warning: "#FFC107", // Yellow for warnings
  success: "#28A745", // Green for success (kept distinct from orange for clarity)
  border: "#E0E0E0", // Light gray for borders
  lightBackground: "#FFF3E0", // Very light orange for tinted backgrounds
};

// --- Interfaces ---
interface OfficeData {
  id: string;
  officeName: string;
  latitude: number;
  longitude: number;
  requiredDistance?: number; // Distance in meters for geofence
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number | null; // Accuracy in meters
}

// --- Component Props Interfaces ---
interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

interface PulsingDotProps {
  size?: number;
  color?: string;
}

// --- Reusable Components ---

/**
 * A reusable card component with consistent styling.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the card.
 * @param {StyleProp<ViewStyle>} [props.style] - Optional custom styles for the card container.
 */
const Card: React.FC<CardProps> = ({ children, style = {} }) => (
  <View
    style={[
      {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 18,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.border,
      },
      style,
    ]}
  >
    {children}
  </View>
);

/**
 * An animated pulsing dot component for status indication.
 * @param {Object} props - Component props.
 * @param {number} [props.size=12] - The size of the inner dot.
 * @param {string} [props.color=colors.success] - The color of the dot and pulse.
 */
const PulsingDot: React.FC<PulsingDotProps> = ({ size = 12, color = colors.success }) => {
  const pulse = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.15, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.5, duration: 900, useNativeDriver: true }),
        ]),
      ])
    );
    pulseAnim.start();
    return () => pulseAnim.stop();
  }, [pulse, opacity]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer animated pulse */}
      <Animated.View
        style={{
          position: 'absolute',
          width: size * 2.2,
          height: size * 2.2,
          borderRadius: (size * 2.2) / 2,
          backgroundColor: color,
          opacity: opacity,
          transform: [{ scale: pulse }],
        }}
      />
      {/* Inner dot with white border */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: '#fff',
          zIndex: 1,
        }}
      />
    </View>
  );
};

// --- Main Screen Component ---

export default function MarkAttendanceScreen() {
  const { user, isLoaded } = useUser();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [assignedOffices, setAssignedOffices] = useState<OfficeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermissionStatus, setLocationPermissionStatus] = useState<string>("");
  const [lastTap, setLastTap] = useState<number>(0); // For double tap prevention

  /**
   * Calculates the distance between two geographical points using the Haversine formula.
   * @param {number} lat1 - Latitude of the first point.
   * @param {number} lon1 - Longitude of the first point.
   * @param {number} lat2 - Latitude of the second point.
   * @param {number} lon2 - Longitude of the second point.
   * @returns {number} Distance in meters.
   */
  const calculateDistance = useCallback((
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
  }, []);

  /**
   * Determines the nearest office and the distance to it from the current location.
   * @returns {{distance: number, office: OfficeData | null}} An object containing the minimum distance and the nearest office data.
   */
  const getDistanceToNearestOffice = useCallback((): {
    distance: number;
    office: OfficeData | null;
  } => {
    if (!location || assignedOffices.length === 0) {
      return { distance: Infinity, office: null };
    }

    let minDistance = Infinity;
    let nearestOffice = null;

    for (const office of assignedOffices) {
      const distance = calculateDistance(
        location.lat,
        location.lng,
        office.latitude,
        office.longitude
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestOffice = office;
      }
    }

    return { distance: minDistance, office: nearestOffice };
  }, [location, assignedOffices, calculateDistance]);

  /**
   * Requests and retrieves the current foreground location of the device.
   * Handles permission requests and accuracy checks.
   */
  const getLocation = useCallback(async () => {
    setError(null);
    try {
      let { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      setLocationPermissionStatus(existingStatus);

      if (existingStatus !== "granted") {
        const { status } = await Location.requestForegroundPermissionsAsync();
        existingStatus = status;
        setLocationPermissionStatus(status);

        if (status !== "granted") {
          Alert.alert(
            "Location Permission Needed",
            "Location access is required to mark attendance. Please enable it in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () =>
                  Linking.openSettings().catch(() => {
                    Alert.alert(
                      "Error",
                      "Unable to open settings. Please enable location manually."
                    );
                  }),
              },
            ]
          );
          setError("Location permission denied.");
          setLocation(null);
          return;
        }
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });

      if (
        loc.coords.accuracy &&
        loc.coords.accuracy > ACCEPTABLE_GPS_ACCURACY_THRESHOLD
      ) {
        setError(
          `Location accuracy too low (${loc.coords.accuracy.toFixed(0)}m). ` +
          `Please move to an open area for better GPS signal.`
        );
        setLocation(null);
        return;
      }

      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      });

      console.log("Location obtained:", {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      });
    } catch (err) {
      console.error("Error getting location:", err);
      let message = "Failed to get location. Check device location settings and try again.";
      if (err instanceof Error) {
        if (err.message.includes("timeout")) {
          message = "Location request timed out. Please ensure GPS is enabled and try again.";
        } else if (err.message.includes("Location services are disabled")) {
          message = "Location services are disabled on your device. Please enable them in settings.";
        } else if (err.message) {
          message = err.message;
        }
      }
      setError(message);
      setLocation(null);
    }
  }, []);

  /**
   * Fetches the list of offices assigned to the current user from the backend.
   */
  const fetchAssignedOffices = useCallback(async () => {
    if (!user?.id) {
      console.error("No user ID available for fetching offices");
      setError("User authentication required to fetch offices.");
      return;
    }

    try {
      const url = `${API_URL}/api/managers/assigned-offices?clerkId=${encodeURIComponent(user.id)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse response from server");
        throw new Error("Invalid response format from server.");
      }

      if (!res.ok) {
        let errorMessage = data.error || data.message || `HTTP error! Status: ${res.status}`;
        if (res.status === 404) {
          errorMessage = "No offices assigned to your account. Please contact your administrator.";
        } else if (res.status === 401) {
          errorMessage = "Authentication failed. Please sign in again.";
        } else if (res.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
        throw new Error(errorMessage);
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid office data format received from server.");
      }

      if (data.length === 0) {
        setError("No offices assigned to your account. Please contact your administrator.");
        setAssignedOffices([]); // Clear any previous offices
        return;
      }

      // Basic validation for each office object
      const isValid = data.every(
        (office: any) =>
          typeof office.id === "string" &&
          typeof office.officeName === "string" &&
          typeof office.latitude === "number" &&
          typeof office.longitude === "number"
      );

      if (!isValid) {
        throw new Error("Invalid office data structure received.");
      }

      setAssignedOffices(data);
    } catch (err) {
      console.error("Error fetching assigned offices:", err);
      let errorMessage = "Failed to fetch office details.";
      if (err instanceof Error) {
        if (err.name === "TypeError" && err.message.includes("Network request failed")) {
          errorMessage = "Network error. Please check your internet connection.";
        } else if (err.name === "AbortError" || err.message?.includes("timeout")) {
          errorMessage = "Request for offices timed out. Please try again.";
        } else if (err.message) {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
      setAssignedOffices([]); // Clear offices on error
    }
  }, [user]); // Dependencies for useCallback

  /**
   * Initializes screen data by fetching assigned offices and current location.
   */
  const initializeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchAssignedOffices(), getLocation()]);
    } catch (err) {
      console.error("One of the initialization promises failed:", err);
      setError("Failed to load all necessary data. Please pull to refresh.");
    } finally {
      setLoading(false);
    }
  }, [fetchAssignedOffices, getLocation]);

  // Initial data load effect
  useEffect(() => {
    if (isLoaded && user) {
      initializeData();
    }
  }, [isLoaded, user, initializeData]);

  /**
   * Handles pull-to-refresh action for the ScrollView.
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await initializeData(); // Re-fetch all data
    setRefreshing(false);
  }, [initializeData]);

  /**
   * Proceeds with marking attendance after all checks are passed.
   * Sends attendance data to the backend.
   */
  const proceedWithAttendance = useCallback(async () => {
    if (!user || !location || !assignedOffices.length) {
      Alert.alert("Error", "Prerequisites for marking attendance are not met.");
      return;
    }

    setMarking(true);
    Vibration.vibrate(50); // Haptic feedback on action start

    const { distance, office: nearestOffice } = getDistanceToNearestOffice();

    const requestBody = {
      clerkId: user.id,
      latitude: location.lat,
      longitude: location.lng,
      accuracy: location.accuracy,
      timestamp: new Date().toISOString(),
      deviceInfo: {
        platform: Platform.OS,
        // Potentially add more device info like OS version, app version, model if needed for debugging/auditing
        timestamp: new Date().toISOString(),
      },
    };

    console.log("Sending attendance request:", requestBody);

    try {
      const res = await fetch(`${API_URL}/api/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await res.text();
      console.log("Attendance response status:", res.status);
      console.log("Attendance response body:", responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse attendance response:", parseError);
        throw new Error("Server returned an unreadable response.");
      }

      if (res.ok) {
        Alert.alert(
          "Success",
          `Attendance marked successfully!\n\nOffice: ${
            responseData.attendance?.officeName ||
            nearestOffice?.officeName ||
            "N/A"
          }\nDistance from Office: ${Math.round(distance)}m`,
          [{ text: "OK" }]
        );
        Vibration.vibrate([50, 100, 50]); // Success haptic feedback
      } else {
        let alertMessage =
          responseData.error || responseData.message || "Failed to mark attendance.";
        if (responseData.nearestOffice && responseData.distance) {
          alertMessage += `\n\nNearest office: ${responseData.nearestOffice}\nYour distance: ${responseData.distance}m\nRequired distance: ${responseData.requiredDistance || "N/A"}m`;
        }
        Alert.alert("Attendance Failed", alertMessage);
      }
    } catch (err) {
      console.error("Error marking attendance:", err);
      let errorMessage = "Failed to connect to the attendance server. Please check your internet connection.";
      if (err instanceof Error) {
        if (err.name === "TypeError" && err.message.includes("Network request failed")) {
          errorMessage = "Network error: Could not reach the server. Please check your internet connection.";
        } else if (err.name === "AbortError" || err.message?.includes("timeout")) {
          errorMessage = "Request for attendance timed out. Please try again.";
        } else if (err.message) {
          errorMessage = err.message;
        }
      }
      Alert.alert("Network Error", errorMessage);
    } finally {
      setMarking(false);
    }
  }, [user, location, assignedOffices, getDistanceToNearestOffice]);

  /**
   * Main function to initiate the attendance marking process.
   * Includes double-tap prevention, location accuracy check, and geofence check.
   */
  const markAttendance = useCallback(async () => {
    // Prevent double taps
    const now = Date.now();
    if (now - lastTap < 1500) { // Increased debounce time slightly for robust prevention
      return;
    }
    setLastTap(now);

    if (!user) {
      Alert.alert("Authentication Error", "User not authenticated. Please sign in again.");
      return;
    }

    if (!location) {
      Alert.alert("Location Error", "Your current location data is not available. Please ensure location services are enabled and try refreshing.");
      return;
    }

    if (assignedOffices.length === 0) {
      Alert.alert("Office Assignment Error", "No offices are assigned to your account. Attendance cannot be marked. Please contact your administrator.");
      return;
    }

    // High accuracy warning
    if (location.accuracy && location.accuracy > ACCEPTABLE_GPS_ACCURACY_THRESHOLD) {
      Alert.alert(
        "Low GPS Accuracy",
        `Your current location accuracy is ${location.accuracy.toFixed(
          0
        )}m, which is lower than required. For best results, move to an open area with a clear view of the sky.`,
        [
          { text: "Cancel", style: "cancel", onPress: () => Vibration.vibrate(50) },
          { text: "Proceed Anyway", onPress: () => proceedWithAttendance() },
        ],
        { cancelable: true }
      );
      return;
    }

    // Geofence check
    const { distance, office: nearestOffice } = getDistanceToNearestOffice();
    const requiredGeofenceDistance = nearestOffice?.requiredDistance || 1000; // Default to 1000m if not specified

    if (!nearestOffice) {
      // This case should ideally be caught by assignedOffices.length === 0, but as a fallback
      Alert.alert("Error", "Could not determine the nearest office. Please try refreshing.");
      return;
    }

    if (distance > requiredGeofenceDistance) {
      Alert.alert(
        "Out of Office Range",
        `You are too far from the nearest assigned office: ${
          nearestOffice.officeName
        }.\n\nYour distance: ${
          distance >= 1000
            ? (distance / 1000).toFixed(1) + " km"
            : Math.round(distance) + " m"
        }\nRequired distance: Within ${requiredGeofenceDistance}m.`,
        [
          { text: "OK", style: "cancel", onPress: () => Vibration.vibrate(50) },
          { text: "Proceed Anyway", onPress: () => proceedWithAttendance() }, // Option to override for legitimate cases
        ],
        { cancelable: true }
      );
      return;
    }

    // If all checks pass
    await proceedWithAttendance();
  }, [user, location, assignedOffices, lastTap, getDistanceToNearestOffice, proceedWithAttendance]);

  // --- Render Logic for various states ---

  // Loading state
  if (!isLoaded || loading) {
    return (
      <SafeAreaView style={styles.fullscreenCenterContainer} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <LottieView
          source={require("../../../assets/loading-animation.json")}
          autoPlay
          loop
          style={styles.loadingAnimation}
        />
        <Text style={styles.loadingText} accessibilityLabel="Loading workspace">
          Loading your workspace...
        </Text>
      </SafeAreaView>
    );
  }

  // Authentication required state
  if (!user) {
    return (
      <SafeAreaView style={styles.fullscreenCenterContainer} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <Ionicons
          name="person-circle-outline"
          size={80}
          color={colors.primary}
          accessibilityLabel="Authentication required icon"
        />
        <Text style={styles.authRequiredTitle}>Authentication Required</Text>
        <Text style={styles.authRequiredSubtitle}>Please sign in to continue</Text>
      </SafeAreaView>
    );
  }

  // General error state (e.g., failed to fetch offices, severe location error)
  if (error && !loading) {
    return (
      <SafeAreaView style={styles.fullscreenCenterContainer} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <Ionicons
          name="warning-outline"
          size={64}
          color={colors.error}
          accessibilityLabel="Error occurred icon"
        />
        <Text style={styles.errorText}>{error}</Text>
        <View style={styles.errorActionsContainer}>
          <TouchableOpacity
            onPress={onRefresh}
            accessibilityLabel="Retry fetching data"
            accessibilityRole="button"
            testID="retryButton"
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          {error.includes("Location permission") && ( // Show "Open Settings" only for permission errors
            <TouchableOpacity
              onPress={() => Linking.openSettings()}
              accessibilityLabel="Open device settings"
              accessibilityRole="button"
              testID="openSettingsButton"
              style={styles.openSettingsButton}
            >
              <Text style={styles.openSettingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Main content display
  const { distance, office: nearestOffice } = getDistanceToNearestOffice();
  const requiredGeofenceDistance = nearestOffice?.requiredDistance || 1000;
  const isWithinRange = distance <= requiredGeofenceDistance;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header section with LinearGradient */}
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text
              style={styles.greetingText}
              accessibilityLabel={`Greeting ${user.firstName || "Manager"}`}
            >
              Good{" "}
              {new Date().getHours() < 12
                ? "Morning"
                : new Date().getHours() < 18
                ? "Afternoon"
                : "Evening"}
            </Text>
            <Text style={styles.userNameText}>
              {user.firstName || "Manager"}
            </Text>
          </View>
          <View style={styles.headerDateContainer}>
            <PulsingDot size={14} color="#ffffff" />
            <Text style={styles.headerDateText}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Location Status Card */}
        <Card>
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: location ? colors.success : colors.error },
              ]}
            >
              <Ionicons
                name={location ? "location" : "location-outline"}
                size={24}
                color="#ffffff"
                accessibilityLabel={location ? "Location connected" : "Location required"}
              />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle}>Location Status</Text>
              <Text
                style={[
                  styles.cardSubtitle,
                  { color: location ? colors.success : colors.error },
                ]}
              >
                {location ? "Connected & Ready" : "Location Required"}
              </Text>
            </View>
          </View>
          {location ? (
            <View style={styles.locationInfoBox}>
              <Text style={styles.locationInfoTitle}>
                📍 Current Location
              </Text>
              <Text style={styles.locationInfoText}>
                Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
              </Text>
              <Text style={styles.locationInfoText}>
                Accuracy: {location.accuracy !== null ? `${location.accuracy.toFixed(2)}m` : "N/A"}
              </Text>
              <TouchableOpacity
                onPress={getLocation}
                accessibilityLabel="Refresh current location"
                accessibilityRole="button"
                testID="refreshLocationButton"
                style={styles.refreshLocationButton}
              >
                <Text style={styles.refreshLocationButtonText}>
                  Refresh Location
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.locationErrorBox}>
              <Text style={styles.locationErrorTitle}>
                🚫 Location Access Needed
              </Text>
              <Text style={styles.locationErrorText}>
                Permission: {locationPermissionStatus}{" "}
                {error && `(${error.toLowerCase().includes("location") ? error : "permission error"})`}
              </Text>
              <TouchableOpacity
                onPress={getLocation}
                accessibilityLabel="Enable location permissions"
                accessibilityRole="button"
                testID="enableLocationButton"
                style={styles.enableLocationButton}
              >
                <Text style={styles.enableLocationButtonText}>
                  Enable Location
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Attendance Status Card (Conditional rendering) */}
        {location && assignedOffices.length > 0 && (
          <Card
            style={[
              styles.attendanceStatusCard,
              {
                backgroundColor: isWithinRange ? colors.lightBackground : '#FCE7E7',
                borderColor: isWithinRange ? colors.success : colors.error,
              },
            ]}
          >
            <View style={styles.attendanceStatusHeader}>
              <View
                style={[
                  styles.attendanceIconCircle,
                  { backgroundColor: isWithinRange ? colors.success : colors.error },
                ]}
              >
                <Ionicons
                  name={isWithinRange ? "checkmark-circle" : "warning"}
                  size={32}
                  color="#ffffff"
                  accessibilityLabel={isWithinRange ? "Ready to clock in" : "Out of office range"}
                />
              </View>
              <Text style={styles.attendanceStatusTitle}>
                {isWithinRange ? "Ready to Clock In!" : "Move Closer to Office"}
              </Text>
            </View>
            <View style={styles.attendanceDetailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Nearest Office</Text>
                <Text style={styles.detailValue}>
                  {nearestOffice?.officeName || "N/A"}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>
                  {distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text
                  style={[
                    styles.detailValue,
                    { color: isWithinRange ? colors.success : colors.error },
                  ]}
                >
                  {isWithinRange ? "Within Range" : "Out of Range"}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Mark Attendance Button */}
        <TouchableOpacity
          onPress={markAttendance}
          disabled={marking || !location || assignedOffices.length === 0}
          accessibilityLabel="Mark attendance button"
          accessibilityRole="button"
          testID="markAttendanceButton"
          style={[
            styles.markAttendanceButton,
            {
              backgroundColor:
                marking || !location || assignedOffices.length === 0
                  ? colors.subtext
                  : colors.primary,
            },
          ]}
        >
          {marking ? (
            <ActivityIndicator color="#ffffff" size="small" accessibilityLabel="Marking attendance" />
          ) : (
            <Text style={styles.markAttendanceButtonText}>
              Mark My Attendance
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  fullscreenCenterContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: 24, // Consistent padding for full-screen messages
  },
  loadingAnimation: {
    width: 150,
    height: 150,
  },
  loadingText: {
    marginTop: 16,
    color: colors.text,
    fontSize: 18,
    fontWeight: "600",
    opacity: 0.9,
    textAlign: 'center',
  },
  authRequiredTitle: {
    color: colors.text,
    fontSize: 20,
    textAlign: "center",
    marginTop: 16,
    fontWeight: "700", // Slightly bolder title
  },
  authRequiredSubtitle: {
    color: colors.subtext,
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  errorText: {
    color: colors.text,
    fontSize: 18,
    textAlign: "center",
    marginVertical: 16,
    fontWeight: "600",
    paddingHorizontal: 24,
  },
  errorActionsContainer: {
    flexDirection: "row",
    gap: 12, // Gap between buttons
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  openSettingsButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  openSettingsButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 10,
    paddingHorizontal: 16,
    paddingBottom: 16, // Increased slightly for better visual balance
    marginBottom: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingText: {
    fontSize: 22, // Slightly larger for greeting
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4, // Adjusted spacing
  },
  userNameText: {
    fontSize: 15, // Slightly larger for user name
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  headerDateContainer: {
    alignItems: "center",
  },
  headerDateText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12, // Slightly larger date
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollViewContent: {
    paddingVertical: 10, // Added vertical padding to scroll content
    paddingBottom: 20, // Ensure content isn't cut off by bottom padding
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  locationInfoBox: {
    backgroundColor: colors.lightBackground,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1, // Added border for subtle separation
    borderColor: colors.primary + '30', // Light primary border
  },
  locationInfoTitle: {
    color: colors.primary,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  locationInfoText: {
    color: colors.subtext,
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "SFMono-Regular" : "monospace", // Monospace for coordinates
    marginTop: 4, // Consistent spacing
  },
  refreshLocationButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  refreshLocationButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  locationErrorBox: {
    backgroundColor: '#FCE7E7', // Light red for errors
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error + '30', // Light error border
  },
  locationErrorTitle: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  locationErrorText: {
    color: colors.subtext,
    fontSize: 12,
    marginBottom: 12,
  },
  enableLocationButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  enableLocationButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  attendanceStatusCard: {
    // Styles for the conditional card
  },
  attendanceStatusHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  attendanceIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  attendanceStatusTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  attendanceDetailsBox: {
    backgroundColor: colors.card, // Nested card look
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  detailLabel: {
    color: colors.subtext,
    fontSize: 14,
  },
  detailValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  markAttendanceButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  markAttendanceButtonText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
});

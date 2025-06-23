// app/(guest)/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
// import { useAuth } from "@clerk/clerk-expo"; // Not directly used in this layout, can be removed if not needed elsewhere
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"; // Import useSafeAreaInsets
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const insets = useSafeAreaInsets(); // Get safe area insets
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem('onboardingComplete');
      if (!seen) {
        setShowOnboarding(true);
        router.replace('/Onboarding');
      } else {
        setShowOnboarding(false);
      }
    })();
  }, [router]);

  if (showOnboarding) return null; // Prevent rendering tabs while redirecting

  return (
    // Removed SafeAreaView here, as the Tabs component will handle it implicitly or
    // we'll apply padding directly to the tabBar. Keeping it at the top for other content
    // is fine, but for the tabs, it's better to manage its specific padding.
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#F97316", // Updated to match new theme
          tabBarInactiveTintColor: "#4B5EAA", // Updated to match new theme
          tabBarStyle: {
            ...styles.tabBar,
            // Dynamically add paddingBottom based on safe area insets
            paddingBottom: styles.tabBar.paddingBottom + insets.bottom,
            height: styles.tabBar.height + insets.bottom, // Adjust height to accommodate padding
          },
          tabBarLabelStyle: styles.tabBarLabel,
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="home-outline" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="search" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Camera"
          options={{
            title: "Camera",
            tabBarIcon: ({ color }) => (
              <MaterialIcons size={24} name="videocam" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="SellRequest"
          options={{
            title: "Sell",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={24} name="money" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="Profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="person-outline" color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  // safeArea style is now less critical for the tab bar itself, but useful for main screen content
  // safeArea: {
  //   flex: 1,
  //   backgroundColor: "#FFF7ED", // Updated to match new theme
  // },
  container: {
    flex: 1,
    backgroundColor: "#FFF7ED", // Updated to match new theme background
  },
  tabBar: {
    backgroundColor: "#FFF7ED", // Updated to match new theme background
    borderTopColor: "#F97316", // Updated to match new theme active color
    borderTopEndRadius: 0, // Remove radius for a flat look and to avoid color bleed
    borderTopStartRadius: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
    height: 60, // Base height
    paddingBottom: 8, // Updated to match new theme padding
    paddingTop: 8, // Updated to match new theme padding
    borderTopWidth: 1, // Add a border for clear separation
    overflow: 'visible', // Prevent clipping
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: "Manrope-SemiBold", // Added font family to match new theme
  },
  // header styles are not directly used here for the tab bar but might be for inner screens
  header: {
    backgroundColor: '#F97316', // Updated to match new theme
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});

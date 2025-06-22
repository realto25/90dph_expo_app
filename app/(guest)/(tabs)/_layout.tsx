// app/(guest)/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { useAuth } from "@clerk/clerk-expo"; // Not directly used in the provided snippet, but imported
import { Text, TouchableOpacity, Dimensions, StyleSheet } from "react-native"; // Text and TouchableOpacity are imported, but not used with bare text
import { Ionicons } from "@expo/vector-icons";

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,
    elevation: 0,
    height: Dimensions.get("window").height * 0.1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});

export default function TabLayout() {
  // const { signOut } = useAuth(); // Example of useAuth if needed

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#f97316", // orange-500
        tabBarInactiveTintColor: "#6b7280", // gray-500
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: {
          fontSize: 12, // Smaller font for label
          fontWeight: '600', // Semibold
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size + (focused ? 2 : 0)} color={color} />
          ),
          accessibilityLabel: "Navigate to Home",
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
        name="Booking"
        options={{
          title: "Booking",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="book-outline" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile", // Capitalized "Profile" for consistency
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="person-outline" color={color} />
          ),
          // Example of a custom header for profile screen if needed:
          // headerTitle: () => (
          //   <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>My Profile</Text>
          // ),
          // headerShown: true, // Only for this screen
        }}
      />
    </Tabs>
  );
}

// app/(guest)/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { useAuth } from "@clerk/clerk-expo";

export default function TabLayout() {
  // const { signOut } = useAuth(); // Example of useAuth if needed

  return (
    <SafeAreaView style={styles.safeArea}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#F97316",
          tabBarInactiveTintColor: "#4B5EAA",
          tabBarStyle: {
            backgroundColor: "#FFF7ED",
            borderTopWidth: 1,
            borderTopColor: "#e5e7eb",
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: "Manrope-SemiBold",
          },
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="home-outline" color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="Explore"
          options={{
            title: "Explore",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="search" color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="Booking"
          options={{
            title: "Booking",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="book-outline" color={color} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="Profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <Ionicons size={24} name="person-outline" color={color} />
            ),
            headerShown: false,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7ED",
  },
});

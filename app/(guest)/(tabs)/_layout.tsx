import { Tabs } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
 

  return (
    <Tabs
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: "#f97316",
      tabBarInactiveTintColor: "#6b7280",
      tabBarStyle: { backgroundColor: "white", 
      borderTopColor: "#f97316" ,
      borderTopEndRadius:20,
      borderTopStartRadius:20,
    
    },
    }}
    >
       <Tabs.Screen
        name="Home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons size={28} name="home-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="Explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color }) => <Ionicons size={28} name="search" color={color} />,
        }}
      />
       <Tabs.Screen
        name="Booking"
        options={{
          title: "Booking",
          tabBarIcon: ({ color }) => <Ionicons size={28} name="book-outline" color={color} />,
        }}
      />
       <Tabs.Screen
        name="Profile"
        options={{
          title: "profile",
          tabBarIcon: ({ color }) => <Ionicons size={28} name="person-outline" color={color} />,
        }}
      />
    </Tabs>
  );
}
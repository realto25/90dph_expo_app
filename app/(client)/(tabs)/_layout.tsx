// app/(guest)/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"; 
export default function TabLayout() {
  const insets = useSafeAreaInsets(); 
  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#f97316", 
          tabBarInactiveTintColor: "#6b7280", 
          tabBarStyle: {
            ...styles.tabBar,
            paddingBottom: styles.tabBar.paddingBottom + insets.bottom,
            height: styles.tabBar.height + insets.bottom, 
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
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: "white",
    borderTopColor: "#f97316",
    borderTopEndRadius: 20,
    borderTopStartRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 5,
    height: 60, 
    paddingBottom: 5, 
    paddingTop: 5,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#007bff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});
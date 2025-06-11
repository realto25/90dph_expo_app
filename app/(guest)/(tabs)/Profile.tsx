import { View, Text ,StyleSheet, TouchableOpacity} from 'react-native'
import React from 'react'
import { useAuth, useUser } from '@clerk/clerk-expo';

const Profile = () => {
    const { user } = useUser();
    const { signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome, {user?.firstName || "User"}!</Text>
      <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
      <TouchableOpacity
              onPress={() => signOut()}
              style={{ marginRight: 15 }}
            >
              <Text style={{ color: "#007AFF" }}>Sign Out</Text>
            </TouchableOpacity>
    </View>
  )
}
export default Profile

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#f5f5f5",
    },
    welcome: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 10,
    },
    email: {
      fontSize: 16,
      color: "#666",
    },
  });


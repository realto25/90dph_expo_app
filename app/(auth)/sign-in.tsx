// app/(auth)/sign-in.tsx
import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loading, setLoading] = React.useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);
      
      const { createdSessionId, signIn, signUp, setActive } = 
        await startOAuthFlow({
          redirectUrl: Linking.createURL("/(guest)/(tabs)/Home", { scheme: "your-app-scheme" })
        });

      // If sign in was successful, set the session as active
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace("/(guest)/(tabs)/Home");
      } else {
        // Handle sign in or sign up as needed
        if (signIn || signUp) {
          Alert.alert(
            "Success",
            "Authentication successful!",
            [{ text: "OK", onPress: () => router.replace("/(guest)/(tabs)/Home") }]
          );
        }
      }
    } catch (err: any) {
      console.error("OAuth error:", JSON.stringify(err, null, 2));
      
      // Handle specific error cases
      if (err.errors) {
        const errorMessage = err.errors[0]?.message || "Authentication failed";
        Alert.alert("Error", errorMessage);
      } else {
        Alert.alert("Error", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, startOAuthFlow, setActive, router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TouchableOpacity
          style={[styles.googleButton, loading && styles.disabledButton]}
          onPress={handleGoogleSignIn}
          disabled={loading || !isLoaded}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Image
                source={{
                  uri: "https://www.google.com/favicon.ico",
                }}
                style={styles.googleIcon}
              />
              <Text style={styles.googleButtonText}>
                Continue with Google
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 40,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4285F4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 250,
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
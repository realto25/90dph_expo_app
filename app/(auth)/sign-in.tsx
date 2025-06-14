// app/(auth)/sign-in.tsx
import React, { useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  Dimensions,
} from "react-native";
import { useSignIn, useOAuth, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import LottieView from "lottie-react-native";
import * as SecureStore from "expo-secure-store";

// Assuming 'api' is an axios instance or similar for making API calls
// You might need to import it like:
// import api from '../utils/api';
// And define 'getUserByClerkId' function if it's not part of 'api'
// For example: const getUserByClerkId = async (userId, token) => api.get(`/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
// Replace these with your actual implementation
const api = {
  post: async (url: string, data: any, config?: any) => {
    console.log(`[API Mock] POST to ${url} with data:`, data);
    // Simulate API call
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500));
  },
};

// This function needs to be defined based on how your backend API is structured
// It should fetch a user by their Clerk ID and return null or an empty array if not found
const getUserByClerkId = async (userId: string, token: string | null) => {
  console.log(`[API Mock] Getting user by Clerk ID: ${userId}`);
  // Simulate API call to check if user exists
  // In a real scenario, this would make an actual network request
  return new Promise((resolve) =>
    setTimeout(() => {
      // Simulate user not found for the first time, then found on subsequent calls
      const userExists = Math.random() > 0.5; // Simulate if user exists or not
      resolve(userExists ? [{ id: "someUserId", clerkId: userId }] : []);
    }, 500)
  );
};

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { signOut } = useAuth();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loading, setLoading] = React.useState(false);

  const { isSignedIn, userId, getToken } = useAuth(); // Destructure userId and getToken from useAuth

  useEffect(() => {
    const handleUserSession = async () => {
      if (isLoaded && isSignedIn && userId) {
        console.log("[SignIn] User is loaded, signed in, and userId is available.");
        const ensureUserExists = async () => {
          try {
            const token = await getToken();
            console.log("[SignIn] Fetched token:", token ? "Exists" : "Does not exist");
            const response: any = await getUserByClerkId(userId, token);

            if (!response || (Array.isArray(response) && !response.length)) {
              console.log("[SignIn] Creating new user in backend...");
              await api.post(
                "/users",
                { clerkId: userId, role: "GUEST" },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              console.log("[SignIn] New user created successfully.");
            } else {
              console.log("[SignIn] User already exists in backend.");
            }
          } catch (err) {
            console.error("[SignIn] Error ensuring user exists:", err);
            Alert.alert("Error", "Could not verify user existence. Please try again.");
            // Optionally sign out the user if there's a critical error ensuring user existence
            // handleSignOut();
          } finally {
            router.replace("/(auth)/Role");
          }
        };
        ensureUserExists();
      } else if (isLoaded && !isSignedIn) {
        // Only check for existing session if Clerk is loaded and user is not signed in yet
        const checkExistingSession = async () => {
          try {
            const token = await SecureStore.getItemAsync("clerk-token");
            if (token) {
              console.log("[SignIn] Found existing token, attempting to restore session");
              await setActive({ session: token });
              // The main useEffect will handle navigation after successful session restoration
            }
          } catch (err) {
            console.error("[SignIn] Error checking existing session:", err);
          }
        };
        checkExistingSession();
      }
    };
    handleUserSession();
  }, [isLoaded, isSignedIn, userId, getToken, router, setActive]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!isLoaded) {
      console.log("[SignIn] Clerk not loaded yet.");
      return;
    }

    try {
      setLoading(true);
      const redirectUrl = Linking.createURL("oauth-callback", {
        scheme: "x90dph",
      });
      console.log("[SignIn] Redirect URL for OAuth:", redirectUrl);

      const { createdSessionId, setActive: clerkSetActive } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId) {
        console.log("[SignIn] OAuth successful, session created:", createdSessionId);
        await SecureStore.setItemAsync("clerk-token", createdSessionId);
        await clerkSetActive!({ session: createdSessionId });
        // The main useEffect will handle navigation after setActive completes and updates isSignedIn/userId
      } else {
        console.log("[SignIn] OAuth flow completed but no session created.");
      }
    } catch (err) {
      console.error("[SignIn] OAuth error:", err);
      Alert.alert("Sign-In Error", "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, startOAuthFlow, setActive]);

  // Handle sign out (kept for completeness, though not directly used in the initial sign-in flow)
  const handleSignOut = async () => {
    try {
      console.log("[SignIn] Attempting to sign out.");
      await SecureStore.deleteItemAsync("clerk-token");
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error("[SignIn] Error signing out:", err);
      Alert.alert("Sign-Out Error", "Could not sign out. Please try again.");
    }
  };

  if (!isLoaded || (isSignedIn && !userId)) {
    // Show loading indicator until Clerk is fully loaded and user data is available
    return (
      <View style={styles.fullScreenLoading}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Getting things ready...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LottieView
          source={require("@/assets/login-flow.json")}
          autoPlay
          loop
          style={styles.lottieAnimation}
        />

        <View style={styles.contentCard}>
          <Text style={styles.title}>Welcome to{"\n"}90 Degree Pride Homes</Text>
          <Text style={styles.subtitle}>Find your dream property with us</Text>

          <TouchableOpacity
            style={[
              styles.googleButton,
              loading && styles.disabledButton,
              !isLoaded && styles.disabledButton,
            ]}
            onPress={handleGoogleSignIn}
            disabled={loading || !isLoaded}
          >
            {loading ? (
              <ActivityIndicator color="#4285F4" size="small" />
            ) : (
              <View style={styles.googleButtonContent}>
                <View style={styles.googleIconContainer}>
                  <Image
                    source={{
                      uri: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1000px-Google_%22G%22_logo.svg.png",
                    }}
                    style={styles.googleIcon}
                  />
                </View>
                <Text style={styles.googleButtonText}>Sign in with Google</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF0E6",
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 40 : 0,
    justifyContent: "center",
  },
  lottieAnimation: {
    width: width * 0.9,
    height: height * 0.3,
    marginBottom: 16,
  },
  contentCard: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    shadowColor: "#E2E8F0",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2D3748",
    marginBottom: 8,
    textAlign: "center",
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: "#718096",
    marginBottom: 32,
    textAlign: "center",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  googleButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconContainer: {
    backgroundColor: "#FFFFFF",
    padding: 2,
    borderRadius: 2,
    marginRight: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    color: "#5F6368",
    fontSize: 16,
    fontWeight: "500",
  },
  disabledButton: {
    opacity: 0.7,
  },
  fullScreenLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#4A5568",
  },
});
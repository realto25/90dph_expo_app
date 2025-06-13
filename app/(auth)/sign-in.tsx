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

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded, signOut } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loading, setLoading] = React.useState(false);

  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/(guest)/(tabs)/Home");
    }
  }, [isLoaded, isSignedIn, router]);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = await SecureStore.getItemAsync("clerk-token");
        if (token && isLoaded && !isSignedIn) {
          console.log("[SignIn] Found existing token, attempting to restore session");
          await setActive({ session: token });
        }
      } catch (err) {
        console.error("[SignIn] Error checking existing session:", err);
      }
    };
    checkExistingSession();
  }, [isLoaded, isSignedIn]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);
      const redirectUrl = Linking.createURL("oauth-callback", {
        scheme: "x90dph"
      });

      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl
      });

      if (createdSessionId) {
        // Save the session token
        await SecureStore.setItemAsync("clerk-token", createdSessionId);
        await setActive!({ session: createdSessionId });
        router.replace("/(guest)/(tabs)/Home");
      }
    } catch (err) {
      console.error("[SignIn] OAuth error:", err);
      Alert.alert("Sign-In Error", "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [isLoaded, startOAuthFlow, setActive, router]);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await SecureStore.deleteItemAsync("clerk-token");
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (err) {
      console.error("[SignIn] Error signing out:", err);
    }
  };

  if (!isLoaded || isSignedIn) {
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
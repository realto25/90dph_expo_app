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

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [loading, setLoading] = React.useState(false);

  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/(guest)/(tabs)/Home");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleGoogleSignIn = useCallback(async () => {
    if (!isLoaded) {
      console.log('[SignIn] Clerk not loaded yet');
      return;
    }

    try {
      setLoading(true);
      console.log('[SignIn] Starting OAuth flow...');

      const redirectUrl = Linking.createURL("oauth-native-callback", {
        scheme: "90-dph",
      });

      console.log('[SignIn] Using redirect URL:', redirectUrl);

      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl,
      });

      console.log('[SignIn] OAuth flow result:', { createdSessionId, signIn, signUp });

      if (createdSessionId) {
        console.log('[SignIn] Setting active session...');
        await setActive!({ session: createdSessionId });
        console.log('[SignIn] Redirecting to home...');
        router.replace("/(guest)/(tabs)/Home");
      } else {
        if (signIn || signUp) {
          console.log('[SignIn] Sign in/up successful, showing alert...');
          Alert.alert(
            "Welcome!",
            "You have successfully signed in.",
            [{ text: "Continue", onPress: () => {
              console.log('[SignIn] Alert continue pressed, redirecting...');
              router.replace("/(guest)/(tabs)/Home");
            }}]
          );
        }
      }
    } catch (err: any) {
      console.error("[SignIn] OAuth error:", JSON.stringify(err, null, 2));

      if (err.errors) {
        const errorMessage =
          err.errors[0]?.message || "Authentication failed. Please try again.";
        Alert.alert("Sign-In Error", errorMessage);
      } else {
        Alert.alert("Oops!", "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, startOAuthFlow, setActive, router]);

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
    backgroundColor: "#F8F9FA",
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
    fontSize: 28,
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
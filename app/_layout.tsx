// app/_layout.tsx - Updated with proper error handling
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-expo";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import 'global.css'

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

const tokenCache = {
  async getToken(key: string) {
    try {
      const token = await SecureStore.getItemAsync(key);
      console.log("[TokenCache] Retrieved token:", token ? "exists" : "null");
      return token;
    } catch (err) {
      console.error("[TokenCache] Error getting token:", err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
      console.log("[TokenCache] Token saved successfully");
    } catch (err) {
      console.error("[TokenCache] Error saving token:", err);
    }
  },
  async deleteToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log("[TokenCache] Token deleted successfully");
    } catch (err) {
      console.error("[TokenCache] Error deleting token:", err);
    }
  }
};

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) {
      console.log('[InitialLayout] Auth not loaded yet');
      return;
    }

    console.log('[InitialLayout] Auth state:', { isLoaded, isSignedIn, segments });

    const inAuthGroup = segments[0] === "(auth)";
    console.log('[InitialLayout] Navigation state:', { inAuthGroup, currentSegment: segments[0] });

    if (isSignedIn && inAuthGroup) {
      console.log('[InitialLayout] User is signed in, redirecting to guest home...');
      router.replace("/(guest)/(tabs)/Home");
    } else if (!isSignedIn && !inAuthGroup) {
      console.log('[InitialLayout] User is not signed in, redirecting to sign in...');
      router.replace("/(auth)/sign-in");
    }
  }, [isSignedIn, segments, isLoaded]);

  return <Slot />;
}

export default function RootLayout() {
  const [isLoaded, error] = useFonts({
    "manrope": require("../assets/fonts/Manrope-Regular.ttf"),
    "manrope-medium": require("../assets/fonts/Manrope-Medium.ttf"),
    "manrope-bold": require("../assets/fonts/Manrope-Bold.ttf"),
    Space: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <InitialLayout />
    </ClerkProvider>
  );
}
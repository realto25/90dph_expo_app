// app/_layout.tsx - Updated with proper error handling
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import 'global.css';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env'
  );
}

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

function InitialLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inGuestGroup = segments[0] === '(guest)';

    if (isSignedIn && inAuthGroup) {
      // Add a small delay to ensure auth state is properly updated
      setTimeout(() => {
        router.replace('/(guest)/(tabs)/Home');
      }, 500);
    } else if (!isSignedIn && !inAuthGroup) {
      // Add a small delay to ensure auth state is properly updated
      setTimeout(() => {
        router.replace('/(auth)/sign-in');
      }, 500);
    }
  }, [isSignedIn, segments, isLoaded]);

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [isLoaded, error] = useFonts({
    manrope: require('../assets/fonts/Manrope-Regular.ttf'),
    'manrope-medium': require('../assets/fonts/Manrope-Medium.ttf'),
    'manrope-bold': require('../assets/fonts/Manrope-Bold.ttf'),
    Space: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <InitialLayout />
    </ClerkProvider>
  );
}

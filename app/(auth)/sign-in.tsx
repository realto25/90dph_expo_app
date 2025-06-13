import { useOAuth, useSignIn } from '@clerk/clerk-expo';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { signIn, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [loading, setLoading] = useState(false);

  const redirectUrl = Linking.createURL('callback');

  const handleGoogleSignIn = useCallback(async () => {
    if (!isLoaded) return;

    try {
      setLoading(true);

      const { createdSessionId, setActive } = await startOAuthFlow({ redirectUrl });

      if (createdSessionId) {
        await setActive?.({ session: createdSessionId });
        router.replace('/(guest)/(tabs)/Home');
      } else {
        Alert.alert('Login failed', 'No session returned.');
      }
    } catch (err: any) {
      console.error('OAuth Error:', err);

      if (err?.errors?.[0]?.message) {
        Alert.alert('Error', err.errors[0].message);
      } else {
        Alert.alert('Error', 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, startOAuthFlow, redirectUrl]);

  return (
    <View style={styles.container}>
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
              source={{ uri: 'https://www.google.com/favicon.ico' }}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

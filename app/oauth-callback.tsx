import { useOAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import * as WebBrowser from "expo-web-browser";

export default function OAuthCallback() {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const router = useRouter();

  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
    router.replace("/(guest)/(tabs)/Home");
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#f97316" />
    </View>
  );
} 
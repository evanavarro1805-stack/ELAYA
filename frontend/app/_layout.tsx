import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { LogBox, View, ActivityIndicator } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

import { queryClient } from "@/src/query-client";
import { AuthProvider, useAuth } from "@/src/auth";
import { CartProvider } from "@/src/cart";
import { colors } from "@/src/theme";

LogBox.ignoreAllLogs(true);

function AuthGate() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const seg = segments[0];
    const inCustomer = seg === "(customer)";
    const inOwner = seg === "(owner)";
    const inAdmin = seg === "(admin)";
    const inAuth = seg === "(auth)";
    const inIndex = seg === undefined || seg === "index";

    if (!user) {
      if (inCustomer || inOwner || inAdmin) router.replace("/(auth)/sign-in");
      return;
    }
    // Enforce role-based zone
    if (user.role === "customer" && (inOwner || inAdmin)) router.replace("/(customer)/home");
    else if (user.role === "flower_owner" && (inCustomer || inAdmin)) router.replace("/(owner)/dashboard");
    else if (user.role === "admin" && (inCustomer || inOwner)) router.replace("/(admin)/overview");
    else if (inAuth || inIndex) {
      if (user.role === "customer") router.replace("/(customer)/home");
      else if (user.role === "flower_owner") router.replace("/(owner)/dashboard");
      else if (user.role === "admin") router.replace("/(admin)/overview");
    }
  }, [user, loading, segments]);

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={colors.brandPrimary} size="large" />
    </View>
  );
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <KeyboardProvider>
            <AuthProvider>
              <CartProvider>
                <StatusBar style="dark" />
                <AuthGate />
              </CartProvider>
            </AuthProvider>
          </KeyboardProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

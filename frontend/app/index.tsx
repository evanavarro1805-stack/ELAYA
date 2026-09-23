import { View, Text, StyleSheet, Pressable, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius } from "@/src/theme";

const { width } = Dimensions.get("window");

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container} testID="welcome-screen">
      <Image
        source={{ uri: "https://images.unsplash.com/photo-1523693916903-027d144a2b7d?w=1200" }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
      />
      <LinearGradient
        colors={["rgba(255,117,140,0.15)", "rgba(43,30,34,0.4)", "rgba(43,30,34,0.92)"]}
        style={StyleSheet.absoluteFillObject}
        locations={[0, 0.45, 1]}
      />
      <View style={[styles.top, { paddingTop: insets.top + spacing.xl }]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Biñan, Laguna</Text>
        </View>
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.brand}>Elaya</Text>
        <Text style={styles.tagline}>Bloom-to-door.{"\n"}Handcrafted bouquets, delivered fresh.</Text>

        <Pressable
          testID="get-started-btn"
          onPress={() => router.push("/(auth)/sign-in")}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.88 }]}
        >
          <LinearGradient
            colors={["#FF7EB3", "#FF758C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaBg}
          >
            <Text style={styles.ctaText}>Get Started</Text>
          </LinearGradient>
        </Pressable>

        <Pressable testID="have-account-btn" onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.link}>Already have an account? <Text style={{ fontWeight: "700" }}>Sign In</Text></Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#2B1E22" },
  top: { paddingHorizontal: spacing.lg, alignItems: "flex-start" },
  badge: { backgroundColor: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.4)", borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: radius.pill },
  badgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },
  bottom: { marginTop: "auto", paddingHorizontal: spacing.xl, gap: spacing.lg },
  brand: { fontSize: 64, fontWeight: "300", color: "#FFFFFF", letterSpacing: 2, fontStyle: "italic" },
  tagline: { color: "rgba(255,255,255,0.9)", fontSize: 17, lineHeight: 24, marginBottom: spacing.md },
  cta: { borderRadius: radius.pill, overflow: "hidden" },
  ctaBg: { paddingVertical: 18, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700", letterSpacing: 0.5 },
  link: { color: "rgba(255,255,255,0.85)", textAlign: "center", fontSize: 14, marginTop: spacing.sm },
});

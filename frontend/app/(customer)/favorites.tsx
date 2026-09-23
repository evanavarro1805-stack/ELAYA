import { View, Text, StyleSheet, Pressable, FlatList, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";

const { width } = Dimensions.get("window");
const CARD = (width - spacing.lg * 2 - spacing.md) / 2;

export default function Favorites() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: favs = [] } = useQuery({ queryKey: ["favs"], queryFn: () => api("/favorites") });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>←</Text></Pressable>
        <Text style={styles.title}>Favorites</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={favs}
        keyExtractor={(i: any) => i.id}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: colors.muted, marginTop: 40 }}>No favorites yet ❤️</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(customer)/product/${item.id}` as any)} style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.img} contentFit="cover" />
            <View style={{ padding: spacing.sm }}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.price}>₱{item.price.toLocaleString()}</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  back: { fontSize: 22, color: colors.onSurface },
  title: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  card: { width: CARD, backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border },
  img: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceSecondary },
  name: { fontSize: 14, fontWeight: "600", color: colors.onSurface },
  price: { fontSize: 14, fontWeight: "700", color: colors.brandPrimary, marginTop: 2 },
});

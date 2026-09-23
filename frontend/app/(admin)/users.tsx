import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";

const ROLES = ["all", "customer", "flower_owner", "admin"] as const;
const ROLE_LABEL: Record<string, string> = { customer: "Customer", flower_owner: "Shop Owner", admin: "Admin" };

export default function AdminUsers() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [f, setF] = useState<(typeof ROLES)[number]>("all");
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: () => api("/admin/users") });
  const mut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api(`/admin/users/${id}/status?new_status=${status}`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
  const filtered = f === "all" ? users : users.filter((u: any) => u.role === f);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.title}>User Management</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {ROLES.map((r) => (
            <Pressable key={r} testID={`chip-${r}`} onPress={() => setF(r)} style={[styles.chip, f === r && styles.chipActive]}>
              <Text style={[styles.chipText, f === r && { color: colors.onBrandPrimary }]}>{r === "all" ? "All" : ROLE_LABEL[r]}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, paddingBottom: 100 }}>
        {filtered.map((u: any) => (
          <View key={u.id} style={styles.card}>
            <View style={styles.avatar}><Text style={{ fontSize: 20 }}>{u.role === "admin" ? "👑" : u.role === "flower_owner" ? "🏪" : "👤"}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{u.name}</Text>
              <Text style={styles.email}>{u.email}</Text>
              <View style={styles.metaRow}>
                <View style={styles.rolePill}><Text style={styles.rolePillText}>{ROLE_LABEL[u.role]}</Text></View>
                <View style={[styles.statusPill, { backgroundColor: u.status === "active" ? colors.success + "20" : colors.error + "20" }]}>
                  <Text style={[styles.statusText, { color: u.status === "active" ? colors.success : colors.error }]}>{u.status}</Text>
                </View>
              </View>
            </View>
            {u.role !== "admin" && (
              <Pressable
                testID={`toggle-${u.id}`}
                onPress={() => mut.mutate({ id: u.id, status: u.status === "active" ? "disabled" : "active" })}
                style={[styles.actionBtn, { backgroundColor: u.status === "active" ? colors.error : colors.success }]}
              >
                <Text style={styles.actionText}>{u.status === "active" ? "Disable" : "Enable"}</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  title: { fontSize: 24, fontWeight: "300", fontStyle: "italic", color: colors.onSurface },
  chipRow: { paddingVertical: spacing.md, gap: spacing.sm },
  chip: { paddingHorizontal: spacing.md, height: 36, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, flexShrink: 0 },
  chipActive: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipText: { fontSize: 13, color: colors.onSurfaceSecondary, fontWeight: "600" },
  card: { flexDirection: "row", alignItems: "center", padding: spacing.md, backgroundColor: colors.surfaceSecondary, borderRadius: radius.md, gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandTertiary, alignItems: "center", justifyContent: "center" },
  name: { fontWeight: "700", color: colors.onSurface, fontSize: 14 },
  email: { color: colors.muted, fontSize: 12, marginTop: 2 },
  metaRow: { flexDirection: "row", gap: spacing.xs, marginTop: 4 },
  rolePill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.brandTertiary },
  rolePillText: { color: colors.onBrandTertiary, fontSize: 10, fontWeight: "700" },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill },
  statusText: { fontSize: 10, fontWeight: "700" },
  actionBtn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill },
  actionText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
});

import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Switch } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, radius } from "@/src/theme";
import { api } from "@/src/api";

type Field = { key: string; label: string; placeholder?: string; type?: "text" | "number" | "multiline" | "csv" | "bool"; required?: boolean };

export function ProductForm({ title, endpoint, fields, defaultImage }: {
  title: string; endpoint: string; fields: Field[]; defaultImage: string;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, any>>({ image: defaultImage, availability: true });
  const [err, setErr] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: (body: any) => api(endpoint, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      router.back();
    },
    onError: (e: any) => setErr(e.message),
  });

  const submit = () => {
    const body: any = {};
    for (const f of fields) {
      const v = values[f.key];
      if (f.required && (v === undefined || v === "")) { setErr(`${f.label} is required`); return; }
      if (f.type === "number") body[f.key] = Number(v || 0);
      else if (f.type === "csv") body[f.key] = v ? String(v).split(",").map((s) => s.trim()).filter(Boolean) : [];
      else if (f.type === "bool") body[f.key] = !!v;
      else body[f.key] = v ?? "";
    }
    body.image = values.image || defaultImage;
    body.availability = values.availability ?? true;
    setErr(null);
    mut.mutate(body);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>←</Text></Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 200 }}>
        <View>
          <Text style={styles.label}>Image URL</Text>
          <TextInput testID="image-input" value={values.image || ""} onChangeText={(v) => setValues({ ...values, image: v })} placeholder="https://..." placeholderTextColor={colors.muted} style={styles.input} autoCapitalize="none" />
        </View>
        {fields.map((f) => (
          <View key={f.key}>
            <Text style={styles.label}>{f.label}{f.required ? " *" : ""}</Text>
            {f.type === "bool" ? (
              <View style={styles.rowSwitch}>
                <Text style={{ color: colors.onSurface }}>{values[f.key] ? "Available" : "Unavailable"}</Text>
                <Switch testID={`sw-${f.key}`} value={!!values[f.key]} onValueChange={(v) => setValues({ ...values, [f.key]: v })} trackColor={{ true: colors.brandPrimary }} />
              </View>
            ) : (
              <TextInput
                testID={`input-${f.key}`}
                value={values[f.key] !== undefined ? String(values[f.key]) : ""}
                onChangeText={(v) => setValues({ ...values, [f.key]: v })}
                placeholder={f.placeholder}
                placeholderTextColor={colors.muted}
                keyboardType={f.type === "number" ? "numeric" : "default"}
                multiline={f.type === "multiline"}
                style={[styles.input, f.type === "multiline" && { minHeight: 80 }]}
                autoCapitalize={f.type === "number" ? "none" : "sentences"}
              />
            )}
          </View>
        ))}
        {err ? <Text style={{ color: colors.error }}>{err}</Text> : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable testID="save-btn" onPress={submit} disabled={mut.isPending} style={styles.cta}>
          <LinearGradient colors={["#FF7EB3", "#FF758C"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBg}>
            {mut.isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaText}>Save Product</Text>}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  back: { fontSize: 22, color: colors.onSurface },
  title: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  label: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 14, color: colors.onSurface },
  rowSwitch: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  footer: { position: "absolute", left: 0, right: 0, bottom: 64, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.divider },
  cta: { borderRadius: radius.pill, overflow: "hidden" },
  ctaBg: { paddingVertical: 14, alignItems: "center" },
  ctaText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
});

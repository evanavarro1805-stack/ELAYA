import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FFFFFF",
  onSurface: "#2B1E22",
  surfaceSecondary: "#FFF5F7",
  onSurfaceSecondary: "#3D2A30",
  surfaceTertiary: "#FDE8EE",
  onSurfaceTertiary: "#4A353B",
  surfaceInverse: "#2B1E22",
  onSurfaceInverse: "#FFFFFF",
  muted: "#8A7178",

  brand: "#FF758C",
  onBrand: "#FFFFFF",
  brandPrimary: "#FF758C",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF7EB3",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FFDDE6",
  onBrandTertiary: "#B02A5B",

  success: "#4C7355",
  onSuccess: "#FFFFFF",
  warning: "#B87B41",
  onWarning: "#FFFFFF",
  error: "#C4324B",
  onError: "#FFFFFF",
  info: "#607487",
  onInfo: "#FFFFFF",

  border: "#F5D9E1",
  borderStrong: "#F0B4C5",
  divider: "#FCE7EE",
};

export type ThemeColors = typeof light;
export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}
setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

export const colors = light;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };
export const radius = { sm: 6, md: 12, lg: 20, xl: 28, pill: 999 };

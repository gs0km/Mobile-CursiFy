export const theme = {
  colors: {
    primary: "#4F46E5",
    primaryForeground: "#FFFFFF",
    secondary: "#10B981",
    background: "#FFFFFF",
    surface: "#F9FAFB",
    surfaceHighlight: "#F3F4F6",
    textMain: "#111827",
    textMuted: "#6B7280",
    border: "#E5E7EB",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 999,
  },
  typography: {
    h1: 30,
    h2: 22,
    body: 16,
    small: 13,
  },
};

export type Theme = typeof theme;
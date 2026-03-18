import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";
import { AppTab } from "../types";

interface TabItem {
  key: AppTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

export function BottomTabBar({ tabs, activeTab, onChange }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            testID={`tab-${tab.key}`}
            accessibilityRole="button"
            accessibilityLabel={`Abrir aba ${tab.label}`}
            onPress={() => onChange(tab.key)}
            style={({ pressed }) => [styles.item, active && styles.activeItem, pressed && styles.pressed]}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={active ? theme.colors.primary : theme.colors.textMuted}
            />
            <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.s,
    paddingBottom: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  item: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.s,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  activeItem: {
    backgroundColor: "#EEF2FF",
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  label: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  activeLabel: {
    color: theme.colors.primary,
  },
});
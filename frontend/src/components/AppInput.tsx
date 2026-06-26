import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

interface AppInputProps extends TextInputProps {
  label: string;
  prefix?: string;
}

export function AppInput({ label, prefix, secureTextEntry, ...props }: AppInputProps) {
  const { theme } = useTheme();
  const [visible, setVisible] = useState(false);
  const isPassword = secureTextEntry;
  const inputStyle = [
    styles.input,
    {
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      fontSize: theme.typography.body,
      color: theme.colors.textMain,
    },
    props.style,
  ];
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textMuted, fontSize: theme.typography.small }]}>{label}</Text>
      {prefix ? (
        <View style={[styles.input, { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, flexDirection: "row", alignItems: "center", paddingHorizontal: 0 }]}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.body, paddingLeft: 16 }}>{prefix}</Text>
          <TextInput
            {...props}
            style={[{ flex: 1, minHeight: 48, fontSize: theme.typography.body, color: theme.colors.textMain, paddingHorizontal: 4 }, props.style]}
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>
      ) : isPassword ? (
        <View style={[styles.input, { borderColor: theme.colors.border, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, flexDirection: "row", alignItems: "center", paddingHorizontal: 0 }]}>
          <TextInput
            {...props}
            secureTextEntry={!visible}
            textContentType="oneTimeCode"
            importantForAutofill="no"
            style={[{ flex: 1, minHeight: 48, fontSize: theme.typography.body, color: theme.colors.textMain, paddingHorizontal: 16 }, props.style]}
            placeholderTextColor={theme.colors.textMuted}
          />
          <Pressable onPress={() => setVisible((v) => !v)} style={{ paddingHorizontal: 12 }}>
            <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      ) : (
        <TextInput
          {...props}
          testID={props.testID}
          style={inputStyle}
          placeholderTextColor={theme.colors.textMuted}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  label: { marginBottom: 8, fontWeight: "500" },
  input: { minHeight: 48, borderWidth: 1, paddingHorizontal: 16 },
});

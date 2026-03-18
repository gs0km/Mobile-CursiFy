import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { theme } from "../constants/theme";

interface AppInputProps extends TextInputProps {
  label: string;
}

export function AppInput({ label, ...props }: AppInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        testID={props.testID}
        style={[styles.input, props.style]}
        placeholderTextColor={theme.colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.spacing.m,
  },
  label: {
    fontSize: theme.typography.small,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.s,
    fontWeight: "500",
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.m,
    fontSize: theme.typography.body,
    color: theme.colors.textMain,
  },
});
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { theme } from "../constants/theme";
import { UserRole } from "../types";
import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";

interface AuthScreenProps {
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  registerName: string;
  setRegisterName: (value: string) => void;
  registerEmail: string;
  setRegisterEmail: (value: string) => void;
  registerPassword: string;
  setRegisterPassword: (value: string) => void;
  registerRole: UserRole;
  setRegisterRole: (value: UserRole) => void;
  registerBio: string;
  setRegisterBio: (value: string) => void;
  onLogin: () => void;
  onRegister: () => void;
  loading: boolean;
  feedback: string;
}

export function AuthScreen(props: AuthScreenProps) {
  const {
    mode,
    setMode,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    registerName,
    setRegisterName,
    registerEmail,
    setRegisterEmail,
    registerPassword,
    setRegisterPassword,
    registerRole,
    setRegisterRole,
    registerBio,
    setRegisterBio,
    onLogin,
    onRegister,
    loading,
    feedback,
  } = props;

  const roleOptions: UserRole[] = ["student", "teacher", "admin"];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBlock}>
          <Text style={styles.title}>CursiFy Mobile</Text>
          <Text style={styles.subtitle}>Aprenda, ensine e administre em um só app.</Text>
        </View>

        <View style={styles.modeSwitch}>
          <AppButton
            label="Entrar"
            variant={mode === "login" ? "primary" : "secondary"}
            onPress={() => setMode("login")}
            style={styles.halfButton}
            testID="auth-mode-login"
          />
          <AppButton
            label="Criar conta"
            variant={mode === "register" ? "primary" : "secondary"}
            onPress={() => setMode("register")}
            style={styles.halfButton}
            testID="auth-mode-register"
          />
        </View>

        {mode === "login" ? (
          <View style={styles.card}>
            <AppInput
              label="E-mail"
              placeholder="voce@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={loginEmail}
              onChangeText={setLoginEmail}
              testID="login-email"
            />
            <AppInput
              label="Senha"
              placeholder="******"
              secureTextEntry
              value={loginPassword}
              onChangeText={setLoginPassword}
              testID="login-password"
            />
            <AppButton label="Acessar" onPress={onLogin} loading={loading} testID="login-submit" />
          </View>
        ) : (
          <View style={styles.card}>
            <AppInput
              label="Username"
              placeholder="Seu nome no app"
              value={registerName}
              onChangeText={setRegisterName}
              testID="register-name"
            />
            <AppInput
              label="E-mail"
              placeholder="voce@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={registerEmail}
              onChangeText={setRegisterEmail}
              testID="register-email"
            />
            <AppInput
              label="Senha"
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              value={registerPassword}
              onChangeText={setRegisterPassword}
              testID="register-password"
            />

            <Text style={styles.roleLabel}>Perfil</Text>
            <View style={styles.rolesRow}>
              {roleOptions.map((role) => (
                <AppButton
                  key={role}
                  label={role === "student" ? "Aluno" : role === "teacher" ? "Professor" : "Admin"}
                  onPress={() => setRegisterRole(role)}
                  variant={registerRole === role ? "primary" : "outline"}
                  style={styles.roleButton}
                  testID={`register-role-${role}`}
                />
              ))}
            </View>

            <AppInput
              label="Bio (obrigatória para professor/admin)"
              placeholder="Fale um pouco sobre você"
              value={registerBio}
              onChangeText={setRegisterBio}
              testID="register-bio"
            />
            <AppButton
              label="Cadastrar"
              onPress={onRegister}
              loading={loading}
              testID="register-submit"
            />
            <Text style={styles.note}>Imagem de perfil base64 padrão aplicada automaticamente.</Text>
          </View>
        )}

        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.l,
  },
  headerBlock: {
    marginBottom: theme.spacing.l,
    gap: theme.spacing.s,
  },
  title: {
    fontSize: theme.typography.h1,
    fontWeight: "800",
    color: theme.colors.textMain,
  },
  subtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textMuted,
    lineHeight: 24,
  },
  modeSwitch: {
    flexDirection: "row",
    gap: theme.spacing.s,
    marginBottom: theme.spacing.l,
  },
  halfButton: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
  },
  roleLabel: {
    marginBottom: theme.spacing.s,
    fontWeight: "600",
    color: theme.colors.textMain,
    fontSize: theme.typography.small,
  },
  rolesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  roleButton: {
    minWidth: 90,
  },
  feedback: {
    marginTop: theme.spacing.m,
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    textAlign: "left",
  },
  note: {
    marginTop: theme.spacing.s,
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});
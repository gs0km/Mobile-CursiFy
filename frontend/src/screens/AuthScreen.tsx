import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { theme } from "../constants/theme";
import authService from "../services/authService";
import { UserRole } from "../types";
import { defaultAvatarBase64 } from "../constants/images";

interface AuthScreenProps {
  mode: "login" | "register";
  setMode: (mode: "login" | "register") => void;
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  onLogin: () => void;
  onLoginWithCredentials: (email: string, password: string) => void;
  loading: boolean;
  feedback: string;
}

function validatePassword(password: string): boolean {
  return /[a-zA-Z]/.test(password) && /\d/.test(password) && password.length >= 8 && password.length <= 20;
}

export function AuthScreen(props: AuthScreenProps) {
  const {
    mode, setMode,
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    onLogin, onLoginWithCredentials, loading, feedback,
  } = props;

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("student");
  const [registerBio, setRegisterBio] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [loginEmailValue, setLoginEmailValue] = useState(loginEmail);
  const [loginPasswordValue, setLoginPasswordValue] = useState(loginPassword);

  const roleOptions: UserRole[] = ["student", "teacher", "admin"];

  const handleRegister = async () => {
    setRegisterError("");

    if (!validatePassword(registerPassword)) {
      setRegisterError("A senha deve ter entre 8 e 20 caracteres, incluindo letras e números.");
      return;
    }

    if (registerRole !== "student" && registerBio.trim().length < 3) {
      setRegisterError("Professores e admins precisam preencher a bio.");
      return;
    }

    const emailToLogin = registerEmail.trim();
    const passwordToLogin = registerPassword;

    setRegisterLoading(true);
    try {
      await authService.create({
        username: registerName.trim(),
        email: emailToLogin,
        password: passwordToLogin,
        role: registerRole,
        bio: registerBio.trim(),
        profile_image_base64: defaultAvatarBase64,
      });

      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterBio("");
      setRegisterRole("student");

      onLoginWithCredentials(emailToLogin, passwordToLogin);
    } catch (error: unknown) {
      setRegisterError(error instanceof Error ? error.message : "Erro ao cadastrar.");
    } finally {
      setRegisterLoading(false);
    }
  };

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
              value={loginEmailValue}
              onChangeText={(value) => {
                setLoginEmailValue(value);
                setLoginEmail(value);
              }}
              testID="login-email"
            />
            <AppInput
              label="Senha"
              placeholder="******"
              secureTextEntry
              value={loginPasswordValue}
              onChangeText={(value) => {
                setLoginPasswordValue(value);
                setLoginPassword(value);
              }}
              testID="login-password"
            />
            <AppButton
              label="Acessar"
              onPress={() => onLoginWithCredentials(loginEmailValue, loginPasswordValue)}
              loading={loading}
              testID="login-submit"
            />
          </View>
        ) : (
          <View style={styles.card}>
            <AppInput
              label="Nome"
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
              placeholder="8 a 20 caracteres, letras e números"
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

            {registerError ? <Text style={styles.errorText}>{registerError}</Text> : null}

            <AppButton
              label="Cadastrar"
              onPress={handleRegister}
              loading={registerLoading}
              testID="register-submit"
            />
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
  headerBlock: { marginBottom: theme.spacing.l, gap: theme.spacing.s },
  title: { fontSize: theme.typography.h1, fontWeight: "800", color: theme.colors.textMain },
  subtitle: { fontSize: theme.typography.body, color: theme.colors.textMuted, lineHeight: 24 },
  modeSwitch: { flexDirection: "row", gap: theme.spacing.s, marginBottom: theme.spacing.l },
  halfButton: { flex: 1 },
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
  roleButton: { minWidth: 90 },
  errorText: {
    color: "red",
    fontSize: theme.typography.small,
    marginBottom: theme.spacing.s,
  },
  feedback: {
    marginTop: theme.spacing.m,
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    textAlign: "left",
  },
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
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
  loading: boolean;
  feedback: string;
}

/** Valida senha: 8-20 caracteres, com letras e números */
function validatePassword(password: string): boolean {
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const validLength = password.length >= 8 && password.length <= 20;
  return hasLetters && hasNumbers && validLength;
}

export function AuthScreen(props: AuthScreenProps) {
  const {
    mode, setMode,
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    onLogin, loading, feedback,
  } = props;

  // ─── Estado local do formulário de registro ───────────────────────────────
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("student");
  const [registerBio, setRegisterBio] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const roleOptions: UserRole[] = ["student", "teacher", "admin"];

  // ─── Submissão do cadastro ────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!validatePassword(registerPassword)) {
      Alert.alert("Senha inválida", "A senha deve ter entre 8 e 20 caracteres, incluindo letras e números.");
      return;
    }

    if (registerRole !== "student" && registerBio.trim().length < 3) {
      Alert.alert("Bio obrigatória", "Professores e admins precisam preencher a bio.");
      return;
    }

    setRegisterLoading(true);
    try {
      const novoUsuario = await authService.create({
        username: registerName.trim(),
        email: registerEmail.trim(),
        password: registerPassword,
        role: registerRole,
        bio: registerBio.trim(),
        profile_image_base64: defaultAvatarBase64,
      });

      // Salva informações básicas (equivalente ao localStorage do web)
      await AsyncStorage.multiSet([
        ["userId", novoUsuario.user_id],
        ["userName", novoUsuario.username],
        ["userEmail", novoUsuario.email],
        ["nivelAcesso", novoUsuario.role],
      ]);

      Alert.alert("Cadastro realizado!", "Agora faça login com suas credenciais.");
      setMode("login");

      // Limpa formulário
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterBio("");
      setRegisterRole("student");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro ao cadastrar.";
      Alert.alert("Erro ao cadastrar", msg);
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
  feedback: {
    marginTop: theme.spacing.m,
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    textAlign: "left",
  },
});

import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAvoidingView, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppButton } from "../components/AppButton";
import { AppInput } from "../components/AppInput";
import { useTheme } from "../contexts/ThemeContext";
import authService from "../services/authService";
import { UserRole } from "../types";

const cursifyLogo = require("../../assets/images/logopreta.jpg");

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

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function AuthScreen(props: AuthScreenProps) {
  const { theme } = useTheme();
  const {
    mode, setMode,
    loginEmail, setLoginEmail,
    loginPassword, setLoginPassword,
    onLoginWithCredentials, loading, feedback,
  } = props;

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerCpf, setRegisterCpf] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("student");
  const [registerBio, setRegisterBio] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [loginEmailValue, setLoginEmailValue] = useState(loginEmail);
  const [loginPasswordValue, setLoginPasswordValue] = useState(loginPassword);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirm, setForgotConfirm] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [legalVisible, setLegalVisible] = useState<"terms" | "privacy" | null>(null);

  const handleForgotPassword = async () => {
    setForgotError(""); setForgotSuccess("");
    if (!forgotEmail.trim()) { setForgotError("Informe o e-mail."); return; }
    if (!validatePassword(forgotNewPassword)) { setForgotError("A senha deve ter entre 8 e 20 caracteres, incluindo letras e números."); return; }
    if (forgotNewPassword !== forgotConfirm) { setForgotError("As senhas não coincidem."); return; }
    setForgotLoading(true);
    try {
      await authService.resetPassword(forgotEmail.trim(), forgotNewPassword);
      setForgotSuccess("Senha redefinida com sucesso! Faça login.");
      setForgotEmail(""); setForgotNewPassword(""); setForgotConfirm("");
      setTimeout(() => { setForgotVisible(false); setForgotSuccess(""); }, 2000);
    } catch (e: unknown) {
      setForgotError(e instanceof Error ? e.message : "Erro ao redefinir senha.");
    } finally {
      setForgotLoading(false);
    }
  };

  useEffect(() => {
    AsyncStorage.getItem("cursify_remember").then((raw) => {
      if (!raw) return;
      const { email, password } = JSON.parse(raw);
      setLoginEmailValue(email);
      setLoginPasswordValue(password);
      setLoginEmail(email);
      setLoginPassword(password);
      setRememberMe(true);
    });
  }, []);

  const handleLogin = async () => {
    if (rememberMe) {
      await AsyncStorage.setItem("cursify_remember", JSON.stringify({ email: loginEmailValue, password: loginPasswordValue }));
    } else {
      await AsyncStorage.removeItem("cursify_remember");
    }
    onLoginWithCredentials(loginEmailValue, loginPasswordValue);
  };

  const roleOptions: UserRole[] = ["student"];

  const handleRegister = async () => {
    setRegisterError("");
    if (!validatePassword(registerPassword)) {
      setRegisterError("A senha deve ter entre 8 e 20 caracteres, incluindo letras e números.");
      return;
    }
    if (onlyDigits(registerCpf).length !== 11) {
      setRegisterError("Informe um CPF com 11 dígitos.");
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
        cpf: onlyDigits(registerCpf),
        password: passwordToLogin,
        role: registerRole,
        bio: registerBio.trim(),
        profile_image_base64: "",
      });
      setRegisterName(""); setRegisterEmail(""); setRegisterCpf(""); setRegisterPassword("");
      setRegisterBio(""); setRegisterRole("student");
      onLoginWithCredentials(emailToLogin, passwordToLogin);
    } catch (error: unknown) {
      setRegisterError(error instanceof Error ? error.message : "Erro ao cadastrar.");
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: theme.colors.background, paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.l }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.headerBlock, { marginBottom: theme.spacing.l, alignItems: "center", gap: theme.spacing.s }]}>
          <Image source={cursifyLogo} style={{ width: 80, height: 80, borderRadius: 40, marginBottom: theme.spacing.s, borderWidth: 2, borderColor: "#326791" }} />
          <Text style={{ fontSize: theme.typography.h1, fontWeight: "800", color: theme.colors.textMain }}>CursiFy Mobile</Text>
          <Text style={{ fontSize: theme.typography.body, color: theme.colors.textMuted, lineHeight: 24 }}>Aprenda, ensine e administre em um só app.</Text>
        </View>

        <View style={[styles.modeSwitch, { gap: theme.spacing.s, marginBottom: theme.spacing.l }]}>
          <AppButton label="Entrar" variant={mode === "login" ? "primary" : "secondary"} onPress={() => setMode("login")} style={styles.halfButton} testID="auth-mode-login" />
          <AppButton label="Criar conta" variant={mode === "register" ? "primary" : "secondary"} onPress={() => setMode("register")} style={styles.halfButton} testID="auth-mode-register" />
        </View>

        {mode === "login" ? (
          <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, padding: theme.spacing.m }}>
            <AppInput label="E-mail" placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" value={loginEmailValue} onChangeText={(v) => { setLoginEmailValue(v); setLoginEmail(v); }} testID="login-email" />
            <AppInput label="Senha" placeholder="******" secureTextEntry value={loginPasswordValue} onChangeText={(v) => { setLoginPasswordValue(v); setLoginPassword(v); }} testID="login-password" />
            <Pressable onPress={() => setRememberMe((v) => !v)} style={[styles.rememberRow, { marginBottom: theme.spacing.s }]} testID="remember-me">
              <View style={[styles.checkbox, { borderColor: theme.colors.primary, backgroundColor: rememberMe ? theme.colors.primary : "transparent" }]}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.small, marginLeft: theme.spacing.s }}>Lembrar-me</Text>
            </Pressable>
            <Pressable onPress={() => setForgotVisible(true)} style={{ alignSelf: "flex-end", marginBottom: theme.spacing.m }}>
              <Text style={{ color: theme.colors.primary, fontSize: theme.typography.small }}>Esqueceu a senha?</Text>
            </Pressable>
            <AppButton label="Acessar" onPress={handleLogin} loading={loading} testID="login-submit" />
            <View style={[styles.rememberRow, { justifyContent: "center", marginTop: theme.spacing.s, flexWrap: "wrap" }]}>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>Ao acessar, você concorda com os </Text>
              <Pressable onPress={() => setLegalVisible("terms")}><Text style={{ color: theme.colors.primary, fontSize: 11 }}>Termos de Uso</Text></Pressable>
              <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}> e </Text>
              <Pressable onPress={() => setLegalVisible("privacy")}><Text style={{ color: theme.colors.primary, fontSize: 11 }}>Política de Privacidade</Text></Pressable>
            </View>
          </View>
        ) : (
          <View style={{ borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, padding: theme.spacing.m }}>
            <AppInput label="Nome" placeholder="Seu nome no app" value={registerName} onChangeText={setRegisterName} testID="register-name" />
            <AppInput label="E-mail" placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" value={registerEmail} onChangeText={setRegisterEmail} testID="register-email" />
            <AppInput label="CPF" placeholder="000.000.000-00" keyboardType="number-pad" value={registerCpf} onChangeText={(value) => setRegisterCpf(formatCpf(value))} maxLength={14} testID="register-cpf" />
            <AppInput label="Senha" placeholder="8 a 20 caracteres, letras e números" secureTextEntry value={registerPassword} onChangeText={setRegisterPassword} testID="register-password" />

            <Text style={{ marginBottom: theme.spacing.s, fontWeight: "600", color: theme.colors.textMain, fontSize: theme.typography.small }}>Perfil</Text>
            <View style={[styles.rolesRow, { gap: theme.spacing.s, marginBottom: theme.spacing.m }]}>
              {roleOptions.map((role) => (
                <AppButton key={role} label={role === "student" ? "Aluno" : role === "teacher" ? "Professor" : "Admin"} onPress={() => setRegisterRole(role)} variant={registerRole === role ? "primary" : "outline"} style={styles.roleButton} testID={`register-role-${role}`} />
              ))}
            </View>

            <AppInput label="Bio (obrigatória para professor/admin)" placeholder="Fale um pouco sobre você" value={registerBio} onChangeText={setRegisterBio} testID="register-bio" />
            {registerError ? <Text style={{ color: theme.colors.error, fontSize: theme.typography.small, marginBottom: theme.spacing.s }}>{registerError}</Text> : null}
            <AppButton label="Cadastrar" onPress={handleRegister} loading={registerLoading} testID="register-submit" />
          </View>
        )}

        {feedback ? <Text style={{ marginTop: theme.spacing.m, color: theme.colors.primary, fontSize: theme.typography.small }}>{feedback}</Text> : null}
      </ScrollView>

      <Modal visible={legalVisible !== null} transparent animationType="slide" onRequestClose={() => setLegalVisible(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setLegalVisible(null)}>
          <Pressable style={[styles.modalBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, maxHeight: "80%" }]} onPress={() => {}}>
            <Text style={{ fontSize: theme.typography.h2, fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.m }}>
              {legalVisible === "terms" ? "Termos de Uso" : "Política de Privacidade"}
            </Text>
            <ScrollView showsVerticalScrollIndicator style={{ marginBottom: theme.spacing.m }}>
              {legalVisible === "terms" ? (
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.small, lineHeight: 22 }}>
                  {`Bem-vindo ao CursiFy. Ao utilizar este aplicativo, você concorda com os seguintes termos:

1. USO PERMITIDO
O app é destinado exclusivamente para fins educacionais. É proibido usar o CursiFy para qualquer atividade ilegal ou não autorizada.

2. CONTA
Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas na sua conta.

3. CONTEÚDO
Todo o conteúdo publicado na plataforma é de responsabilidade do respectivo autor. O CursiFy não se responsabiliza por conteúdos enviados por usuários.

4. PROPRIEDADE INTELECTUAL
Todo o conteúdo original do CursiFy é protegido por direitos autorais. É proibida a reprodução sem autorização.

5. ENCERRAMENTO
O CursiFy reserva-se o direito de encerrar contas que violem estes termos.

6. ALTERAÇÕES
Estes termos podem ser atualizados a qualquer momento. O uso contínuo do app implica aceitação das alterações.`}
                </Text>
              ) : (
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.typography.small, lineHeight: 22 }}>
                  {`Esta Política descreve como o CursiFy trata seus dados:

1. DADOS COLETADOS
Coletamos nome, e-mail, senha (armazenada no servidor) e foto de perfil (armazenada localmente no dispositivo).

2. USO DOS DADOS
Seus dados são usados exclusivamente para autenticação e personalização da experiência no app.

3. ARMAZENAMENTO
Senhas e dados de perfil são armazenados no servidor da plataforma. Foto de perfil e bio são salvas localmente no seu dispositivo via AsyncStorage.

4. COMPARTILHAMENTO
Não compartilhamos seus dados pessoais com terceiros.

5. SEUS DIREITOS
Você pode alterar ou excluir seus dados a qualquer momento através das configurações de perfil.

6. CONTATO
Dúvidas sobre privacidade? Entre em contato pelo suporte do app.`}
                </Text>
              )}
            </ScrollView>
            <AppButton label="Entendi" onPress={() => setLegalVisible(null)} />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={forgotVisible} transparent animationType="fade" onRequestClose={() => setForgotVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setForgotVisible(false)}>
          <Pressable style={[styles.modalBox, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]} onPress={() => {}}>
            <Text style={{ fontSize: theme.typography.h2, fontWeight: "700", color: theme.colors.textMain, marginBottom: theme.spacing.m }}>Redefinir senha</Text>
            <AppInput label="E-mail da conta" placeholder="voce@exemplo.com" keyboardType="email-address" autoCapitalize="none" value={forgotEmail} onChangeText={setForgotEmail} />
            <AppInput label="Nova senha" placeholder="8 a 20 caracteres, letras e números" secureTextEntry value={forgotNewPassword} onChangeText={setForgotNewPassword} />
            <AppInput label="Confirmar nova senha" placeholder="Repita a nova senha" secureTextEntry value={forgotConfirm} onChangeText={setForgotConfirm} />
            {forgotError ? <Text style={{ color: theme.colors.error, fontSize: theme.typography.small, marginBottom: theme.spacing.s }}>{forgotError}</Text> : null}
            {forgotSuccess ? <Text style={{ color: theme.colors.primary, fontSize: theme.typography.small, marginBottom: theme.spacing.s }}>{forgotSuccess}</Text> : null}
            <AppButton label="Redefinir senha" onPress={handleForgotPassword} loading={forgotLoading} />
            <AppButton label="Cancelar" variant="outline" onPress={() => setForgotVisible(false)} style={{ marginTop: theme.spacing.s }} />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  headerBlock: {},
  modeSwitch: { flexDirection: "row" },
  halfButton: { flex: 1 },
  rolesRow: { flexDirection: "row", flexWrap: "wrap" },
  roleButton: { minWidth: 90 },
  rememberRow: { flexDirection: "row", alignItems: "center" },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  modalBox: { width: "100%", borderRadius: 16, borderWidth: 1, padding: 24 },
});

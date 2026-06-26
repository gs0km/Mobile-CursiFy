/**
 * index.tsx — Ponto de entrada do app CursiFy.
 *
 * Integração com o backend via services (Axios):
 *   - authService    → login, registro, perfil
 *   - courseService  → catálogo, criação, exclusão
 *   - enrollmentService → inscrições do usuário
 *   - adminService   → painel administrativo
 *
 * Sessão persistida no AsyncStorage (chave: cursify_session).
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BottomTabBar } from "../src/components/BottomTabBar";
import { ThemeProvider, useTheme } from "../src/contexts/ThemeContext";
import { AdminScreen } from "../src/screens/AdminScreen";
import { AuthScreen } from "../src/screens/AuthScreen";
import { CatalogScreen } from "../src/screens/CatalogScreen";
import { CourseDetailsScreen } from "../src/screens/CourseDetailsScreen";
import { MyCoursesScreen } from "../src/screens/MyCoursesScreen";
import { ProfileScreen } from "../src/screens/ProfileScreen";
import { PublishCourseScreen } from "../src/screens/PublishCourseScreen";
import TeacherChatScreen from "../src/screens/TeacherChatScreen";
import StudentTeacherChatScreen from "../src/screens/StudentTeacherChatScreen";
import { ApiError, setAuthToken } from "../src/services/api";
import adminService from "../src/services/adminService";
import authService from "../src/services/authService";
import { chatService } from "../src/services/chatService";
import courseService from "../src/services/courseService";
import enrollmentService from "../src/services/enrollmentService";
import {
  AdminOverview,
  AppTab,
  Course,
  CreateCoursePayload,
  Enrollment,
  UpdateProfilePayload,
  User,
} from "../src/types";

type AuthMode = "login" | "register";

const SESSION_KEY = "cursify_session";

export default function Index() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { theme, isDark, toggleTheme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>("catalog");
  const [chatUnread, setChatUnread] = useState(0);


  const [busy, setBusy] = useState(false);
  const [screenLoading, setScreenLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  // ─── Restaura sessão salva ao abrir o app ──────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY).then((raw) => {
      if (!raw) { setScreenLoading(false); return; }
      try {
        const { token: savedToken, user: savedUser } = JSON.parse(raw) as { token: string; user: User };
        setToken(savedToken);
        setUser(savedUser);
        setAuthToken(savedToken);
        loadInitialData(savedUser).finally(() => setScreenLoading(false));
      } catch {
        setScreenLoading(false);
      }
    });
  }, []);

  // ─── Animação de transição entre abas ─────────────────────────────────────
  useEffect(() => {
    const useNative = Platform.OS !== "web";
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: useNative }).start(() =>
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: useNative }).start()
    );
  }, [activeTab, selectedCourse, fadeAnim]);

  // ─── Polling de não lidas no chat ─────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      const users = await authService.getAll();
      const others = users.filter((u) => u.user_id !== user.user_id);
      const counts = await Promise.all(others.map((u) => chatService.getUnreadCount(user.user_id, u.user_id)));
      setChatUnread(counts.reduce((a, b) => a + b, 0));
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    if (activeTab === "chat") setChatUnread(0);
  }, [activeTab]);

  // ─── Abas dinâmicas por role ───────────────────────────────────────────────
  const tabs = useMemo(() => {
    if (!user) return [];
    const base: { key: AppTab; label: string; icon: "home-outline" | "book-outline" | "school-outline" | "shield-checkmark-outline" | "person-outline" | "chatbubbles-outline"; badge?: number }[] = [
      { key: "catalog", label: "Catálogo", icon: "home-outline" },
      { key: "my-courses", label: "Cursos", icon: "book-outline" },
    ];
    if (user.role === "admin")
      base.push({ key: "teacher", label: "Professor", icon: "school-outline" });
    if (user.role === "admin")
      base.push({ key: "admin", label: "Admin", icon: "shield-checkmark-outline" });
    base.push({ key: "chat", label: "Chat", icon: "chatbubbles-outline", badge: chatUnread || undefined });
    base.push({ key: "profile", label: "Perfil", icon: "person-outline" });
    return base;
  }, [user]);

  // ─── Carrega dados iniciais após login/restauração ─────────────────────────
  const loadInitialData = async (nextUser: User) => {
    setScreenLoading(true);
    try {
      const [catalog, enrollments, teacher, admin] = await Promise.all([
        courseService.getAll(),
        enrollmentService.getAll(nextUser.user_id),
        nextUser.role === "teacher" || nextUser.role === "admin"
          ? courseService.getProfessorCourses()
          : Promise.resolve([] as Course[]),
        nextUser.role === "admin"
          ? adminService.getAll()
          : Promise.resolve(null as AdminOverview | null),
      ]);
      setCourses(catalog);
      setMyEnrollments(enrollments);
      setTeacherCourses(teacher);
      setAdminOverview(admin);
    } catch (error) {
      handleError(error);
    } finally {
      setScreenLoading(false);
    }
  };

  // ─── Tratamento global de erros ───────────────────────────────────────────
  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleError = (error: unknown) => {
    if (error instanceof ApiError || error instanceof Error) {
      showFeedback(error.message);
    } else {
      showFeedback("Não foi possível concluir a ação. Tente novamente.");
    }
  };

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = async (email?: string, password?: string) => {
    const emailToUse = email ?? loginEmail.trim();
    const passwordToUse = password ?? loginPassword;
    setBusy(true);
    setFeedback("");
    try {
      const response = await authService.login({ email: emailToUse, password: passwordToUse });
      setToken(response.access_token);
      setUser(response.user);
      setAuthToken(response.access_token);
      setActiveTab("catalog");
      const sessionUser = {
        user_id: response.user.user_id,
        email: response.user.email,
        username: response.user.username,
        cpf: response.user.cpf,
        role: response.user.role,
        bio: response.user.bio,
        profile_image_base64: response.user.profile_image_base64,
        cover_image_base64: response.user.cover_image_base64,
        created_at: response.user.created_at,
        active: response.user.active,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token: response.access_token, user: sessionUser }));
      await loadInitialData(response.user);
      showFeedback(`Bem-vindo, ${response.user.username}!`);
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  // ─── Cursos ────────────────────────────────────────────────────────────────
  const handleRefreshCatalog = async () => {
    setScreenLoading(true);
    try {
      setCourses(await courseService.getAll());
    } catch (error) {
      handleError(error);
    } finally {
      setScreenLoading(false);
    }
  };

  const handleOpenCourseById = async (courseId: string) => {
    const local = [...courses, ...teacherCourses].find((c) => c.course_id === courseId);
    if (local) { setSelectedCourse(local); return; }
    try {
      setSelectedCourse(await courseService.getById(courseId));
    } catch (error) {
      handleError(error);
    }
  };

  const handleOpenCourse = (course: Course) => setSelectedCourse(course);

  const handleCreateCourse = async (payload: CreateCoursePayload) => {
    if (!user) return null;
    setBusy(true);
    setFeedback("");
    try {
      const result = await courseService.create(payload);
      showFeedback("Curso publicado com sucesso.");
      await loadInitialData(user);
      setActiveTab("catalog");
      return result.raw as { id: number; nome: string };
    } catch (error) {
      handleError(error);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!user) return;
    setBusy(true);
    setFeedback("");
    try {
      await courseService.remove(courseId);
      showFeedback("Curso excluído com sucesso.");
      await loadInitialData(user);
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  // ─── Inscrição ─────────────────────────────────────────────────────────────
  const handleEnroll = async () => {
    if (!selectedCourse || !user) return;
    setBusy(true);
    setFeedback("");
    try {
      await enrollmentService.create(user.user_id, selectedCourse.course_id);
      await loadInitialData(user);
      setSelectedCourse(await courseService.getById(selectedCourse.course_id));
      setActiveTab("my-courses");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  // ─── Perfil ────────────────────────────────────────────────────────────────
  const handleUpdateProfile = async (payload: UpdateProfilePayload) => {
    if (!token) return;
    setBusy(true);
    setFeedback("");
    try {
      const updated = await authService.update(payload);
      setUser(updated);
      const updatedUser = {
        user_id: updated.user_id,
        email: updated.email,
        username: updated.username,
        role: updated.role,
        bio: updated.bio,
        profile_image_base64: updated.profile_image_base64,
        cover_image_base64: updated.cover_image_base64,
        created_at: updated.created_at,
        active: updated.active,
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify({ token, user: updatedUser }));
      setAuthToken(token);
      showFeedback("Perfil atualizado com sucesso.");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    AsyncStorage.removeItem(SESSION_KEY);
    setAuthToken(null);
    setToken(""); setUser(null); setCourses([]); setSelectedCourse(null);
    setMyEnrollments([]); setTeacherCourses([]); setAdminOverview(null);
    showFeedback("Sessão encerrada com segurança.");
    setAuthMode("login");
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  const renderMainArea = () => {
    if (!user) return null;

    if (selectedCourse)
      return (
        <CourseDetailsScreen
          course={selectedCourse}
          canEnroll={user.role === "student" || user.role === "admin"}
          loading={busy}
          userId={user.user_id}
          onBack={() => setSelectedCourse(null)}
          onEnroll={handleEnroll}
        />
      );

    if (activeTab === "catalog")
      return (
        <CatalogScreen
          courses={courses}
          loading={screenLoading}
          userId={user.user_id}
          onOpenCourse={handleOpenCourse}
          onRefresh={handleRefreshCatalog}
        />
      );

    if (activeTab === "my-courses")
      return <MyCoursesScreen enrollments={myEnrollments} userId={user.user_id} onOpenCourse={handleOpenCourseById} />;

    if (activeTab === "teacher")
      return (
        <PublishCourseScreen
          canManage={user.role === "teacher" || user.role === "admin"}
          userId={Number(user.user_id)}
          courses={teacherCourses}
          loading={busy}
          onCreateCourse={handleCreateCourse}
          onOpenCourse={handleOpenCourse}
          onDeleteCourse={handleDeleteCourse}
        />
      );

    if (activeTab === "admin")
      return <AdminScreen isAdmin={user.role === "admin"} data={adminOverview} />;

    if (activeTab === "chat")
      return user.role === "teacher" || user.role === "admin"
        ? <TeacherChatScreen userName={user.username} />
        : <StudentTeacherChatScreen userName={user.username} />;

    return (
      <ProfileScreen
        user={user}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
        loading={busy}
        feedback={feedback}
        enrolledCount={myEnrollments.length}
        completedCount={myEnrollments.filter((e) => e.status === "Concluído").length}
        studiedHours={myEnrollments.reduce((acc, e) => acc + (e.course.carga_horaria || 0), 0)}
      />
    );
  };

  // Tela de loading inicial (restauração de sessão)
  if (screenLoading && !user)
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {!token || !user ? (
        <AuthScreen
          mode={authMode} setMode={setAuthMode}
          loginEmail={loginEmail} setLoginEmail={setLoginEmail}
          loginPassword={loginPassword} setLoginPassword={setLoginPassword}
          onLogin={handleLogin}
          onLoginWithCredentials={(email, password) => handleLogin(email, password)}
          loading={busy} feedback={feedback}
        />
      ) : (
        <View style={styles.flex}>
          <LinearGradient
            colors={["#0EA5E9", "#10B981", "#22C55E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { borderBottomWidth: 1, borderBottomColor: "#0EA5E9", paddingHorizontal: theme.spacing.l, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.m }]}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerSide} />
              <View style={styles.headerCenter}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Text style={[styles.appName, { color: "#ffffff" }]}>CursiFy</Text>
                  <Image source={require("../assets/images/logopreta.jpg")} style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: "#0EA5E9", backgroundColor: "#0EA5E9" }} />
                </View>
              </View>
              <View style={styles.headerSide} />
            </View>
          </LinearGradient>

          {screenLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <Text style={[styles.loadingText, { color: theme.colors.textMuted, fontSize: theme.typography.body }]}>Sincronizando dados...</Text>
            </View>
          ) : (
            <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>
              {renderMainArea()}
            </Animated.View>
          )}

          {feedback ? <Text style={[styles.feedback, { color: theme.colors.primary, fontSize: theme.typography.small, backgroundColor: theme.colors.feedbackBg }]}>{feedback}</Text> : null}

          {!selectedCourse && (
            <BottomTabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  header: { borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "center" },
  headerCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  headerSide: { width: 38, alignItems: "flex-end" },
  appName: { fontSize: 28, fontWeight: "800" },
  userHint: { textAlign: "center" },
  themeToggle: { padding: 8 },
  loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: {},
  feedback: { paddingHorizontal: 24, paddingVertical: 8 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
});

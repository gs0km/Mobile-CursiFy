import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BottomTabBar } from "../src/components/BottomTabBar";
import { defaultAvatarBase64, pickCourseImage } from "../src/constants/images";
import { theme } from "../src/constants/theme";
import { AdminScreen } from "../src/screens/AdminScreen";
import { AuthScreen } from "../src/screens/AuthScreen";
import { CatalogScreen } from "../src/screens/CatalogScreen";
import { CourseDetailsScreen } from "../src/screens/CourseDetailsScreen";
import { MyCoursesScreen } from "../src/screens/MyCoursesScreen";
import { ProfileScreen } from "../src/screens/ProfileScreen";
import { TeacherScreen } from "../src/screens/TeacherScreen";
import { ApiError, createApiClient } from "../src/services/api";
import {
  AdminOverview,
  AppTab,
  Course,
  CourseLevel,
  CreateCoursePayload,
  Enrollment,
  User,
  UserRole,
} from "../src/types";

type AuthMode = "login" | "register";

const appConfig = Constants.expoConfig;
const fallbackBackend = process.env.EXPO_PUBLIC_BACKEND_URL ?? "";
const backendUrl =
  (appConfig?.extra?.EXPO_PUBLIC_BACKEND_URL as string | undefined) ?? fallbackBackend;

export default function Index() {
  const api = useMemo(() => createApiClient(backendUrl), []);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerRole, setRegisterRole] = useState<UserRole>("student");
  const [registerBio, setRegisterBio] = useState("");

  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [myEnrollments, setMyEnrollments] = useState<Enrollment[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<Course[]>([]);
  const [adminOverview, setAdminOverview] = useState<AdminOverview | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>("catalog");

  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseCategory, setNewCourseCategory] = useState("Desenvolvimento");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [newCoursePedagogy, setNewCoursePedagogy] = useState("");
  const [newCourseLessons, setNewCourseLessons] = useState("8");
  const [newCourseHours, setNewCourseHours] = useState("4");
  const [newCourseLevel, setNewCourseLevel] = useState<CourseLevel>("beginner");

  const [busy, setBusy] = useState(false);
  const [screenLoading, setScreenLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const enableNativeDriver = Platform.OS !== "web";
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: enableNativeDriver,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: enableNativeDriver,
      }).start();
    });
  }, [activeTab, selectedCourse, fadeAnim]);

  const tabs = useMemo(() => {
    if (!user) {
      return [];
    }
    const baseTabs: { key: AppTab; label: string; icon: "home-outline" | "book-outline" | "school-outline" | "shield-checkmark-outline" | "person-outline" }[] = [
      { key: "catalog", label: "Catálogo", icon: "home-outline" },
      { key: "my-courses", label: "Cursos", icon: "book-outline" },
    ];

    if (user.role === "teacher" || user.role === "admin") {
      baseTabs.push({ key: "teacher", label: "Professor", icon: "school-outline" });
    }
    if (user.role === "admin") {
      baseTabs.push({ key: "admin", label: "Admin", icon: "shield-checkmark-outline" });
    }

    baseTabs.push({ key: "profile", label: "Perfil", icon: "person-outline" });
    return baseTabs;
  }, [user]);

  const loadInitialData = async (nextUser: User, nextToken: string) => {
    setScreenLoading(true);
    try {
      const loadCoursesPromise = api.getCourses();
      const loadEnrollmentsPromise = api.myEnrollments(nextToken);
      const loadTeacherPromise =
        nextUser.role === "teacher" || nextUser.role === "admin"
          ? api.professorCourses(nextToken)
          : Promise.resolve([] as Course[]);
      const loadAdminPromise =
        nextUser.role === "admin"
          ? api.adminOverview(nextToken)
          : Promise.resolve(null as AdminOverview | null);

      const [catalogResponse, enrollResponse, teacherResponse, adminResponse] = await Promise.all([
        loadCoursesPromise,
        loadEnrollmentsPromise,
        loadTeacherPromise,
        loadAdminPromise,
      ]);

      setCourses(catalogResponse);
      setMyEnrollments(enrollResponse);
      setTeacherCourses(teacherResponse);
      setAdminOverview(adminResponse);
    } catch (error) {
      handleError(error);
    } finally {
      setScreenLoading(false);
    }
  };

  const handleError = (error: unknown) => {
    if (error instanceof ApiError) {
      setFeedback(error.message);
      return;
    }
    
    if (error instanceof Error) {
      setFeedback(error.message);
      return;
    }
    
    // Fallback para tipos desconhecidos
    setFeedback("Não foi possível concluir a ação. Tente novamente.");
  };

  const handleRegister = async () => {
    if (registerRole !== "student" && registerBio.trim().length < 3) {
      setFeedback("Professores e admins precisam preencher bio.");
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      await api.register({
        email: registerEmail.trim(),
        username: registerName.trim(),
        password: registerPassword,
        role: registerRole,
        bio: registerBio.trim(),
        profile_image_base64: defaultAvatarBase64,
      });
      setFeedback("Cadastro realizado! Agora faça login.");
      setAuthMode("login");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async () => {
    setBusy(true);
    setFeedback("");
    try {
      const response = await api.login({ email: loginEmail.trim(), password: loginPassword });
      setToken(response.access_token);
      setUser(response.user);
      setActiveTab("catalog");
      await loadInitialData(response.user, response.access_token);
      setFeedback(`Bem-vindo, ${response.user.username}!`);
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshCatalog = async () => {
    setScreenLoading(true);
    try {
      setCourses(await api.getCourses());
    } catch (error) {
      handleError(error);
    } finally {
      setScreenLoading(false);
    }
  };

  const handleOpenCourseById = async (courseId: string) => {
    try {
      const detail = await api.getCourseById(courseId);
      setSelectedCourse(detail);
    } catch (error) {
      handleError(error);
    }
  };

  const handleOpenCourse = async (course: Course) => {
    await handleOpenCourseById(course.course_id);
  };

  const handleEnroll = async () => {
    if (!selectedCourse || !token || !user) {
      return;
    }
    setBusy(true);
    setFeedback("");
    try {
      await api.enroll(selectedCourse.course_id, token);
      setFeedback("Inscrição confirmada com sucesso!");
      await loadInitialData(user, token);
      setSelectedCourse(await api.getCourseById(selectedCourse.course_id));
      setActiveTab("my-courses");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  const clearCourseForm = () => {
    setNewCourseTitle("");
    setNewCourseCategory("Desenvolvimento");
    setNewCourseDescription("");
    setNewCoursePedagogy("");
    setNewCourseLessons("8");
    setNewCourseHours("4");
    setNewCourseLevel("beginner");
  };

  const handleCreateCourse = async () => {
    if (!token || !user) {
      return;
    }
    const payload: CreateCoursePayload = {
      title: newCourseTitle.trim(),
      category: newCourseCategory.trim(),
      description: newCourseDescription.trim(),
      pedagogy_description: newCoursePedagogy.trim(),
      lessons_count: Number(newCourseLessons),
      estimated_hours: Number(newCourseHours),
      level: newCourseLevel,
      thumbnail_base64: pickCourseImage(newCourseCategory, newCourseTitle),
    };

    setBusy(true);
    setFeedback("");
    try {
      await api.createCourse(payload, token);
      setFeedback("Curso publicado com sucesso.");
      clearCourseForm();
      await loadInitialData(user, token);
      setActiveTab("catalog");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setCourses([]);
    setSelectedCourse(null);
    setMyEnrollments([]);
    setTeacherCourses([]);
    setAdminOverview(null);
    setFeedback("Sessão encerrada com segurança.");
    setAuthMode("login");
  };

  const renderMainArea = () => {
    if (!user) {
      return null;
    }

    if (selectedCourse) {
      return (
        <CourseDetailsScreen
          course={selectedCourse}
          canEnroll={user.role === "student" || user.role === "admin"}
          loading={busy}
          onBack={() => setSelectedCourse(null)}
          onEnroll={handleEnroll}
        />
      );
    }

    if (activeTab === "catalog") {
      return (
        <CatalogScreen
          courses={courses}
          loading={screenLoading}
          onOpenCourse={handleOpenCourse}
          onRefresh={handleRefreshCatalog}
        />
      );
    }

    if (activeTab === "my-courses") {
      return <MyCoursesScreen enrollments={myEnrollments} onOpenCourse={handleOpenCourseById} />;
    }

    if (activeTab === "teacher") {
      return (
        <TeacherScreen
          canManage={user.role === "teacher" || user.role === "admin"}
          title={newCourseTitle}
          setTitle={setNewCourseTitle}
          category={newCourseCategory}
          setCategory={setNewCourseCategory}
          description={newCourseDescription}
          setDescription={setNewCourseDescription}
          pedagogyDescription={newCoursePedagogy}
          setPedagogyDescription={setNewCoursePedagogy}
          lessonsCount={newCourseLessons}
          setLessonsCount={setNewCourseLessons}
          estimatedHours={newCourseHours}
          setEstimatedHours={setNewCourseHours}
          level={newCourseLevel}
          setLevel={setNewCourseLevel}
          loading={busy}
          onCreateCourse={handleCreateCourse}
          courses={teacherCourses}
          onOpenCourse={handleOpenCourse}
        />
      );
    }

    if (activeTab === "admin") {
      return <AdminScreen isAdmin={user.role === "admin"} data={adminOverview} />;
    }

    return <ProfileScreen user={user} onLogout={handleLogout} />;
  };

  if (!backendUrl) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Configure EXPO_PUBLIC_BACKEND_URL para iniciar o app.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {!token || !user ? (
        <AuthScreen
          mode={authMode}
          setMode={setAuthMode}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          registerName={registerName}
          setRegisterName={setRegisterName}
          registerEmail={registerEmail}
          setRegisterEmail={setRegisterEmail}
          registerPassword={registerPassword}
          setRegisterPassword={setRegisterPassword}
          registerRole={registerRole}
          setRegisterRole={setRegisterRole}
          registerBio={registerBio}
          setRegisterBio={setRegisterBio}
          onLogin={handleLogin}
          onRegister={handleRegister}
          loading={busy}
          feedback={feedback}
        />
      ) : (
        <View style={styles.flex}>
          <View style={styles.header}>
            <Text style={styles.appName}>CursiFy</Text>
            <Text style={styles.userHint}>
              {user.username} • {user.role}
            </Text>
          </View>

          {screenLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator color={theme.colors.primary} size="large" />
              <Text style={styles.loadingText}>Sincronizando dados...</Text>
            </View>
          ) : (
            <Animated.View style={[styles.flex, { opacity: fadeAnim }]}>{renderMainArea()}</Animated.View>
          )}

          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

          {!selectedCourse ? (
            <BottomTabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.m,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.textMain,
  },
  userHint: {
    marginTop: theme.spacing.s,
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
  },
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.m,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
  },
  feedback: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.s,
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    backgroundColor: "#EEF2FF",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    padding: theme.spacing.l,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.body,
    textAlign: "left",
  },
});

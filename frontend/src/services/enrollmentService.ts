import AsyncStorage from "@react-native-async-storage/async-storage";
import courseService from "./courseService";
import { Enrollment } from "../types";

type EnrollmentState = Record<string, { enrolled: boolean; status: string; updatedAt: string }>;

function buildStorageKey(userId: string) {
  return `userCourseState:${userId}`;
}

async function getEnrollmentState(userId: string): Promise<EnrollmentState> {
  try {
    const raw = await AsyncStorage.getItem(buildStorageKey(userId));
    return raw ? JSON.parse(raw) as EnrollmentState : {};
  } catch {
    return {};
  }
}

async function saveEnrollmentState(userId: string, state: EnrollmentState) {
  await AsyncStorage.setItem(buildStorageKey(userId), JSON.stringify(state));
}

const enrollmentService = {
  getAll: async (userId: string): Promise<Enrollment[]> => {
    const state = await getEnrollmentState(userId);
    const enrolledIds = Object.entries(state)
      .filter(([, entry]) => entry.enrolled)
      .map(([courseId]) => courseId);

    if (enrolledIds.length === 0) {
      return [];
    }

    const courses = await courseService.getAll();

    return enrolledIds
      .map((courseId) => {
        const course = courses.find((item) => item.course_id === courseId);
        if (!course) return null;

        return {
          enrollment_id: `${userId}-${courseId}`,
          enrolled_at: state[courseId]?.updatedAt ?? new Date().toISOString(),
          course,
        };
      })
      .filter((item): item is Enrollment => item !== null);
  },

  create: async (userId: string, courseId: string) => {
    const state = await getEnrollmentState(userId);
    state[courseId] = {
      enrolled: true,
      status: "Em progresso",
      updatedAt: new Date().toISOString(),
    };

    await saveEnrollmentState(userId, state);
    return { enrollment_id: `${userId}-${courseId}` };
  },

  getById: (_id: string): Promise<Enrollment> =>
    Promise.reject(new Error("Endpoint nao implementado.")),
  update: (): Promise<void> => Promise.reject(new Error("Endpoint nao implementado.")),
  remove: (): Promise<void> => Promise.reject(new Error("Endpoint nao implementado.")),
};

export default enrollmentService;

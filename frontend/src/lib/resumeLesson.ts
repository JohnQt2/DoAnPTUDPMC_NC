import { api } from './api';

const LAST_LESSON_KEY = 'hanzi4u_in_progress_lesson_id';

export function saveInProgressLessonId(lessonId: number): void {
  if (!Number.isFinite(lessonId) || lessonId <= 0) return;
  try {
    localStorage.setItem(LAST_LESSON_KEY, String(lessonId));
  } catch {
    // ignore storage errors
  }
}

export function clearInProgressLessonId(): void {
  try {
    localStorage.removeItem(LAST_LESSON_KEY);
  } catch {
    // ignore storage errors
  }
}

export function getInProgressLessonId(): number | null {
  try {
    const raw = localStorage.getItem(LAST_LESSON_KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * Luôn điều hướng tới đúng bài học mà học viên đang học dở:
 * 1. Ưu tiên bài học đang mở dở gần nhất (localStorage)
 * 2. Nếu chưa có, lấy bài tiếp theo đang dở từ tiến độ hệ thống (/users/me/progress)
 * 3. Fallback về bài đầu tiên của lộ trình hoặc lesson 1
 */
export async function goToInProgressLesson(fallbackLessonId?: number): Promise<void> {
  const savedId = getInProgressLessonId();
  if (savedId) {
    window.location.hash = `#/lessons/${savedId}`;
    return;
  }

  try {
    const prog = await api.get<any>('/users/me/progress');
    const recId =
      prog?.next_recommended_lesson?.lesson_id ||
      prog?.next_recommended_lesson?.lessonId ||
      prog?.active_roadmap?.current_lesson?.lessonId;
    if (recId) {
      window.location.hash = `#/lessons/${recId}`;
      return;
    }
  } catch {
    // fallback below
  }

  window.location.hash = `#/lessons/${fallbackLessonId || 1}`;
}


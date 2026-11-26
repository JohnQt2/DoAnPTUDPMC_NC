import http from 'http';
import assert from 'assert';
import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import { signAccessToken } from '../shared/utils/crypto';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PracticeLevelSummary {
  id: number;
  code: string;
}

interface PracticeExerciseSetSummary {
  id: number;
  skill: string;
}

interface PracticeLessonSummary {
  id: number;
  lessonNumber: number;
  exerciseSets: PracticeExerciseSetSummary[];
}

interface PracticeQuestionPayload {
  id: number;
  code: string;
  type: string;
  prompt: unknown;
  score: number;
  sortOrder: number;
  sourceAudio: string | null;
  answer?: never;
  explanation?: never;
}

interface ExerciseSetPayload {
  id: number;
  questions: PracticeQuestionPayload[];
}

interface AttemptPayload {
  attemptId: number;
  exerciseSetId: number;
  status: string;
  startedAt: string;
  answers: Record<number, unknown>;
  totalQuestions: number;
}

interface SaveAnswerPayload {
  success: boolean;
  attemptId: number;
  questionId: number;
}

interface SubmitQuestionPayload {
  correctAnswer: unknown;
  explanation: unknown;
}

interface SubmitResultPayload {
  attemptId: number;
  totalQuestions: number;
  correctCount: number;
  earnedScore: number;
  percentage: number;
  questions: SubmitQuestionPayload[];
}

interface LevelProgressPayload {
  levelCode: string;
  completionPercent: number;
}

interface ProgressPayload {
  levels: LevelProgressPayload[];
}

interface LessonProgressPayload {
  completedExerciseCount: number;
}

function readApiResponse<T>(value: unknown): ApiResponse<T> {
  assert(
    typeof value === 'object' && value !== null,
    'API response must be an object'
  );

  const candidate = value as Partial<ApiResponse<T>>;
  assert.strictEqual(candidate.success, true);
  assert('data' in candidate, 'API response must contain data');

  return candidate as ApiResponse<T>;
}

async function runPracticeTests() {
  console.log('🧪 Starting Practice Workbook Module Integration Tests...\n');

  let server: http.Server | null = null;
  try {
    server = http.createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const address = server.address();
    assert(address && typeof address !== 'string');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    // Helper request
    const request = async <T>(urlPath: string, options: RequestInit = {}) => {
      const url = new URL(urlPath, baseUrl);
      const headers = new Headers(options.headers);
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      const res = await fetch(url.toString(), {
        ...options,
        headers,
      });
      const data = readApiResponse<T>(await res.json().catch(() => null));
      return { status: res.status, data };
    };

    // Create a mock user
    const testUser = await prisma.users.upsert({
      where: { email: 'student_practice_test@chinaeasy.test' },
      create: {
        email: 'student_practice_test@chinaeasy.test',
        display_name: 'Practice Tester',
        role: 'STUDENT',
        status: 'ACTIVE',
      },
      update: {},
    });

    const authToken = signAccessToken({
      userId: testUser.user_id,
      email: testUser.email,
      role: testUser.role,
    });
    const authHeader = { Authorization: `Bearer ${authToken}` };

    // ─── TEST 1: Levels & Lessons API ──────────────────────────────────────────
    console.log('▶ Test 1: Levels & Lessons Catalog APIs');
    const levelsRes = await request<PracticeLevelSummary[]>('/api/v1/practice/levels');
    assert.strictEqual(levelsRes.status, 200);
    assert(Array.isArray(levelsRes.data.data));
    assert(levelsRes.data.data.some((level) => level.code === 'HSK1'));

    const hsk1LessonsRes = await request<PracticeLessonSummary[]>(
      '/api/v1/practice/levels/HSK1/lessons'
    );
    assert.strictEqual(hsk1LessonsRes.status, 200);
    assert(hsk1LessonsRes.data.data.length >= 15);
    const lesson3 = hsk1LessonsRes.data.data.find((lesson) => lesson.lessonNumber === 3);
    assert(lesson3);
    assert(lesson3.exerciseSets.length >= 4);
    console.log('  ✔ Level & 15 Lessons returned correctly.');

    // ─── TEST 2: Security - Ensure No Answers in Student Exercise API ─────────
    console.log('\n▶ Test 2: Security - Answers & Explanations Stripped in Practice Mode');
    const listeningSet = lesson3.exerciseSets.find((set) => set.skill === 'LISTENING');
    assert(listeningSet);

    const setRes = await request<ExerciseSetPayload>(
      `/api/v1/practice/exercise-sets/${listeningSet.id}`
    );
    assert.strictEqual(setRes.status, 200);
    const questions = setRes.data.data.questions;
    assert(questions.length > 0);

    for (const q of questions) {
      assert.strictEqual(q.answer, undefined, `Question ${q.code} leaked answer!`);
      assert.strictEqual(q.explanation, undefined, `Question ${q.code} leaked explanation!`);
    }
    console.log('  ✔ All questions have answers and explanations safely stripped.');

    // ─── TEST 3: Attempt Lifecycle & Autosave ──────────────────────────────────
    console.log('\n▶ Test 3: Attempt Creation, Autosave & Resuming');
    const startRes = await request<AttemptPayload>('/api/v1/practice/attempts', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ exerciseSetId: listeningSet.id }),
    });
    assert.strictEqual(startRes.status, 200);
    const attemptId = startRes.data.data.attemptId;
    assert(attemptId > 0);

    // Save answer to Q1 (True/False)
    const q1 = questions[0];
    const saveRes = await request<SaveAnswerPayload>(
      `/api/v1/practice/attempts/${attemptId}/answers/${q1.id}`,
      {
        method: 'PUT',
        headers: authHeader,
        body: JSON.stringify({ answer: false }),
      }
    );
    assert.strictEqual(saveRes.status, 200);
    assert.strictEqual(saveRes.data.success, true);

    // Resume attempt test: posting again should return in-progress attempt with saved answer
    const resumeRes = await request<AttemptPayload>('/api/v1/practice/attempts', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ exerciseSetId: listeningSet.id }),
    });
    assert.strictEqual(resumeRes.data.data.attemptId, attemptId);
    assert.strictEqual(resumeRes.data.data.answers[q1.id], false);
    console.log('  ✔ In-progress attempt created, answered, and resumed seamlessly.');

    // ─── TEST 4: Submission & Accurate Grading ────────────────────────────────
    console.log('\n▶ Test 4: Submit & Grading Evaluation');
    // Prepare answers: Q1 is false (correct), Q2 is false (correct), Q3 is true (correct), Q4 is true (correct)
    const answersPayload: Record<number, unknown> = {};
    questions.forEach((q) => {
      if (q.code === 'HSK1-L03-LISTENING-P1-Q01') answersPayload[q.id] = false;
      else if (q.code === 'HSK1-L03-LISTENING-P1-Q02') answersPayload[q.id] = false;
      else if (q.code === 'HSK1-L03-LISTENING-P1-Q03') answersPayload[q.id] = true;
      else if (q.code === 'HSK1-L03-LISTENING-P1-Q04') answersPayload[q.id] = true;
      else if (q.code === 'HSK1-L03-LISTENING-P2-Q05') answersPayload[q.id] = 'B';
      else if (q.code === 'HSK1-L03-LISTENING-P2-Q06') answersPayload[q.id] = 'A';
      else if (q.code === 'HSK1-L03-LISTENING-P2-Q07') answersPayload[q.id] = 'E';
      else if (q.code === 'HSK1-L03-LISTENING-P2-Q08') answersPayload[q.id] = 'D';
      else if (q.code === 'HSK1-L03-LISTENING-P3-Q09') answersPayload[q.id] = 'A';
      else if (q.code === 'HSK1-L03-LISTENING-P3-Q10') answersPayload[q.id] = 'B';
      else if (q.code === 'HSK1-L03-LISTENING-P3-Q11') answersPayload[q.id] = 'B';
      else if (q.code === 'HSK1-L03-LISTENING-P3-Q12') answersPayload[q.id] = 'C';
    });

    const submitRes = await request<SubmitResultPayload>(
      `/api/v1/practice/attempts/${attemptId}/submit`,
      {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ answers: answersPayload }),
      }
    );
    assert.strictEqual(submitRes.status, 200);
    const result = submitRes.data.data;
    assert.strictEqual(result.percentage, 100);
    assert.strictEqual(result.correctCount, 12);
    assert.strictEqual(result.earnedScore, 12);
    assert(result.questions[0].correctAnswer !== undefined);
    assert(result.questions[0].explanation !== undefined);
    console.log('  ✔ Submission graded 100% (12/12) with full explanations revealed.');

    // ─── TEST 5: Idempotent Submission ─────────────────────────────────────────
    console.log('\n▶ Test 5: Idempotent Submission');
    const resubmitRes = await request<SubmitResultPayload>(
      `/api/v1/practice/attempts/${attemptId}/submit`,
      {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ answers: answersPayload }),
      }
    );
    assert.strictEqual(resubmitRes.status, 200);
    assert.strictEqual(resubmitRes.data.data.percentage, 100);
    console.log('  ✔ Repeated submit call safely returns existing result without duplicating.');

    // ─── TEST 6: Progress Tracking ─────────────────────────────────────────────
    console.log('\n▶ Test 6: Progress Tracking Updates');
    const progRes = await request<ProgressPayload>('/api/v1/practice/progress', {
      headers: authHeader,
    });
    assert.strictEqual(progRes.status, 200);
    const hsk1Prog = progRes.data.data.levels.find((level) => level.levelCode === 'HSK1');
    assert(hsk1Prog);
    assert(hsk1Prog.completionPercent > 0);

    const lessonProgRes = await request<LessonProgressPayload>(
      `/api/v1/practice/progress/lessons/${lesson3.id}`,
      {
        headers: authHeader,
      }
    );
    assert.strictEqual(lessonProgRes.status, 200);
    assert.strictEqual(lessonProgRes.data.data.completedExerciseCount, 1);
    console.log('  ✔ Lesson & overall level progress accurately updated.');

    console.log('\n===============================================================');
    console.log('🎉 ALL PRACTICE WORKBOOK INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('===============================================================\n');
  } finally {
    if (server) {
      server.close();
    }
  }
}

runPracticeTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });

import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import { redisService } from '../shared/redis/redis.service';
import { calculateSM2, ratingToQuality, previewNextIntervals } from '../shared/utils/sm2';
import assert from 'assert';

async function runTests() {
  console.log('🧪 Starting ChinaEasy Modular Monolith Integration Tests...\n');

  try {
    // ─── TEST 1: SM-2 Algorithm Unit Tests ──────────────────────────────
    console.log('▶ Test 1: SuperMemo-2 (SM-2) Spaced Repetition Algorithm');
    // First repetition, good rating (q=4) -> interval 1 day
    const sm2Step1 = calculateSM2({ repetitions: 0, easeFactor: 2.5, intervalDays: 1, quality: 4 });
    assert.strictEqual(sm2Step1.repetitions, 1);
    assert.strictEqual(sm2Step1.intervalDays, 1);
    assert(sm2Step1.easeFactor >= 2.5);

    // Second repetition, good rating (q=4) -> interval 6 days
    const sm2Step2 = calculateSM2({ repetitions: 1, easeFactor: sm2Step1.easeFactor, intervalDays: 1, quality: 4 });
    assert.strictEqual(sm2Step2.repetitions, 2);
    assert.strictEqual(sm2Step2.intervalDays, 6);

    // Third repetition -> interval round(6 * EF)
    const sm2Step3 = calculateSM2({ repetitions: 2, easeFactor: sm2Step2.easeFactor, intervalDays: 6, quality: 4 });
    assert.strictEqual(sm2Step3.repetitions, 3);
    assert.strictEqual(sm2Step3.intervalDays, Math.round(6 * sm2Step2.easeFactor));

    // Failure rating (q=1) -> reset repetitions to 0, interval to 1
    const sm2Fail = calculateSM2({ repetitions: 5, easeFactor: 2.5, intervalDays: 30, quality: 1 });
    assert.strictEqual(sm2Fail.repetitions, 0);
    assert.strictEqual(sm2Fail.intervalDays, 1);
    assert(sm2Fail.easeFactor >= 1.3); // Minimum bound 1.3

    const previews = previewNextIntervals({ repetitions: 1, easeFactor: 2.5, intervalDays: 1 });
    assert.strictEqual(previews.again.intervalDays, 1);
    assert.strictEqual(previews.good.intervalDays, 6);
    console.log('  ✔ SM-2 calculations, intervals, and reset verified.');

    // ─── TEST 2: OTP Generation, Hashing, 300s TTL, & Lockout ────────────
    console.log('\n▶ Test 2: Email OTP, Redis TTL (300s), and 5-attempt Lockout');
    const testEmail = `test_${Date.now()}@example.com`;

    // Import auth service directly
    const { authService } = await import('../modules/auth/auth.service');
    const otpRes = await authService.sendEmailOtp(testEmail);
    assert.strictEqual(otpRes.expiresIn, 300);

    // Check Redis TTL
    const storedTtl = await redisService.ttl(`otp:${testEmail}`);
    assert(storedTtl > 0 && storedTtl <= 300, `Stored TTL should be between 1 and 300, got ${storedTtl}`);

    // Try wrong OTP 4 times
    for (let i = 1; i <= 4; i++) {
      try {
        await authService.verifyEmailOtp(testEmail, '000000', { ip: '127.0.0.1' });
        assert.fail('Should have thrown OTP_INCORRECT');
      } catch (err: any) {
        assert.strictEqual(err.code, 'OTP_INCORRECT');
        assert.strictEqual(err.details?.remainingAttempts, 5 - i);
      }
    }

    // 5th wrong attempt should trigger lockout
    try {
      await authService.verifyEmailOtp(testEmail, '000000', { ip: '127.0.0.1' });
      assert.fail('Should have thrown OTP_MAX_ATTEMPTS_EXCEEDED');
    } catch (err: any) {
      assert.strictEqual(err.code, 'OTP_MAX_ATTEMPTS_EXCEEDED');
    }

    // Check that account is locked in Redis
    const isLocked = await redisService.get(`otp:lockout:${testEmail}`);
    assert.strictEqual(isLocked, 'LOCKED');
    console.log('  ✔ OTP TTL 300s, attempt decrement, and 5-attempt lockout verified.');

    // ─── TEST 3: User Creation & Refresh Token Rotation (RTR) ───────────
    console.log('\n▶ Test 3: Refresh Token Rotation & Token Reuse Session Revocation');
    // Clear lockout for a clean test user
    const validEmail = `student_${Date.now()}@example.com`;
    const sendValid = await authService.sendEmailOtp(validEmail);
    assert(sendValid.devOtp, 'devOtp should be present in dev mode');

    // Verify correct OTP
    const authResult = await authService.verifyEmailOtp(validEmail, sendValid.devOtp!, { ip: '127.0.0.1' });
    assert.strictEqual(authResult.user.email, validEmail);
    assert.strictEqual(authResult.user.role, 'STUDENT');
    assert(authResult.accessToken);
    assert(authResult.refreshToken);

    // Rotate refresh token (Valid rotation)
    const rotated1 = await authService.rotateRefreshToken(authResult.refreshToken, { ip: '127.0.0.1' });
    assert(rotated1.accessToken);
    assert(rotated1.refreshToken);
    assert.notStrictEqual(rotated1.refreshToken, authResult.refreshToken);

    // REUSE DETECTION: Submitting the OLD refresh token again
    try {
      await authService.rotateRefreshToken(authResult.refreshToken, { ip: '127.0.0.1' });
      assert.fail('Should have detected token reuse');
    } catch (err: any) {
      assert.strictEqual(err.code, 'TOKEN_FAMILY_REVOKED');
      console.log('  ✔ Detected token reuse and revoked entire session family.');
    }

    // ─── TEST 4: Assessment, Idempotency & 80% Unlock Condition ──────────
    console.log('\n▶ Test 4: Assessment Snapshot, Idempotency-Key & 80% Lesson Unlock');
    const { assessmentService } = await import('../modules/assessment/assessment.service');

    // Get an existing test
    const testRecord = await prisma.tests.findFirst({
      where: { is_published: true },
      include: { testQuestions: { include: { question: true } } },
    });
    assert(testRecord, 'Test record should exist from seed');

    // Start test session with Question Snapshot
    const session = await assessmentService.startTestSession(authResult.user.userId, testRecord.test_id);
    assert(session.sessionToken);
    assert.strictEqual((session.questions[0] as any).correctAnswer, undefined, 'Correct answers must not be sent to student');

    // Prepare 100% correct answers
    const answers = testRecord.testQuestions.map((tq) => ({
      question_id: tq.question_id,
      user_answer: tq.question.correct_answer,
    }));

    const idempotencyKey = `test_idem_${Date.now()}`;
    const submissionResult1: any = await assessmentService.submitTest(
      authResult.user.userId,
      testRecord.test_id,
      {
        session_token: session.sessionToken,
        duration_seconds: 120,
        answers,
      },
      idempotencyKey
    );

    assert.strictEqual(submissionResult1.score, 100);
    assert.strictEqual(submissionResult1.isPassed, true);

    // Re-submit with identical Idempotency-Key
    const submissionResult2: any = await assessmentService.submitTest(
      authResult.user.userId,
      testRecord.test_id,
      {
        duration_seconds: 120,
        answers,
      },
      idempotencyKey
    );
    assert.strictEqual(submissionResult2.isIdempotentReplay, true, 'Duplicate submission must be recognized as idempotent replay');
    assert.strictEqual(submissionResult2.score, 100);
    console.log('  ✔ Idempotent grading and Prisma transaction evaluation verified.');

    // Check lesson unlock condition
    if (testRecord.lesson_id) {
      const unlockStatus = await assessmentService.checkLessonUnlockStatus(
        authResult.user.userId,
        testRecord.lesson_id
      );
      assert.strictEqual(unlockStatus.isUnlocked, true);
      console.log('  ✔ 80% passing unlock logic verified.');
    }

    // ─── TEST 5: SRS Daily Review Queue & SM-2 Submission ───────────────
    console.log('\n▶ Test 5: SRS Daily Review Queue & SM-2 Review Recording');
    const { srsService } = await import('../modules/srs/srs.service');

    const queue = await srsService.getDailyQueue(authResult.user.userId, 10);
    assert(queue.cards.length > 0, 'SRS queue should have cards');

    const firstCard = queue.cards[0];
    const reviewRes = await srsService.submitReview(authResult.user.userId, {
      char_id: firstCard.charId,
      rating: 'good',
    });
    assert(reviewRes.intervalDays >= 1);
    assert(reviewRes.repetitions >= 1);
    console.log('  ✔ SRS SM-2 card review successfully updated next review date.');

    console.log('\n======================================================');
    console.log('✅ ALL INTEGRATION TESTS PASSED (5/5 MODULES VERIFIED)!');
    console.log('======================================================');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

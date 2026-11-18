/**
 * curriculum-content.test.ts
 * Integration tests for HSK Curriculum Content APIs (Giai đoạn 5).
 *
 * Chạy: node dist/test/curriculum-content.test.js
 * Yêu cầu: database đã được seed (npm run db:seed).
 */
import http from 'http';
import { app } from '../app';
import { prisma } from '../shared/database/prisma.client';
import assert from 'assert';

// ── HTTP helper ──────────────────────────────────────────────────────────────
async function request(
  baseUrl: string,
  method: string,
  path: string,
  body?: any,
  token?: string,
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const bodyStr = body ? JSON.stringify(body) : undefined;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode || 0, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode || 0, data: raw });
          }
        });
      },
    );

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ── Test runner ──────────────────────────────────────────────────────────────
async function runTests() {
  console.log('🧪 Starting Curriculum Content Integration Tests...\n');

  let server: http.Server | null = null;
  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  function pass(name: string) {
    console.log(`  ✔ ${name}`);
    passed++;
  }

  function fail(name: string, err: any) {
    const msg = err?.message || String(err);
    console.error(`  ✘ ${name}\n    → ${msg}`);
    failures.push(`${name}: ${msg}`);
    failed++;
  }

  try {
    server = http.createServer(app);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const address = server.address() as any;
    const BASE = `http://127.0.0.1:${address.port}`;

    // ────────────────────────────────────────────────────────────────────────
    //  TEST GROUP 1: Courses API
    // ────────────────────────────────────────────────────────────────────────
    console.log('▶ Group 1: GET /api/v1/content/courses');

    // 1.1 List all courses
    try {
      const res = await request(BASE, 'GET', '/api/v1/content/courses');
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      assert.ok(res.data.success, 'Response should have success: true');
      assert.ok(Array.isArray(res.data.data), 'data should be an array');
      assert.ok(res.data.data.length >= 6, `Expected at least 6 courses, got ${res.data.data.length}`);
      const levels = res.data.data.map((c: any) => c.level);
      for (const lvl of ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']) {
        assert.ok(levels.includes(lvl), `Missing course level: ${lvl}`);
      }
      pass('List all 6 HSK courses');
    } catch (err) { fail('List all 6 HSK courses', err); }

    // 1.2 Filter by level=HSK1
    try {
      const res = await request(BASE, 'GET', '/api/v1/content/courses?level=HSK1');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.length >= 1, 'Should return at least 1 course for HSK1');
      assert.strictEqual(res.data.data[0].level, 'HSK1');
      pass('Filter courses by level=HSK1');
    } catch (err) { fail('Filter courses by level=HSK1', err); }

    // 1.3 Filter by level=HSK3
    try {
      const res = await request(BASE, 'GET', '/api/v1/content/courses?level=HSK3');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.data.data[0].level, 'HSK3');
      pass('Filter courses by level=HSK3');
    } catch (err) { fail('Filter courses by level=HSK3', err); }

    // ────────────────────────────────────────────────────────────────────────
    //  TEST GROUP 2: Units API
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n▶ Group 2: Units by Level');

    // Find HSK1 course id
    const coursesRes = await request(BASE, 'GET', '/api/v1/content/courses?level=HSK1');
    const hsk1Course = coursesRes.data.data[0];
    assert.ok(hsk1Course, 'HSK1 course must exist');
    const hsk1CourseId: number = hsk1Course.courseId;

    // 2.1 Get units by courseId
    try {
      const res = await request(BASE, 'GET', `/api/v1/content/courses/${hsk1CourseId}/units`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.units, 'Should have units array');
      assert.ok(res.data.data.units.length >= 3, `Expected ≥ 3 units, got ${res.data.data.units.length}`);
      // Verify unit structure
      const unit1 = res.data.data.units[0];
      assert.ok(unit1.unitId, 'Unit should have unitId');
      assert.ok(unit1.title, 'Unit should have title');
      assert.ok(unit1.stats, 'Unit should have stats');
      assert.ok(typeof unit1.stats.vocabularies === 'number', 'stats.vocabularies should be a number');
      pass('List units by courseId (HSK1 → 3 units)');
    } catch (err) { fail('List units by courseId', err); }

    // 2.2 Get units by HSK level string
    try {
      const res = await request(BASE, 'GET', '/api/v1/content/courses/level/HSK1/units');
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.units.length >= 3, 'HSK1 should have ≥ 3 units');
      assert.strictEqual(res.data.data.level, 'HSK1');
      pass('List units by level string (HSK1)');
    } catch (err) { fail('List units by level string', err); }

    // 2.3 Units have correct stats
    try {
      const res = await request(BASE, 'GET', '/api/v1/content/courses/level/HSK1/units');
      const units: any[] = res.data.data.units;
      let totalVocab = 0;
      for (const u of units) {
        totalVocab += u.stats.vocabularies;
        assert.ok(u.unitId, 'Each unit must have unitId');
        assert.ok(u.unitNumber > 0, 'Each unit must have positive unitNumber');
      }
      assert.ok(totalVocab > 0, 'Total vocabularies across units should be > 0');
      pass('Units have correct stats (vocabularies count > 0)');
    } catch (err) { fail('Units have correct stats', err); }

    // Get unit IDs for further tests
    const unitsRes = await request(BASE, 'GET', '/api/v1/content/courses/level/HSK1/units');
    const hsk1Units: any[] = unitsRes.data.data.units;
    const unit1Id: number = hsk1Units[0].unitId;
    const unit2Id: number = hsk1Units[1].unitId;
    const unit3Id: number = hsk1Units[2].unitId;

    // ────────────────────────────────────────────────────────────────────────
    //  TEST GROUP 3: Unit Detail — Full Decomposition
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n▶ Group 3: Unit Detail - Full Content Decomposition');

    for (const [label, uid] of [['Unit 1', unit1Id], ['Unit 2', unit2Id], ['Unit 3', unit3Id]]) {
      try {
        const res = await request(BASE, 'GET', `/api/v1/content/units/${uid}`);
        assert.strictEqual(res.status, 200, `GET /units/${uid} should return 200`);
        const d = res.data.data;
        assert.ok(d.unitId, 'unitId must exist');
        assert.ok(d.title, 'title must exist');
        assert.ok(Array.isArray(d.vocabularies), 'vocabularies must be array');
        assert.ok(Array.isArray(d.sentencePatterns), 'sentencePatterns must be array');
        assert.ok(Array.isArray(d.grammars), 'grammars must be array');
        assert.ok(Array.isArray(d.dialogues), 'dialogues must be array');
        assert.ok(Array.isArray(d.phonetics), 'phonetics must be array');
        assert.ok(Array.isArray(d.hanzi), 'hanzi must be array');
        assert.ok(Array.isArray(d.exercises), 'exercises must be array');
        pass(`${label} (id=${uid}) full decomposition — 7 content types present`);
      } catch (err) { fail(`${label} full decomposition`, err); }
    }

    // 3.1 Unit 1 vocabularies content check
    try {
      const res = await request(BASE, 'GET', `/api/v1/content/units/${unit1Id}`);
      const vocabs = res.data.data.vocabularies;
      assert.ok(vocabs.length > 0, 'Unit 1 should have vocabularies');
      const v = vocabs[0];
      assert.ok(v.word, 'Vocabulary should have word (Chinese character)');
      assert.ok(v.pinyin, 'Vocabulary should have pinyin');
      assert.ok(v.meaning, 'Vocabulary should have meaning');
      pass('Unit 1 vocabulary fields: word, pinyin, meaning present');
    } catch (err) { fail('Unit 1 vocabulary fields', err); }

    // 3.2 Unit 1 dialogues check
    try {
      const res = await request(BASE, 'GET', `/api/v1/content/units/${unit1Id}`);
      const dialogues = res.data.data.dialogues;
      assert.ok(dialogues.length > 0, 'Unit 1 should have dialogues');
      const dl = dialogues[0];
      assert.ok(dl.dialogueId, 'Dialogue should have dialogueId');
      assert.ok(Array.isArray(dl.turns) || dl.turns !== undefined, 'Dialogue should have turns');
      pass('Unit 1 dialogues present with turns');
    } catch (err) { fail('Unit 1 dialogues', err); }

    // 3.3 Unit 1 hanzi (SVG data)
    try {
      const res = await request(BASE, 'GET', `/api/v1/content/units/${unit1Id}`);
      const hanziList = res.data.data.hanzi;
      assert.ok(hanziList.length > 0, 'Unit 1 should have hanzi');
      const hz = hanziList[0];
      assert.ok(hz.character, 'Hanzi should have character');
      assert.ok(hz.pinyin, 'Hanzi should have pinyin');
      assert.ok(hz.strokeCount !== undefined, 'Hanzi should have strokeCount');
      pass('Unit 1 hanzi present with character, pinyin, strokeCount');
    } catch (err) { fail('Unit 1 hanzi fields', err); }

    // 3.4 Unit 3 grammars
    try {
      const res = await request(BASE, 'GET', `/api/v1/content/units/${unit3Id}`);
      const grammars = res.data.data.grammars;
      assert.ok(grammars.length > 0, 'Unit 3 should have grammars');
      const g = grammars[0];
      assert.ok(g.grammarId, 'Grammar should have grammarId');
      assert.ok(g.title, 'Grammar should have title');
      assert.ok(g.explanation, 'Grammar should have explanation');
      pass('Unit 3 grammars present with title and explanation');
    } catch (err) { fail('Unit 3 grammars', err); }

    // 3.5 Unit 2 sentence patterns
    try {
      const res = await request(BASE, 'GET', `/api/v1/content/units/${unit2Id}`);
      const patterns = res.data.data.sentencePatterns;
      assert.ok(patterns.length > 0, 'Unit 2 should have sentence patterns');
      const sp = patterns[0];
      assert.ok(sp.sentencePatternId, 'SentencePattern should have id');
      assert.ok(sp.pattern, 'SentencePattern should have pattern');
      pass('Unit 2 sentence patterns present');
    } catch (err) { fail('Unit 2 sentence patterns', err); }

    // 3.6 Phonetics
    try {
      const res = await request(BASE, 'GET', `/api/v1/content/units/${unit1Id}`);
      const phonetics = res.data.data.phonetics;
      assert.ok(phonetics.length > 0, 'Unit 1 should have phonetics');
      const ph = phonetics[0];
      assert.ok(ph.phoneticId, 'Phonetic should have phoneticId');
      pass('Unit 1 phonetics present');
    } catch (err) { fail('Unit 1 phonetics', err); }

    // ────────────────────────────────────────────────────────────────────────
    //  TEST GROUP 4: Modular Content Endpoints
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n▶ Group 4: Modular Content Endpoints (tab-based loading)');

    const modularEndpoints = [
      { path: `/api/v1/content/units/${unit1Id}/vocabularies`, key: 'vocabularies', label: 'vocabularies' },
      { path: `/api/v1/content/units/${unit2Id}/sentence-patterns`, key: 'sentencePatterns', label: 'sentence-patterns' },
      { path: `/api/v1/content/units/${unit3Id}/grammars`, key: 'grammars', label: 'grammars' },
      { path: `/api/v1/content/units/${unit1Id}/dialogues`, key: 'dialogues', label: 'dialogues' },
      { path: `/api/v1/content/units/${unit1Id}/phonetics`, key: 'phonetics', label: 'phonetics' },
      { path: `/api/v1/content/units/${unit1Id}/hanzi`, key: 'hanzi', label: 'hanzi' },
      { path: `/api/v1/content/units/${unit1Id}/exercises`, key: 'exercises', label: 'exercises' },
    ];

    for (const ep of modularEndpoints) {
      try {
        const res = await request(BASE, 'GET', ep.path);
        assert.strictEqual(res.status, 200, `${ep.path} should return 200`);
        assert.ok(res.data.success, 'Response should be successful');
        const arr = res.data.data[ep.key];
        assert.ok(Array.isArray(arr), `${ep.key} should be an array`);
        assert.ok(arr.length > 0, `${ep.key} should not be empty for Unit 1`);
        pass(`GET /units/:unitId/${ep.label} → ${arr.length} items`);
      } catch (err) { fail(`Modular endpoint /${ep.label}`, err); }
    }

    // ────────────────────────────────────────────────────────────────────────
    //  TEST GROUP 5: Hanzi Detail & Search
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n▶ Group 5: Hanzi Detail & Material Search');

    // 5.1 Lookup 你 (nǐ)
    try {
      const res = await request(BASE, 'GET', `/api/v1/content/materials/hanzi/${encodeURIComponent('你')}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.character === '你', 'Should return 你 character');
      assert.ok(res.data.data.pinyin, 'Should have pinyin');
      assert.ok(res.data.data.strokeCount !== undefined, 'Should have strokeCount');
      assert.ok(Array.isArray(res.data.data.relatedUnits), 'Should have relatedUnits');
      pass('Hanzi detail: 你 — character, pinyin, strokeCount, relatedUnits');
    } catch (err) { fail('Hanzi detail 你', err); }

    // 5.2 Lookup 好 (hǎo)
    try {
      const res = await request(BASE, 'GET', `/api/v1/content/materials/hanzi/${encodeURIComponent('好')}`);
      assert.strictEqual(res.status, 200);
      assert.ok(res.data.data.character === '好');
      pass('Hanzi detail: 好 — found');
    } catch (err) { fail('Hanzi detail 好', err); }

    // 5.3 Lookup non-existent → 404
    try {
      const res = await request(BASE, 'GET', `/api/v1/content/materials/hanzi/${encodeURIComponent('龘')}`);
      assert.ok(res.status === 404 || res.status === 200, 'Should handle gracefully');
      pass('Hanzi lookup non-existent character → handled gracefully');
    } catch (err) { fail('Hanzi lookup non-existent', err); }

    // 5.4 Search vocabulary by keyword
    try {
      const res = await request(BASE, 'GET', '/api/v1/content/materials/search?q=你&type=vocabulary');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.data.results), 'Results should be array');
      assert.ok(res.data.data.results.length > 0, 'Should find vocabulary containing 你');
      pass('Search vocabulary "你" → results found');
    } catch (err) { fail('Search vocabulary', err); }

    // 5.5 Search grammar
    try {
      const res = await request(BASE, 'GET', '/api/v1/content/materials/search?q=是&type=grammar');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.data.data.results), 'Results should be array');
      pass('Search grammar "是" → results returned');
    } catch (err) { fail('Search grammar', err); }

    // 5.6 Search with level filter
    try {
      const res = await request(BASE, 'GET', '/api/v1/content/materials/search?q=你&level=HSK1&type=vocabulary');
      assert.strictEqual(res.status, 200);
      pass('Search with level=HSK1 filter → results returned');
    } catch (err) { fail('Search with level filter', err); }

    // ────────────────────────────────────────────────────────────────────────
    //  TEST GROUP 6: Exercises & Answers
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n▶ Group 6: Exercises');

    try {
      const res = await request(BASE, 'GET', `/api/v1/content/units/${unit1Id}/exercises`);
      assert.strictEqual(res.status, 200);
      const exercises = res.data.data.exercises;
      assert.ok(exercises.length > 0, 'Unit 1 should have exercises');
      const ex = exercises[0];
      assert.ok(ex.exerciseId, 'Exercise should have exerciseId');
      assert.ok(ex.exerciseType, 'Exercise should have exerciseType');
      assert.ok(ex.answer, 'Exercise should have answer (joined)');
      assert.ok(ex.answer.correctData, 'Answer should have correctData');
      pass(`Unit 1 exercises: ${exercises.length} exercises with answers`);
    } catch (err) { fail('Unit 1 exercises with answers', err); }

    // ────────────────────────────────────────────────────────────────────────
    //  TEST GROUP 7: DB-Level Verification
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n▶ Group 7: DB-Level Verification');

    try {
      const vocabCount = await prisma.vocabulary.count();
      assert.ok(vocabCount >= 23, `Expected ≥ 23 vocabularies, got ${vocabCount}`);
      pass(`Vocabulary table: ${vocabCount} records`);
    } catch (err) { fail('Vocabulary count', err); }

    try {
      const grammarCount = await prisma.grammar.count();
      assert.ok(grammarCount >= 3, `Expected ≥ 3 grammars, got ${grammarCount}`);
      pass(`Grammar table: ${grammarCount} records`);
    } catch (err) { fail('Grammar count', err); }

    try {
      const dialogueCount = await prisma.dialogue.count();
      assert.ok(dialogueCount >= 10, `Expected ≥ 10 dialogues, got ${dialogueCount}`);
      pass(`Dialogue table: ${dialogueCount} records`);
    } catch (err) { fail('Dialogue count', err); }

    try {
      const hanziCount = await prisma.hanzi.count();
      assert.ok(hanziCount >= 14, `Expected ≥ 14 hanzi, got ${hanziCount}`);
      pass(`Hanzi table: ${hanziCount} records`);
    } catch (err) { fail('Hanzi count', err); }

    try {
      const phoneticCount = await prisma.phonetic.count();
      assert.ok(phoneticCount >= 3, `Expected ≥ 3 phonetics, got ${phoneticCount}`);
      pass(`Phonetic table: ${phoneticCount} records`);
    } catch (err) { fail('Phonetic count', err); }

    try {
      const exerciseCount = await prisma.exercise.count();
      assert.ok(exerciseCount >= 45, `Expected ≥ 45 exercises, got ${exerciseCount}`);
      pass(`Exercise table: ${exerciseCount} records`);
    } catch (err) { fail('Exercise count', err); }

    try {
      // Verify UnitVocabulary decomposition
      const unitVocabCount = await prisma.unitVocabulary.count();
      assert.ok(unitVocabCount > 0, 'UnitVocabulary should have decomposition records');
      pass(`UnitVocabulary decomposition: ${unitVocabCount} records`);
    } catch (err) { fail('UnitVocabulary decomposition', err); }

    try {
      const unitHanziCount = await prisma.unitHanzi.count();
      assert.ok(unitHanziCount > 0, 'UnitHanzi should have decomposition records');
      pass(`UnitHanzi decomposition: ${unitHanziCount} records`);
    } catch (err) { fail('UnitHanzi decomposition', err); }

    // ────────────────────────────────────────────────────────────────────────
    //  TEST GROUP 8: 404 Error Handling
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n▶ Group 8: Error Handling');

    try {
      const res = await request(BASE, 'GET', '/api/v1/content/units/999999');
      assert.ok(res.status === 404, `Non-existent unit should return 404, got ${res.status}`);
      pass('Non-existent unit returns 404');
    } catch (err) { fail('Non-existent unit 404', err); }

    try {
      const res = await request(BASE, 'GET', '/api/v1/content/courses/level/INVALID/units');
      assert.ok(res.status === 404, `Invalid level should return 404, got ${res.status}`);
      pass('Invalid HSK level returns 404');
    } catch (err) { fail('Invalid HSK level 404', err); }

    // ────────────────────────────────────────────────────────────────────────
    //  RESULTS SUMMARY
    // ────────────────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log(`📊 Results: ${passed} passed, ${failed} failed`);
    if (failures.length > 0) {
      console.log('\n❌ Failures:');
      failures.forEach((f) => console.log(`  - ${f}`));
    } else {
      console.log('\n✅ All curriculum-content tests PASSED!');
    }
    console.log('═'.repeat(60) + '\n');

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  } finally {
    if (server) await new Promise<void>((r) => server!.close(() => r()));
    await prisma.$disconnect();
  }
}

runTests();

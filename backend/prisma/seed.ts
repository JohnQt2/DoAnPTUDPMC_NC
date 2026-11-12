import { PrismaClient } from '@prisma/client';
import { importLearningContent } from './importers/import-learning-content';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ChinaEasy Database with rich pedagogical content...');

  // 1. Users & Roles
  const admin = await prisma.users.upsert({
    where: { email: 'admin@chinaeasy.vn' },
    update: {},
    create: {
      email: 'admin@chinaeasy.vn',
      display_name: 'Quản Trị Viên (Admin)',
      role: 'ADMIN',
      status: 'ACTIVE',
      notificationSettings: {
        create: {
          reminder_time: '19:30',
          notify_email: true,
          notify_webpush: true,
        },
      },
    },
  });

  const editor = await prisma.users.upsert({
    where: { email: 'editor@chinaeasy.vn' },
    update: {},
    create: {
      email: 'editor@chinaeasy.vn',
      display_name: 'Biên Tập Viên (Editor)',
      role: 'CONTENT_EDITOR',
      status: 'ACTIVE',
      notificationSettings: {
        create: {
          reminder_time: '20:00',
          notify_email: true,
        },
      },
    },
  });

  const student = await prisma.users.upsert({
    where: { email: 'student@chinaeasy.vn' },
    update: {},
    create: {
      email: 'student@chinaeasy.vn',
      display_name: 'Học Viên Demo',
      role: 'STUDENT',
      status: 'ACTIVE',
      notificationSettings: {
        create: {
          reminder_time: '20:30',
          notify_email: true,
          notify_webpush: false,
        },
      },
    },
  });

  console.log('✅ Users created: admin, editor, student');

  // 2. Characters with SVG Stroke Order
  const charactersData = [
    {
      character: '你',
      pinyin: 'nǐ',
      sino_vietnamese: 'Nhĩ',
      meaning: 'Bạn, anh, chị (ngôi thứ 2 số ít)',
      radical: '亻 (Nhân đứng)',
      strokes_count: 7,
      stroke_order_svg: JSON.stringify([
        'M35,18 c-0.1,5 -1.2,14 -4.8,22 c-4.2,9.3 -11.5,21.8 -21.2,29.7',
        'M27,42 c0.6,0.6 0.9,1.8 0.9,3.1 c0,13.6 -0.3,42.4 -0.3,49.4',
        'M58,16 c0.04,0.6 0.17,1.6 -0.08,2.3 c-2.3,6.3 -6.8,14.6 -12.4,20.8',
        'M54,34 c2.8,0 20.2,-2.7 22.8,-2.7 c2.6,0 3.7,1.8 1.9,3.8 C73.4,41.4 67.5,48.2 60,54',
        'M50,44 c0.7,0.7 1.1,1.8 1.1,3.1 c0,14.2 -0.4,41.9 -0.4,46.9',
        'M52,65 c6,-0.8 22,-2.5 28.5,-3.2',
        'M69,45 c0.8,0.8 1.2,2 1.2,3.3 c0,9.7 -0.2,35.2 -0.2,42.2 c0,9 5.5,8 14.5,8 c8,0 10.5,-1.5 10.5,-7.5',
      ]),
    },
    {
      character: '好',
      pinyin: 'hǎo',
      sino_vietnamese: 'Hảo',
      meaning: 'Tốt, đẹp, hay, khỏe',
      radical: '女 (Nữ)',
      strokes_count: 6,
      stroke_order_svg: JSON.stringify([
        'M28,18 c0.4,1 0.6,2.4 0.4,3.8 C26.7,35 20.3,55.8 15.8,63.2 c-0.9,1.5 -0.2,2.1 0.4,2.2 c7.8,1.4 16.5,5.2 21.8,11.8',
        'M39.5,33 c0.1,1.1 0.2,3.2 -0.2,4.8 C35.7,52 26.2,74.5 11,85',
        'M10,48 c0.7,0.3 2.6,0.4 3.7,0.3 c8.8,-0.8 19.3,-2.3 29.8,-3.1 c1.8,-0.1 3.5,0.2 4.5,0.4',
        'M59,20 c1.2,0.5 2.8,0.7 4.2,0.5 c4.6,-0.7 17.1,-3.5 18.6,-3.7 c2.2,-0.3 3.6,1.4 1.8,3.4 C77.5,27.5 69,38 64,42',
        'M64,41 c2.2,2.8 10.5,18.8 13.8,38.2 c0.9,5.5 -0.8,9.6 -6.8,9.6 c-5.2,0 -8.5,-5.2 -9.5,-6.2',
        'M47,52 c1.5,0.8 3.8,0.9 5.5,0.6 c9.2,-1.6 27.5,-3.8 38.5,-4.4 c2.3,-0.1 4.2,0.3 5.5,0.7',
      ]),
    },
    {
      character: '我',
      pinyin: 'wǒ',
      sino_vietnamese: 'Ngã',
      meaning: 'Tôi, mình, tao (ngôi thứ nhất số ít)',
      radical: '戈 (Qua)',
      strokes_count: 7,
      stroke_order_svg: JSON.stringify([
        'M36,15 c-0.1,0.9 -0.6,1.9 -1.2,2.4 c-4.6,3.6 -12.4,7.8 -23.8,11.2',
        'M18,39 c0.7,0.4 2.8,0.6 4.1,0.5 c7.9,-0.6 15.9,-2.4 23.4,-3.6 c1.3,-0.2 2.7,0.1 3.5,0.3',
        'M32.5,27 c0.9,0.9 1.4,2.2 1.4,3.7 c0,14.3 -0.2,49.2 -0.2,55.1 c0,4.2 -1.2,6.2 -4.2,3.2 c-3,-3 -5.5,-5.5 -7.5,-7.2',
        'M16,66 c1.5,1.2 2.8,1.2 4.2,0.5 c5.8,-3 14.8,-8.2 21.8,-12.7',
        'M64,12 c1,1.2 1.5,2.8 1.6,4.5 c1.5,22.5 8,62 23.4,78 c4.5,4.6 4,-2 3.8,-7.5',
        'M84,38 c0.1,0.9 -0.2,2.3 -0.7,3.3 c-3.5,6.5 -11.5,17.2 -24.8,25.2',
        'M77,16 c3.5,1.8 8.5,5.8 10.2,8.8',
      ]),
    },
    {
      character: '是',
      pinyin: 'shì',
      sino_vietnamese: 'Thị',
      meaning: 'Là, phải, đúng',
      radical: '日 (Nhật)',
      strokes_count: 9,
      stroke_order_svg: JSON.stringify([
        'M29,14 c0.8,0.8 1.3,1.8 1.3,3 c0,10.2 -0.2,23.5 -0.2,27',
        'M31,16 c4.5,-0.6 34.5,-4 38,-4.2 c2.5,-0.2 3.8,1.2 3.8,3.5 c0,6.2 -0.5,17.5 -0.5,24.5',
        'M31,30 c6.5,-0.7 33.5,-3.2 40.5,-3.5',
        'M31,43 c9.5,-0.8 31.5,-2.8 40,-3.2',
        'M18,57 c1.8,0.6 4.5,0.4 6.5,0.2 c16.5,-1.6 38.5,-3.8 55.5,-4.6 c2.5,-0.1 4.5,0.3 6,0.6',
        'M49,45 c0.8,0.8 1.2,2 1.2,3.2 c0,6.5 -0.2,21.5 -0.2,27.5',
        'M32,67 c0.1,0.8 -0.1,1.8 -0.5,2.4 c-2.8,4.2 -8.5,10.8 -18.5,16.2',
        'M30,76 c4.5,-0.5 12.5,-1.5 17.5,-2.2',
        'M52,62 c5.5,5.2 21.5,18.5 32.5,24.5 c2.5,1.4 5.2,2.8 8,3.2',
      ]),
    },
    {
      character: '人',
      pinyin: 'rén',
      sino_vietnamese: 'Nhân',
      meaning: 'Người, con người',
      radical: '人 (Nhân)',
      strokes_count: 2,
      stroke_order_svg: JSON.stringify([
        'M52,15 c0.2,1.8 0.4,3.5 -0.4,5.2 C46.5,33.5 33.5,63.5 12,82',
        'M49,38 c6.5,8.8 24.5,31.2 36.5,41.5 c2.8,2.4 5.8,4.8 9.5,6',
      ]),
    },
  ];

  for (const c of charactersData) {
    await prisma.characters.upsert({
      where: { character: c.character },
      update: c,
      create: c,
    });
  }
  console.log('✅ Characters created with SVG strokes: 你, 好, 我, 是, 人');

  // 3. Pinyin Syllables & Minimal Pairs
  const p1 = await prisma.pinyinSyllables.create({
    data: {
      syllable: 'bā',
      tone: 1,
      category: 'INITIAL',
      f0_pitch_contour: '55',
      mouth_shape_guide: 'Âm môi hai bên khép chặt, không bật hơi, luồng khí nhẹ thoát ra tự nhiên.',
    },
  });

  const p2 = await prisma.pinyinSyllables.create({
    data: {
      syllable: 'pā',
      tone: 1,
      category: 'INITIAL',
      f0_pitch_contour: '55',
      mouth_shape_guide: 'Âm môi hai bên khép chặt, BẬT HƠI RẤT MẠNH từ cơ hoành làm rung tờ giấy trước miệng.',
      contrast_pair_id: p1.syllable_id,
    },
  });

  const p3 = await prisma.pinyinSyllables.create({
    data: {
      syllable: 'mā',
      tone: 1,
      category: 'SYLLABLE',
      f0_pitch_contour: '55',
      mouth_shape_guide: 'Thanh 1: Ngân đều đặn ở cao độ bậc 5 (cao bằng), giữ hơi thở ổn định.',
    },
  });

  const p4 = await prisma.pinyinSyllables.create({
    data: {
      syllable: 'mà',
      tone: 4,
      category: 'SYLLABLE',
      f0_pitch_contour: '51',
      mouth_shape_guide: 'Thanh 4: Rơi dứt khoát từ bậc 5 xuống bậc 1 (như quát nhẹ hoặc giậm chân).',
      contrast_pair_id: p3.syllable_id,
    },
  });

  console.log('✅ Pinyin Syllables and Minimal Pairs created: bā vs pā, mā vs mà');

  // 4. Course, Chapters & Lessons
  const course = await prisma.courses.upsert({
    where: { code: 'HSK1' },
    update: { is_published: true },
    create: {
      title: 'Khóa Học Tiếng Trung Sơ Cấp HSK 1',
      code: 'HSK1',
      description: 'Lộ trình chuẩn hóa 150 từ vựng căn bản, làm chủ toàn bộ Pinyin, quy tắc bút thuận chữ Hán và đàm thoại tự tin.',
      level: 'HSK1',
      is_published: true,
    },
  });

  const chapter1 = await prisma.chapters.create({
    data: {
      course_id: course.course_id,
      title: 'Chương 1: Khởi Động Với Pinyin & Chào Hỏi Căn Bản',
      order_index: 1,
    },
  });

  const chapter2 = await prisma.chapters.create({
    data: {
      course_id: course.course_id,
      title: 'Chương 2: Giới Thiệu Bản Thân & Quốc Tịch',
      order_index: 2,
    },
  });

  // Lesson 1
  const lesson1 = await prisma.lessons.create({
    data: {
      chapter_id: chapter1.chapter_id,
      title: 'Bài 1: Chào hỏi căn bản (你好 - Nǐ hǎo)',
      order_index: 1,
      estimated_duration_mins: 10,
      status: 'PUBLISHED',
    },
  });

  // Link characters to Lesson 1
  const charNi = await prisma.characters.findUnique({ where: { character: '你' } });
  const charHao = await prisma.characters.findUnique({ where: { character: '好' } });
  if (charNi && charHao) {
    await prisma.lessonVocabularies.createMany({
      data: [
        { lesson_id: lesson1.lesson_id, char_id: charNi.char_id },
        { lesson_id: lesson1.lesson_id, char_id: charHao.char_id },
      ],
    });
  }

  // Lesson Blocks for Lesson 1
  await prisma.lessonBlocks.createMany({
    data: [
      {
        lesson_id: lesson1.lesson_id,
        block_type: 'THEORY',
        order_index: 1,
        content_json: JSON.stringify({
          title: 'Khái niệm Lời chào trong tiếng Trung',
          content: 'Trong tiếng Trung, câu chào phổ biến nhất là "你好" (Nǐ hǎo), được ghép từ "你" (Bạn) và "好" (Tốt/Khỏe). Nghĩa đen là chúc bạn tốt đẹp, an khang.',
        }),
      },
      {
        lesson_id: lesson1.lesson_id,
        block_type: 'PINYIN',
        order_index: 2,
        content_json: JSON.stringify({
          syllables: ['nǐ', 'hǎo'],
          rule: 'Quy tắc biến điệu hai thanh 3: Khi hai âm mang thanh 3 đi liền nhau (nǐ + hǎo), âm đầu tiên biến thành thanh 2: "ní hǎo".',
        }),
      },
      {
        lesson_id: lesson1.lesson_id,
        block_type: 'HANZI',
        order_index: 3,
        content_json: JSON.stringify({
          character: '好',
          meaning: 'Bộ Nữ (女) đứng cạnh bộ Tử (子). Người xưa quan niệm người phụ nữ có con trai con gái sum vầy là điều TỐT ĐẸP nhất.',
        }),
      },
      {
        lesson_id: lesson1.lesson_id,
        block_type: 'AUDIO',
        order_index: 4,
        content_json: JSON.stringify({
          dialogue: [
            { speaker: 'A', hanzi: '你好！', pinyin: 'Nǐ hǎo!', meaning: 'Xin chào bạn!' },
            { speaker: 'B', hanzi: '你好！', pinyin: 'Nǐ hǎo!', meaning: 'Chào bạn!' },
          ],
        }),
      },
    ],
  });

  // Lesson 2
  const lesson2 = await prisma.lessons.create({
    data: {
      chapter_id: chapter1.chapter_id,
      title: 'Bài 2: Nhận diện Thanh 1 và Thanh 4',
      order_index: 2,
      estimated_duration_mins: 12,
      status: 'PUBLISHED',
    },
  });

  // Lesson 3
  const lesson3 = await prisma.lessons.create({
    data: {
      chapter_id: chapter2.chapter_id,
      title: 'Bài 3: Đại từ nhân xưng (我，你，他)',
      order_index: 1,
      estimated_duration_mins: 15,
      status: 'PUBLISHED',
    },
  });

  console.log('✅ Courses, Chapters & Lessons created with content blocks');

  // 5. Question Bank
  const q1 = await prisma.questions.create({
    data: {
      question_type: 'MULTIPLE_CHOICE',
      skill_category: 'READING',
      difficulty_level: 'HSK1',
      content: 'Cụm từ "你好" (nǐ hǎo) có nghĩa tiếng Việt là gì?',
      options_json: JSON.stringify([
        { id: 'A', text: 'Tạm biệt' },
        { id: 'B', text: 'Xin chào' },
        { id: 'C', text: 'Cảm ơn' },
        { id: 'D', text: 'Xin lỗi' },
      ]),
      correct_answer: 'B',
      explanation: '你好 (nǐ hǎo) là câu chào hỏi cơ bản nhất trong tiếng Trung, có nghĩa là "Xin chào".',
    },
  });

  const q2 = await prisma.questions.create({
    data: {
      question_type: 'TONE_PICKER',
      skill_category: 'TONE',
      difficulty_level: 'HSK1',
      content: 'Khi hai thanh 3 đi liền nhau (ví dụ: 你 nǐ + 好 hǎo), thanh điệu của từ đầu tiên biến đổi như thế nào?',
      options_json: JSON.stringify([
        { id: 'A', text: 'Biến thành Thanh 1 (Cao bằng)' },
        { id: 'B', text: 'Biến thành Thanh 2 (Dấu hỏi lướt lên)' },
        { id: 'C', text: 'Biến thành Thanh 4 (Dứt khoát)' },
        { id: 'D', text: 'Giữ nguyên không đổi' },
      ]),
      correct_answer: 'B',
      explanation: 'Quy tắc biến điệu hai thanh 3: 3 + 3 → 2 + 3. Do đó 你好 đọc thành "ní hǎo".',
    },
  });

  const q3 = await prisma.questions.create({
    data: {
      question_type: 'RADICAL_BUILDER',
      skill_category: 'WRITING',
      difficulty_level: 'HSK1',
      content: 'Chữ "好" (hǎo) được cấu tạo từ hai bộ thủ nào ghép lại?',
      options_json: JSON.stringify([
        { id: 'A', text: '亻 (Nhân đứng) + 口 (Khẩu)' },
        { id: 'B', text: '女 (Nữ - phụ nữ) + 子 (Tử - con)' },
        { id: 'C', text: '日 (Nhật - mặt trời) + 月 (Nguyệt)' },
        { id: 'D', text: '木 (Mộc - cây) + 目 (Mục - mắt)' },
      ]),
      correct_answer: 'B',
      explanation: 'Chữ 好 (Hảo) gồm bộ Nữ (女) bên trái và bộ Tử (子) bên phải, mang ý nghĩa tốt đẹp trọn vẹn.',
    },
  });

  const q4 = await prisma.questions.create({
    data: {
      question_type: 'MULTIPLE_CHOICE',
      skill_category: 'READING',
      difficulty_level: 'HSK1',
      content: 'Đại từ nhân xưng ngôi thứ nhất số ít "Tôi, mình" trong tiếng Trung viết là chữ nào?',
      options_json: JSON.stringify([
        { id: 'A', text: '你 (nǐ)' },
        { id: 'B', text: '他 (tā)' },
        { id: 'C', text: '我 (wǒ)' },
        { id: 'D', text: '们 (men)' },
      ]),
      correct_answer: 'C',
      explanation: '我 (wǒ) nghĩa là Tôi, tao, mình trong tiếng Trung.',
    },
  });

  // 6. Test linked to Lesson 1
  const test1 = await prisma.tests.create({
    data: {
      lesson_id: lesson1.lesson_id,
      title: 'Bài Kiểm Tra Củng Cố: Bài 1 (你好)',
      test_type: 'QUIZ',
      passing_score: 80,
      time_limit_mins: 10,
      is_published: true,
    },
  });

  await prisma.testQuestions.createMany({
    data: [
      { test_id: test1.test_id, question_id: q1.question_id, order_index: 1 },
      { test_id: test1.test_id, question_id: q2.question_id, order_index: 2 },
      { test_id: test1.test_id, question_id: q3.question_id, order_index: 3 },
      { test_id: test1.test_id, question_id: q4.question_id, order_index: 4 },
    ],
  });

  console.log('✅ Question Bank and Test created with Snapshot capability');

  // 7. Seed Initial SRS Flashcards for demo student
  if (charNi && charHao) {
    await prisma.userSrsItems.createMany({
      data: [
        {
          user_id: student.user_id,
          char_id: charNi.char_id,
          ease_factor: 2.5,
          interval_days: 1,
          repetitions: 1,
          next_review_at: new Date(Date.now() - 3600000), // Due 1 hour ago
        },
        {
          user_id: student.user_id,
          char_id: charHao.char_id,
          ease_factor: 2.5,
          interval_days: 1,
          repetitions: 2,
          next_review_at: new Date(Date.now() - 7200000), // Due 2 hours ago
        },
      ],
    });
    console.log('✅ Initial SRS review queue seeded for demo student');
  }

  // Additive JSON curriculum import; the legacy seed above remains intact.
  await importLearningContent(prisma);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

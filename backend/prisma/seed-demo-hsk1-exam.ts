import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_TITLE = 'HSK 1 – Đề thi thử 001 (3 kỹ năng • 40 câu)';

interface SeedQuestion {
  question_type: string;
  skill_category: 'LISTENING' | 'READING' | 'WRITING';
  difficulty_level: string;
  content: string;
  options: Array<{ id: string; text: string }>;
  correct_answer: string;
  explanation: string;
}

const QUESTIONS: SeedQuestion[] = [
  // ═══════════════════════════════════════════════════════════
  // PHẦN 1: NGHE HIỂU (15 câu: Câu 1–15)
  // ═══════════════════════════════════════════════════════════
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe đoạn ghi âm: "你好！" — Câu này có nghĩa là gì?',
    options: [
      { id: 'A', text: 'Xin chào!' },
      { id: 'B', text: 'Tạm biệt!' },
      { id: 'C', text: 'Cảm ơn!' },
    ],
    correct_answer: 'A',
    explanation: '你好 (nǐ hǎo) nghĩa là Xin chào.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe đoạn ghi âm: "谢谢你！" — Đáp án đúng là gì?',
    options: [
      { id: 'A', text: 'Xin lỗi bạn' },
      { id: 'B', text: 'Cảm ơn bạn' },
      { id: 'C', text: 'Không có gì' },
    ],
    correct_answer: 'B',
    explanation: '谢谢你 (xièxie nǐ) nghĩa là Cảm ơn bạn.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe đoạn ghi âm: "我叫大卫。" — Người nói đang giới thiệu điều gì?',
    options: [
      { id: 'A', text: 'Tuổi tác' },
      { id: 'B', text: 'Quốc tịch' },
      { id: 'C', text: 'Tên của mình (Đại Vệ / David)' },
    ],
    correct_answer: 'C',
    explanation: '我叫大卫 (Wǒ jiào Dàwèi) = Tôi tên là David.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe đoạn ghi âm: "我是越南人。" — Người nói là người nước nào?',
    options: [
      { id: 'A', text: 'Việt Nam' },
      { id: 'B', text: 'Trung Quốc' },
      { id: 'C', text: 'Mỹ' },
    ],
    correct_answer: 'A',
    explanation: '越南人 (Yuènán rén) nghĩa là người Việt Nam.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe đoạn ghi âm: "明天见！" — Câu này dùng khi nào?',
    options: [
      { id: 'A', text: 'Khi mới gặp lần đầu' },
      { id: 'B', text: 'Khi chào tạm biệt, hẹn gặp ngày mai' },
      { id: 'C', text: 'Khi chúc ngủ ngon' },
    ],
    correct_answer: 'B',
    explanation: '明天见 (míngtiān jiàn) = Hẹn gặp lại ngày mai.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe câu: "我想喝茶。" — Người nói muốn uống gì?',
    options: [
      { id: 'A', text: 'Cà phê' },
      { id: 'B', text: 'Nước lọc' },
      { id: 'C', text: 'Trà' },
    ],
    correct_answer: 'C',
    explanation: '喝茶 (hē chá) = uống trà.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe câu: "这个苹果五块钱。" — Quả táo giá bao nhiêu?',
    options: [
      { id: 'A', text: '5 tệ' },
      { id: 'B', text: '10 tệ' },
      { id: 'C', text: '15 tệ' },
    ],
    correct_answer: 'A',
    explanation: '五块钱 (wǔ kuài qián) = 5 tệ.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe câu: "今天天气很热。" — Thời tiết hôm nay thế nào?',
    options: [
      { id: 'A', text: 'Rất lạnh' },
      { id: 'B', text: 'Rất nóng' },
      { id: 'C', text: 'Trời mưa' },
    ],
    correct_answer: 'B',
    explanation: '很热 (hěn rè) = rất nóng.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe câu: "我爸爸是医生。" — Bố của người nói làm nghề gì?',
    options: [
      { id: 'A', text: 'Giáo viên' },
      { id: 'B', text: 'Học sinh' },
      { id: 'C', text: 'Bác sĩ' },
    ],
    correct_answer: 'C',
    explanation: '医生 (yīshēng) = bác sĩ.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe câu: "现在八点半。" — Bây giờ là mấy giờ?',
    options: [
      { id: 'A', text: '8 giờ 30 phút' },
      { id: 'B', text: '8 giờ đúng' },
      { id: 'C', text: '7 giờ 30 phút' },
    ],
    correct_answer: 'A',
    explanation: '八点半 (bā diǎn bàn) = 8 giờ rưỡi (8:30).',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe hội thoại: "你去哪儿？我去学校。" — Người trả lời đi đâu?',
    options: [
      { id: 'A', text: 'Đi bệnh viện' },
      { id: 'B', text: 'Đi trường học' },
      { id: 'C', text: 'Đi cửa hàng' },
    ],
    correct_answer: 'B',
    explanation: '学校 (xuéxiào) = trường học.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe hội thoại: "你家有几口人？我家有四口人。" — Nhà bạn ấy có mấy người?',
    options: [
      { id: 'A', text: '3 người' },
      { id: 'B', text: '5 người' },
      { id: 'C', text: '4 người' },
    ],
    correct_answer: 'C',
    explanation: '四口人 (sì kǒu rén) = 4 người.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe hội thoại: "你会说汉语吗？我会说一点儿。" — Khả năng nói tiếng Hán của người đó?',
    options: [
      { id: 'A', text: 'Biết nói một chút' },
      { id: 'B', text: 'Không biết nói' },
      { id: 'C', text: 'Nói rất giỏi' },
    ],
    correct_answer: 'A',
    explanation: '一点儿 (yìdiǎnr) = một chút.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe câu: "桌子上面有一本书。" — Trên bàn có vật gì?',
    options: [
      { id: 'A', text: 'Một chiếc cốc' },
      { id: 'B', text: 'Một quyển sách' },
      { id: 'C', text: 'Một chiếc máy tính' },
    ],
    correct_answer: 'B',
    explanation: '一本书 (yì běn shū) = một quyển sách.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'LISTENING',
    difficulty_level: 'HSK1',
    content: 'Nghe câu: "我坐出租车去火车站。" — Người nói đi ga tàu bằng phương tiện gì?',
    options: [
      { id: 'A', text: 'Máy bay' },
      { id: 'B', text: 'Xe buýt' },
      { id: 'C', text: 'Xe taxi' },
    ],
    correct_answer: 'C',
    explanation: '出租车 (chūzūchē) = xe taxi.',
  },

  // ═══════════════════════════════════════════════════════════
  // PHẦN 2: ĐỌC HIỂU (15 câu: Câu 16–30)
  // ═══════════════════════════════════════════════════════════
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Chữ Hán "老师" có phiên âm và nghĩa đúng là gì?',
    options: [
      { id: 'A', text: 'lǎoshī — Giáo viên' },
      { id: 'B', text: 'xuésheng — Học sinh' },
      { id: 'C', text: 'péngyou — Bạn bè' },
      { id: 'D', text: 'tóngxué — Bạn học' },
    ],
    correct_answer: 'A',
    explanation: '老师 (lǎoshī) nghĩa là thầy/cô giáo.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Chữ Hán "朋友" nghĩa là gì?',
    options: [
      { id: 'A', text: 'Bố mẹ' },
      { id: 'B', text: 'Bạn bè' },
      { id: 'C', text: 'Con gái' },
      { id: 'D', text: 'Bác sĩ' },
    ],
    correct_answer: 'B',
    explanation: '朋友 (péngyou) = bạn bè.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Chọn chữ Hán đúng cho phiên âm "shuǐguǒ" (trái cây):',
    options: [
      { id: 'A', text: '米饭' },
      { id: 'B', text: '杯子' },
      { id: 'C', text: '水果' },
      { id: 'D', text: '衣服' },
    ],
    correct_answer: 'C',
    explanation: '水果 (shuǐguǒ) = trái cây, hoa quả.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Từ "下雨" (xiàyǔ) nói về hiện tượng thời tiết nào?',
    options: [
      { id: 'A', text: 'Nắng to' },
      { id: 'B', text: 'Gió mạnh' },
      { id: 'C', text: 'Tuyết rơi' },
      { id: 'D', text: 'Trời mưa' },
    ],
    correct_answer: 'D',
    explanation: '下雨 (xiàyǔ) = trời mưa.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Chữ "昨天" (zuótiān) nghĩa là gì?',
    options: [
      { id: 'A', text: 'Hôm qua' },
      { id: 'B', text: 'Hôm nay' },
      { id: 'C', text: 'Ngày mai' },
      { id: 'D', text: 'Tháng sau' },
    ],
    correct_answer: 'A',
    explanation: '昨天 (zuótiān) = hôm qua.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Điền từ thích hợp vào chỗ trống: 我很喜欢 ___ 中国菜。',
    options: [
      { id: 'A', text: '喝' },
      { id: 'B', text: '吃' },
      { id: 'C', text: '看' },
      { id: 'D', text: '听' },
    ],
    correct_answer: 'B',
    explanation: '吃中国菜 (chī Zhōngguó cài) = ăn món Trung Quốc.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Điền lượng từ đúng: 我买了三 ___ 苹果。',
    options: [
      { id: 'A', text: '本' },
      { id: 'B', text: '岁' },
      { id: 'C', text: '个' },
      { id: 'D', text: '口' },
    ],
    correct_answer: 'C',
    explanation: '个 (gè) là lượng từ dùng cho 苹果 (táo).',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Điền từ thích hợp: 你 ___ 什么名字？',
    options: [
      { id: 'A', text: '叫' },
      { id: 'B', text: '是' },
      { id: 'C', text: '在' },
      { id: 'D', text: '有' },
    ],
    correct_answer: 'A',
    explanation: '你叫什么名字？(Nǐ jiào shénme míngzi?) = Bạn tên là gì?',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Điền từ thích hợp: 这 ___ 书很有意思。',
    options: [
      { id: 'A', text: '杯' },
      { id: 'B', text: '本' },
      { id: 'C', text: '块' },
      { id: 'D', text: '些' },
    ],
    correct_answer: 'B',
    explanation: 'Lượng từ của 书 (sách) là 本 (běn).',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Điền từ thích hợp: 妈妈在厨房 ___ 饭呢。',
    options: [
      { id: 'A', text: '写' },
      { id: 'B', text: '读' },
      { id: 'C', text: '坐' },
      { id: 'D', text: '做' },
    ],
    correct_answer: 'D',
    explanation: '做饭 (zuòfàn) = nấu cơm.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Đọc câu: "我今年二十岁。" — Câu này nói về điều gì?',
    options: [
      { id: 'A', text: 'Năm nay tôi 20 tuổi.' },
      { id: 'B', text: 'Tôi có 20 người bạn.' },
      { id: 'C', text: 'Cái này giá 20 tệ.' },
      { id: 'D', text: 'Tôi học tiếng Trung 20 ngày.' },
    ],
    correct_answer: 'A',
    explanation: '今年二十岁 (jīnnián èrshí suì) = năm nay 20 tuổi.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Khi ai đó nói "对不起！" (Xin lỗi!), câu đáp lịch sự nhất là gì?',
    options: [
      { id: 'A', text: '不客气！' },
      { id: 'B', text: '没关系！' },
      { id: 'C', text: '再见！' },
      { id: 'D', text: '很好！' },
    ],
    correct_answer: 'B',
    explanation: 'Đáp lại 对不起 (Xin lỗi) dùng 没关系 (Không sao đâu).',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Đọc câu: "小猫在椅子下面。" — Con mèo đang ở đâu?',
    options: [
      { id: 'A', text: 'Ở trên ghế' },
      { id: 'B', text: 'Ở trong nhà' },
      { id: 'C', text: 'Ở dưới ghế' },
      { id: 'D', text: 'Ở phía trước ghế' },
    ],
    correct_answer: 'C',
    explanation: '椅子下面 (yǐzi xiàmian) = ở dưới ghế.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Đọc câu: "我昨天没去看电影，我在家学习了。" — Hôm qua người nói đã làm gì?',
    options: [
      { id: 'A', text: 'Đi xem phim ở rạp' },
      { id: 'B', text: 'Đi mua quần áo' },
      { id: 'C', text: 'Đi bệnh viện' },
      { id: 'D', text: 'Ở nhà học bài' },
    ],
    correct_answer: 'D',
    explanation: '我在家学习了 = Tôi đã ở nhà học bài.',
  },
  {
    question_type: 'MULTIPLE_CHOICE',
    skill_category: 'READING',
    difficulty_level: 'HSK1',
    content: 'Câu nào sau đây đúng ngữ pháp tiếng Trung?',
    options: [
      { id: 'A', text: '我是学生。' },
      { id: 'B', text: '学生我是。' },
      { id: 'C', text: '是我学生。' },
      { id: 'D', text: '我学生是。' },
    ],
    correct_answer: 'A',
    explanation: 'Cấu trúc chuẩn Chủ ngữ + 是 + Tân ngữ: 我是学生。',
  },

  // ═══════════════════════════════════════════════════════════
  // PHẦN 3: VIẾT — 书写 (10 câu: Câu 31–40)
  // ═══════════════════════════════════════════════════════════
  {
    question_type: 'FILL_IN_BLANK',
    skill_category: 'WRITING',
    difficulty_level: 'HSK1',
    content: 'Viết chữ Hán cho phiên âm: "nǐ hǎo" (Xin chào)',
    options: [],
    correct_answer: '你好',
    explanation: '你好 (nǐ hǎo) = Xin chào.',
  },
  {
    question_type: 'FILL_IN_BLANK',
    skill_category: 'WRITING',
    difficulty_level: 'HSK1',
    content: 'Viết chữ Hán cho phiên âm: "xièxie" (Cảm ơn)',
    options: [],
    correct_answer: '谢谢',
    explanation: '谢谢 (xièxie) = Cảm ơn.',
  },
  {
    question_type: 'FILL_IN_BLANK',
    skill_category: 'WRITING',
    difficulty_level: 'HSK1',
    content: 'Viết chữ Hán cho phiên âm: "zàijiàn" (Tạm biệt)',
    options: [],
    correct_answer: '再见',
    explanation: '再见 (zàijiàn) = Tạm biệt.',
  },
  {
    question_type: 'FILL_IN_BLANK',
    skill_category: 'WRITING',
    difficulty_level: 'HSK1',
    content: 'Viết chữ Hán cho phiên âm: "Zhōngguó" (Trung Quốc)',
    options: [],
    correct_answer: '中国',
    explanation: '中国 (Zhōngguó) = Trung Quốc.',
  },
  {
    question_type: 'FILL_IN_BLANK',
    skill_category: 'WRITING',
    difficulty_level: 'HSK1',
    content: 'Viết chữ Hán cho phiên âm: "xuéxí" (Học tập)',
    options: [],
    correct_answer: '学习',
    explanation: '学习 (xuéxí) = Học tập.',
  },
  {
    question_type: 'FILL_IN_BLANK',
    skill_category: 'WRITING',
    difficulty_level: 'HSK1',
    content: 'Sắp xếp thành câu hoàn chỉnh: 学生 / 我 / 是',
    options: [],
    correct_answer: '我是学生',
    explanation: 'Trật tự đúng: 我是学生 (Tôi là học sinh).',
  },
  {
    question_type: 'FILL_IN_BLANK',
    skill_category: 'WRITING',
    difficulty_level: 'HSK1',
    content: 'Sắp xếp thành câu hoàn chỉnh: 喜欢 / 我 / 汉语 / 学习',
    options: [],
    correct_answer: '我喜欢学习汉语',
    explanation: 'Trật tự đúng: 我喜欢学习汉语 (Tôi thích học tiếng Hán).',
  },
  {
    question_type: 'FILL_IN_BLANK',
    skill_category: 'WRITING',
    difficulty_level: 'HSK1',
    content: 'Sắp xếp thành câu hoàn chỉnh: 很好 / 今天 / 天气',
    options: [],
    correct_answer: '今天天气很好',
    explanation: 'Trật tự đúng: 今天天气很好 (Thời tiết hôm nay rất đẹp).',
  },
  {
    question_type: 'FILL_IN_BLANK',
    skill_category: 'WRITING',
    difficulty_level: 'HSK1',
    content: 'Dịch sang tiếng Trung (chữ Hán): "Tôi yêu Trung Quốc."',
    options: [],
    correct_answer: '我爱中国',
    explanation: '我爱中国 (Wǒ ài Zhōngguó).',
  },
  {
    question_type: 'FILL_IN_BLANK',
    skill_category: 'WRITING',
    difficulty_level: 'HSK1',
    content: 'Dịch sang tiếng Trung (chữ Hán): "Anh ấy là giáo viên của tôi."',
    options: [],
    correct_answer: '他是我的老师',
    explanation: '他是我的老师 (Tā shì wǒ de lǎoshī).',
  },
];

async function main() {
  const existing = await prisma.tests.findFirst({
    where: { title: DEMO_TITLE },
  });

  if (existing) {
    console.log(`Đề demo đã tồn tại (test_id = ${existing.test_id}). Đang làm mới câu hỏi...`);
    await prisma.testQuestions.deleteMany({ where: { test_id: existing.test_id } });
    await prisma.tests.delete({ where: { test_id: existing.test_id } });
  }

  const test = await prisma.tests.create({
    data: {
      title: DEMO_TITLE,
      test_type: 'MOCK_EXAM',
      passing_score: 60,
      time_limit_mins: 40,
      is_published: true,
    },
  });

  for (let i = 0; i < QUESTIONS.length; i++) {
    const q = QUESTIONS[i];
    const createdQ = await prisma.questions.create({
      data: {
        question_type: q.question_type,
        skill_category: q.skill_category,
        difficulty_level: q.difficulty_level,
        content: q.content,
        options_json: JSON.stringify(q.options),
        correct_answer: q.correct_answer,
        explanation: q.explanation,
      },
    });

    await prisma.testQuestions.create({
      data: {
        test_id: test.test_id,
        question_id: createdQ.question_id,
        order_index: i + 1,
      },
    });
  }

  console.log(`✅ Đã tạo thành công đề demo HSK 1 (test_id = ${test.test_id}, 40 câu: 15 Nghe + 15 Đọc + 10 Viết)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());


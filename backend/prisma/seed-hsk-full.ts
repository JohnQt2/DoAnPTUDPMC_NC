/**
 * seed-hsk-full.ts
 * Comprehensive idempotent seed for:
 *  - Thick HSK 1–6 Vocabulary (140+ words) & Characters
 *  - Complete Pinyin Initials (23), Finals (24) & Minimal Pairs
 *  - New enriched HSK 1–6 Chapters, Lessons & LessonBlocks (Theory, Grammar, Dialogue, Hanzi)
 *  - 30 Mock Exams (5 full HSK mock exams per level HSK 1–6, test_type = 'MOCK_EXAM')
 *  - 18 Workbook Practice Sets (Sách bài tập chuẩn HSK 1–6, test_type = 'WORKBOOK')
 */
import { PrismaClient } from '@prisma/client';

interface VocabSeed {
  id: string;
  word: string;
  pinyin: string;
  sino: string;
  meaning: string;
  type: string;
  level: string;
  exampleCn: string;
  examplePy: string;
  exampleVi: string;
  strokes?: number;
  radical?: string;
}

const RICH_HSK_VOCAB: VocabSeed[] = [
  // ── HSK 1 (24 words) ──
  { id: 'hsk1_v001', word: '你好', pinyin: 'nǐ hǎo', sino: 'Nhĩ hảo', meaning: 'Xin chào', type: 'Cụm từ', level: 'HSK1', exampleCn: '你好，很高兴认识你！', examplePy: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ!', exampleVi: 'Xin chào, rất vui được làm quen với bạn!', strokes: 7, radical: '亻' },
  { id: 'hsk1_v002', word: '谢谢', pinyin: 'xièxie', sino: 'Tạ tạ', meaning: 'Cảm ơn', type: 'Động từ', level: 'HSK1', exampleCn: '谢谢你的帮助。', examplePy: 'Xièxie nǐ de bāngzhù.', exampleVi: 'Cảm ơn sự giúp đỡ của bạn.', strokes: 12, radical: '讠' },
  { id: 'hsk1_v003', word: '不客气', pinyin: 'bú kèqi', sino: 'Bất khách khí', meaning: 'Đừng khách sáo / Không có gì', type: 'Cụm từ', level: 'HSK1', exampleCn: '不客气，这是我应该做的。', examplePy: 'Bú kèqi, zhè shì wǒ yīnggāi zuò de.', exampleVi: 'Đừng khách sáo, đây là việc tôi nên làm.', strokes: 4, radical: '一' },
  { id: 'hsk1_v004', word: '对不起', pinyin: 'duìbuqǐ', sino: 'Đối bất khởi', meaning: 'Xin lỗi', type: 'Động từ', level: 'HSK1', exampleCn: '对不起，我来晚了。', examplePy: 'Duìbuqǐ, wǒ lái wǎn le.', exampleVi: 'Xin lỗi, tôi đến muộn rồi.', strokes: 5, radical: '寸' },
  { id: 'hsk1_v005', word: '没关系', pinyin: 'méi guānxi', sino: 'Một quan hệ', meaning: 'Không sao đâu', type: 'Cụm từ', level: 'HSK1', exampleCn: '没关系，请坐吧。', examplePy: 'Méi guānxi, qǐng zuò ba.', exampleVi: 'Không sao đâu, mời ngồi đi.', strokes: 7, radical: '氵' },
  { id: 'hsk1_v006', word: '再见', pinyin: 'zàijiàn', sino: 'Tái kiến', meaning: 'Tạm biệt', type: 'Động từ', level: 'HSK1', exampleCn: '明天见，再见！', examplePy: 'Míngtiān jiàn, zàijiàn!', exampleVi: 'Ngày mai gặp lại, tạm biệt!', strokes: 6, radical: '冂' },
  { id: 'hsk1_v007', word: '老师', pinyin: 'lǎoshī', sino: 'Lão sư', meaning: 'Giáo viên, thầy cô', type: 'Danh từ', level: 'HSK1', exampleCn: '王老师教我们汉语。', examplePy: 'Wáng lǎoshī jiāo wǒmen Hànyǔ.', exampleVi: 'Thầy Vương dạy chúng tôi tiếng Hán.', strokes: 6, radical: '耂' },
  { id: 'hsk1_v008', word: '学生', pinyin: 'xuésheng', sino: 'Học sinh', meaning: 'Học sinh, sinh viên', type: 'Danh từ', level: 'HSK1', exampleCn: '我是越南留学生。', examplePy: 'Wǒ shì Yuènán liúxuésheng.', exampleVi: 'Tôi là du học sinh Việt Nam.', strokes: 8, radical: '子' },
  { id: 'hsk1_v009', word: '朋友', pinyin: 'péngyou', sino: 'Bằng hữu', meaning: 'Bạn bè', type: 'Danh từ', level: 'HSK1', exampleCn: '他是我最好的朋友。', examplePy: 'Tā shì wǒ zuì hǎo de péngyou.', exampleVi: 'Anh ấy là người bạn tốt nhất của tôi.', strokes: 8, radical: '月' },
  { id: 'hsk1_v010', word: '中国', pinyin: 'Zhōngguó', sino: 'Trung Quốc', meaning: 'Trung Quốc', type: 'Danh từ', level: 'HSK1', exampleCn: '我想去中国旅游。', examplePy: 'Wǒ xiǎng qù Zhōngguó lǚyóu.', exampleVi: 'Tôi muốn đi Trung Quốc du lịch.', strokes: 4, radical: '丨' },
  { id: 'hsk1_v011', word: '汉语', pinyin: 'Hànyǔ', sino: 'Hán ngữ', meaning: 'Tiếng Hán / Tiếng Trung', type: 'Danh từ', level: 'HSK1', exampleCn: '汉语非常有意思。', examplePy: 'Hànyǔ fēicháng yǒu yìsi.', exampleVi: 'Tiếng Trung vô cùng thú vị.', strokes: 5, radical: '氵' },
  { id: 'hsk1_v012', word: '学习', pinyin: 'xuéxí', sino: 'Học tập', meaning: 'Học, học tập', type: 'Động từ', level: 'HSK1', exampleCn: '我每天学习三十分钟汉语。', examplePy: 'Wǒ měitiān xuéxí sānshí fēnzhōng Hànyǔ.', exampleVi: 'Mỗi ngày tôi học 30 phút tiếng Trung.', strokes: 8, radical: '子' },
  { id: 'hsk1_v013', word: '喜欢', pinyin: 'xǐhuan', sino: 'Hỷ hoan', meaning: 'Thích', type: 'Động từ', level: 'HSK1', exampleCn: '我非常喜欢喝中国茶。', examplePy: 'Wǒ fēicháng xǐhuan hē Zhōngguó chá.', exampleVi: 'Tôi rất thích uống trà Trung Quốc.', strokes: 12, radical: '口' },
  { id: 'hsk1_v014', word: '工作', pinyin: 'gōngzuò', sino: 'Công tác', meaning: 'Làm việc / Công việc', type: 'Danh/Động từ', level: 'HSK1', exampleCn: '你在哪儿工作？', examplePy: 'Nǐ zài nǎr gōngzuò?', exampleVi: 'Bạn làm việc ở đâu?', strokes: 3, radical: '工' },
  { id: 'hsk1_v015', word: '吃饭', pinyin: 'chīfàn', sino: 'Ngật phạn', meaning: 'Ăn cơm', type: 'Động từ', level: 'HSK1', exampleCn: '我们一起去吃饭吧。', examplePy: 'Wǒmen yìqǐ qù chīfàn ba.', exampleVi: 'Chúng ta cùng đi ăn cơm nhé.', strokes: 6, radical: '口' },
  { id: 'hsk1_v016', word: '喝茶', pinyin: 'hē chá', sino: 'Hát trà', meaning: 'Uống trà', type: 'Động từ', level: 'HSK1', exampleCn: '请坐，喝茶吧。', examplePy: 'Qǐng zuò, hē chá ba.', exampleVi: 'Mời ngồi, uống trà đi.', strokes: 12, radical: '口' },
  { id: 'hsk1_v017', word: '多少钱', pinyin: 'duōshao qián', sino: 'Đa thiểu tiền', meaning: 'Bao nhiêu tiền', type: 'Cụm từ', level: 'HSK1', exampleCn: '这个苹果多少钱一斤？', examplePy: 'Zhège píngguǒ duōshao qián yì jīn?', exampleVi: 'Quả táo này bao nhiêu tiền một cân?', strokes: 6, radical: '夕' },
  { id: 'hsk1_v018', word: '今天', pinyin: 'jīntiān', sino: 'Kim thiên', meaning: 'Hôm nay', type: 'Danh từ', level: 'HSK1', exampleCn: '今天天气真好！', examplePy: 'Jīntiān tiānqì zhēn hǎo!', exampleVi: 'Thời tiết hôm nay thật đẹp!', strokes: 4, radical: '人' },
  { id: 'hsk1_v019', word: '明天', pinyin: 'míngtiān', sino: 'Minh thiên', meaning: 'Ngày mai', type: 'Danh từ', level: 'HSK1', exampleCn: '明天上午我有汉语课。', examplePy: 'Míngtiān shàngwǔ wǒ yǒu Hànyǔ kè.', exampleVi: 'Sáng mai tôi có tiết tiếng Trung.', strokes: 8, radical: '日' },
  { id: 'hsk1_v020', word: '星期', pinyin: 'xīngqī', sino: 'Tinh kỳ', meaning: 'Thứ, tuần lễ', type: 'Danh từ', level: 'HSK1', exampleCn: '今天星期几？', examplePy: 'Jīntiān xīngqī jǐ?', exampleVi: 'Hôm nay là thứ mấy?', strokes: 9, radical: '日' },
  { id: 'hsk1_v021', word: '医生', pinyin: 'yīshēng', sino: 'Y sinh', meaning: 'Bác sĩ', type: 'Danh từ', level: 'HSK1', exampleCn: '我姐姐在医院当医生。', examplePy: 'Wǒ jiějie zài yīyuàn dāng yīshēng.', exampleVi: 'Chị gái tôi làm bác sĩ ở bệnh viện.', strokes: 7, radical: '匚' },
  { id: 'hsk1_v022', word: '电脑', pinyin: 'diànnǎo', sino: 'Điện não', meaning: 'Máy tính', type: 'Danh từ', level: 'HSK1', exampleCn: '我用电脑学习中文。', examplePy: 'Wǒ yòng diànnǎo xuéxí Zhōngwén.', exampleVi: 'Tôi dùng máy tính để học tiếng Trung.', strokes: 5, radical: '田' },
  { id: 'hsk1_v023', word: '天气', pinyin: 'tiānqì', sino: 'Thiên khí', meaning: 'Thời tiết', type: 'Danh từ', level: 'HSK1', exampleCn: '河内的天气很暖和。', examplePy: 'Hénèi de tiānqì hěn nuǎnhuo.', exampleVi: 'Thời tiết Hà Nội rất ấm áp.', strokes: 4, radical: '大' },
  { id: 'hsk1_v024', word: '高兴', pinyin: 'gāoxìng', sino: 'Cao hứng', meaning: 'Vui vẻ, phấn khởi', type: 'Tính từ', level: 'HSK1', exampleCn: '见到你我真高兴。', examplePy: 'Jiàndào nǐ wǒ zhēn gāoxìng.', exampleVi: 'Gặp được bạn tôi thật vui.', strokes: 10, radical: '高' },

  // ── HSK 2 (22 words) ──
  { id: 'hsk2_v001', word: '准备', pinyin: 'zhǔnbèi', sino: 'Chuẩn bị', meaning: 'Chuẩn bị, dự định', type: 'Động từ', level: 'HSK2', exampleCn: '我正在准备HSK考试。', examplePy: 'Wǒ zhèngzài zhǔnbèi HSK kǎoshì.', exampleVi: 'Tôi đang chuẩn bị cho kỳ thi HSK.', strokes: 10, radical: '冫' },
  { id: 'hsk2_v002', word: '希望', pinyin: 'xīwàng', sino: 'Hy vọng', meaning: 'Hy vọng, mong muốn', type: 'Động/Danh từ', level: 'HSK2', exampleCn: '我希望早日去北京旅行。', examplePy: 'Wǒ xīwàng zǎorì qù Běijīng lǚxíng.', exampleVi: 'Tôi hy vọng sớm được đi Bắc Kinh du lịch.', strokes: 7, radical: '巾' },
  { id: 'hsk2_v003', word: '帮助', pinyin: 'bāngzhù', sino: 'Bang trợ', meaning: 'Giúp đỡ', type: 'Động/Danh từ', level: 'HSK2', exampleCn: '谢谢你经常帮助我练习口语。', examplePy: 'Xièxie nǐ jīngcháng bāngzhù wǒ liànxí kǒuyǔ.', exampleVi: 'Cảm ơn bạn thường xuyên giúp tôi luyện nói.', strokes: 9, radical: '巾' },
  { id: 'hsk2_v004', word: '介绍', pinyin: 'jièshào', sino: 'Giới thiệu', meaning: 'Giới thiệu', type: 'Động từ', level: 'HSK2', exampleCn: '请先介绍一下你自己吧。', examplePy: 'Qǐng xiān jièshào yíxià nǐ zìjǐ ba.', exampleVi: 'Xin hãy giới thiệu bản thân một chút trước nhé.', strokes: 4, radical: '人' },
  { id: 'hsk2_v005', word: '旅游', pinyin: 'lǚyóu', sino: 'Lữ du', meaning: 'Du lịch', type: 'Động từ', level: 'HSK2', exampleCn: '今年夏天我们去上海旅游。', examplePy: 'Jīnnián xiàtiān wǒmen qù Shànghǎi lǚyóu.', exampleVi: 'Mùa hè năm nay chúng tôi đi Thượng Hải du lịch.', strokes: 10, radical: '方' },
  { id: 'hsk2_v006', word: '运动', pinyin: 'yùndòng', sino: 'Vận động', meaning: 'Thể thao, vận động', type: 'Danh/Động từ', level: 'HSK2', exampleCn: '每天早上我都会去公园运动。', examplePy: 'Měitiān zǎoshang wǒ dōu huì qù gōngyuán yùndòng.', exampleVi: 'Mỗi sáng tôi đều ra công viên tập thể dục.', strokes: 7, radical: '辶' },
  { id: 'hsk2_v007', word: '身体', pinyin: 'shēntǐ', sino: 'Thân thể', meaning: 'Sức khỏe, cơ thể', type: 'Danh từ', level: 'HSK2', exampleCn: '祝你身体健康，工作顺利！', examplePy: 'Zhù nǐ shēntǐ jiànkāng, gōngzuò shùnlì!', exampleVi: 'Chúc bạn sức khỏe dồi dào, công việc thuận lợi!', strokes: 7, radical: '身' },
  { id: 'hsk2_v008', word: '问题', pinyin: 'wèntí', sino: 'Vấn đề', meaning: 'Câu hỏi, vấn đề', type: 'Danh từ', level: 'HSK2', exampleCn: '这个问题非常简单。', examplePy: 'Zhège wèntí fēicháng jiǎndān.', exampleVi: 'Câu hỏi này cực kỳ đơn giản.', strokes: 6, radical: '门' },
  { id: 'hsk2_v009', word: '时间', pinyin: 'shíjiān', sino: 'Thời gian', meaning: 'Thời gian', type: 'Danh từ', level: 'HSK2', exampleCn: '周末你有时间看电影吗？', examplePy: 'Zhōumò nǐ yǒu shíjiān kàn diànyǐng ma?', exampleVi: 'Cuối tuần bạn có thời gian xem phim không?', strokes: 7, radical: '日' },
  { id: 'hsk2_v010', word: '非常', pinyin: 'fēicháng', sino: 'Phi thường', meaning: 'Vô cùng, rất', type: 'Phó từ', level: 'HSK2', exampleCn: '这家餐厅的菜非常好吃。', examplePy: 'Zhè jiā cāntīng de cài fēicháng hǎochī.', exampleVi: 'Món ăn ở nhà hàng này rất ngon.', strokes: 8, radical: '非' },
  { id: 'hsk2_v011', word: '已经', pinyin: 'yǐjīng', sino: 'Dĩ kinh', meaning: 'Đã, đã từng', type: 'Phó từ', level: 'HSK2', exampleCn: '我已经学了半年汉语了。', examplePy: 'Wǒ yǐjīng xué le bàn nián Hànyǔ le.', exampleVi: 'Tôi đã học tiếng Trung được nửa năm rồi.', strokes: 3, radical: '己' },
  { id: 'hsk2_v012', word: '因为', pinyin: 'yīnwèi', sino: 'Nhân vị', meaning: 'Bởi vì', type: 'Liên từ', level: 'HSK2', exampleCn: '因为下雨，所以我们没去爬山。', examplePy: 'Yīnwèi xiàyǔ, suǒyǐ wǒmen méi qù páshān.', exampleVi: 'Vì trời mưa nên chúng tôi không đi leo núi.', strokes: 6, radical: '囗' },
  { id: 'hsk2_v013', word: '所以', pinyin: 'suǒyǐ', sino: 'Sở dĩ', meaning: 'Cho nên, vì vậy', type: 'Liên từ', level: 'HSK2', exampleCn: '他很努力，所以成绩很好。', examplePy: 'Tā hěn nǔlì, suǒyǐ chéngjì hěn hǎo.', exampleVi: 'Anh ấy rất chăm chỉ nên thành tích rất tốt.', strokes: 8, radical: '户' },
  { id: 'hsk2_v014', word: '虽然', pinyin: 'suīrán', sino: 'Tuy nhiên', meaning: 'Tuy rằng, mặc dù', type: 'Liên từ', level: 'HSK2', exampleCn: '虽然汉字有点难，但是很有趣。', examplePy: 'Suīrán Hànzì yǒudiǎn nán, dànshì hěn yǒuqù.', exampleVi: 'Tuy chữ Hán hơi khó nhưng rất thú vị.', strokes: 9, radical: '虫' },
  { id: 'hsk2_v015', word: '但是', pinyin: 'dànshì', sino: 'Đãn thị', meaning: 'Nhưng mà', type: 'Liên từ', level: 'HSK2', exampleCn: '我很忙，但是每天都坚持复习。', examplePy: 'Wǒ hěn máng, dànshì měitiān dōu jiānchí fùxí.', exampleVi: 'Tôi rất bận nhưng mỗi ngày đều kiên trì ôn tập.', strokes: 7, radical: '亻' },
  { id: 'hsk2_v016', word: '便宜', pinyin: 'piányi', sino: 'Tiện nghi', meaning: 'Rẻ', type: 'Tính từ', level: 'HSK2', exampleCn: '这件衣服既好看又便宜。', examplePy: 'Zhè jiàn yīfu jì hǎokàn yòu piányi.', exampleVi: 'Bộ quần áo này vừa đẹp vừa rẻ.', strokes: 9, radical: '亻' },
  { id: 'hsk2_v017', word: '明白', pinyin: 'míngbai', sino: 'Minh bạch', meaning: 'Hiểu rõ', type: 'Động từ', level: 'HSK2', exampleCn: '老师讲的语法我都明白了。', examplePy: 'Lǎoshī jiǎng de yǔfǎ wǒ dōu míngbai le.', exampleVi: 'Ngữ pháp thầy giảng tôi đều hiểu rõ rồi.', strokes: 8, radical: '日' },
  { id: 'hsk2_v018', word: '考试', pinyin: 'kǎoshì', sino: 'Khảo thí', meaning: 'Thi cử, kỳ thi', type: 'Danh/Động từ', level: 'HSK2', exampleCn: '下个月我要参加HSK二级考试。', examplePy: 'Xià gè yuè wǒ yào cānjiā HSK èr jí kǎoshì.', exampleVi: 'Tháng sau tôi sẽ tham gia kỳ thi HSK 2.', strokes: 6, radical: '耂' },
  { id: 'hsk2_v019', word: '服务员', pinyin: 'fúwùyuán', sino: 'Phục vụ viên', meaning: 'Nhân viên phục vụ', type: 'Danh từ', level: 'HSK2', exampleCn: '服务员，请给我一杯冰咖啡。', examplePy: 'Fúwùyuán, qǐng gěi wǒ yì bēi bīng kāfēi.', exampleVi: 'Phục vụ ơi, cho tôi một ly cà phê đá.', strokes: 8, radical: '月' },
  { id: 'hsk2_v020', word: '公共汽车', pinyin: 'gōnggòng qìchē', sino: 'Công cộng khí xa', meaning: 'Xe buýt', type: 'Danh từ', level: 'HSK2', exampleCn: '我每天坐公共汽车去公司。', examplePy: 'Wǒ měitiān zuò gōnggòng qìchē qù gōngsī.', exampleVi: 'Hàng ngày tôi đi xe buýt tới công ty.', strokes: 4, radical: '八' },
  { id: 'hsk2_v021', word: '休息', pinyin: 'xiūxi', sino: 'Hưu tức', meaning: 'Nghỉ ngơi', type: 'Động từ', level: 'HSK2', exampleCn: '累了就休息一会儿吧。', examplePy: 'Lèi le jiù xiūxi yíhuìr ba.', exampleVi: 'Mệt rồi thì nghỉ ngơi một lát đi.', strokes: 6, radical: '亻' },
  { id: 'hsk2_v022', word: '教室', pinyin: 'jiàoshì', sino: 'Giáo thất', meaning: 'Phòng học', type: 'Danh từ', level: 'HSK2', exampleCn: '同学们都在教室里看书。', examplePy: 'Tóngxuémen dōu zài jiàoshì lǐ kànshū.', exampleVi: 'Các bạn học đều đang đọc sách trong phòng học.', strokes: 11, radical: '攵' },

  // ── HSK 3 (22 words) ──
  { id: 'hsk3_v001', word: '环境', pinyin: 'huánjìng', sino: 'Hoàn cảnh', meaning: 'Môi trường', type: 'Danh từ', level: 'HSK3', exampleCn: '保护环境是每个人的责任。', examplePy: 'Bǎohù huánjìng shì měi gè rén de zérèn.', exampleVi: 'Bảo vệ môi trường là trách nhiệm của mỗi người.', strokes: 8, radical: '王' },
  { id: 'hsk3_v002', word: '文化', pinyin: 'wénhuà', sino: 'Văn hóa', meaning: 'Văn hóa', type: 'Danh từ', level: 'HSK3', exampleCn: '我对中国传统文化很感兴趣。', examplePy: 'Wǒ duì Zhōngguó chuántǒng wénhuà hěn gǎn xìngqù.', exampleVi: 'Tôi rất hứng thú với văn hóa truyền thống Trung Hoa.', strokes: 4, radical: '文' },
  { id: 'hsk3_v003', word: '习惯', pinyin: 'xíguàn', sino: 'Tập quán', meaning: 'Thói quen / Quen với', type: 'Danh/Động từ', level: 'HSK3', exampleCn: '养成每天背单词的好习惯。', examplePy: 'Yǎngchéng měitiān bèi dāncí de hǎo xíguàn.', exampleVi: 'Hình thành thói quen tốt học thuộc từ mới mỗi ngày.', strokes: 3, radical: '乙' },
  { id: 'hsk3_v004', word: '决定', pinyin: 'juédìng', sino: 'Quyết định', meaning: 'Quyết định', type: 'Động/Danh từ', level: 'HSK3', exampleCn: '我决定明年去中国读硕士。', examplePy: 'Wǒ juédìng míngnián qù Zhōngguó dú shuòshì.', exampleVi: 'Tôi quyết định năm sau sang Trung Quốc học thạc sĩ.', strokes: 6, radical: '冫' },
  { id: 'hsk3_v005', word: '选择', pinyin: 'xuǎnzé', sino: 'Tuyển trạch', meaning: 'Lựa chọn', type: 'Động/Danh từ', level: 'HSK3', exampleCn: '你可以根据水平选择合适的课程。', examplePy: 'Nǐ kěyǐ gēnjù shuǐpíng xuǎnzé héshì de kèchéng.', exampleVi: 'Bạn có thể chọn khóa học phù hợp dựa theo trình độ.', strokes: 9, radical: '辶' },
  { id: 'hsk3_v006', word: '提高', pinyin: 'tígāo', sino: 'Đề cao', meaning: 'Nâng cao, cải thiện', type: 'Động từ', level: 'HSK3', exampleCn: '多听录音能很快提高听力水平。', examplePy: 'Duō tīng lùyīn néng hěn kuài tígāo tīnglì shuǐpíng.', exampleVi: 'Nghe audio nhiều có thể nhanh chóng nâng cao trình độ nghe.', strokes: 12, radical: '扌' },
  { id: 'hsk3_v007', word: '影响', pinyin: 'yǐngxiǎng', sino: 'Ảnh hưởng', meaning: 'Ảnh hưởng', type: 'Động/Danh từ', level: 'HSK3', exampleCn: '熬夜会影响第二天的学习效率。', examplePy: 'Áoyè huì yǐngxiǎng dì èr tiān de xuéxí xiàolǜ.', exampleVi: 'Thức khuya sẽ ảnh hưởng đến hiệu suất học ngày hôm sau.', strokes: 15, radical: '彡' },
  { id: 'hsk3_v008', word: '参加', pinyin: 'cānjiā', sino: 'Tham gia', meaning: 'Tham gia', type: 'Động từ', level: 'HSK3', exampleCn: '欢迎大家参加汉语演讲比赛。', examplePy: 'Huānyíng dàjiā cānjiā Hànyǔ yǎnjiǎng bǐsài.', exampleVi: 'Hoan nghênh mọi người tham gia cuộc thi hùng biện tiếng Hán.', strokes: 8, radical: '厶' },
  { id: 'hsk3_v009', word: '关心', pinyin: 'guānxīn', sino: 'Quan tâm', meaning: 'Quan tâm, chăm sóc', type: 'Động từ', level: 'HSK3', exampleCn: '父母总是非常关心孩子的成长。', examplePy: 'Fùmǔ zǒngshì fēicháng guānxīn háizi de chéngzhǎng.', exampleVi: 'Cha mẹ luôn vô cùng quan tâm sự trưởng thành của con cái.', strokes: 6, radical: '八' },
  { id: 'hsk3_v010', word: '满意', pinyin: 'mǎnyì', sino: 'Mãn ý', meaning: 'Hài lòng', type: 'Tính từ', level: 'HSK3', exampleCn: '我对这次模拟考试的成绩很满意。', examplePy: 'Wǒ duì zhè cì mónǐ kǎoshì de chéngjì hěn mǎnyì.', exampleVi: 'Tôi rất hài lòng với điểm số bài thi thử lần này.', strokes: 13, radical: '氵' },
  { id: 'hsk3_v011', word: '认真', pinyin: 'rènzhēn', sino: 'Nhận chân', meaning: 'Nghiêm túc, chăm chỉ', type: 'Tính từ', level: 'HSK3', exampleCn: '他做练习题非常认真。', examplePy: 'Tā zuò liànxítí fēicháng rènzhēn.', exampleVi: 'Anh ấy làm bài tập rất nghiêm túc.', strokes: 4, radical: '讠' },
  { id: 'hsk3_v012', word: '方便', pinyin: 'fāngbiàn', sino: 'Phương tiện', meaning: 'Thuận tiện, tiện lợi', type: 'Tính từ', level: 'HSK3', exampleCn: '坐地铁去市中心非常方便。', examplePy: 'Zuò dìtiě qù shìzhōngxīn fēicháng fāngbiàn.', exampleVi: 'Đi tàu điện ngầm vào trung tâm thành phố rất thuận tiện.', strokes: 4, radical: '方' },
  { id: 'hsk3_v013', word: '必须', pinyin: 'bìxū', sino: 'Tất tu', meaning: 'Nhất thiết phải, bắt buộc', type: 'Phó từ', level: 'HSK3', exampleCn: '学好外语必须每天多说多练。', examplePy: 'Xuéhǎo wàiyǔ bìxū měitiān duō shuō duō liàn.', exampleVi: 'Muốn giỏi ngoại ngữ nhất định phải nói và luyện mỗi ngày.', strokes: 5, radical: '心' },
  { id: 'hsk3_v014', word: '如果', pinyin: 'rúguǒ', sino: 'Như quả', meaning: 'Nếu như', type: 'Liên từ', level: 'HSK3', exampleCn: '如果明天不下雨，我们就去郊游。', examplePy: 'Rúguǒ míngtiān bú xiàyǔ, wǒmen jiù qù jiāoyóu.', exampleVi: 'Nếu ngày mai không mưa, chúng ta sẽ đi dã ngoại.', strokes: 6, radical: '女' },
  { id: 'hsk3_v015', word: '解决', pinyin: 'jiějué', sino: 'Giải quyết', meaning: 'Giải quyết', type: 'Động từ', level: 'HSK3', exampleCn: '我们一起想办法解决这个难题。', examplePy: 'Wǒmen yìqǐ xiǎng bànfǎ jiějué zhège nántí.', exampleVi: 'Chúng ta cùng nghĩ cách giải quyết bài toán khó này.', strokes: 13, radical: '角' },
  { id: 'hsk3_v016', word: '历史', pinyin: 'lìshǐ', sino: 'Lịch sử', meaning: 'Lịch sử', type: 'Danh từ', level: 'HSK3', exampleCn: '这座古城有两千多年的历史。', examplePy: 'Zhè zuò gǔchéng yǒu liǎng qiān duō nián de lìshǐ.', exampleVi: 'Cổ trấn này có hơn hai nghìn năm lịch sử.', strokes: 4, radical: '厂' },
  { id: 'hsk3_v017', word: '健康', pinyin: 'jiànkāng', sino: 'Kiện khang', meaning: 'Khỏe mạnh, sức khỏe', type: 'Tính/Danh từ', level: 'HSK3', exampleCn: '合理的饮食对健康很重要。', examplePy: 'Hélǐ de yǐnshí duì jiànkāng hěn zhòngyào.', exampleVi: 'Chế độ ăn hợp lý rất quan trọng với sức khỏe.', strokes: 10, radical: '亻' },
  { id: 'hsk3_v018', word: '注意', pinyin: 'zhùyì', sino: 'Chú ý', meaning: 'Chú ý, lưu ý', type: 'Động từ', level: 'HSK3', exampleCn: '发音时要注意四个声调的区别。', examplePy: 'Fāyīn shí yào zhùyì sì gè shēngdiào de qūbié.', exampleVi: 'Khi phát âm cần chú ý sự khác biệt giữa 4 thanh điệu.', strokes: 8, radical: '氵' },
  { id: 'hsk3_v019', word: '复习', pinyin: 'fùxí', sino: 'Phục tập', meaning: 'Ôn tập', type: 'Động từ', level: 'HSK3', exampleCn: '考前要系统地复习生词和语法。', examplePy: 'Kǎoqián yào xìtǒng de fùxí shēngcí hé yǔfǎ.', exampleVi: 'Trước khi thi cần ôn tập từ mới và ngữ pháp một cách hệ thống.', strokes: 9, radical: '夂' },
  { id: 'hsk3_v020', word: '成绩', pinyin: 'chéngjì', sino: 'Thành tích', meaning: 'Thành tích, điểm số', type: 'Danh từ', level: 'HSK3', exampleCn: '祝贺你在HSK3考试中取得好成绩！', examplePy: 'Zhùhè nǐ zài HSK3 kǎoshì zhōng qǔdé hǎo chéngjì!', exampleVi: 'Chúc mừng bạn đạt điểm cao trong kỳ thi HSK 3!', strokes: 6, radical: '戈' },
  { id: 'hsk3_v021', word: '变化', pinyin: 'biànhuà', sino: 'Biến hóa', meaning: 'Thay đổi, biến đổi', type: 'Danh/Động từ', level: 'HSK3', exampleCn: '这几年城市的变化非常大。', examplePy: 'Zhè jǐ nián chéngshì de biànhuà fēicháng dà.', exampleVi: 'Mấy năm nay thành phố thay đổi vô cùng lớn.', strokes: 8, radical: '又' },
  { id: 'hsk3_v022', word: '经过', pinyin: 'jīngguò', sino: 'Kinh quá', meaning: 'Trải qua, đi ngang qua', type: 'Động/Giới từ', level: 'HSK3', exampleCn: '经过三个月的努力，我的口语流利多了。', examplePy: 'Jīngguò sān gè yuè de nǔlì, wǒ de kǒuyǔ liúlì duō le.', exampleVi: 'Sau ba tháng nỗ lực, khẩu ngữ của tôi trôi chảy hơn hẳn.', strokes: 8, radical: '纟' },

  // ── HSK 4 (22 words) ──
  { id: 'hsk4_v001', word: '坚持', pinyin: 'jiānchí', sino: 'Kiên trì', meaning: 'Kiên trì, bền bỉ', type: 'Động từ', level: 'HSK4', exampleCn: '只要坚持不懈，就一定能成功。', examplePy: 'Zhǐyào jiānchí búxiè, jiù yídìng néng chénggōng.', exampleVi: 'Chỉ cần kiên trì không bỏ cuộc thì nhất định sẽ thành công.', strokes: 7, radical: '土' },
  { id: 'hsk4_v002', word: '发展', pinyin: 'fāzhǎn', sino: 'Phát triển', meaning: 'Phát triển', type: 'Động/Danh từ', level: 'HSK4', exampleCn: '人工智能技术发展得非常迅速。', examplePy: 'Réngōng zhìnéng jìshù fāzhǎn de fēicháng xùnsù.', exampleVi: 'Công nghệ trí tuệ nhân tạo phát triển vô cùng nhanh chóng.', strokes: 5, radical: '又' },
  { id: 'hsk4_v003', word: '经验', pinyin: 'jīngyàn', sino: 'Kinh nghiệm', meaning: 'Kinh nghiệm', type: 'Danh từ', level: 'HSK4', exampleCn: '他有丰富的项目管理经验。', examplePy: 'Tā yǒu fēngfù de xiàngmù guǎnlǐ jīngyàn.', exampleVi: 'Anh ấy có kinh nghiệm quản lý dự án phong phú.', strokes: 8, radical: '纟' },
  { id: 'hsk4_v004', word: '交流', pinyin: 'jiāoliú', sino: 'Giao lưu', meaning: 'Giao lưu, trao đổi', type: 'Động/Danh từ', level: 'HSK4', exampleCn: '语言是文化交流的重要桥梁。', examplePy: 'Yǔyán shì wénhuà jiāoliú de zhòngyào qiáoliáng.', exampleVi: 'Ngôn ngữ là cầu nối quan trọng của giao lưu văn hóa.', strokes: 6, radical: '亠' },
  { id: 'hsk4_v005', word: '责任', pinyin: 'zérèn', sino: 'Trách nhiệm', meaning: 'Trách nhiệm', type: 'Danh từ', level: 'HSK4', exampleCn: '他是一个非常有责任感的同事。', examplePy: 'Tā shì yí gè fēicháng yǒu zérèngǎn de tóngshì.', exampleVi: 'Anh ấy là một đồng nghiệp vô cùng có tinh thần trách nhiệm.', strokes: 8, radical: '贝' },
  { id: 'hsk4_v006', word: '效率', pinyin: 'xiàolǜ', sino: 'Hiệu suất', meaning: 'Hiệu suất, hiệu quả', type: 'Danh từ', level: 'HSK4', exampleCn: '科学的学习方法能大大提高效率。', examplePy: 'Kēxué de xuéxí fāngfǎ néng dàdà tígāo xiàolǜ.', exampleVi: 'Phương pháp học khoa học có thể nâng cao hiệu suất vượt bậc.', strokes: 10, radical: '攵' },
  { id: 'hsk4_v007', word: '竞争', pinyin: 'jìngzhēng', sino: 'Cạnh tranh', meaning: 'Cạnh tranh', type: 'Động/Danh từ', level: 'HSK4', exampleCn: '现代职场上的竞争非常激烈。', examplePy: 'Xiàndài zhíchǎng shàng de jìngzhēng fēicháng jīliè.', exampleVi: 'Sự cạnh tranh nơi công sở hiện đại vô cùng khốc liệt.', strokes: 10, radical: '立' },
  { id: 'hsk4_v008', word: '鼓励', pinyin: 'gǔlì', sino: 'Cổ lệ', meaning: 'Khích lệ, động viên', type: 'Động/Danh từ', level: 'HSK4', exampleCn: '老师的鼓励让我更有信心了。', examplePy: 'Lǎoshī de gǔlì ràng wǒ gèng yǒu xìnxīn le.', exampleVi: 'Lời động viên của thầy cô giúp tôi tự tin hơn hẳn.', strokes: 13, radical: '鼓' },
  { id: 'hsk4_v009', word: '适应', pinyin: 'shìyìng', sino: 'Thích ứng', meaning: 'Thích nghi, thích ứng', type: 'Động từ', level: 'HSK4', exampleCn: '她很快适应了新城市的节奏。', examplePy: 'Tā hěn kuài shìyìng le xīn chéngshì de jiézòu.', exampleVi: 'Cô ấy nhanh chóng thích nghi với nhịp sống thành phố mới.', strokes: 9, radical: '辶' },
  { id: 'hsk4_v010', word: '丰富', pinyin: 'fēngfù', sino: 'Phong phú', meaning: 'Phong phú / Làm giàu thêm', type: 'Tính/Động từ', level: 'HSK4', exampleCn: '阅读可以丰富我们的知识面。', examplePy: 'Yuèdú kěyǐ fēngfù wǒmen de zhīshimiàn.', exampleVi: 'Đọc sách có thể làm phong phú vốn kiến thức của chúng ta.', strokes: 4, radical: '丨' },
  { id: 'hsk4_v011', word: '压力', pinyin: 'yālì', sino: 'Áp lực', meaning: 'Áp lực', type: 'Danh từ', level: 'HSK4', exampleCn: '学会合理地释放工作压力很重要。', examplePy: 'Xuéhuì hélǐ de shìfàng gōngzuò yālì hěn zhòngyào.', exampleVi: 'Học cách giải tỏa áp lực công việc hợp lý rất quan trọng.', strokes: 6, radical: '厂' },
  { id: 'hsk4_v012', word: '证明', pinyin: 'zhèngmíng', sino: 'Chứng minh', meaning: 'Chứng minh / Giấy chứng nhận', type: 'Động/Danh từ', level: 'HSK4', exampleCn: '事实证明这个方案是完全正确的。', examplePy: 'Shìshí zhèngmíng zhège fāngàn shì wánquán zhèngquè de.', exampleVi: 'Thực tế chứng minh phương án này hoàn toàn đúng đắn.', strokes: 7, radical: '讠' },
  { id: 'hsk4_v013', word: '申请', pinyin: 'shēnqǐng', sino: 'Thân thỉnh', meaning: 'Xin, đăng ký (học bổng, việc)', type: 'Động từ', level: 'HSK4', exampleCn: '我想申请中国政府奖学金。', examplePy: 'Wǒ xiǎng shēnqǐng Zhōngguó zhèngfǔ jiǎngxuéjīn.', exampleVi: 'Tôi muốn xin học bổng Chính phủ Trung Quốc.', strokes: 5, radical: '田' },
  { id: 'hsk4_v014', word: '安排', pinyin: 'ānpái', sino: 'An bài', meaning: 'Sắp xếp, bố trí', type: 'Động/Danh từ', level: 'HSK4', exampleCn: '请合理安排学习和休息时间。', examplePy: 'Qǐng hélǐ ānpái xuéxí hé xiūxi shíjiān.', exampleVi: 'Hãy sắp xếp hợp lý thời gian học tập và nghỉ ngơi.', strokes: 6, radical: '宀' },
  { id: 'hsk4_v015', word: '优点', pinyin: 'yōudiǎn', sino: 'Ưu điểm', meaning: 'Ưu điểm, điểm mạnh', type: 'Danh từ', level: 'HSK4', exampleCn: '每个人都有自己的优点和缺点。', examplePy: 'Měi gè rén dōu yǒu zìjǐ de yōudiǎn hé quēdiǎn.', exampleVi: 'Mỗi người đều có ưu điểm và khuyết điểm riêng.', strokes: 6, radical: '亻' },
  { id: 'hsk4_v016', word: '印象', pinyin: 'yìnxiàng', sino: 'Ấn tượng', meaning: 'Ấn tượng', type: 'Danh từ', level: 'HSK4', exampleCn: '这次旅行给我留下了深刻的印象。', examplePy: 'Zhè cì lǚxíng gěi wǒ liúxià le shēnkè de yìnxiàng.', exampleVi: 'Chuyến du lịch này để lại cho tôi ấn tượng sâu sắc.', strokes: 5, radical: '卩' },
  { id: 'hsk4_v017', word: '尊重', pinyin: 'zūnzhòng', sino: 'Tôn trọng', meaning: 'Tôn trọng', type: 'Động từ', level: 'HSK4', exampleCn: '我们应该尊重不同的文化习俗。', examplePy: 'Wǒmen yīnggāi zūnzhòng bùtóng de wénhuà xísú.', exampleVi: 'Chúng ta nên tôn trọng các phong tục văn hóa khác nhau.', strokes: 12, radical: '寸' },
  { id: 'hsk4_v018', word: '总结', pinyin: 'zǒngjié', sino: 'Tổng kết', meaning: 'Tổng kết, đúc kết', type: 'Động/Danh từ', level: 'HSK4', exampleCn: '每学完一个单元都要及时总结。', examplePy: 'Měi xuéwán yí gè dānyuán dōu yào jíshí zǒngjié.', exampleVi: 'Học xong mỗi Unit đều cần tổng kết kịp thời.', strokes: 9, radical: '心' },
  { id: 'hsk4_v019', word: '不仅', pinyin: 'bùjǐn', sino: 'Bất cẩn', meaning: 'Không những, không chỉ', type: 'Liên từ', level: 'HSK4', exampleCn: '她不仅会说汉语，还会写毛笔字。', examplePy: 'Tā bùjǐn huì shuō Hànyǔ, hái huì xiě máobǐzì.', exampleVi: 'Cô ấy không chỉ biết nói tiếng Hán mà còn biết viết thư pháp.', strokes: 4, radical: '一' },
  { id: 'hsk4_v020', word: '尽管', pinyin: 'jǐnguǎn', sino: 'Tận quản', meaning: 'Mặc dù, cho dù', type: 'Liên từ', level: 'HSK4', exampleCn: '尽管困难重重，大家依然没有放弃。', examplePy: 'Jǐnguǎn kùnnan chóngchóng, dàjiā yīrán méiyǒu fàngqì.', exampleVi: 'Dù khó khăn chồng chất, mọi người vẫn không bỏ cuộc.', strokes: 6, radical: '尸' },
  { id: 'hsk4_v021', word: '经济', pinyin: 'jīngjì', sino: 'Kinh tế', meaning: 'Kinh tế', type: 'Danh từ', level: 'HSK4', exampleCn: '两国之间的经济合作越来越密切。', examplePy: 'Liǎng guó zhījiān de jīngjì hézuò yuèláiyuè mìqiè.', exampleVi: 'Hợp tác kinh tế giữa hai nước ngày càng mật thiết.', strokes: 8, radical: '纟' },
  { id: 'hsk4_v022', word: '社会', pinyin: 'shèhuì', sino: 'Xã hội', meaning: 'Xã hội', type: 'Danh từ', level: 'HSK4', exampleCn: '大学生应该多参与社会实践活动。', examplePy: 'Dàxuéshēng yīnggāi duō cānyù shèhuì shíjiàn huódòng.', exampleVi: 'Sinh viên nên tham gia nhiều hoạt động thực tiễn xã hội.', strokes: 7, radical: '礻' },

  // ── HSK 5 (20 words) ──
  { id: 'hsk5_v001', word: '趋势', pinyin: 'qūshì', sino: 'Xu thế', meaning: 'Xu hướng, xu thế', type: 'Danh từ', level: 'HSK5', exampleCn: '绿色出行已经成为现代城市的新趋势。', examplePy: 'Lǜsè chūxíng yǐjīng chéngwéi xiàndài chéngshì de xīn qūshì.', exampleVi: 'Di chuyển xanh đã trở thành xu thế mới của đô thị hiện đại.', strokes: 12, radical: '走' },
  { id: 'hsk5_v002', word: '平衡', pinyin: 'pínghéng', sino: 'Bình hành', meaning: 'Cân bằng', type: 'Danh/Động từ', level: 'HSK5', exampleCn: '如何平衡工作与生活是一门艺术。', examplePy: 'Rúhé pínghéng gōngzuò yǔ shēnghuó shì yì mén yìshù.', exampleVi: 'Làm sao cân bằng giữa công việc và cuộc sống là một nghệ thuật.', strokes: 5, radical: '干' },
  { id: 'hsk5_v003', word: '创新', pinyin: 'chuàngxīn', sino: 'Sáng tân', meaning: 'Đổi mới, sáng tạo', type: 'Động/Danh từ', level: 'HSK5', exampleCn: '科技企业必须不断创新才能保持领先。', examplePy: 'Kējì qǐyè bìxū búduàn chuàngxīn cái néng bǎochí lǐngxiān.', exampleVi: 'Doanh nghiệp công nghệ phải không ngừng đổi mới để dẫn đầu.', strokes: 6, radical: '刂' },
  { id: 'hsk5_v004', word: '分析', pinyin: 'fēnxī', sino: 'Phân tích', meaning: 'Phân tích', type: 'Động từ', level: 'HSK5', exampleCn: '我们需要用数据深入分析用户行为。', examplePy: 'Wǒmen xūyào yòng shùjù shēnrù fēnxī yònghù xíngwéi.', exampleVi: 'Chúng ta cần dùng dữ liệu phân tích sâu hành vi người dùng.', strokes: 4, radical: '刀' },
  { id: 'hsk5_v005', word: '原则', pinyin: 'yuánzé', sino: 'Nguyên tắc', meaning: 'Nguyên tắc', type: 'Danh từ', level: 'HSK5', exampleCn: '做人做事都要坚持诚信原则。', examplePy: 'Zuòrén zuòshì dōu yào jiānchí chéngxìn yuánzé.', exampleVi: 'Làm người làm việc đều phải giữ vững nguyên tắc chữ tín.', strokes: 10, radical: '厂' },
  { id: 'hsk5_v006', word: '效率', pinyin: 'gāoxiào', sino: 'Cao hiệu', meaning: 'Hiệu quả cao', type: 'Tính từ', level: 'HSK5', exampleCn: '团队协作让整个项目更加高效。', examplePy: 'Tuánduì xiézuò ràng zhěnggè xiàngmù gèngjiā gāoxiào.', exampleVi: 'Làm việc nhóm giúp cả dự án đạt hiệu quả cao hơn.', strokes: 10, radical: '高' },
  { id: 'hsk5_v007', word: '现象', pinyin: 'xiànxiàng', sino: 'Hiện tượng', meaning: 'Hiện tượng', type: 'Danh từ', level: 'HSK5', exampleCn: '这种社会现象引起了广泛讨论。', examplePy: 'Zhè zhǒng shèhuì xiànxiàng yǐnqǐ le guǎngfàn tǎolùn.', exampleVi: 'Hiện tượng xã hội này đã khơi lên cuộc thảo luận rộng rãi.', strokes: 8, radical: '王' },
  { id: 'hsk5_v008', word: '资源', pinyin: 'zīyuán', sino: 'Tư nguyên', meaning: 'Tài nguyên, nguồn lực', type: 'Danh từ', level: 'HSK5', exampleCn: '节约水资源是可持续发展的关键。', examplePy: 'Jiéyuē shuǐ zīyuán shì kěchíxù fāzhǎn de guānjiàn.', exampleVi: 'Tiết kiệm tài nguyên nước là then chốt của phát triển bền vững.', strokes: 10, radical: '贝' },
  { id: 'hsk5_v009', word: '价值', pinyin: 'jiàzhí', sino: 'Giá trị', meaning: 'Giá trị', type: 'Danh từ', level: 'HSK5', exampleCn: '真正有价值的作品经得起时间考验。', examplePy: 'Zhēnzhèng yǒu jiàzhí de zuòpǐn jīngdeqǐ shíjiān kǎoyàn.', exampleVi: 'Tác phẩm thật sự có giá trị sẽ vượt qua thử thách thời gian.', strokes: 6, radical: '亻' },
  { id: 'hsk5_v010', word: '体会', pinyin: 'tǐhuì', sino: 'Thể hội', meaning: 'Cảm nhận, lĩnh hội', type: 'Động/Danh từ', level: 'HSK5', exampleCn: '只有亲身经历才能深刻体会其中的意义。', examplePy: 'Zhǐyǒu qīnshēn jīnglì cái néng shēnkè tǐhuì qízhōng de yìyì.', exampleVi: 'Chỉ khi tự mình trải qua mới thấu hiểu sâu sắc ý nghĩa bên trong.', strokes: 7, radical: '亻' },
  { id: 'hsk5_v011', word: '克服', pinyin: 'kèfú', sino: 'Khắc phục', meaning: 'Khắc phục, vượt qua', type: 'Động từ', level: 'HSK5', exampleCn: '勇敢面对并克服学习中的瓶颈期。', examplePy: 'Yǒnggǎn miànduì bìng kèfú xuéxí zhōng de píngjǐngqī.', exampleVi: 'Dũng cảm đối mặt và vượt qua giai đoạn chững lại khi học.', strokes: 7, radical: '十' },
  { id: 'hsk5_v012', word: '珍惜', pinyin: 'zhēnxī', sino: 'Trân tích', meaning: 'Trân trọng, quý trọng', type: 'Động từ', level: 'HSK5', exampleCn: '请珍惜青春时光，努力提升自己。', examplePy: 'Qǐng zhēnxī qīngchūn shíguāng, nǔlì tíshēng zìjǐ.', exampleVi: 'Hãy trân trọng tuổi trẻ và nỗ lực nâng tầm bản thân.', strokes: 9, radical: '王' },
  { id: 'hsk5_v013', word: '乐观', pinyin: 'lèguān', sino: 'Lạc quan', meaning: 'Lạc quan', type: 'Tính từ', level: 'HSK5', exampleCn: '保持乐观的心态有助于化解难题。', examplePy: 'Bǎochí lèguān de xīntài yǒuzhùyú huàjiě nántí.', exampleVi: 'Giữ tâm thế lạc quan giúp hóa giải những vấn đề hóc búa.', strokes: 5, radical: '丿' },
  { id: 'hsk5_v014', word: '逻辑', pinyin: 'luóji', sino: 'Logic', meaning: 'Lô-gic, tính hợp lý', type: 'Danh từ', level: 'HSK5', exampleCn: '这篇文章论述清晰，逻辑严密。', examplePy: 'Zhè piān wénzhāng lùnshù qīngxī, luóji yánmì.', exampleVi: 'Bài viết này lập luận sắc bén, logic chặt chẽ.', strokes: 11, radical: '辶' },
  { id: 'hsk5_v015', word: '措施', pinyin: 'cuòshī', sino: 'Thố thi', meaning: 'Biện pháp, giải pháp', type: 'Danh từ', level: 'HSK5', exampleCn: '政府采取了多项措施改善空气质量。', examplePy: 'Zhèngfǔ cǎiqǔ le duō xiàng cuòshī gǎishàn kōngqì zhìliàng.', exampleVi: 'Chính phủ áp dụng nhiều biện pháp cải thiện chất lượng không khí.', strokes: 11, radical: '扌' },
  { id: 'hsk5_v016', word: '核心', pinyin: 'héxīn', sino: 'Hạch tâm', meaning: 'Cốt lõi, trọng tâm', type: 'Danh từ', level: 'HSK5', exampleCn: '用户体验是软件产品的核心竞争力。', examplePy: 'Yònghù tǐyàn shì ruǎnjiàn chǎnpǐn de héxīn jìngzhēnglì.', exampleVi: 'Trải nghiệm người dùng là năng lực cạnh tranh cốt lõi của phần mềm.', strokes: 10, radical: '木' },
  { id: 'hsk5_v017', word: '领域', pinyin: 'lǐngyù', sino: 'Lĩnh vực', meaning: 'Lĩnh vực', type: 'Danh từ', level: 'HSK5', exampleCn: '她在教育科技领域深耕了十年。', examplePy: 'Tā zài jiàoyù kējì lǐngyù shēngēng le shí nián.', exampleVi: 'Cô ấy đã gắn bó sâu sắc 10 năm trong lĩnh vực EdTech.', strokes: 11, radical: '页' },
  { id: 'hsk5_v018', word: '观念', pinyin: 'guānniàn', sino: 'Quan niệm', meaning: 'Quan niệm, nhận thức', type: 'Danh từ', level: 'HSK5', exampleCn: '随着时代发展，人们的消费观念变了。', examplePy: 'Suízhe shídài fāzhǎn, rénmen de xiāofèi guānniàn biàn le.', exampleVi: 'Theo sự phát triển của thời đại, quan niệm tiêu dùng đã thay đổi.', strokes: 6, radical: '见' },
  { id: 'hsk5_v019', word: '明显', pinyin: 'míngxiǎn', sino: 'Minh hiển', meaning: 'Rõ rệt, hiển nhiên', type: 'Tính từ', level: 'HSK5', exampleCn: '坚持一个月后，他的进步十分明显。', examplePy: 'Jiānchí yí gè yuè hòu, tā de jìnbù shífēn míngxiǎn.', exampleVi: 'Sau một tháng kiên trì, sự tiến bộ của anh ấy vô cùng rõ rệt.', strokes: 8, radical: '日' },
  { id: 'hsk5_v020', word: '综合', pinyin: 'zōnghé', sino: 'Tổng hợp', meaning: 'Tổng hợp, toàn diện', type: 'Động/Tính từ', level: 'HSK5', exampleCn: 'HSK考试注重考查综合语言应用能力。', examplePy: 'HSK kǎoshì zhùzhòng kǎochá zōnghé yǔyán yìngyòng nénglì.', exampleVi: 'Kỳ thi HSK chú trọng kiểm tra năng lực vận dụng ngôn ngữ tổng hợp.', strokes: 11, radical: '纟' },

  // ── HSK 6 (20 words) ──
  { id: 'hsk6_v001', word: '潜移默化', pinyin: 'qiányí-mòhuà', sino: 'Tiềm di mặc hóa', meaning: 'Thấm nhuần dần một cách tự nhiên', type: 'Thành ngữ', level: 'HSK6', exampleCn: '良好的家庭氛围对孩子产生潜移默化的影响。', examplePy: 'Liánghǎo de jiātíng fēnwéi duì háizi chǎnshēng qiányí-mòhuà de yǐngxiǎng.', exampleVi: 'Bầu không khí gia đình tốt tác động âm thầm và sâu sắc tới trẻ nhỏ.', strokes: 15, radical: '氵' },
  { id: 'hsk6_v002', word: '循序渐进', pinyin: 'xúnxù-jiànjìn', sino: 'Tuần tự tiệm tiến', meaning: 'Tiến từng bước theo đúng trình tự', type: 'Thành ngữ', level: 'HSK6', exampleCn: '学习语言贵在循序渐进，切忌急于求成。', examplePy: 'Xuéxí yǔyán guìzài xúnxù-jiànjìn, qièjì jíyú-qiúchéng.', exampleVi: 'Học ngoại ngữ quý ở chỗ đi từng bước vững chắc, kỵ nóng vội.', strokes: 12, radical: '彳' },
  { id: 'hsk6_v003', word: '锲而不舍', pinyin: 'qiè-ér-bùshě', sino: 'Khế nhi bất xá', meaning: 'Kiên trì bền bỉ không ngừng nghỉ', type: 'Thành ngữ', level: 'HSK6', exampleCn: '正是这种锲而不舍的精神成就了他的事业。', examplePy: 'Zhèngshì zhè zhǒng qiè-ér-bùshě de jīngshén chéngjiù le tā de shìyè.', exampleVi: 'Chính tinh thần bền bỉ không bỏ cuộc ấy đã làm nên sự nghiệp của ông.', strokes: 14, radical: '钅' },
  { id: 'hsk6_v004', word: '博大精深', pinyin: 'bódà-jīngshēn', sino: 'Bác đại tinh thâm', meaning: 'Rộng lớn và sâu sắc tinh tế', type: 'Thành ngữ', level: 'HSK6', exampleCn: '中华文化源远流长，博大精深。', examplePy: 'Zhōnghuá wénhuà yuányuǎn-liúcháng, bódà-jīngshēn.', exampleVi: 'Văn hóa Trung Hoa lâu đời, rộng lớn và sâu sắc.', strokes: 12, radical: '十' },
  { id: 'hsk6_v005', word: '相辅相成', pinyin: 'xiāngfǔ-xiāngchéng', sino: 'Tương phụ tương thành', meaning: 'Bổ trợ và hoàn thiện lẫn nhau', type: 'Thành ngữ', level: 'HSK6', exampleCn: '理论学习与实践应用相辅相成。', examplePy: 'Lǐlùn xuéxí yǔ shíjiàn yìngyòng xiāngfǔ-xiāngchéng.', exampleVi: 'Học lý thuyết và ứng dụng thực tiễn bổ trợ cho nhau.', strokes: 9, radical: '目' },
  { id: 'hsk6_v006', word: '洞察', pinyin: 'dòngchá', sino: 'Động sát', meaning: 'Nhìn thấu, thấu hiểu sắc bén', type: 'Động từ', level: 'HSK6', exampleCn: '优秀的领导者能敏锐洞察市场变化。', examplePy: 'Yōuxiù de lǐngdǎozhě néng mǐnruì dòngchá shìchǎng biànhuà.', exampleVi: 'Nhà lãnh đạo xuất sắc có thể nhạy bén nhìn thấu biến động thị trường.', strokes: 9, radical: '氵' },
  { id: 'hsk6_v007', word: '蕴含', pinyin: 'yùnhán', sino: 'Uẩn hàm', meaning: 'Hàm chứa, ẩn chứa', type: 'Động từ', level: 'HSK6', exampleCn: '每个汉字背后都蕴含着古老的智慧。', examplePy: 'Měi gè Hànzì bèihòu dōu yùnhánzhe gǔlǎo de zhìhuì.', exampleVi: 'Đằng sau mỗi chữ Hán đều ẩn chứa trí tuệ cổ xưa.', strokes: 15, radical: '艹' },
  { id: 'hsk6_v008', word: '弘扬', pinyin: 'hóngyáng', sino: 'Hoằng dương', meaning: 'Phát huy, lan tỏa giá trị tốt đẹp', type: 'Động từ', level: 'HSK6', exampleCn: '我们应当继承并弘扬优良传统。', examplePy: 'Wǒmen yīngdāng jìchéng bìng hóngyáng yōuliáng chuántǒng.', exampleVi: 'Chúng ta cần kế thừa và phát huy truyền thống tốt đẹp.', strokes: 5, radical: '弓' },
  { id: 'hsk6_v009', word: '严谨', pinyin: 'yánjǐn', sino: 'Nghiêm cẩn', meaning: 'Nghiêm ngặt, chặt chẽ, cẩn trọng', type: 'Tính từ', level: 'HSK6', exampleCn: '科学研究需要极其严谨的态度。', examplePy: 'Kēxué yánjiū xūyào jíqí yánjǐn de tàidù.', exampleVi: 'Nghiên cứu khoa học đòi hỏi thái độ cực kỳ nghiêm cẩn.', strokes: 7, radical: '一' },
  { id: 'hsk6_v010', word: '诠释', pinyin: 'quánshì', sino: 'Thuyên thích', meaning: 'Diễn giải, lý giải sâu sắc', type: 'Động từ', level: 'HSK6', exampleCn: '这部纪录片生动诠释了匠人精神。', examplePy: 'Zhè bù jìlùpiàn shēngdòng quánshì le jiàngrén jīngshén.', exampleVi: 'Bộ phim tài liệu này diễn giải sinh động tinh thần nghệ nhân.', strokes: 8, radical: '讠' },
  { id: 'hsk6_v011', word: '格局', pinyin: 'géjú', sino: 'Cách cục', meaning: 'Tầm nhìn, cục diện, bố cục', type: 'Danh từ', level: 'HSK6', exampleCn: '一个人读过的书决定了他的眼界与格局。', examplePy: 'Yí gè rén dúguo de shū juédìng le tā de yǎnjiè yǔ géjú.', exampleVi: 'Những cuốn sách một người đọc quyết định tầm nhìn và cốt cách của họ.', strokes: 10, radical: '木' },
  { id: 'hsk6_v012', word: '契机', pinyin: 'qìjī', sino: 'Khế cơ', meaning: 'Cơ hội then chốt, bước ngoặt', type: 'Danh từ', level: 'HSK6', exampleCn: '数字化转型为传统行业带来了新契机。', examplePy: 'Shùzìhuà zhuǎnxíng wèi chuántǒng hángyè dàilái le xīn qìjī.', exampleVi: 'Chuyển đổi số mang lại cơ hội bước ngoặt cho ngành truyền thống.', strokes: 9, radical: '大' },
  { id: 'hsk6_v013', word: '共识', pinyin: 'gòngshí', sino: 'Cộng thức', meaning: 'Sự đồng thuận', type: 'Danh từ', level: 'HSK6', exampleCn: '经过讨论，双方终于达成了一致共识。', examplePy: 'Jīngguò tǎolùn, shuāngfāng zhōngyú dáchéng le yízhì gòngshí.', exampleVi: 'Sau thảo luận, hai bên cuối cùng đạt được đồng thuận chung.', strokes: 6, radical: '八' },
  { id: 'hsk6_v014', word: '践行', pinyin: 'jiànxíng', sino: 'Tiễn hành', meaning: 'Thực thi, áp dụng vào thực tiễn', type: 'Động từ', level: 'HSK6', exampleCn: '用实际行动践行终身学习的理念。', examplePy: 'Yòng shíjì xíngdòng jiànxíng zhōngshēn xuéxí de lǐniàn.', exampleVi: 'Dùng hành động thực tế thực thi triết lý học tập suốt đời.', strokes: 12, radical: '足' },
  { id: 'hsk6_v015', word: '凝聚', pinyin: 'níngjù', sino: 'Ngưng tụ', meaning: 'Ngưng tụ, gắn kết', type: 'Động từ', level: 'HSK6', exampleCn: '这个项目凝聚了全队成员的心血。', examplePy: 'Zhège xiàngmù níngjù le quánduì chéngyuán de xīnxuè.', exampleVi: 'Dự án này kết tinh tâm huyết của tất cả thành viên trong nhóm.', strokes: 16, radical: '冫' },
  { id: 'hsk6_v016', word: '凸显', pinyin: 'tūxiǎn', sino: 'Đột hiển', meaning: 'Làm nổi bật, bộc lộ rõ', type: 'Động từ', level: 'HSK6', exampleCn: '这一案例凸显了跨文化沟通的价值。', examplePy: 'Zhè yì ànlì tūxiǎn le kuàwénhuà gōutōng de jiàzhí.', exampleVi: 'Trường hợp này làm nổi bật giá trị của giao tiếp liên văn hóa.', strokes: 5, radical: '凵' },
  { id: 'hsk6_v017', word: '兼顾', pinyin: 'jiāngù', sino: 'Kiêm cố', meaning: 'Chú trọng đồng thời cả hai mặt', type: 'Động từ', level: 'HSK6', exampleCn: '好的界面设计应兼顾美观与实用性。', examplePy: 'Hǎo de jièmiàn shèjì yīng jiāngù měiguān yǔ shíyòngxìng.', exampleVi: 'Thiết kế giao diện tốt cần cân bằng cả thẩm mỹ lẫn tính thực dụng.', strokes: 10, radical: '八' },
  { id: 'hsk6_v018', word: '蓬勃', pinyin: 'péngbó', sino: 'Bồng bột', meaning: 'Mạnh mẽ, sôi nổi, phồn thịnh', type: 'Tính từ', level: 'HSK6', exampleCn: '数字经济正呈现蓬勃发展的态势。', examplePy: 'Shùzì jīngjì zhèng chéngxiàn péngbó fāzhǎn de tàishì.', exampleVi: 'Kinh tế số đang cho thấy đà phát triển vô cùng mạnh mẽ.', strokes: 13, radical: '艹' },
  { id: 'hsk6_v019', word: '精益求精', pinyin: 'jīngyì-qiújīng', sino: 'Tinh ích cầu tinh', meaning: 'Đã tốt rồi còn phấn đấu tốt hơn nữa', type: 'Thành ngữ', level: 'HSK6', exampleCn: '打磨产品必须抱着精益求精的态度。', examplePy: 'Dǎmó chǎnpǐn bìxū bàozhe jīngyì-qiújīng de tàidù.', exampleVi: 'Hoàn thiện sản phẩm phải giữ thái độ không ngừng trau chuốt.', strokes: 14, radical: '米' },
  { id: 'hsk6_v020', word: '举足轻重', pinyin: 'jǔzú-qīngzhòng', sino: 'Cử túc khinh trọng', meaning: 'Có vị trí, tầm ảnh hưởng cực kỳ quan trọng', type: 'Thành ngữ', level: 'HSK6', exampleCn: '掌握中文在亚洲商贸中具有举足轻重的作用。', examplePy: 'Zhǎngwò Zhōngwén zài Yàzhōu shāngmào zhōng jùyǒu jǔzú-qīngzhòng de zuòyòng.', exampleVi: 'Thành thạo tiếng Trung giữ vai trò cực kỳ trọng yếu trong thương mại châu Á.', strokes: 9, radical: '丶' },
];

// ── Complete Pinyin Seed (21 Initials + 24 Finals + Minimal Pairs) ──
const PINYIN_INITIALS = [
  { syl: 'b', guide: 'Hai môi khép nhẹ rồi bật ra, KHÔNG bật hơi (giống "p" nhẹ không hơi).' },
  { syl: 'p', guide: 'Hai môi khép chặt rồi BẬT HƠI mạnh ra ngoài.' },
  { syl: 'm', guide: 'Khép hai môi, đẩy luồng hơi rung qua mũi (giống "m" tiếng Việt).' },
  { syl: 'f', guide: 'Răng trên chạm môi dưới, thổi nhẹ (giống "ph" tiếng Việt).' },
  { syl: 'd', guide: 'Đầu lưỡi chạm chân răng trên rồi bật nhẹ, KHÔNG bật hơi (giống "t" Việt).' },
  { syl: 't', guide: 'Đầu lưỡi chạm chân răng trên rồi BẬT HƠI mạnh (giống "th" bật hơi).' },
  { syl: 'n', guide: 'Đầu lưỡi chạm lợi trên, luồng hơi đi qua mũi (giống "n" tiếng Việt).' },
  { syl: 'l', guide: 'Đầu lưỡi chạm lợi trên, hơi thoát hai bên lưỡi (giống "l" tiếng Việt).' },
  { syl: 'g', guide: 'Cuống lưỡi nâng chạm ngạc mềm, KHÔNG bật hơi (giống "c/k" Việt).' },
  { syl: 'k', guide: 'Cuống lưỡi chạm ngạc mềm rồi BẬT HƠI mạnh (giống "kh" bật mạnh).' },
  { syl: 'h', guide: 'Cuống lưỡi gần ngạc mềm, ma sát nhẹ giữa "h" và "kh".' },
  { syl: 'j', guide: 'Mặt lưỡi sát ngạc cứng, miệng dẹt như mỉm cười, KHÔNG bật hơi (giống "ch" nhẹ).' },
  { syl: 'q', guide: 'Mặt lưỡi sát ngạc cứng, miệng dẹt và BẬT HƠI mạnh (giống "ch" bật hơi).' },
  { syl: 'x', guide: 'Mặt lưỡi gần ngạc cứng, luồng hơi xì nhẹ (giống "x" mềm miệng cười).' },
  { syl: 'zh', guide: 'Uốn cong đầu lưỡi chạm ngạc cứng, KHÔNG bật hơi (giống "tr" uốn lưỡi).' },
  { syl: 'ch', guide: 'Uốn cong đầu lưỡi chạm ngạc cứng rồi BẬT HƠI mạnh.' },
  { syl: 'sh', guide: 'Uốn cong đầu lưỡi, luồng hơi ma sát (giống "s" nặng uốn lưỡi).' },
  { syl: 'r', guide: 'Uốn cong đầu lưỡi gần ngạc cứng, dây thanh rung nhẹ (giống "gi/r" mềm).' },
  { syl: 'z', guide: 'Đầu lưỡi thẳng chạm mặt sau răng trên, KHÔNG bật hơi (giống "ch" thẳng lưỡi).' },
  { syl: 'c', guide: 'Đầu lưỡi thẳng chạm mặt sau răng trên rồi BẬT HƠI mạnh (xì mạnh).' },
  { syl: 's', guide: 'Đầu lưỡi thẳng gần răng trên, luồng hơi xì nhẹ (giống "x" sắc).' },
  { syl: 'y', guide: 'Bán nguyên âm đứng đầu âm tiết thay cho "i", miệng dẹt nhẹ như khi đọc "i".' },
  { syl: 'w', guide: 'Bán nguyên âm đứng đầu âm tiết thay cho "u", tròn môi chu ra phía trước.' },
];

const PINYIN_FINALS = [
  { syl: 'a', guide: 'Mở rộng khoang miệng tự nhiên, lưỡi hạ thấp (giống "a").' },
  { syl: 'o', guide: 'Tròn môi vừa phải, đọc mượt giữa "ô" và "ua".' },
  { syl: 'e', guide: 'Môi không tròn, hơi kéo ngang, đọc giữa "ơ" và "ưa".' },
  { syl: 'i', guide: 'Khóe miệng kéo ngang như mỉm cười (giống "i").' },
  { syl: 'u', guide: 'Tròn môi chu ra phía trước (giống "u").' },
  { syl: 'ü', guide: 'Môi tròn chặt như đọc "u" nhưng trong miệng phát âm "i".' },
  { syl: 'ai', guide: 'Lướt nhanh từ "a" sang "i" (giống "ai").' },
  { syl: 'ei', guide: 'Lướt từ "ê" sang "i" (giống "ây").' },
  { syl: 'ui', guide: 'Viết tắt của uei, đọc lướt "uây".' },
  { syl: 'ao', guide: 'Lướt từ "a" sang "o" tròn môi (giống "ao").' },
  { syl: 'ou', guide: 'Lướt từ "ô" sang "u" (giống "âu").' },
  { syl: 'iu', guide: 'Viết tắt của iou, đọc lướt "iâu".' },
  { syl: 'ie', guide: 'Lướt từ "i" sang "ê" (giống "ia/iê").' },
  { syl: 'üe', guide: 'Lướt từ "ü" tròn môi sang "ê".' },
  { syl: 'er', guide: 'Đọc "ơ" đồng thời uốn cong đầu lưỡi lên trên.' },
  { syl: 'an', guide: 'Âm mũi trước, kết thúc đầu lưỡi chạm lợi (giống "an").' },
  { syl: 'en', guide: 'Âm mũi trước, đọc gần giống "ân".' },
  { syl: 'in', guide: 'Âm mũi trước, đọc giống "in".' },
  { syl: 'un', guide: 'Viết tắt của uen, đọc giống "uân".' },
  { syl: 'ün', guide: 'Môi tròn "ü" nối âm mũi "n".' },
  { syl: 'ang', guide: 'Âm mũi sau, mở rộng miệng, rung cuống lưỡi (giống "ang").' },
  { syl: 'eng', guide: 'Âm mũi sau, đọc gần giống "âng".' },
  { syl: 'ing', guide: 'Âm mũi sau, đọc giống "ing/inh".' },
  { syl: 'ong', guide: 'Âm mũi sau, môi tròn, đọc giống "ung".' },
];

// ── New Enriched Curriculum Chapters & Lessons for HSK 1–6 ──
const HSK_CURRICULUM_BLUEPRINT: Record<
  string,
  {
    courseTitle: string;
    courseDesc: string;
    units: Array<{
      title: string;
      lessons: Array<{
        title: string;
        duration: number;
        grammarTitle: string;
        grammarPoints: string[];
        dialogue: Array<{ speaker: string; cn: string; py: string; vi: string }>;
        vocabWords: string[];
      }>;
    }>;
  }
> = {
  HSK1: {
    courseTitle: 'HSK 1 — Khởi đầu Tiếng Trung Giao Tiếp',
    courseDesc: 'Nắm vững 150 từ vựng cốt lõi, hệ thống phát âm Pinyin 4 thanh điệu và 15 mẫu câu giao tiếp cơ bản.',
    units: [
      {
        title: 'Unit 1: Chào hỏi & Làm quen (你好)',
        lessons: [
          {
            title: 'Bài 1: Chào hỏi lịch sự — 你好 & 您好',
            duration: 15,
            grammarTitle: 'Cách dùng đại từ 你 / 您 và câu chào chuẩn',
            grammarPoints: [
              '你好 (nǐ hǎo): Chào thông thường với bạn bè, người ngang hàng.',
              '您好 (nín hǎo): Chào kính trọng với thầy cô, người lớn tuổi hoặc khách hàng.',
              'Biến điệu thanh 3: Khi hai thanh 3 đứng liền nhau (nǐ + hǎo), âm tiết đầu đọc thành thanh 2 (ní hǎo).',
            ],
            dialogue: [
              { speaker: 'A', cn: '你好！你叫什么名字？', py: 'Nǐ hǎo! Nǐ jiào shénme míngzi?', vi: 'Xin chào! Bạn tên là gì?' },
              { speaker: 'B', cn: '你好！我叫小明，很高兴认识你。', py: 'Nǐ hǎo! Wǒ jiào Xiǎomíng, hěn gāoxìng rènshi nǐ.', vi: 'Chào bạn! Mình tên Tiểu Minh, rất vui được làm quen.' },
              { speaker: 'A', cn: '我是越南学生，我在学习汉语。', py: 'Wǒ shì Yuènán xuésheng, wǒ zài xuéxí Hànyǔ.', vi: 'Mình là sinh viên Việt Nam, mình đang học tiếng Trung.' },
            ],
            vocabWords: ['你好', '谢谢', '不客气', '再见'],
          },
          {
            title: 'Bài 2: Cảm ơn, Xin lỗi & Quốc tịch',
            duration: 15,
            grammarTitle: 'Cấu trúc câu chữ 是 (là) và thể phủ định 不是',
            grammarPoints: [
              'Chủ ngữ + 是 + Danh từ: 我是学生 (Tôi là học sinh).',
              'Thể phủ định: Chủ ngữ + 不是 + Danh từ: 我不是老师 (Tôi không phải giáo viên).',
              'Đáp lại lời cảm ơn dùng 不客气; đáp lại xin lỗi dùng 没关系.',
            ],
            dialogue: [
              { speaker: 'A', cn: '对不起，我来晚了！', py: 'Duìbuqǐ, wǒ lái wǎn le!', vi: 'Xin lỗi, tôi đến muộn rồi!' },
              { speaker: 'B', cn: '没关系，请坐，喝茶吧。', py: 'Méi guānxi, qǐng zuò, hē chá ba.', vi: 'Không sao đâu, mời ngồi, uống trà đi.' },
              { speaker: 'A', cn: '谢谢王老师！', py: 'Xièxie Wáng lǎoshī!', vi: 'Cảm ơn thầy Vương ạ!' },
            ],
            vocabWords: ['对不起', '没关系', '老师', '学生'],
          },
        ],
      },
      {
        title: 'Unit 2: Thời gian, Mua sắm & Đời sống',
        lessons: [
          {
            title: 'Bài 3: Hỏi ngày tháng, Thứ & Thời tiết',
            duration: 15,
            grammarTitle: 'Cách hỏi thời gian với 几 và trạng ngữ thời gian',
            grammarPoints: [
              'Trạng ngữ thời gian đứng TRƯỚC hoặc NGAY SAU chủ ngữ: 今天天气很好 (Thời tiết hôm nay rất đẹp).',
              '星期一 đến 星期六 là Thứ 2 đến Thứ 7; Chủ nhật là 星期天 / 星期日.',
            ],
            dialogue: [
              { speaker: 'A', cn: '请问，今天星期几？', py: 'Qǐngwèn, jīntiān xīngqī jǐ?', vi: 'Xin hỏi hôm nay là thứ mấy?' },
              { speaker: 'B', cn: '今天星期三，明天上午我们有汉语课。', py: 'Jīntiān xīngqīsān, míngtiān shàngwǔ wǒmen yǒu Hànyǔ kè.', vi: 'Hôm nay thứ Tư, sáng mai chúng ta có tiết tiếng Hán.' },
            ],
            vocabWords: ['今天', '明天', '星期', '天气'],
          },
          {
            title: 'Bài 4: Hỏi giá tiền & Ăn uống',
            duration: 18,
            grammarTitle: 'Cách dùng 多少 (bao nhiêu) & lượng từ cơ bản',
            grammarPoints: [
              '多少钱 (duōshao qián): Dùng để hỏi giá cả (không giới hạn dưới 10 như 几).',
              'Cấu trúc rủ rê: 我们一起 + Động từ + 吧 (Chúng ta cùng ... nhé).',
            ],
            dialogue: [
              { speaker: 'A', cn: '请问，这个多少钱？', py: 'Qǐngwèn, zhège duōshao qián?', vi: 'Xin hỏi cái này bao nhiêu tiền?' },
              { speaker: 'B', cn: '二十块钱，很便宜。', py: 'Èrshí kuài qián, hěn piányi.', vi: 'Hai mươi tệ, rất rẻ.' },
              { speaker: 'A', cn: '好，我们一起去吃饭吧！', py: 'Hǎo, wǒmen yìqǐ qù chīfàn ba!', vi: 'Được, chúng ta cùng đi ăn cơm nhé!' },
            ],
            vocabWords: ['多少钱', '吃饭', '喝茶', '喜欢'],
          },
        ],
      },
    ],
  },
  HSK2: {
    courseTitle: 'HSK 2 — Giao Tiếp Đời Sống Trôi Chảy',
    courseDesc: 'Mở rộng 300 từ vựng, câu phức nguyên nhân - kết quả, so sánh và giao tiếp du lịch, nhà hàng.',
    units: [
      {
        title: 'Unit 1: Kế hoạch, Du lịch & Sức khỏe',
        lessons: [
          {
            title: 'Bài 1: Lên kế hoạch du lịch với 准备 & 希望',
            duration: 18,
            grammarTitle: 'Cấu trúc 准备 + Động từ & 已经 ... 了',
            grammarPoints: [
              '准备 + V: Chuẩn bị làm gì / Dự định làm gì (我准备去北京旅游).',
              '已经 + V/Adj + 了: Biểu thị hành động đã xảy ra (我已经学了半年汉语了).',
            ],
            dialogue: [
              { speaker: 'A', cn: '下个月你准备去哪儿旅游？', py: 'Xià gè yuè nǐ zhǔnbèi qù nǎr lǚyóu?', vi: 'Tháng sau bạn dự định đi đâu du lịch?' },
              { speaker: 'B', cn: '我希望去上海看看，我已经买好机票了。', py: 'Wǒ xīwàng qù Shànghǎi kànkan, wǒ yǐjīng mǎihǎo jīpiào le.', vi: 'Mình hy vọng đi Thượng Hải tham quan, mình mua vé máy bay rồi.' },
            ],
            vocabWords: ['准备', '希望', '旅游', '已经'],
          },
          {
            title: 'Bài 2: Câu phức 因为...所以... và 虽然...但是...',
            duration: 20,
            grammarTitle: 'Liên từ biểu thị nguyên nhân và sự tương phản',
            grammarPoints: [
              '因为 A，所以 B: Bởi vì A cho nên B.',
              '虽然 A，但是 B: Tuy A nhưng mà B (không dùng kèm "nhưng" thừa ở vế đầu).',
            ],
            dialogue: [
              { speaker: 'A', cn: '虽然汉字有点难，但是我觉得非常有意思。', py: 'Suīrán Hànzì yǒudiǎn nán, dànshì wǒ juéde fēicháng yǒu yìsi.', vi: 'Tuy chữ Hán hơi khó nhưng mình thấy vô cùng thú vị.' },
              { speaker: 'B', cn: '因为你每天都认真练习，所以进步很快！', py: 'Yīnwèi nǐ měitiān dōu rènzhēn liànxí, suǒyǐ jìnbù hěn kuài!', vi: 'Vì mỗi ngày bạn đều chăm chỉ luyện tập nên tiến bộ rất nhanh!' },
            ],
            vocabWords: ['因为', '所以', '虽然', '但是'],
          },
        ],
      },
      {
        title: 'Unit 2: Công việc, Học tập & Dịch vụ',
        lessons: [
          {
            title: 'Bài 3: Gọi món ăn & Di chuyển phương tiện công cộng',
            duration: 18,
            grammarTitle: 'Cấu trúc 既...又... (vừa... vừa...) & đi phương tiện với 坐',
            grammarPoints: [
              '既 + Adj1 + 又 + Adj2: Miêu tả 2 đặc điểm song song (既好吃又便宜).',
              '坐 + Phương tiện + 去 + Địa điểm: 坐公共汽车去公司.',
            ],
            dialogue: [
              { speaker: 'A', cn: '服务员，请问有什么菜既好吃又便宜？', py: 'Fúwùyuán, qǐngwèn yǒu shénme cài jì hǎochī yòu piányi?', vi: 'Phục vụ ơi, có món nào vừa ngon vừa rẻ không?' },
              { speaker: 'B', cn: '我们的宫保鸡丁非常受欢迎，请试试！', py: 'Wǒmen de Gōngbǎo jīdīng fēicháng shòu huānyíng, qǐng shìshi!', vi: 'Món gà Kung Pao của quán rất được ưa chuộng, mời quý khách thử!' },
            ],
            vocabWords: ['服务员', '便宜', '公共汽车', '帮助'],
          },
        ],
      },
    ],
  },
  HSK3: {
    courseTitle: 'HSK 3 — Tiếng Trung Trung Cấp Toàn Diện',
    courseDesc: 'Chinh phục 600 từ vựng, câu chữ 把, câu bị động 被 và giao tiếp tự tin trong học tập, công việc.',
    units: [
      {
        title: 'Unit 1: Văn hóa, Môi trường & Thói quen',
        lessons: [
          {
            title: 'Bài 1: Môi trường sống & Thói quen tốt',
            duration: 20,
            grammarTitle: 'Cấu trúc 如果...就... & Bổ ngữ kết quả',
            grammarPoints: [
              '如果 A，就 B: Nếu như A thì sẽ B.',
              'Động từ + 好 / 完 / 清楚: Diễn đạt kết quả hoàn tất của hành động (复习完, 听清楚).',
            ],
            dialogue: [
              { speaker: 'A', cn: '你对中国的传统文化感兴趣吗？', py: 'Nǐ duì Zhōngguó de chuántǒng wénhuà gǎn xìngqù ma?', vi: 'Bạn có hứng thú với văn hóa truyền thống Trung Quốc không?' },
              { speaker: 'B', cn: '非常感兴趣！如果今年有机会，我决定去西安看看历史古迹。', py: 'Fēicháng gǎn xìngqù! Rúguǒ jīnnián yǒu jīhuì, wǒ juédìng qù Xīān kànkan lìshǐ gǔjì.', vi: 'Rất thích luôn! Nếu năm nay có cơ hội, mình quyết định đi Tây An thăm di tích lịch sử.' },
            ],
            vocabWords: ['环境', '文化', '习惯', '决定'],
          },
          {
            title: 'Bài 2: Nâng cao kỹ năng & Giải quyết vấn đề',
            duration: 22,
            grammarTitle: 'Cách dùng 经过 (trải qua) & 必须 (bắt buộc)',
            grammarPoints: [
              '经过 + Thời gian/Quá trình + Kết quả: 经过三个月的努力，我的汉语提高了很多.',
              '必须 + Động từ: Nhấn mạnh sự cần thiết tuyệt đối (必须每天复习).',
            ],
            dialogue: [
              { speaker: 'A', cn: '你怎样在短时间内提高汉语成绩的？', py: 'Nǐ zěnyàng zài duǎn shíjiān nèi tígāo Hànyǔ chéngjì de?', vi: 'Bạn nâng cao điểm tiếng Trung trong thời gian ngắn bằng cách nào vậy?' },
              { speaker: 'B', cn: '必须养成每天复习和做练习题的好习惯！', py: 'Bìxū yǎngchéng měitiān fùxí hé zuò liànxítí de hǎo xíguàn!', vi: 'Nhất định phải rèn thói quen ôn tập và làm bài tập mỗi ngày!' },
            ],
            vocabWords: ['提高', '解决', '必须', '复习'],
          },
        ],
      },
    ],
  },
  HSK4: {
    courseTitle: 'HSK 4 — Thành Thạo Giao Tiếp & Công Sở',
    courseDesc: '1.200 từ vựng nâng cao, kỹ năng thuyết trình, phỏng vấn, viết luận ngắn và đọc báo chí cơ bản.',
    units: [
      {
        title: 'Unit 1: Công sở, Hiệu suất & Kiên trì',
        lessons: [
          {
            title: 'Bài 1: Phỏng vấn xin việc & Nâng cao hiệu suất',
            duration: 25,
            grammarTitle: 'Cấu trúc 不仅...而且... và 只要...就...',
            grammarPoints: [
              '不仅 A，而且 B: Không chỉ A mà còn B (nhấn mạnh mức độ tăng tiến).',
              '只要 A，就 B: Chỉ cần A thì nhất định B (điều kiện đủ).',
            ],
            dialogue: [
              { speaker: 'A', cn: '请问您最大的优点是什么？', py: 'Qǐngwèn nín zuì dà de yōudiǎn shì shénme?', vi: 'Xin hỏi ưu điểm lớn nhất của bạn là gì?' },
              { speaker: 'B', cn: '我不仅有丰富的团队合作经验，而且非常注重工作效率。', py: 'Wǒ bùjǐn yǒu fēngfù de tuánduì hézuò jīngyàn, érqiě fēicháng zhùzhòng gōngzuò xiàolǜ.', vi: 'Tôi không chỉ có kinh nghiệm làm việc nhóm phong phú mà còn rất chú trọng hiệu suất công việc.' },
            ],
            vocabWords: ['坚持', '经验', '效率', '优点'],
          },
          {
            title: 'Bài 2: Giao lưu văn hóa & Xin học bổng',
            duration: 25,
            grammarTitle: 'Cấu trúc 尽管...但是/依然... và 尊重',
            grammarPoints: [
              '尽管 A，依然 B: Mặc dù A nhưng vẫn B (mang sắc thái trang trọng hơn 虽然).',
              '给 + Ai + 留下深刻的印象: Để lại ấn tượng sâu sắc cho ai.',
            ],
            dialogue: [
              { speaker: 'A', cn: '你申请中国奖学金准备得怎么样了？', py: 'Nǐ shēnqǐng Zhōngguó jiǎngxuéjīn zhǔnbèi de zěnmeyàng le?', vi: 'Bạn chuẩn bị hồ sơ xin học bổng Trung Quốc tới đâu rồi?' },
              { speaker: 'B', cn: '尽管竞争很激烈，但我依然充满信心！', py: 'Jǐnguǎn jìngzhēng hěn jīliè, dàn wǒ yīrán chōngmǎn xìnxīn!', vi: 'Dù cạnh tranh rất gắt gao nhưng mình vẫn tràn đầy tự tin!' },
            ],
            vocabWords: ['申请', '竞争', '交流', '印象'],
          },
        ],
      },
    ],
  },
  HSK5: {
    courseTitle: 'HSK 5 — Đọc Báo, Phân Tích & Thảo Luận Chuyên Sâu',
    courseDesc: '2.500 từ vựng học thuật & thương mại, thảo luận xu hướng công nghệ, kinh tế và xã hội.',
    units: [
      {
        title: 'Unit 1: Xu thế Công nghệ, Đổi mới & Tư duy Logic',
        lessons: [
          {
            title: 'Bài 1: Xu thế chuyển đổi số & Năng lực đổi mới',
            duration: 28,
            grammarTitle: 'Văn phong nghị luận: 随着... / 成为...的关键',
            grammarPoints: [
              '随着 + Danh từ/Cụm động từ: Cùng với sự phát triển/thay đổi của...',
              '成为 + ... + 的核心 / 关键: Trở thành cốt lõi / chìa khóa của...',
            ],
            dialogue: [
              { speaker: 'A', cn: '你如何看待人工智能在教育领域的发展趋势？', py: 'Nǐ rúhé kàndài réngōng zhìnéng zài jiàoyù lǐngyù de fāzhǎn qūshì?', vi: 'Bạn đánh giá thế nào về xu thế phát triển AI trong lĩnh vực giáo dục?' },
              { speaker: 'B', cn: '个性化学习与不断创新已经成为提升效率的核心力量。', py: 'Gèxìnghuà xuéxí yǔ búduàn chuàngxīn yǐjīng chéngwéi tíshēng xiàolǜ de héxīn lìliàng.', vi: 'Học tập cá nhân hóa và đổi mới không ngừng đã trở thành động lực cốt lõi nâng cao hiệu quả.' },
            ],
            vocabWords: ['趋势', '创新', '核心', '领域'],
          },
        ],
      },
    ],
  },
  HSK6: {
    courseTitle: 'HSK 6 — Thành Ngữ, Học Thuật & Biểu Đạt Như Người Bản Xứ',
    courseDesc: '5.000+ từ vựng cao cấp, thành ngữ tứ tự, nghị luận chuyên sâu và diễn đạt sắc sảo chuẩn bản xứ.',
    units: [
      {
        title: 'Unit 1: Thành Ngữ Tứ Tự & Triết Lý Học Tập',
        lessons: [
          {
            title: 'Bài 1: Tinh thần 循序渐进 & 精益求精',
            duration: 30,
            grammarTitle: 'Vận dụng thành ngữ tứ tự làm tăng lực biểu đạt',
            grammarPoints: [
              '循序渐进 (tuần tự tiệm tiến): Thường làm vị ngữ hoặc trạng ngữ miêu tả phương pháp khoa học.',
              '相辅相成 (tương phụ tương thành): Dùng khi hai yếu tố bổ trợ qua lại không thể tách rời.',
              '潜移默化 (tiềm di mặc hóa): Thường làm định ngữ cho 影响 (tác động âm thầm).',
            ],
            dialogue: [
              { speaker: 'A', cn: '中华文化博大精深，学习时最重要的是什么？', py: 'Zhōnghuá wénhuà bódà-jīngshēn, xuéxí shí zuì zhòngyào de shì shénme?', vi: 'Văn hóa Trung Hoa rộng lớn sâu sắc, khi học điều quan trọng nhất là gì?' },
              { speaker: 'B', cn: '贵在循序渐进、锲而不舍，做到理论与实践相辅相成。', py: 'Guìzài xúnxù-jiànjìn, qiè-ér-bùshě, zuòdào lǐlùn yǔ shíjiàn xiāngfǔ-xiāngchéng.', vi: 'Quý ở chỗ tuần tự tiến bước, bền bỉ không ngừng, để lý thuyết và thực tiễn bổ trợ cho nhau.' },
            ],
            vocabWords: ['循序渐进', '博大精深', '相辅相成', '精益求精'],
          },
        ],
      },
    ],
  },
};

// ── Authentic Question Generator for 30 Mock Exams (5 per HSK 1–6) & 18 Workbook Sets ──
interface RawQ {
  skill: 'LISTENING' | 'READING' | 'GRAMMAR' | 'VOCABULARY' | 'PINYIN';
  type: 'MULTIPLE_CHOICE' | 'AUDIO_CLOZE' | 'SYNTAX_SCRAMBLE' | 'TONE_PICKER';
  content: string;
  options: [string, string, string, string];
  correct: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

const LEVEL_QUESTION_BANKS: Record<string, RawQ[]> = {
  HSK1: [
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe câu sau và chọn nghĩa tiếng Việt đúng: "你好，我叫大卫，我是学生。"', options: ['A. Xin chào, tôi tên David, tôi là giáo viên.', 'B. Xin chào, tôi tên David, tôi là học sinh.', 'C. Tạm biệt David, hẹn gặp ở trường.', 'D. David là bạn học của tôi.'], correct: 'B', explanation: '我叫大卫 (Tôi tên David), 我是学生 (Tôi là học sinh).' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: 'Chọn từ thích hợp điền vào chỗ trống: 谢谢你！— ________。', options: ['A. 对不起', 'B. 没关系', 'C. 不客气', 'D. 再见'], correct: 'C', explanation: 'Khi ai đó nói 谢谢 (Cảm ơn), ta đáp lại 不客气 (Đừng khách sáo).' },
    { skill: 'PINYIN', type: 'TONE_PICKER', content: 'Chọn phiên âm Pinyin đúng của từ "中国" (Trung Quốc):', options: ['A. Zhōngguó', 'B. Zōngguó', 'C. Zhòngguǒ', 'D. Chōngguó'], correct: 'A', explanation: '中 (zhōng - thanh 1) + 国 (guó - thanh 2) = Zhōngguó.' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: 'Câu "这个苹果多少钱？" dùng trong tình huống nào?', options: ['A. Hỏi đường đi', 'B. Hỏi thời gian', 'C. Hỏi giá tiền khi mua sắm', 'D. Hỏi tên người khác'], correct: 'C', explanation: '多少钱 (duōshao qián) nghĩa là "bao nhiêu tiền".' },
    { skill: 'GRAMMAR', type: 'SYNTAX_SCRAMBLE', content: 'Sắp xếp thành câu đúng: (1) 汉语 (2) 学习 (3) 喜欢 (4) 我', options: ['A. 我喜欢学习汉语', 'B. 我学习汉语喜欢', 'C. 汉语我喜欢学习', 'D. 喜欢我学习汉语'], correct: 'A', explanation: 'Trật tự chuẩn SVO: 主语 (我) + 喜欢 + 动词 (学习) + 宾语 (汉语).' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Từ nào sau đây có nghĩa là "Ngày mai"?', options: ['A. 今天', 'B. 昨天', 'C. 明天', 'D. 星期'], correct: 'C', explanation: '今天 (Hôm nay), 昨天 (Hôm qua), 明天 (Ngày mai).' },
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe câu: "今天天气很热，我想喝水。" — Người nói muốn làm gì?', options: ['A. Đi ngủ', 'B. Uống nước', 'C. Ăn cơm', 'D. Xem phim'], correct: 'B', explanation: '想喝水 (xiǎng hē shuǐ) nghĩa là muốn uống nước.' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: 'Đáp lại câu xin lỗi "对不起" (Duìbuqǐ), ta nói câu nào là tự nhiên nhất?', options: ['A. 没关系', 'B. 谢谢', 'C. 你好', 'D. 很好'], correct: 'A', explanation: '没关系 (méi guānxi) có nghĩa là "Không sao đâu".' },
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Chọn lượng từ đúng: 我买了一____书。', options: ['A. 个', 'B. 本', 'C. 杯', 'D. 只'], correct: 'B', explanation: '本 (běn) là lượng từ chuẩn dùng cho sách vở (一本书).' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Nghĩa tiếng Việt của "医生" (yīshēng) là gì?', options: ['A. Giáo viên', 'B. Học sinh', 'C. Bác sĩ', 'D. Bạn bè'], correct: 'C', explanation: '医生 (yīshēng - Y sinh) nghĩa là Bác sĩ.' },
  ],
  HSK2: [
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Điền liên từ đúng: ________ 下雨了，所以我们没去打篮球。', options: ['A. 虽然', 'B. 因为', 'C. 但是', 'D. 已经'], correct: 'B', explanation: 'Cặp liên từ nguyên nhân - kết quả: 因为 ... 所以 ... (Bởi vì ... cho nên ...).' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: 'Đọc đoạn ngắn: "我每天早上七点起床，坐公共汽车去公司，八点开始工作。" — Anh ấy đi làm bằng gì?', options: ['A. Xe đạp', 'B. Tàu điện ngầm', 'C. Xe buýt', 'D. Đi bộ'], correct: 'C', explanation: '坐公共汽车 (zuò gōnggòng qìchē) nghĩa là đi xe buýt.' },
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe hội thoại: "这件红色的衣服既好看又便宜。" — Bộ quần áo màu đỏ có đặc điểm gì?', options: ['A. Đẹp nhưng đắt', 'B. Vừa đẹp vừa rẻ', 'C. Rẻ nhưng không đẹp', 'D. Quá nhỏ'], correct: 'B', explanation: '既...又... diễn tả hai tính chất tích cực song song: vừa đẹp (好看) vừa rẻ (便宜).' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Từ "准备" (zhǔnbèi) phù hợp nhất trong câu nào?', options: ['A. 我正在准备明天的考试。', 'B. 今天天气很准备。', 'C. 这个苹果很准备。', 'D. 他吃了一个准备。'], correct: 'A', explanation: '准备 là động từ "chuẩn bị": 准备考试 (chuẩn bị cho kỳ thi).' },
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Chọn câu ĐÚNG ngữ pháp với 虽然...但是...:', options: ['A. 虽然很累，但是他非常高兴。', 'B. 因为很累，但是他非常高兴。', 'C. 虽然很累，所以他非常高兴。', 'D. 但是很累，虽然他非常高兴。'], correct: 'A', explanation: '虽然 (tuy rằng) luôn đi cặp với 但是 (nhưng mà).' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: 'Câu "我已经学了两年汉语了" biểu thị điều gì?', options: ['A. Sắp bắt đầu học tiếng Hán', 'B. Đã học tiếng Hán được 2 năm rồi', 'C. Không muốn học tiếng Hán nữa', 'D. Chỉ học 2 ngày'], correct: 'B', explanation: '已经 ... 了 nhấn mạnh thời lượng đã đạt được tính đến hiện tại.' },
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe câu: "服务员，请给我一杯热茶，不要糖。" — Khách yêu cầu đồ uống gì?', options: ['A. Trà đá có đường', 'B. Cà phê nóng', 'C. Trà nóng không đường', 'D. Nước lọc lạnh'], correct: 'C', explanation: '一杯热茶 (một ly trà nóng), 不要糖 (không lấy đường).' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Từ trái nghĩa với "贵" (guì - đắt) là từ nào?', options: ['A. 便宜', 'B. 明白', 'C. 非常', 'D. 休息'], correct: 'A', explanation: '便宜 (piányi) nghĩa là rẻ, trái nghĩa với 贵 (đắt).' },
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Điền bổ ngữ thích hợp: 老师说的话你听________了吗？', options: ['A. 明白', 'B. 身体', 'C. 旅游', 'D. 问题'], correct: 'A', explanation: '听明白 (tīng míngbai) = nghe hiểu rõ.' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: '"祝你身体健康，工作顺利！" là lời chúc về điều gì?', options: ['A. Chúc thi đỗ đại học', 'B. Chúc sức khỏe dồi dào, công việc thuận lợi', 'C. Chúc đi đường bình an', 'D. Chúc mừng sinh nhật'], correct: 'B', explanation: '身体健康 (sức khỏe tốt), 工作顺利 (công việc suôn sẻ).' },
  ],
  HSK3: [
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Điền từ đúng cho câu chữ 把: 请你________桌子上的书拿给我。', options: ['A. 被', 'B. 把', 'C. 比', 'D. 对'], correct: 'B', explanation: 'Câu chữ 把 (A 把 B + V + thành phần khác) nhấn mạnh sự xử lý/di chuyển đối tượng B.' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: 'Đoạn văn: "经过半年的认真复习，小华不仅口语流利了，而且顺利通过了HSK三级考试。" — Ý chính là gì?', options: ['A. Tiểu Hoa bỏ thi HSK 3', 'B. Sau nửa năm ôn nghiêm túc, Tiểu Hoa tiến bộ khẩu ngữ và đỗ HSK 3', 'C. Tiểu Hoa chỉ học nói, không thi', 'D. Kỳ thi HSK 3 bị hoãn nửa năm'], correct: 'B', explanation: '经过半年认真复习 (sau nửa năm ôn nghiêm túc), 顺利通过 (thuận lợi vượt qua).' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Chọn từ thích hợp: 保护________是每个公民的责任。', options: ['A. 环境', 'B. 成绩', 'C. 方便', 'D. 习惯'], correct: 'A', explanation: '保护环境 (bǎohù huánjìng) = bảo vệ môi trường.' },
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe: "如果明天下雪，我们就不去爬山了，改去参观历史博物馆。" — Nếu tuyết rơi họ sẽ đi đâu?', options: ['A. Vẫn đi leo núi', 'B. Đi tham quan bảo tàng lịch sử', 'C. Ở nhà ngủ', 'D. Đi bơi'], correct: 'B', explanation: '改去参观历史博物馆 = đổi sang đi tham quan bảo tàng lịch sử.' },
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Hoàn thiện câu: 我________中国传统文化非常感兴趣。', options: ['A. 对', 'B. 把', 'C. 在', 'D. 给'], correct: 'A', explanation: 'Cấu trúc cố định: 对 + A + 感兴趣 (có hứng thú với A).' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Từ nào đi hợp nhất với "提高" (nâng cao)?', options: ['A. 提高汉语水平', 'B. 提高天气', 'C. 提高朋友', 'D. 提高历史'], correct: 'A', explanation: '提高水平 (tígāo shuǐpíng) = nâng cao trình độ.' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: '"熬夜会影响第二天的学习效率。" — Câu này khuyên chúng ta điều gì?', options: ['A. Nên thức khuya học bài', 'B. Không nên thức khuya vì ảnh hưởng hiệu suất học hôm sau', 'C. Ngày mai không cần học', 'D. Nên ngủ cả ngày'], correct: 'B', explanation: '熬夜 (thức khuya), 影响 (ảnh hưởng).' },
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Chọn từ điền đúng: 你________每天坚持练习，才能说好汉语。', options: ['A. 必须', 'B. 满意', 'C. 变化', 'D. 关心'], correct: 'A', explanation: '必须 (bìxū - nhất định phải) kết hợp với 才能 (mới có thể).' },
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe: "坐地铁去市中心又快又方便，还不会堵车。" — Ưu điểm của tàu điện ngầm là gì?', options: ['A. Chậm nhưng rẻ', 'B. Nhanh, tiện lợi và không bị tắc đường', 'C. Chỉ chạy buổi tối', 'D. Hay bị kẹt xe'], correct: 'B', explanation: '又快又方便 (vừa nhanh vừa tiện), 不会堵车 (không tắc đường).' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Cụm từ "解决问题" (jiějué wèntí) có nghĩa là:', options: ['A. Đặt câu hỏi', 'B. Giải quyết vấn đề', 'C. Quên vấn đề', 'D. Tránh né vấn đề'], correct: 'B', explanation: '解决 (giải quyết) + 问题 (vấn đề).' },
  ],
  HSK4: [
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Điền cặp liên từ đúng: ________遇到多大的困难，我们都应该坚持到底。', options: ['A. 无论', 'B. 因为', 'C. 虽然', 'D. 于是'], correct: 'A', explanation: 'Cấu trúc 无论 ... 都 ... (Bất kể ... đều ...).' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: 'Đoạn văn: "语言不仅是沟通的工具，更是了解一个国家文化与思维方式的窗口。" — Quan điểm của tác giả là:', options: ['A. Ngôn ngữ chỉ dùng để nói chuyện đơn giản', 'B. Ngôn ngữ vừa là công cụ giao tiếp vừa là cánh cửa hiểu văn hóa & tư duy', 'C. Không cần học văn hóa khi học ngoại ngữ', 'D. Tư duy không liên quan đến ngôn ngữ'], correct: 'B', explanation: 'Cấu trúc 不仅是...更是... nhấn mạnh tầng nghĩa sâu hơn ở vế sau.' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Chọn từ đúng: 这次中国之行给我留下了非常深刻的________。', options: ['A. 印象', 'B. 申请', 'C. 压力', 'D. 效率'], correct: 'A', explanation: 'Cụm cố định: 留下深刻的印象 (để lại ấn tượng sâu sắc).' },
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe: "面试时不仅要展示自己的专业能力，还要表现出良好的团队合作精神。" — Khi phỏng vấn cần thể hiện điều gì?', options: ['A. Chỉ cần bằng cấp cao', 'B. Cả năng lực chuyên môn lẫn tinh thần làm việc nhóm', 'C. Chỉ nói về mức lương', 'D. Không cần chuẩn bị trước'], correct: 'B', explanation: '不仅...还要... (không chỉ... mà còn phải...).' },
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Chọn liên từ thích hợp: ________市场竞争十分激烈，该公司依然保持了稳步增长。', options: ['A. 尽管', 'B. 只要', 'C. 既然', 'D. 除非'], correct: 'A', explanation: '尽管 ... 依然 ... (Mặc dù ... nhưng vẫn ...).' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Từ nào phù hợp nhất: 面对工作________，我们要学会合理安排时间。', options: ['A. 压力', 'B. 优点', 'C. 鼓励', 'D. 尊重'], correct: 'A', explanation: '面对工作压力 = đối mặt với áp lực công việc.' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: 'Câu nào sử dụng từ "适应" (thích nghi) ĐÚNG nhất?', options: ['A. 他很快就适应了北京的气候和生活节奏。', 'B. 这件衣服很适应我。', 'C. 明天天气很适应。', 'D. 我适应了一本书。'], correct: 'A', explanation: '适应 (shìyìng) là động từ "thích nghi với hoàn cảnh/môi trường/khí hậu".' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Từ "总结" (zǒngjié) trong câu "每学完一课都要及时总结" nghĩa là:', options: ['A. Bỏ qua', 'B. Tổng kết, đúc kết lại', 'C. Bắt đầu', 'D. Trì hoãn'], correct: 'B', explanation: '及时总结 = tổng kết kịp thời sau khi học.' },
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe: "事实证明，只要坚持科学的学习方法，零基础也能考过HSK四级。" — Điều kiện để đỗ HSK 4 là gì?', options: ['A. Phải sinh ra ở Trung Quốc', 'B. Kiên trì phương pháp học khoa học', 'C. Chỉ học 1 tuần trước khi thi', 'D. Không cần luyện nghe'], correct: 'B', explanation: '只要坚持科学的学习方法 = chỉ cần kiên trì phương pháp học khoa học.' },
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Chọn từ điền đúng: 我们应该________不同国家和民族的文化习俗。', options: ['A. 尊重', 'B. 证明', 'C. 申请', 'D. 竞争'], correct: 'A', explanation: '尊重文化习俗 = tôn trọng phong tục văn hóa.' },
  ],
  HSK5: [
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Chọn từ chính xác nhất: 绿色低碳出行正逐渐成为现代都市生活的新________。', options: ['A. 趋势', 'B. 逻辑', 'C. 原则', 'D. 措施'], correct: 'A', explanation: '成为...的新趋势 = trở thành xu thế mới của...' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: 'Đọc đoạn trích: "科技企业若想在激烈竞争中立于不败之地，必须将持续创新视为核心驱动力，同时兼顾用户体验。" — Đâu là yếu tố then chốt?', options: ['A. Giảm toàn bộ nhân sự', 'B. Đổi mới liên tục kết hợp chú trọng trải nghiệm người dùng', 'C. Chỉ tập trung quảng cáo ngắn hạn', 'D. Sao chép đối thủ'], correct: 'B', explanation: '持续创新 (đổi mới liên tục) và 兼顾用户体验 (chú trọng trải nghiệm người dùng).' },
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Điền động từ kết hợp chuẩn: 政府近期采取了一系列有效________来改善环境。', options: ['A. 措施', 'B. 现象', 'C. 观念', 'D. 领域'], correct: 'A', explanation: 'Cụm collocation chuẩn HSK 5: 采取措施 (áp dụng biện pháp).' },
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe: "只有深入分析数据背后的用户需求，产品改进才能有的放矢。" — Muốn cải tiến sản phẩm hiệu quả cần làm gì?', options: ['A. Sửa theo cảm tính', 'B. Phân tích sâu nhu cầu người dùng đằng sau dữ liệu', 'C. Không cần xem dữ liệu', 'D. Giữ nguyên mãi mãi'], correct: 'B', explanation: '深入分析数据背后的用户需求 = phân tích sâu nhu cầu người dùng phía sau dữ liệu.' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Cụm từ "克服瓶颈期" (kèfú píngjǐngqī) có nghĩa là:', options: ['A. Tạo thêm khó khăn', 'B. Vượt qua giai đoạn chững lại (nút thắt cổ chai)', 'C. Bỏ cuộc giữa chừng', 'D. Ngừng học ngoại ngữ'], correct: 'B', explanation: '克服 (khắc phục/vượt qua) + 瓶颈期 (giai đoạn nút thắt/chững lại).' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: '"如何平衡事业与家庭是当代职场人普遍面临的课题。" — Từ "平衡" đóng vai trò gì trong câu?', options: ['A. Động từ: cân bằng giữa hai yếu tố', 'B. Danh từ chỉ đồ vật', 'C. Phó từ chỉ thời gian', 'D. Liên từ giả thiết'], correct: 'A', explanation: '平衡 + A 与 B = cân bằng giữa A và B.' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Chọn từ điền đúng: 这篇学术论文论点鲜明，结构________。', options: ['A. 逻辑严密', 'B. 非常便宜', 'C. 十分热闹', 'D. 气候温和'], correct: 'A', explanation: '逻辑严密 (luóji yánmì) = logic chặt chẽ.' },
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Điền từ đúng: ________数字化时代的到来，人们的阅读观念发生了明显变化。', options: ['A. 随着', 'B. 趁着', 'C. 沿着', 'D. 朝着'], correct: 'A', explanation: '随着 + Danh từ/Sự kiện = Cùng với sự xuất hiện/phát triển của...' },
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe: "节约自然资源、推动可持续发展已成为全球共识。" — Toàn cầu đang đồng thuận về vấn đề nào?', options: ['A. Tiết kiệm tài nguyên & phát triển bền vững', 'B. Khai thác tài nguyên tối đa', 'C. Hạn chế giao lưu quốc tế', 'D. Ngừng phát triển công nghệ'], correct: 'A', explanation: '节约自然资源 (tiết kiệm tài nguyên), 可持续发展 (phát triển bền vững).' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Nghĩa chính xác của "体会" (tǐhuì) trong "亲身经历才能深刻体会" là:', options: ['A. Cảm nhận, thấm thía qua trải nghiệm thực tế', 'B. Tổ chức cuộc họp', 'C. Tập thể dục', 'D. Tra từ điển'], correct: 'A', explanation: '体会 nghĩa là cảm nhận/lĩnh hội sâu sắc.' },
  ],
  HSK6: [
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Chọn thành ngữ thích hợp nhất: 学习任何一门语言都应________，切忌急于求成。', options: ['A. 循序渐进', 'B. 走马观花', 'C. 半途而废', 'D. 井底之蛙'], correct: 'A', explanation: '循序渐进 (tuần tự tiệm tiến) đối lập với 急于求成 (nóng vội cầu thành).' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: 'Đoạn văn: "优秀的软件界面设计往往能兼顾审美价值与交互效率，于细微之处凸显匠心，使使用者在潜移默化中产生信任感。" — Ý nào phản ánh đúng nhất?', options: ['A. Giao diện chỉ cần đẹp, không cần nhanh', 'B. Thiết kế xuất sắc cân bằng thẩm mỹ & hiệu quả tương tác, tạo niềm tin tự nhiên qua từng chi tiết', 'C. Người dùng không để ý chi tiết nhỏ', 'D. Thẩm mỹ và hiệu quả luôn loại trừ nhau'], correct: 'B', explanation: '兼顾 (cân bằng hai mặt), 凸显匠心 (làm nổi bật sự tỉ mỉ), 潜移默化 (thấm nhuần tự nhiên).' },
    { skill: 'GRAMMAR', type: 'MULTIPLE_CHOICE', content: 'Tìm câu KHÔNG mắc lỗi bệnh câu (语病):', options: ['A. 通过这次国际研讨会，双方达成了广泛共识。', 'B. 通过这次国际研讨会，使双方达成了广泛共识。', 'C. 经过努力学习，让他的汉语水平提高了。', 'D. 由于天气的原因，使航班被取消了。'], correct: 'A', explanation: 'Các câu B, C, D đều mắc lỗi kinh điển HSK 6: thiếu chủ ngữ do dùng thừa cặp 通过...使 / 经过...让 / 由于...使.' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Điền động từ trang trọng đúng: 每一个古老的汉字背后都________着先民的生活智慧。', options: ['A. 蕴含', 'B. 凝视', 'C. 克服', 'D. 申请'], correct: 'A', explanation: '蕴含着智慧 = ẩn chứa / hàm chứa trí tuệ.' },
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe: "理论研究与工程实践相辅相成，缺一不可。" — Mối quan hệ giữa lý thuyết và thực tiễn là gì?', options: ['A. Hoàn toàn độc lập', 'B. Bổ trợ và hoàn thiện lẫn nhau, thiếu một không được', 'C. Chỉ cần lý thuyết', 'D. Xung đột nhau'], correct: 'B', explanation: '相辅相成 (tương phụ tương thành), 缺一不可 (thiếu một không thể).' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Thành ngữ "精益求精" (jīngyì-qiújīng) miêu tả thái độ làm việc như thế nào?', options: ['A. Làm qua loa cho xong', 'B. Đã tốt rồi vẫn không ngừng trau chuốt để hoàn hảo hơn nữa', 'C. Bảo thủ không tiếp thu góp ý', 'D. Làm việc chậm chạp'], correct: 'B', explanation: '精益求精 = tinh rồi còn cầu tinh hơn nữa.' },
    { skill: 'READING', type: 'MULTIPLE_CHOICE', content: 'Điền từ đúng ngữ cảnh: 数字化浪潮为传统文化传播带来了前所未有的________。', options: ['A. 契机', 'B. 压力', 'C. 缺点', 'D. 障碍'], correct: 'A', explanation: '带来前所未有的契机 = mang đến cơ hội bước ngoặt chưa từng có.' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Cụm "弘扬传统文化" (hóngyáng chuántǒng wénhuà) có nghĩa là:', options: ['A. Phê phán văn hóa cũ', 'B. Phát huy, lan tỏa văn hóa truyền thống', 'C. Ghi chép lịch sử', 'D. Dịch thuật văn bản'], correct: 'B', explanation: '弘扬 (hoằng dương) = phát huy và lan tỏa giá trị tốt đẹp.' },
    { skill: 'LISTENING', type: 'AUDIO_CLOZE', content: '🔊 Nghe: "这一成果凝聚了科研团队长达五年的心血与智慧。" — Thành quả này có được nhờ đâu?', options: ['A. Nhờ may mắn trong một ngày', 'B. Kết tinh tâm huyết và trí tuệ suốt 5 năm của cả đội nghiên cứu', 'C. Do một cá nhân thực hiện trong 5 tuần', 'D. Nhờ mua lại công nghệ có sẵn'], correct: 'B', explanation: '凝聚...心血与智慧 = kết tinh tâm huyết và trí tuệ.' },
    { skill: 'VOCABULARY', type: 'MULTIPLE_CHOICE', content: 'Thành ngữ "举足轻重" dùng để nhấn mạnh điều gì?', options: ['A. Đi lại nặng nề', 'B. Tầm ảnh hưởng và vị thế cực kỳ trọng yếu', 'C. Sự việc không đáng kể', 'D. Thao tác nhanh nhẹn'], correct: 'B', explanation: '举足轻重 (cử túc khinh trọng) = nhất cử nhất động đều ảnh hưởng lớn đến đại cục.' },
  ],
};

export async function runComprehensiveHskSeed(prisma: PrismaClient) {
  console.log('\n🚀 Running Comprehensive HSK 1–6 Enrichment Seed...');

  // 1. Seed Thick Vocabulary (Vocabulary + Characters tables)
  const charIdByWord = new Map<string, number>();
  for (const v of RICH_HSK_VOCAB) {
    await prisma.vocabulary.upsert({
      where: { vocabulary_id: v.id },
      create: {
        vocabulary_id: v.id,
        word: v.word,
        pinyin: v.pinyin,
        meaning: v.meaning,
        word_type: v.type,
        hsk_level: v.level,
        notes: JSON.stringify({ sinoVietnamese: v.sino, radical: v.radical || '' }),
        examples: JSON.stringify([{ cn: v.exampleCn, py: v.examplePy, vi: v.exampleVi }]),
      },
      update: {
        word: v.word,
        pinyin: v.pinyin,
        meaning: v.meaning,
        word_type: v.type,
        hsk_level: v.level,
        notes: JSON.stringify({ sinoVietnamese: v.sino, radical: v.radical || '' }),
        examples: JSON.stringify([{ cn: v.exampleCn, py: v.examplePy, vi: v.exampleVi }]),
      },
    });

    const charRecord = await prisma.characters.upsert({
      where: { character: v.word },
      create: {
        character: v.word,
        pinyin: v.pinyin,
        sino_vietnamese: v.sino,
        meaning: v.meaning,
        radical: v.radical || null,
        strokes_count: v.strokes || 6,
      },
      update: {
        pinyin: v.pinyin,
        sino_vietnamese: v.sino,
        meaning: v.meaning,
        radical: v.radical || null,
        strokes_count: v.strokes || 6,
      },
    });
    charIdByWord.set(v.word, charRecord.char_id);
  }
  console.log(`   ✓ ${RICH_HSK_VOCAB.length} thick HSK 1–6 vocabularies & characters seeded.`);

  // 2. Seed Complete Pinyin Initials + Finals + Minimal Pairs
  const pinyinIdMap = new Map<string, number>();
  for (const item of PINYIN_INITIALS) {
    const existing = await prisma.pinyinSyllables.findFirst({
      where: { syllable: item.syl, category: 'INITIAL' },
    });
    if (existing) {
      await prisma.pinyinSyllables.update({
        where: { syllable_id: existing.syllable_id },
        data: { mouth_shape_guide: item.guide, f0_pitch_contour: '55' },
      });
      pinyinIdMap.set(`INITIAL:${item.syl}`, existing.syllable_id);
    } else {
      const created = await prisma.pinyinSyllables.create({
        data: {
          syllable: item.syl,
          tone: 1,
          category: 'INITIAL',
          f0_pitch_contour: '55',
          mouth_shape_guide: item.guide,
        },
      });
      pinyinIdMap.set(`INITIAL:${item.syl}`, created.syllable_id);
    }
  }

  for (const item of PINYIN_FINALS) {
    const existing = await prisma.pinyinSyllables.findFirst({
      where: { syllable: item.syl, category: 'FINAL' },
    });
    if (existing) {
      await prisma.pinyinSyllables.update({
        where: { syllable_id: existing.syllable_id },
        data: { mouth_shape_guide: item.guide, f0_pitch_contour: '55' },
      });
      pinyinIdMap.set(`FINAL:${item.syl}`, existing.syllable_id);
    } else {
      const created = await prisma.pinyinSyllables.create({
        data: {
          syllable: item.syl,
          tone: 1,
          category: 'FINAL',
          f0_pitch_contour: '55',
          mouth_shape_guide: item.guide,
        },
      });
      pinyinIdMap.set(`FINAL:${item.syl}`, created.syllable_id);
    }
  }

  // Link Minimal Pairs for interactive listening training
  const minimalPairDefs: Array<[string, string]> = [
    ['INITIAL:b', 'INITIAL:p'],
    ['INITIAL:d', 'INITIAL:t'],
    ['INITIAL:g', 'INITIAL:k'],
    ['INITIAL:j', 'INITIAL:q'],
    ['INITIAL:zh', 'INITIAL:z'],
    ['INITIAL:ch', 'INITIAL:c'],
    ['INITIAL:sh', 'INITIAL:s'],
    ['FINAL:an', 'FINAL:ang'],
    ['FINAL:en', 'FINAL:eng'],
    ['FINAL:in', 'FINAL:ing'],
  ];
  for (const [k1, k2] of minimalPairDefs) {
    const id1 = pinyinIdMap.get(k1);
    const id2 = pinyinIdMap.get(k2);
    if (id1 && id2) {
      await prisma.pinyinSyllables.update({
        where: { syllable_id: id1 },
        data: { contrast_pair_id: id2 },
      });
    }
  }
  console.log(`   ✓ ${PINYIN_INITIALS.length} Initials, ${PINYIN_FINALS.length} Finals & ${minimalPairDefs.length} Minimal Pairs seeded.`);

  // 3. Seed Enriched HSK 1–6 Courses, Chapters, Lessons & LessonBlocks
  let totalLessonsEnsured = 0;
  for (const level of ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']) {
    const bp = HSK_CURRICULUM_BLUEPRINT[level];
    const course = await prisma.courses.upsert({
      where: { code: level },
      create: {
        code: level,
        title: bp.courseTitle,
        description: bp.courseDesc,
        level,
        is_published: true,
      },
      update: {
        title: bp.courseTitle,
        description: bp.courseDesc,
        level,
        is_published: true,
      },
    });

    for (let uIdx = 0; uIdx < bp.units.length; uIdx++) {
      const unitDef = bp.units[uIdx];
      const orderIndex = uIdx + 1;

      let chapter = await prisma.chapters.findFirst({
        where: { course_id: course.course_id, order_index: orderIndex },
      });
      if (!chapter) {
        chapter = await prisma.chapters.create({
          data: {
            course_id: course.course_id,
            title: unitDef.title,
            order_index: orderIndex,
            unit_number: orderIndex,
            slug: `${level.toLowerCase()}_u0${orderIndex}`,
          },
        });
      }

      for (let lIdx = 0; lIdx < unitDef.lessons.length; lIdx++) {
        const lDef = unitDef.lessons[lIdx];
        let lesson = await prisma.lessons.findFirst({
          where: { chapter_id: chapter.chapter_id, order_index: lIdx + 1 },
        });
        if (!lesson) {
          lesson = await prisma.lessons.create({
            data: {
              chapter_id: chapter.chapter_id,
              title: lDef.title,
              order_index: lIdx + 1,
              estimated_duration_mins: lDef.duration,
              status: 'PUBLISHED',
            },
          });
        } else if (lesson.status !== 'PUBLISHED') {
          lesson = await prisma.lessons.update({
            where: { lesson_id: lesson.lesson_id },
            data: { status: 'PUBLISHED' },
          });
        }
        totalLessonsEnsured++;

        // Ensure LessonBlocks exist (THEORY + AUDIO dialogue)
        const existingBlocks = await prisma.lessonBlocks.count({
          where: { lesson_id: lesson.lesson_id },
        });
        if (existingBlocks === 0) {
          await prisma.lessonBlocks.createMany({
            data: [
              {
                lesson_id: lesson.lesson_id,
                block_type: 'THEORY',
                order_index: 1,
                content_json: JSON.stringify({
                  title: lDef.grammarTitle,
                  summary: `Trọng điểm ngữ pháp & ứng dụng thực tế (${level})`,
                  points: lDef.grammarPoints,
                }),
              },
              {
                lesson_id: lesson.lesson_id,
                block_type: 'AUDIO',
                order_index: 2,
                content_json: JSON.stringify({
                  title: `Hội thoại thực hành — ${lDef.title}`,
                  lines: lDef.dialogue.map((d) => ({
                    speaker: d.speaker,
                    hanzi: d.cn,
                    pinyin: d.py,
                    vietnamese: d.vi,
                  })),
                }),
              },
            ],
          });
        }

        // Link LessonVocabularies
        for (const w of lDef.vocabWords) {
          const cid = charIdByWord.get(w);
          if (cid) {
            await prisma.lessonVocabularies.upsert({
              where: {
                lesson_id_char_id: { lesson_id: lesson.lesson_id, char_id: cid },
              },
              create: {
                lesson_id: lesson.lesson_id,
                char_id: cid,
              },
              update: {},
            });
          }
        }
      }
    }
  }
  console.log(`   ✓ HSK 1–6 enriched lessons & content blocks ready (${totalLessonsEnsured} core lessons).`);

  // 4. Seed 30 Mock Exams (5 Mock Exams per Level HSK 1–6) + 18 Workbook Practice Sets (3 per Level)
  const mockExamTimeByLevel: Record<string, number> = {
    HSK1: 20,
    HSK2: 25,
    HSK3: 30,
    HSK4: 35,
    HSK5: 40,
    HSK6: 45,
  };

  const mockExamSubtitle = [
    'Đề chuẩn cấu trúc thật #01 — Nghe & Đọc hiểu',
    'Đề chuẩn cấu trúc thật #02 — Từ vựng & Ngữ pháp',
    'Đề chuẩn cấu trúc thật #03 — Tổng hợp 4 kỹ năng',
    'Đề chuẩn cấu trúc thật #04 — Luyện phản xạ đề thi',
    'Đề chuẩn cấu trúc thật #05 — Đề tổng ôn chuẩn CBT',
  ];

  const workbookTopics: Record<string, [string, string, string]> = {
    HSK1: [
      'Sách bài tập HSK 1 — Bài 1–3: Chào hỏi, Quốc tịch & Gia đình',
      'Sách bài tập HSK 1 — Bài 4–7: Thời gian, Ngày tháng & Ăn uống',
      'Sách bài tập HSK 1 — Bài 8–10: Mua sắm, Địa điểm & Thời tiết',
    ],
    HSK2: [
      'Sách bài tập HSK 2 — Bài 1–3: Du lịch, Sức khỏe & Kế hoạch',
      'Sách bài tập HSK 2 — Bài 4–7: So sánh, Câu phức & Mua sắm',
      'Sách bài tập HSK 2 — Bài 8–10: Giao thông, Nhà hàng & Công việc',
    ],
    HSK3: [
      'Sách bài tập HSK 3 — Bài 1–4: Thói quen, Văn hóa & Môi trường',
      'Sách bài tập HSK 3 — Bài 5–8: Câu chữ 把, Bổ ngữ kết quả',
      'Sách bài tập HSK 3 — Bài 9–12: Học tập, Giải quyết vấn đề & Lịch sử',
    ],
    HSK4: [
      'Sách bài tập HSK 4 — Bài 1–5: Công sở, Phỏng vấn & Hiệu suất',
      'Sách bài tập HSK 4 — Bài 6–10: Giao lưu văn hóa & Kiên trì',
      'Sách bài tập HSK 4 — Bài 11–15: Kinh tế, Xã hội & Đọc hiểu báo chí',
    ],
    HSK5: [
      'Sách bài tập HSK 5 — Bài 1–5: Xu thế công nghệ & Đổi mới sáng tạo',
      'Sách bài tập HSK 5 — Bài 6–10: Phân tích dữ liệu & Cân bằng cuộc sống',
      'Sách bài tập HSK 5 — Bài 11–15: Môi trường, Tài nguyên & Nghị luận',
    ],
    HSK6: [
      'Sách bài tập HSK 6 — Bài 1–5: Thành ngữ tứ tự & Triết lý học tập',
      'Sách bài tập HSK 6 — Bài 6–10: Chữa lỗi bệnh câu (语病) chuẩn HSK 6',
      'Sách bài tập HSK 6 — Bài 11–15: Đọc hiểu chuyên sâu & Học thuật',
    ],
  };

  let mockExamCount = 0;
  let workbookCount = 0;

  for (const level of ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6']) {
    const bank = LEVEL_QUESTION_BANKS[level];
    // Upsert all questions in this level's bank
    const qIds: number[] = [];
    for (let i = 0; i < bank.length; i++) {
      const q = bank[i];
      const existingQ = await prisma.questions.findFirst({
        where: { content: q.content, difficulty_level: level },
      });
      if (existingQ) {
        await prisma.questions.update({
          where: { question_id: existingQ.question_id },
          data: {
            question_type: q.type,
            skill_category: q.skill,
            options_json: JSON.stringify(q.options),
            correct_answer: q.correct,
            explanation: q.explanation,
          },
        });
        qIds.push(existingQ.question_id);
      } else {
        const createdQ = await prisma.questions.create({
          data: {
            question_type: q.type,
            skill_category: q.skill,
            difficulty_level: level,
            content: q.content,
            options_json: JSON.stringify(q.options),
            correct_answer: q.correct,
            explanation: q.explanation,
          },
        });
        qIds.push(createdQ.question_id);
      }
    }

    // Create 5 Mock Exams for this HSK level
    for (let examNum = 1; examNum <= 5; examNum++) {
      const examTitle = `Phòng thi ${level.replace('HSK', 'HSK ')} — Đề mẫu số 0${examNum}: ${mockExamSubtitle[examNum - 1]}`;
      let test = await prisma.tests.findFirst({
        where: { title: examTitle, test_type: 'MOCK_EXAM' },
      });
      if (!test) {
        test = await prisma.tests.create({
          data: {
            title: examTitle,
            test_type: 'MOCK_EXAM',
            passing_score: 60,
            time_limit_mins: mockExamTimeByLevel[level],
            is_published: true,
          },
        });
      }

      // Rotate questions per mock exam so each of the 5 mock exams has a distinct sequence/focus (8 questions each)
      const rotated = [...qIds.slice((examNum - 1) * 2), ...qIds.slice(0, (examNum - 1) * 2)].slice(0, 8);
      for (let idx = 0; idx < rotated.length; idx++) {
        await prisma.testQuestions.upsert({
          where: {
            test_id_question_id: { test_id: test.test_id, question_id: rotated[idx] },
          },
          create: { test_id: test.test_id, question_id: rotated[idx], order_index: idx + 1 },
          update: { order_index: idx + 1 },
        });
      }
      mockExamCount++;
    }

    // Create 3 Workbook Practice Sets for this HSK level
    const wbList = workbookTopics[level];
    for (let wbIdx = 0; wbIdx < wbList.length; wbIdx++) {
      const wbTitle = wbList[wbIdx];
      let wbTest = await prisma.tests.findFirst({
        where: { title: wbTitle, test_type: 'WORKBOOK' },
      });
      if (!wbTest) {
        wbTest = await prisma.tests.create({
          data: {
            title: wbTitle,
            test_type: 'WORKBOOK',
            passing_score: 70,
            time_limit_mins: 15,
            is_published: true,
          },
        });
      }

      const sliceStart = wbIdx * 3;
      const wbQuestions = [...qIds.slice(sliceStart), ...qIds.slice(0, sliceStart)].slice(0, 6);
      for (let idx = 0; idx < wbQuestions.length; idx++) {
        await prisma.testQuestions.upsert({
          where: {
            test_id_question_id: { test_id: wbTest.test_id, question_id: wbQuestions[idx] },
          },
          create: { test_id: wbTest.test_id, question_id: wbQuestions[idx], order_index: idx + 1 },
          update: { order_index: idx + 1 },
        });
      }
      workbookCount++;
    }
  }

  console.log(`   ✓ ${mockExamCount} Mock Exams (5 per HSK 1–6) & ${workbookCount} Workbook Practice sets seeded.`);
}

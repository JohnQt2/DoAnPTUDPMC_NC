export interface PinyinCharItem {
  syllable: string;
  speakHanzi: string; // Mandarin carrier character so zh-CN SpeechSynthesis pronounces authentic Pinyin instead of English letter names!
  vnHint: string;
  guide: string;
  group: string;
  category: 'INITIAL' | 'FINAL' | 'WHOLE';
  tones?: [string, string, string, string];
  toneHanzi?: [string, string, string, string];
}

export const PINYIN_INITIALS_DATA: PinyinCharItem[] = [
  // Âm hai môi & môi răng
  { syllable: 'b', speakHanzi: '波', vnHint: 'p (không bật hơi)', guide: 'Hai môi khép nhẹ rồi mở ra, KHÔNG bật hơi (đọc giống "p" nhẹ tiếng Việt).', group: 'Âm môi', category: 'INITIAL', tones: ['bō', 'bó', 'bǒ', 'bò'], toneHanzi: ['波', '伯', '跛', '播'] },
  { syllable: 'p', speakHanzi: '坡', vnHint: 'ph (bật hơi mạnh)', guide: 'Hai môi khép chặt rồi BẬT HƠI mạnh ra ngoài.', group: 'Âm môi', category: 'INITIAL', tones: ['pō', 'pó', 'pǒ', 'pò'], toneHanzi: ['坡', '婆', '叵', '破'] },
  { syllable: 'm', speakHanzi: '摸', vnHint: 'm', guide: 'Khép hai môi, đẩy luồng hơi rung qua mũi (giống "m" tiếng Việt).', group: 'Âm môi', category: 'INITIAL', tones: ['mō', 'mó', 'mǒ', 'mò'], toneHanzi: ['摸', '磨', '抹', '墨'] },
  { syllable: 'f', speakHanzi: '佛', vnHint: 'ph', guide: 'Răng trên chạm nhẹ môi dưới, thổi hơi ra (giống "ph" tiếng Việt).', group: 'Âm môi', category: 'INITIAL', tones: ['fō', 'fó', 'fǒ', 'fò'], toneHanzi: ['夫', '佛', '否', '父'] },

  // Âm đầu lưỡi giữa
  { syllable: 'd', speakHanzi: '得', vnHint: 't (không bật hơi)', guide: 'Đầu lưỡi chạm chân răng trên rồi bật nhẹ, KHÔNG bật hơi (giống "t" tiếng Việt).', group: 'Âm đầu lưỡi giữa', category: 'INITIAL', tones: ['dē', 'dé', 'dě', 'dè'], toneHanzi: ['都', '得', '打', '大'] },
  { syllable: 't', speakHanzi: '特', vnHint: 'th (bật hơi mạnh)', guide: 'Đầu lưỡi chạm chân răng trên rồi BẬT HƠI mạnh (giống "th").', group: 'Âm đầu lưỡi giữa', category: 'INITIAL', tones: ['tē', 'té', 'tě', 'tè'], toneHanzi: ['他', '谈', '讨', '特'] },
  { syllable: 'n', speakHanzi: '讷', vnHint: 'n', guide: 'Đầu lưỡi chạm lợi trên, luồng hơi đi qua mũi (giống "n" tiếng Việt).', group: 'Âm đầu lưỡi giữa', category: 'INITIAL', tones: ['nē', 'né', 'ně', 'nè'], toneHanzi: ['呢', '拿', '你', '那'] },
  { syllable: 'l', speakHanzi: '勒', vnHint: 'l', guide: 'Đầu lưỡi chạm lợi trên, hơi thoát hai bên lưỡi (giống "l" tiếng Việt).', group: 'Âm đầu lưỡi giữa', category: 'INITIAL', tones: ['lē', 'lé', 'lě', 'lè'], toneHanzi: ['拉', '来', '老', '乐'] },

  // Âm cuống lưỡi
  { syllable: 'g', speakHanzi: '哥', vnHint: 'c / k (không bật hơi)', guide: 'Cuống lưỡi nâng chạm ngạc mềm, KHÔNG bật hơi (giống "c/k").', group: 'Âm cuống lưỡi', category: 'INITIAL', tones: ['gē', 'gé', 'gě', 'gè'], toneHanzi: ['哥', '格', '葛', '个'] },
  { syllable: 'k', speakHanzi: '科', vnHint: 'kh (bật hơi mạnh)', guide: 'Cuống lưỡi chạm ngạc mềm rồi BẬT HƠI mạnh (giống "kh" bật mạnh).', group: 'Âm cuống lưỡi', category: 'INITIAL', tones: ['kē', 'ké', 'kě', 'kè'], toneHanzi: ['科', '咳', '可', '课'] },
  { syllable: 'h', speakHanzi: '喝', vnHint: 'h / kh nhẹ', guide: 'Cuống lưỡi tiến gần ngạc mềm, ma sát nhẹ giữa "h" và "kh".', group: 'Âm cuống lưỡi', category: 'INITIAL', tones: ['hē', 'hé', 'hě', 'hè'], toneHanzi: ['喝', '和', '很', '贺'] },

  // Âm mặt lưỡi
  { syllable: 'j', speakHanzi: '基', vnHint: 'ch nhẹ (miệng cười)', guide: 'Mặt lưỡi sát ngạc cứng, khóe miệng kéo ngang như mỉm cười, KHÔNG bật hơi.', group: 'Âm mặt lưỡi', category: 'INITIAL', tones: ['jī', 'jí', 'jǐ', 'jì'], toneHanzi: ['基', '急', '几', '记'] },
  { syllable: 'q', speakHanzi: '欺', vnHint: 'ch bật hơi mạnh', guide: 'Mặt lưỡi sát ngạc cứng, miệng dẹt và BẬT HƠI mạnh hơn "j".', group: 'Âm mặt lưỡi', category: 'INITIAL', tones: ['qī', 'qí', 'qǐ', 'qì'], toneHanzi: ['七', '奇', '起', '气'] },
  { syllable: 'x', speakHanzi: '希', vnHint: 'x mềm (miệng cười)', guide: 'Mặt lưỡi gần ngạc cứng, luồng hơi xì nhẹ qua khe hẹp.', group: 'Âm mặt lưỡi', category: 'INITIAL', tones: ['xī', 'xí', 'xǐ', 'xì'], toneHanzi: ['西', '习', '洗', '细'] },

  // Âm uốn lưỡi
  { syllable: 'zh', speakHanzi: '知', vnHint: 'tr (uốn lưỡi, không bật hơi)', guide: 'Uốn cong đầu lưỡi chạm ngạc cứng, KHÔNG bật hơi (giống "tr" uốn lưỡi).', group: 'Âm uốn lưỡi', category: 'INITIAL', tones: ['zhī', 'zhí', 'zhǐ', 'zhì'], toneHanzi: ['知', '直', '纸', '志'] },
  { syllable: 'ch', speakHanzi: '吃', vnHint: 'tr (uốn lưỡi, bật hơi mạnh)', guide: 'Uốn cong đầu lưỡi chạm ngạc cứng rồi BẬT HƠI mạnh.', group: 'Âm uốn lưỡi', category: 'INITIAL', tones: ['chī', 'chí', 'chǐ', 'chì'], toneHanzi: ['吃', '迟', '尺', '赤'] },
  { syllable: 'sh', speakHanzi: '诗', vnHint: 's nặng (uốn lưỡi)', guide: 'Uốn cong đầu lưỡi, luồng hơi ma sát rõ (giống "s" nặng tiếng Việt).', group: 'Âm uốn lưỡi', category: 'INITIAL', tones: ['shī', 'shí', 'shǐ', 'shì'], toneHanzi: ['师', '十', '史', '是'] },
  { syllable: 'r', speakHanzi: '日', vnHint: 'gi / r mềm (uốn lưỡi)', guide: 'Uốn cong đầu lưỡi gần ngạc cứng, dây thanh rung nhẹ (không rung mạnh như "r" Việt).', group: 'Âm uốn lưỡi', category: 'INITIAL', tones: ['rī', 'rí', 'rǐ', 'rì'], toneHanzi: ['人', '然', '忍', '日'] },

  // Âm đầu lưỡi trước
  { syllable: 'z', speakHanzi: '资', vnHint: 'ch thẳng lưỡi (không bật hơi)', guide: 'Đầu lưỡi thẳng chạm mặt sau răng trên, KHÔNG bật hơi.', group: 'Âm đầu lưỡi trước', category: 'INITIAL', tones: ['zī', 'zí', 'zǐ', 'zì'], toneHanzi: ['资', '咱', '子', '字'] },
  { syllable: 'c', speakHanzi: '雌', vnHint: 'x / ch thẳng lưỡi (bật hơi)', guide: 'Đầu lưỡi thẳng chạm mặt sau răng trên rồi BẬT HƠI mạnh.', group: 'Âm đầu lưỡi trước', category: 'INITIAL', tones: ['cī', 'cí', 'cǐ', 'cì'], toneHanzi: ['差', '词', '此', '次'] },
  { syllable: 's', speakHanzi: '思', vnHint: 'x sắc (thẳng lưỡi)', guide: 'Đầu lưỡi thẳng gần răng trên, thổi luồng hơi xì nhẹ.', group: 'Âm đầu lưỡi trước', category: 'INITIAL', tones: ['sī', 'sí', 'sǐ', 'sì'], toneHanzi: ['思', '俗', '死', '四'] },

  // Bán nguyên âm
  { syllable: 'y', speakHanzi: '衣', vnHint: 'd / i', guide: 'Đứng đầu âm tiết thay cho "i", miệng dẹt nhẹ như khi đọc "i".', group: 'Bán nguyên âm', category: 'INITIAL', tones: ['yī', 'yí', 'yǐ', 'yì'], toneHanzi: ['一', '移', '椅', '意'] },
  { syllable: 'w', speakHanzi: '乌', vnHint: 'u / qu nhẹ', guide: 'Đứng đầu âm tiết thay cho "u", tròn môi chu ra phía trước.', group: 'Bán nguyên âm', category: 'INITIAL', tones: ['wū', 'wú', 'wǔ', 'wù'], toneHanzi: ['屋', '无', '五', '物'] },
];

export const PINYIN_FINALS_DATA: PinyinCharItem[] = [
  // 6 Vận mẫu đơn
  { syllable: 'a', speakHanzi: '啊', vnHint: 'a', guide: 'Mở rộng khoang miệng tự nhiên, lưỡi hạ thấp (giống "a").', group: 'Vận mẫu đơn (6)', category: 'FINAL', tones: ['ā', 'á', 'ǎ', 'à'], toneHanzi: ['啊', '嗄', '阿', '啊'] },
  { syllable: 'o', speakHanzi: '喔', vnHint: 'ô / ua nhẹ', guide: 'Tròn môi vừa phải, âm nằm giữa "ô" và "ua".', group: 'Vận mẫu đơn (6)', category: 'FINAL', tones: ['ō', 'ó', 'ǒ', 'ò'], toneHanzi: ['喔', '哦', '嚄', '哦'] },
  { syllable: 'e', speakHanzi: '鹅', vnHint: 'ơ / ưa', guide: 'Môi không tròn, hơi kéo ngang, đọc giữa "ơ" và "ưa".', group: 'Vận mẫu đơn (6)', category: 'FINAL', tones: ['ē', 'é', 'ě', 'è'], toneHanzi: ['阿', '鹅', '恶', '饿'] },
  { syllable: 'i', speakHanzi: '衣', vnHint: 'i', guide: 'Khóe miệng kéo ngang như mỉm cười (giống "i").', group: 'Vận mẫu đơn (6)', category: 'FINAL', tones: ['ī', 'í', 'ǐ', 'ì'], toneHanzi: ['衣', '移', '椅', '意'] },
  { syllable: 'u', speakHanzi: '乌', vnHint: 'u', guide: 'Tròn môi chu ra phía trước (giống "u").', group: 'Vận mẫu đơn (6)', category: 'FINAL', tones: ['ū', 'ú', 'ǔ', 'ù'], toneHanzi: ['乌', '吴', '五', '物'] },
  { syllable: 'ü', speakHanzi: '迂', vnHint: 'uy tròn môi', guide: 'Giữ tròn môi như đọc "u" nhưng trong miệng phát âm "i".', group: 'Vận mẫu đơn (6)', category: 'FINAL', tones: ['ǖ', 'ǘ', 'ǚ', 'ǜ'], toneHanzi: ['迂', '鱼', '雨', '玉'] },

  // 9 Vận mẫu kép
  { syllable: 'ai', speakHanzi: '哀', vnHint: 'ai', guide: 'Lướt nhanh từ "a" sang "i" (giống "ai").', group: 'Vận mẫu kép (9)', category: 'FINAL', tones: ['āi', 'ái', 'ǎi', 'ài'], toneHanzi: ['哀', '癌', '矮', '爱'] },
  { syllable: 'ei', speakHanzi: '诶', vnHint: 'ây', guide: 'Lướt từ "ê" sang "i" (giống "ây").', group: 'Vận mẫu kép (9)', category: 'FINAL', tones: ['ēi', 'éi', 'ěi', 'èi'], toneHanzi: ['杯', '肥', '北', '妹'] },
  { syllable: 'ui', speakHanzi: '威', vnHint: 'uây', guide: 'Viết tắt của uei, đọc lướt "uây".', group: 'Vận mẫu kép (9)', category: 'FINAL', tones: ['uī', 'uí', 'uǐ', 'uì'], toneHanzi: ['威', '围', '伟', '位'] },
  { syllable: 'ao', speakHanzi: '熬', vnHint: 'ao', guide: 'Lướt từ "a" sang "o" tròn môi (giống "ao").', group: 'Vận mẫu kép (9)', category: 'FINAL', tones: ['āo', 'áo', 'ǎo', 'ào'], toneHanzi: ['凹', '熬', '袄', '傲'] },
  { syllable: 'ou', speakHanzi: '欧', vnHint: 'âu', guide: 'Lướt từ "ô" sang "u" (giống "âu").', group: 'Vận mẫu kép (9)', category: 'FINAL', tones: ['ōu', 'óu', 'ǒu', 'òu'], toneHanzi: ['欧', '头', '偶', '后'] },
  { syllable: 'iu', speakHanzi: '优', vnHint: 'iâu', guide: 'Viết tắt của iou, đọc lướt "iâu".', group: 'Vận mẫu kép (9)', category: 'FINAL', tones: ['iū', 'iú', 'iǔ', 'iù'], toneHanzi: ['优', '油', '友', '右'] },
  { syllable: 'ie', speakHanzi: '耶', vnHint: 'ia / iê', guide: 'Lướt nhanh từ "i" sang "ê".', group: 'Vận mẫu kép (9)', category: 'FINAL', tones: ['iē', 'ié', 'iě', 'iè'], toneHanzi: ['耶', '爷', '也', '夜'] },
  { syllable: 'üe', speakHanzi: '约', vnHint: 'uyê', guide: 'Lướt từ "ü" tròn môi sang "ê".', group: 'Vận mẫu kép (9)', category: 'FINAL', tones: ['üē', 'üé', 'üě', 'üè'], toneHanzi: ['约', '学', '雪', '月'] },
  { syllable: 'er', speakHanzi: '儿', vnHint: 'ơ uốn lưỡi', guide: 'Đọc "ơ" đồng thời uốn cong đầu lưỡi lên trên.', group: 'Vận mẫu kép (9)', category: 'FINAL', tones: ['ēr', 'ér', 'ěr', 'èr'], toneHanzi: ['而', '儿', '耳', '二'] },

  // 5 Vận mẫu mũi trước
  { syllable: 'an', speakHanzi: '安', vnHint: 'an', guide: 'Âm mũi trước, kết thúc đầu lưỡi chạm lợi trên (giống "an").', group: 'Vận mẫu mũi trước (5)', category: 'FINAL', tones: ['ān', 'án', 'ǎn', 'àn'], toneHanzi: ['安', '难', '暗', '按'] },
  { syllable: 'en', speakHanzi: '恩', vnHint: 'ân', guide: 'Âm mũi trước, đọc gần giống "ân".', group: 'Vận mẫu mũi trước (5)', category: 'FINAL', tones: ['ēn', 'én', 'ěn', 'èn'], toneHanzi: ['恩', '门', '很', '问'] },
  { syllable: 'in', speakHanzi: '因', vnHint: 'in', guide: 'Âm mũi trước, đọc giống "in".', group: 'Vận mẫu mũi trước (5)', category: 'FINAL', tones: ['īn', 'ín', 'ǐn', 'ìn'], toneHanzi: ['因', '银', '引', '印'] },
  { syllable: 'un', speakHanzi: '温', vnHint: 'uân', guide: 'Viết tắt của uen, đọc giống "uân".', group: 'Vận mẫu mũi trước (5)', category: 'FINAL', tones: ['ūn', 'ún', 'ǔn', 'ùn'], toneHanzi: ['温', '文', '稳', '问'] },
  { syllable: 'ün', speakHanzi: '晕', vnHint: 'uyn', guide: 'Môi tròn "ü" nối âm mũi trước "n".', group: 'Vận mẫu mũi trước (5)', category: 'FINAL', tones: ['ǖn', 'ǘn', 'ǚn', 'ǜn'], toneHanzi: ['晕', '云', '允', '运'] },

  // 4 Vận mẫu mũi sau
  { syllable: 'ang', speakHanzi: '昂', vnHint: 'ang', guide: 'Âm mũi sau, mở rộng miệng, rung cuống lưỡi (giống "ang").', group: 'Vận mẫu mũi sau (4)', category: 'FINAL', tones: ['āng', 'áng', 'ǎng', 'àng'], toneHanzi: ['帮', '昂', '榜', '棒'] },
  { syllable: 'eng', speakHanzi: '灯', vnHint: 'âng', guide: 'Âm mũi sau, đọc gần giống "âng" sâu cuống lưỡi.', group: 'Vận mẫu mũi sau (4)', category: 'FINAL', tones: ['ēng', 'éng', 'ěng', 'èng'], toneHanzi: ['灯', '能', '冷', '梦'] },
  { syllable: 'ing', speakHanzi: '英', vnHint: 'ing / inh', guide: 'Âm mũi sau, đọc giống "ing/inh".', group: 'Vận mẫu mũi sau (4)', category: 'FINAL', tones: ['īng', 'íng', 'ǐng', 'ìng'], toneHanzi: ['英', '迎', '影', '硬'] },
  { syllable: 'ong', speakHanzi: '东', vnHint: 'ung', guide: 'Âm mũi sau, môi tròn, đọc gần giống "ung".', group: 'Vận mẫu mũi sau (4)', category: 'FINAL', tones: ['ōng', 'óng', 'ǒng', 'òng'], toneHanzi: ['东', '同', '懂', '动'] },
];

export const PINYIN_WHOLE_SYLLABLES_DATA: PinyinCharItem[] = [
  { syllable: 'zhi', speakHanzi: '知', vnHint: 'trư (uốn lưỡi)', guide: 'Đọc thẳng liền âm, không đánh vần "zh + i"; chữ "i" đọc gần như "ư".', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['zhī', 'zhí', 'zhǐ', 'zhì'], toneHanzi: ['知', '直', '纸', '志'] },
  { syllable: 'chi', speakHanzi: '吃', vnHint: 'trư (bật hơi)', guide: 'Đọc thẳng uốn lưỡi bật hơi mạnh, không ghép "ch + i".', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['chī', 'chí', 'chǐ', 'chì'], toneHanzi: ['吃', '池', '尺', '翅'] },
  { syllable: 'shi', speakHanzi: '诗', vnHint: 'sư (uốn lưỡi)', guide: 'Đọc thẳng uốn lưỡi, giống "sư".', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['shī', 'shí', 'shǐ', 'shì'], toneHanzi: ['师', '十', '史', '是'] },
  { syllable: 'ri', speakHanzi: '日', vnHint: 'giư / rư', guide: 'Đọc thẳng uốn lưỡi mềm, dây thanh rung nhẹ.', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['rī', 'rí', 'rǐ', 'rì'], toneHanzi: ['热', '人', '忍', '日'] },
  { syllable: 'zi', speakHanzi: '资', vnHint: 'chư (thẳng lưỡi)', guide: 'Đầu lưỡi thẳng sau răng trên, không bật hơi, đọc thẳng.', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['zī', 'zí', 'zǐ', 'zì'], toneHanzi: ['资', '紫', '子', '字'] },
  { syllable: 'ci', speakHanzi: '雌', vnHint: 'xư (bật hơi)', guide: 'Đầu lưỡi thẳng sau răng trên, bật hơi mạnh, đọc thẳng.', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['cī', 'cí', 'cǐ', 'cì'], toneHanzi: ['差', '词', '此', '次'] },
  { syllable: 'si', speakHanzi: '思', vnHint: 'xư', guide: 'Đầu lưỡi thẳng, thổi hơi xì nhẹ giống "xư".', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['sī', 'sí', 'sǐ', 'sì'], toneHanzi: ['思', '似', '死', '四'] },
  { syllable: 'yi', speakHanzi: '衣', vnHint: 'i', guide: 'Đọc giống nguyên âm "i", viết thêm "y" khi đứng độc lập.', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['yī', 'yí', 'yǐ', 'yì'], toneHanzi: ['一', '移', '椅', '意'] },
  { syllable: 'wu', speakHanzi: '乌', vnHint: 'u', guide: 'Đọc giống nguyên âm "u", viết thêm "w" khi đứng độc lập.', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['wū', 'wú', 'wǔ', 'wù'], toneHanzi: ['屋', '无', '五', '物'] },
  { syllable: 'yu', speakHanzi: '迂', vnHint: 'uy tròn môi', guide: 'Đọc giống "ü" tròn môi (bỏ 2 chấm khi đi sau "y").', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['yū', 'yú', 'yǔ', 'yù'], toneHanzi: ['迂', '鱼', '雨', '玉'] },
  { syllable: 'ye', speakHanzi: '耶', vnHint: 'da / iê', guide: 'Đọc thẳng giống "iê".', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['yē', 'yé', 'yě', 'yè'], toneHanzi: ['耶', '爷', '也', '夜'] },
  { syllable: 'yue', speakHanzi: '约', vnHint: 'uyê', guide: 'Đọc thẳng giống "üe" (bỏ 2 chấm sau "y").', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['yuē', 'yué', 'yuě', 'yuè'], toneHanzi: ['约', '越', '月', '月'] },
  { syllable: 'yuan', speakHanzi: '冤', vnHint: 'uyên', guide: 'Tròn môi đọc lướt "uyên".', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['yuān', 'yuán', 'yuǎn', 'yuàn'], toneHanzi: ['冤', '元', '远', '院'] },
  { syllable: 'yin', speakHanzi: '因', vnHint: 'in', guide: 'Đọc giống "in", thêm "y" khi đứng đầu.', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['yīn', 'yín', 'yǐn', 'yìn'], toneHanzi: ['音', '银', '引', '印'] },
  { syllable: 'yun', speakHanzi: '晕', vnHint: 'uyn', guide: 'Đọc giống "ün" tròn môi.', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['yūn', 'yún', 'yǔn', 'yùn'], toneHanzi: ['晕', '云', '允', '运'] },
  { syllable: 'ying', speakHanzi: '英', vnHint: 'ing / inh', guide: 'Âm mũi sau, đọc giống "ing/inh".', group: 'Âm tiết đọc thẳng (16)', category: 'WHOLE', tones: ['yīng', 'yíng', 'yǐng', 'yìng'], toneHanzi: ['英', '迎', '影', '硬'] },
];

export const FALLBACK_MINIMAL_PAIRS = [
  { id: 1, primary: { syllable: 'bā', speak: '八' }, contrasting: { syllable: 'pā', speak: '趴' }, tip: 'Chú ý luồng hơi: b không bật hơi, p bật hơi mạnh.' },
  { id: 2, primary: { syllable: 'dā', speak: '搭' }, contrasting: { syllable: 'tā', speak: '他' }, tip: 'd không bật hơi, t bật hơi mạnh.' },
  { id: 3, primary: { syllable: 'gē', speak: '哥' }, contrasting: { syllable: 'kē', speak: '科' }, tip: 'g đọc nhẹ, k bật hơi mạnh ở cuống lưỡi.' },
  { id: 4, primary: { syllable: 'jī', speak: '机' }, contrasting: { syllable: 'qī', speak: '七' }, tip: 'j không bật hơi, q bật hơi mạnh.' },
  { id: 5, primary: { syllable: 'zhī', speak: '知' }, contrasting: { syllable: 'chī', speak: '吃' }, tip: 'Cả hai đều uốn lưỡi; ch bật hơi mạnh hơn zh.' },
  { id: 6, primary: { syllable: 'zǐ', speak: '子' }, contrasting: { syllable: 'cǐ', speak: '此' }, tip: 'z thẳng lưỡi không bật hơi, c bật hơi mạnh.' },
  { id: 7, primary: { syllable: 'ān', speak: '安' }, contrasting: { syllable: 'āng', speak: '昂' }, tip: 'an là âm mũi trước (khép lưỡi), ang là âm mũi sau (mở rộng).' },
  { id: 8, primary: { syllable: 'yīn', speak: '音' }, contrasting: { syllable: 'yīng', speak: '英' }, tip: 'in ngắn gọn mũi trước, ing vang mũi sau.' },
  { id: 9, primary: { syllable: 'shī', speak: '师' }, contrasting: { syllable: 'sī', speak: '思' }, tip: 'sh uốn lưỡi (âm nặng), s thẳng lưỡi (âm nhẹ).' },
  { id: 10, primary: { syllable: 'yú', speak: '鱼' }, contrasting: { syllable: 'wú', speak: '无' }, tip: 'yu (ü) môi tròn nhưng lưỡi trước; wu (u) lưỡi lùi sau.' },
];

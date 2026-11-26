import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type ContentBlockType = 'THEORY' | 'VOCABULARY' | 'DIALOGUE' | 'PINYIN' | 'HANZI' | 'AUDIO' | 'EXAMPLE';

export interface DialogueLine {
  speaker: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
}

export interface ContentBlockEditorProps {
  blockType: ContentBlockType;
  initialJson: string;
  onChangeJson: (newJson: string, isValid: boolean) => void;
}

export const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
  blockType,
  initialJson,
  onChangeJson,
}) => {
  // Helper to parse initial JSON
  const initialData = React.useMemo(() => {
    try {
      return JSON.parse(initialJson || '{}');
    } catch {
      return {};
    }
  }, [initialJson]);

  // Form states per block type
  // 1. THEORY Form State
  const [theoryTitle, setTheoryTitle] = useState<string>(initialData.title || '');
  const [theoryContent, setTheoryContent] = useState<string>(
    initialData.content ||
    (Array.isArray(initialData.points) ? initialData.points.join('\n') : '') ||
    initialData.summary ||
    ''
  );

  // 2. VOCABULARY Form State
  const [vocabHanzi, setVocabHanzi] = useState<string>(initialData.hanzi || initialData.word || '');
  const [vocabPinyin, setVocabPinyin] = useState<string>(initialData.pinyin || '');
  const [vocabMeaning, setVocabMeaning] = useState<string>(initialData.meaning || initialData.vietnamese || '');

  // 3. DIALOGUE / AUDIO Form State
  const [dialogueTitle, setDialogueTitle] = useState<string>(initialData.title || 'Hội thoại bài học');
  const [dialogueLines, setDialogueLines] = useState<DialogueLine[]>(() => {
    const rawList = initialData.dialogue || initialData.lines || initialData.sentences;
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((item: any, idx: number) => ({
        speaker: item.speaker || (idx % 2 === 0 ? 'A' : 'B'),
        hanzi: item.hanzi || item.cn || '',
        pinyin: item.pinyin || item.py || '',
        meaning: item.meaning || item.vietnamese || item.vi || '',
      }));
    }
    return [
      { speaker: 'A', hanzi: '', pinyin: '', meaning: '' },
      { speaker: 'B', hanzi: '', pinyin: '', meaning: '' },
    ];
  });

  // 4. PINYIN Form State
  const [pinyinRule, setPinyinRule] = useState<string>(initialData.rule || initialData.instruction || '');
  const [pinyinSyllablesText, setPinyinSyllablesText] = useState<string>(
    Array.isArray(initialData.syllables) ? initialData.syllables.join(', ') : (initialData.syllables || '')
  );

  // 5. HANZI Form State
  const [hanziChar, setHanziChar] = useState<string>(initialData.character || initialData.hanzi || '');
  const [hanziPinyin, setHanziPinyin] = useState<string>(initialData.pinyin || '');
  const [hanziMeaning, setHanziMeaning] = useState<string>(initialData.meaning || initialData.vietnamese || '');
  const [hanziStrokes, setHanziStrokes] = useState<string>(
    Array.isArray(initialData.strokes) ? initialData.strokes.join(', ') : (initialData.strokes || '')
  );

  // Helper to sync converted JSON back to parent
  const syncJson = (convertedObj: any) => {
    const formatted = JSON.stringify(convertedObj, null, 2);
    onChangeJson(formatted, true);
  };

  // Sync handlers for each form
  const handleTheoryChange = (newTitle: string, newContent: string) => {
    setTheoryTitle(newTitle);
    setTheoryContent(newContent);
    syncJson({
      title: newTitle.trim(),
      content: newContent.trim(),
      points: newContent.split('\n').map(s => s.trim()).filter(Boolean),
    });
  };

  const handleVocabChange = (newHanzi: string, newPinyin: string, newMeaning: string) => {
    setVocabHanzi(newHanzi);
    setVocabPinyin(newPinyin);
    setVocabMeaning(newMeaning);
    syncJson({
      hanzi: newHanzi.trim(),
      pinyin: newPinyin.trim(),
      meaning: newMeaning.trim(),
    });
  };

  const handleDialogueChange = (newLines: DialogueLine[], newTitle?: string) => {
    const t = newTitle !== undefined ? newTitle : dialogueTitle;
    if (newTitle !== undefined) setDialogueTitle(newTitle);
    setDialogueLines(newLines);
    syncJson({
      title: t.trim(),
      dialogue: newLines.map(l => ({
        speaker: l.speaker.trim(),
        hanzi: l.hanzi.trim(),
        pinyin: l.pinyin.trim(),
        meaning: l.meaning.trim(),
      })),
      lines: newLines.map(l => ({
        speaker: l.speaker.trim(),
        hanzi: l.hanzi.trim(),
        pinyin: l.pinyin.trim(),
        vietnamese: l.meaning.trim(),
      })),
    });
  };

  const handlePinyinChange = (newRule: string, newSyllablesText: string) => {
    setPinyinRule(newRule);
    setPinyinSyllablesText(newSyllablesText);
    const syllables = newSyllablesText
      .split(/[,，\s]+/)
      .map(s => s.trim())
      .filter(Boolean);
    syncJson({
      rule: newRule.trim(),
      syllables,
    });
  };

  const handleHanziChange = (newChar: string, newPinyin: string, newMeaning: string, newStrokes: string) => {
    setHanziChar(newChar);
    setHanziPinyin(newPinyin);
    setHanziMeaning(newMeaning);
    setHanziStrokes(newStrokes);
    const strokes = newStrokes
      .split(/[,，\s]+/)
      .map(s => s.trim())
      .filter(Boolean);
    syncJson({
      character: newChar.trim(),
      pinyin: newPinyin.trim(),
      meaning: newMeaning.trim(),
      strokes,
    });
  };

  // Add line to dialogue
  const addDialogueLine = () => {
    const lastSpeaker = dialogueLines.length > 0 ? dialogueLines[dialogueLines.length - 1].speaker : 'B';
    const nextSpeaker = lastSpeaker === 'A' ? 'B' : 'A';
    const updated = [...dialogueLines, { speaker: nextSpeaker, hanzi: '', pinyin: '', meaning: '' }];
    handleDialogueChange(updated);
  };

  // Remove line from dialogue
  const removeDialogueLine = (index: number) => {
    if (dialogueLines.length <= 1) return;
    const updated = dialogueLines.filter((_, idx) => idx !== index);
    handleDialogueChange(updated);
  };

  // Update line field
  const updateDialogueLineField = (index: number, field: keyof DialogueLine, val: string) => {
    const updated = dialogueLines.map((line, idx) => (idx === index ? { ...line, [field]: val } : line));
    handleDialogueChange(updated);
  };

  // 1. THEORY FORM
  if (blockType === 'THEORY' || blockType === 'EXAMPLE') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
            Tiêu đề bài học / ngữ pháp <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={theoryTitle}
            onChange={(e) => handleTheoryChange(e.target.value, theoryContent)}
            placeholder="VD: Trọng điểm ngữ pháp câu chữ 是"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
            Nội dung lý thuyết / Trọng điểm kiến thức <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={8}
            required
            value={theoryContent}
            onChange={(e) => handleTheoryChange(theoryTitle, e.target.value)}
            placeholder="Nhập nội dung lý thuyết chi tiết hoặc các điểm kiến thức cần ghi nhớ..."
            className="w-full p-3.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed focus:ring-2 focus:ring-primary-400 focus:outline-none"
          />
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
            Gợi ý: Xuống dòng để chia thành các đoạn hoặc các ý chính khác nhau.
          </p>
        </div>
      </div>
    );
  }

  // 2. VOCABULARY FORM
  if (blockType === 'VOCABULARY') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
              Chữ Hán (Hanzi) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={vocabHanzi}
              onChange={(e) => handleVocabChange(e.target.value, vocabPinyin, vocabMeaning)}
              placeholder="VD: 老师"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-base font-chinese font-bold focus:ring-2 focus:ring-primary-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
              Phiên âm Pinyin <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={vocabPinyin}
              onChange={(e) => handleVocabChange(vocabHanzi, e.target.value, vocabMeaning)}
              placeholder="VD: lǎoshī"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-primary-600 focus:ring-2 focus:ring-primary-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
            Nghĩa tiếng Việt <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={vocabMeaning}
            onChange={(e) => handleVocabChange(vocabHanzi, vocabPinyin, e.target.value)}
            placeholder="VD: Giáo viên, thầy/cô giáo"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
          />
        </div>
      </div>
    );
  }

  // 3. DIALOGUE / AUDIO FORM
  if (blockType === 'DIALOGUE' || blockType === 'AUDIO') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
            Tiêu đề đoạn hội thoại
          </label>
          <input
            type="text"
            value={dialogueTitle}
            onChange={(e) => handleDialogueChange(dialogueLines, e.target.value)}
            placeholder="VD: Đoạn hội thoại 1 — Trong lớp học"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-800 dark:text-slate-200">
              Danh sách các câu thoại ({dialogueLines.length} câu)
            </label>
            <button
              type="button"
              onClick={addDialogueLine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm câu thoại</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {dialogueLines.map((line, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-500">#{idx + 1}</span>
                    <input
                      type="text"
                      value={line.speaker}
                      onChange={(e) => updateDialogueLineField(idx, 'speaker', e.target.value)}
                      placeholder="Người nói (A/B)"
                      className="w-24 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-center"
                    />
                  </div>
                  {dialogueLines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDialogueLine(idx)}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Xóa câu thoại này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={line.hanzi}
                    onChange={(e) => updateDialogueLineField(idx, 'hanzi', e.target.value)}
                    placeholder="Chữ Hán: 你好！"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-chinese font-semibold"
                  />
                  <input
                    type="text"
                    value={line.pinyin}
                    onChange={(e) => updateDialogueLineField(idx, 'pinyin', e.target.value)}
                    placeholder="Pinyin: Nǐ hǎo!"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-primary-600"
                  />
                </div>

                <input
                  type="text"
                  value={line.meaning}
                  onChange={(e) => updateDialogueLineField(idx, 'meaning', e.target.value)}
                  placeholder="Nghĩa tiếng Việt: Xin chào!"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-gray-700 dark:text-slate-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 4. PINYIN FORM
  if (blockType === 'PINYIN') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
            Quy tắc ngữ âm / Chú thích quan trọng
          </label>
          <textarea
            rows={3}
            value={pinyinRule}
            onChange={(e) => handlePinyinChange(e.target.value, pinyinSyllablesText)}
            placeholder="VD: Khi hai âm tiết thanh 3 đi liền nhau, âm tiết thứ nhất đọc thành thanh 2."
            className="w-full p-3.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed focus:ring-2 focus:ring-primary-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
            Danh sách âm tiết luyện tập (ngăn cách bằng dấu phẩy)
          </label>
          <input
            type="text"
            value={pinyinSyllablesText}
            onChange={(e) => handlePinyinChange(pinyinRule, e.target.value)}
            placeholder="VD: nǐ hǎo, lǎoshī, xièxie, zàijiàn"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-primary-400 focus:outline-none"
          />
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1">
            Mỗi âm tiết sẽ tự động hiển thị thành một nút phát âm mẫu tương tác trong bài học.
          </p>
        </div>
      </div>
    );
  }

  // 5. HANZI FORM
  if (blockType === 'HANZI') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
              Chữ Hán cần viết (Character) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={hanziChar}
              onChange={(e) => handleHanziChange(e.target.value, hanziPinyin, hanziMeaning, hanziStrokes)}
              placeholder="VD: 你"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-3xl font-chinese font-black text-center focus:ring-2 focus:ring-primary-400 focus:outline-none"
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
                Pinyin
              </label>
              <input
                type="text"
                value={hanziPinyin}
                onChange={(e) => handleHanziChange(hanziChar, e.target.value, hanziMeaning, hanziStrokes)}
                placeholder="VD: nǐ"
                className="w-full px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-primary-600 focus:ring-2 focus:ring-primary-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
                Nghĩa của chữ
              </label>
              <input
                type="text"
                value={hanziMeaning}
                onChange={(e) => handleHanziChange(hanziChar, hanziPinyin, e.target.value, hanziStrokes)}
                placeholder="VD: Bạn, anh, chị (ngôi thứ 2)"
                className="w-full px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
            Thứ tự các nét bút (ngăn cách bằng dấu phẩy)
          </label>
          <input
            type="text"
            value={hanziStrokes}
            onChange={(e) => handleHanziChange(hanziChar, hanziPinyin, hanziMeaning, e.target.value)}
            placeholder="VD: 撇, 竖, 撇, 横钩, 竖, 横折钩, 竖"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-primary-400 focus:outline-none"
          />
        </div>
      </div>
    );
  }

  // Fallback for custom or unknown block types: Theory form
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
          Tiêu đề nội dung <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={theoryTitle}
          onChange={(e) => handleTheoryChange(e.target.value, theoryContent)}
          placeholder="Nhập tiêu đề nội dung..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary-400 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-800 dark:text-slate-200 mb-1">
          Chi tiết nội dung <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={8}
          required
          value={theoryContent}
          onChange={(e) => handleTheoryChange(theoryTitle, e.target.value)}
          placeholder="Nhập nội dung chi tiết..."
          className="w-full p-3.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm leading-relaxed focus:ring-2 focus:ring-primary-400 focus:outline-none"
        />
      </div>
    </div>
  );
};

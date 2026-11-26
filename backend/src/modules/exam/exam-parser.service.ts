import fs from 'fs';
import path from 'path';
import pdfParse = require('pdf-parse');
import {
  CreateQuestionDto,
  CreateSectionDto,
  HskLevel,
  ParsedExamStructureDto,
  UploadedFileMetadata,
} from './exam.dto';

interface RawParsedQuestion {
  question_number: number;
  raw_answer: string;
  section_type: 'LISTENING' | 'READING' | 'WRITING';
  question_type?:
    | 'TRUE_FALSE'
    | 'MCQ_ABC'
    | 'MCQ_ABCD'
    | 'MCQ_ABCDEF'
    | 'WRITING_FILL'
    | 'WRITING_ESSAY';
  options?: string[];
  needsReview?: boolean;
  reviewReason?: string;
}

export class ExamParserService {
  /**
   * Bóc tách toàn diện bộ file HSK (đáp án PDF, đề PDF, transcript) thành cấu trúc đề thi hoàn chỉnh
   */
  async parseExamFiles(options: {
    answerPdfPath?: string;
    examPdfPath?: string;
    transcriptPdfPath?: string;
    audioPath?: string;
    userHskLevel?: string;
    filesMetadata?: Record<string, UploadedFileMetadata>;
  }): Promise<ParsedExamStructureDto> {
    const { answerPdfPath, examPdfPath, transcriptPdfPath, audioPath, userHskLevel, filesMetadata = {} } =
      options;

    let answerText = '';
    let examText = '';

    // 1. Trích xuất text từ file đáp án PDF (nếu có)
    if (answerPdfPath && fs.existsSync(answerPdfPath)) {
      try {
        const dataBuffer = fs.readFileSync(answerPdfPath);
        const parsed = await pdfParse(dataBuffer);
        answerText = parsed.text || '';
      } catch (err: any) {
        console.warn('Lỗi khi đọc file answerPdf:', err?.message || err);
      }
    }

    // 2. Trích xuất text từ file đề PDF (nếu có)
    if (examPdfPath && fs.existsSync(examPdfPath)) {
      try {
        const dataBuffer = fs.readFileSync(examPdfPath);
        const parsed = await pdfParse(dataBuffer);
        examText = parsed.text || '';
      } catch (err: any) {
        console.warn('Lỗi khi đọc file examPdf:', err?.message || err);
      }
    }

    // 3. Nhận diện Mã đề thi (Code) và Cấp độ HSK
    const combinedFilenames = Object.values(filesMetadata)
      .map((f) => f.originalName)
      .join(' ');
    const combinedAllText = `${combinedFilenames}\n${answerText.slice(0, 500)}\n${examText.slice(0, 500)}`;

    const detectedCode = this.detectExamCode(combinedAllText) || 'H10000';
    const detectedLevel = this.detectHskLevel(combinedAllText, detectedCode, userHskLevel);

    // 4. Bóc tách danh sách câu hỏi và đáp án từ text
    let parsedQuestions: RawParsedQuestion[] = [];
    if (answerText.trim()) {
      parsedQuestions = this.extractQuestionsFromAnswerText(answerText, detectedLevel);
    }

    // Nếu PDF không bóc tách được câu hỏi nào (hoặc không có file đáp án), dùng cấu trúc chuẩn HSK mặc định
    if (parsedQuestions.length === 0) {
      parsedQuestions = this.generateDefaultQuestionsSkeleton(detectedLevel);
    }

    // 5. Phân nhóm câu hỏi vào các Section (LISTENING, READING, WRITING)
    const sections = this.buildSections(parsedQuestions, detectedLevel);

    // 6. Tính toán điểm số & thời gian chuẩn HSK
    const durationMinutes = this.getDefaultDuration(detectedLevel);
    const passScore = detectedLevel === 'HSK1' || detectedLevel === 'HSK2' ? 120 : 180;
    const totalScore = sections.reduce(
      (sum, sec) => sum + (sec.questions || []).reduce((qSum, q) => qSum + q.points, 0),
      0
    );

    const hasMissingChars = parsedQuestions.some((q) => q.needsReview);
    const reviewQuestionsCount = parsedQuestions.filter((q) => q.needsReview).length;

    const urls: Record<string, string> = {};
    for (const [key, meta] of Object.entries(filesMetadata)) {
      urls[key] = meta.url;
    }

    return {
      code: detectedCode,
      title: `Đề thi thử ${detectedLevel} - Mã ${detectedCode}`,
      description: `Đề thi thử chuẩn ${detectedLevel} gồm ${sections.length} phần thi, tổng số ${parsedQuestions.length} câu hỏi.`,
      hsk_level: detectedLevel,
      duration_minutes: durationMinutes,
      total_score: totalScore > 0 ? totalScore : 200,
      pass_score: passScore,
      exam_pdf_url: urls['exam_pdf'] || urls['examPdf'],
      answer_pdf_url: urls['answer_pdf'] || urls['answerPdf'],
      audio_url: urls['audio'],
      transcript_pdf_url: urls['transcript_pdf'] || urls['transcriptPdf'],
      sections,
      metadata: {
        hasMissingChars,
        reviewQuestionsCount,
        files: filesMetadata,
        detectedQuestionsCount: parsedQuestions.length,
      },
    };
  }

  /**
   * Nhận diện mã đề thi chuẩn HSK (VD: H10000, H11332, H21001)
   */
  private detectExamCode(text: string): string | null {
    const match = text.match(/\b(H\d{4,5})\b/i);
    if (match) return match[1].toUpperCase();

    const matchHyphen = text.match(/\b(HSK[1-6]?[_-]\w+)\b/i);
    if (matchHyphen) return matchHyphen[1].toUpperCase();

    return null;
  }

  /**
   * Nhận diện cấp độ HSK (HSK1..HSK6)
   */
  private detectHskLevel(text: string, code: string, userLevel?: string): HskLevel {
    if (userLevel && ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].includes(userLevel)) {
      return userLevel as HskLevel;
    }

    // Từ mã đề: H1xxxx -> HSK1, H2xxxx -> HSK2, etc.
    const codeMatch = code.match(/^H([1-6])/i);
    if (codeMatch) {
      return `HSK${codeMatch[1]}` as HskLevel;
    }

    // Từ nội dung chữ Hán (bao gồm cả trường hợp PDF lỗi font như "一㑻" hoặc "˄一")
    if (/HSK\s*[（\(˄]?\s*一[级級㑻]?/i.test(text) || /一[级級㑻]/i.test(text)) return 'HSK1';
    if (/HSK\s*[（\(˄]?\s*二[级級]?/i.test(text) || /二[级級]/i.test(text)) return 'HSK2';
    if (/HSK\s*[（\(˄]?\s*[三ϝ][级級]?/i.test(text) || /三[级級]/i.test(text)) return 'HSK3';
    if (/HSK\s*[（\(˄]?\s*四[级級]?/i.test(text) || /四[级級]/i.test(text)) return 'HSK4';
    if (/HSK\s*[（\(˄]?\s*五[级級]?/i.test(text) || /五[级級]/i.test(text)) return 'HSK5';
    if (/HSK\s*[（\(˄]?\s*六[级級]?/i.test(text) || /六[级級]/i.test(text)) return 'HSK6';

    return 'HSK1';
  }

  /**
   * Thời gian thi chuẩn theo cấp độ
   */
  private getDefaultDuration(level: HskLevel): number {
    switch (level) {
      case 'HSK1':
        return 35;
      case 'HSK2':
        return 50;
      case 'HSK3':
        return 85;
      case 'HSK4':
        return 100;
      case 'HSK5':
        return 120;
      case 'HSK6':
        return 135;
      default:
        return 35;
    }
  }

  /**
   * Thuật toán bóc tách câu hỏi & đáp án từ text file đáp án PDF thuần Regex
   * - Chuẩn hóa văn bản & loại bỏ số trang (- 20 -)
   * - Tách theo khối lớn (一、听力 / 二、阅读 / 三、书写) và tiểu mục (第一部分..第四部分)
   * - Xử lý lỗi dòng dính / mất ký tự font (VD: "3. 4. X", dấu "．" fullwidth, dấu "×", ký tự "ǃ", "ϝ")
   */
  extractQuestionsFromAnswerText(text: string, level: HskLevel): RawParsedQuestion[] {
    // 1. Chuẩn hóa văn bản & loại bỏ số trang dạng "- 20 -"
    const cleanText = text
      .replace(/\r\n/g, '\n')
      .replace(/(?:^|\n)\s*[-—–]\s*\d+\s*[-—–]\s*(?=\n|$)/g, '\n')
      .replace(/[-—–]\s*\d+\s*[-—–]/g, ' ')
      .replace(/[ \t]+/g, ' ');

    // 2. Tìm ranh giới 3 phần lớn (hỗ trợ cả dấu "、" lẫn ký tự lỗi font "ǃ", "ϝ" và khoảng trắng "听 力", "阅 读")
    const listeningIndex = cleanText.search(/(?:一[、ǃ\.．:：\s]*)?[听聽]\s*力(?:\s*部\s*分)?/i);
    const readingIndex = cleanText.search(/(?:二[、ǃ\.．:：\s]*)?[阅閱]\s*[读讀](?:\s*部\s*分)?/i);
    const writingIndex = cleanText.search(/(?:[三ϝ][、ǃ\.．:：\s]*)?[书書]\s*[写寫](?:\s*部\s*分)?/i);

    let listeningText = '';
    let readingText = '';
    let writingText = '';

    if (listeningIndex !== -1 && readingIndex !== -1 && readingIndex > listeningIndex) {
      listeningText = cleanText.slice(listeningIndex, readingIndex);
      if (writingIndex !== -1 && writingIndex > readingIndex) {
        readingText = cleanText.slice(readingIndex, writingIndex);
        writingText = cleanText.slice(writingIndex);
      } else {
        readingText = cleanText.slice(readingIndex);
      }
    } else if (listeningIndex !== -1) {
      if (writingIndex !== -1 && writingIndex > listeningIndex) {
        listeningText = cleanText.slice(listeningIndex, writingIndex);
        writingText = cleanText.slice(writingIndex);
      } else {
        listeningText = cleanText.slice(listeningIndex);
      }
    } else if (readingIndex !== -1) {
      if (writingIndex !== -1 && writingIndex > readingIndex) {
        readingText = cleanText.slice(readingIndex, writingIndex);
        writingText = cleanText.slice(writingIndex);
      } else {
        readingText = cleanText.slice(readingIndex);
      }
    } else {
      listeningText = cleanText;
    }

    const questions: RawParsedQuestion[] = [];
    const seenNumsGlobal = new Set<number>();

    const splitIntoSubsections = (blockText: string): string[] => {
      const subHeaderRegex = /第\s*[一二三ϝ四五六1-6]\s*部\s*分/g;
      const indices: number[] = [];
      let m: RegExpExecArray | null;
      while ((m = subHeaderRegex.exec(blockText)) !== null) {
        indices.push(m.index);
      }
      if (indices.length === 0) return [blockText];

      const subs: string[] = [];
      if (indices[0] > 0) {
        const pre = blockText.slice(0, indices[0]).trim();
        if (/\d+\s*[\.．、\)]/.test(pre)) subs.push(pre);
      }
      for (let i = 0; i < indices.length; i++) {
        const start = indices[i];
        const end = i + 1 < indices.length ? indices[i + 1] : blockText.length;
        subs.push(blockText.slice(start, end));
      }
      return subs;
    };

    const parseSubsection = (subText: string, defaultSec: 'LISTENING' | 'READING' | 'WRITING') => {
      const cleanedSub = subText
        .replace(/第\s*[一二三ϝ四五六1-6]\s*部\s*分/g, ' ')
        .replace(/(?:一[、ǃ\.．:：\s]*)?[听聽]\s*力(?:\s*部\s*分)?/gi, ' ')
        .replace(/(?:二[、ǃ\.．:：\s]*)?[阅閱]\s*[读讀](?:\s*部\s*分)?/gi, ' ')
        .replace(/(?:[三ϝ][、ǃ\.．:：\s]*)?[书書]\s*[写寫](?:\s*部\s*分)?/gi, ' ')
        .replace(/\r?\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Quét toàn cục tất cả mốc số câu: "1.", "1．", "1、", "1)"
      const markerRegex = /(?:^|(?<=[^\d]))(\d{1,3})\s*[\.．、\)]/g;
      const markers: { num: number; start: number; end: number }[] = [];

      let match: RegExpExecArray | null;
      while ((match = markerRegex.exec(cleanedSub)) !== null) {
        const num = parseInt(match[1], 10);
        if (num >= 1 && num <= 120 && !seenNumsGlobal.has(num)) {
          seenNumsGlobal.add(num);
          markers.push({
            num,
            start: match.index,
            end: match.index + match[0].length,
          });
        }
      }

      if (markers.length === 0) return;

      markers.sort((a, b) => a.start - b.start);

      const resolveSecType = (num: number): 'LISTENING' | 'READING' | 'WRITING' => {
        if (defaultSec === 'LISTENING' && listeningIndex === -1 && readingIndex === -1) {
          if (level === 'HSK1' && num > 20) return 'READING';
          if (level === 'HSK2' && num > 35) return 'READING';
          if (level === 'HSK3') {
            if (num > 70) return 'WRITING';
            if (num > 40) return 'READING';
          }
        }
        return defaultSec;
      };

      interface RawItem {
        num: number;
        rawSlice: string;
        secType: 'LISTENING' | 'READING' | 'WRITING';
        extractedToken: string | null;
        isExplicitTrueFalseSymbol: boolean;
        needsReview: boolean;
        reviewReason?: string;
      }

      const items: RawItem[] = [];

      for (let i = 0; i < markers.length; i++) {
        const cur = markers[i];
        const next = markers[i + 1];
        const sliceEnd = next ? next.start : cleanedSub.length;
        const rawSlice = cleanedSub.slice(cur.end, sliceEnd).trim();
        const secType = resolveSecType(cur.num);

        if (secType === 'WRITING') {
          items.push({
            num: cur.num,
            rawSlice,
            secType,
            extractedToken: rawSlice || '',
            isExplicitTrueFalseSymbol: false,
            needsReview: !rawSlice,
            reviewReason: !rawSlice ? 'Chưa nhận diện được đáp án mẫu phần Viết' : undefined,
          });
        } else {
          const tokenMatch = rawSlice.match(/(TRUE|FALSE|[√✓✔×✗对错]|[A-Fa-fTtXx])/i);
          if (tokenMatch) {
            const tok = tokenMatch[1].toUpperCase();
            const isExplicitTF = ['√', '✓', '✔', '×', '✗', 'X', '对', '错', 'TRUE', 'FALSE', 'T'].includes(tok);
            items.push({
              num: cur.num,
              rawSlice,
              secType,
              extractedToken: tok,
              isExplicitTrueFalseSymbol: isExplicitTF,
              needsReview: false,
            });
          } else {
            items.push({
              num: cur.num,
              rawSlice,
              secType,
              extractedToken: null,
              isExplicitTrueFalseSymbol: false,
              needsReview: true,
              reviewReason: 'Ký hiệu đáp án bị mất font hoặc mờ trong PDF gốc (gợi ý mặc định là Đúng √)',
            });
          }
        }

        // Nếu nhảy cóc 1 số câu (VD: 2 và 4 -> khuyết câu 3)
        if (next && next.num === cur.num + 2 && !seenNumsGlobal.has(cur.num + 1)) {
          seenNumsGlobal.add(cur.num + 1);
          items.push({
            num: cur.num + 1,
            rawSlice: '',
            secType: resolveSecType(cur.num + 1),
            extractedToken: null,
            isExplicitTrueFalseSymbol: false,
            needsReview: true,
            reviewReason: 'Số câu bị khuyết trong PDF đáp án (gợi ý mặc định là Đúng √)',
          });
        }
      }

      // Xác định loại câu hỏi cho cả tiểu mục dựa trên tập đáp án
      const hasExplicitTF = items.some((it) => it.isExplicitTrueFalseSymbol);
      const hasMcqLettersOtherThanF = items.some(
        (it) => it.extractedToken && ['A', 'B', 'C', 'D', 'E'].includes(it.extractedToken)
      );
      const isTrueFalseSub =
        hasExplicitTF || (!hasMcqLettersOtherThanF && items.some((it) => it.extractedToken === 'F'));

      let subMcqType: 'MCQ_ABC' | 'MCQ_ABCD' | 'MCQ_ABCDEF' = 'MCQ_ABCD';
      let subMcqOptions: string[] = ['A', 'B', 'C', 'D'];

      if (!isTrueFalseSub) {
        let maxCode = 'A'.charCodeAt(0);
        for (const it of items) {
          if (it.extractedToken && /^[A-F]$/.test(it.extractedToken)) {
            const c = it.extractedToken.charCodeAt(0);
            if (c > maxCode) maxCode = c;
          }
        }
        if (maxCode <= 'C'.charCodeAt(0)) {
          subMcqType = 'MCQ_ABC';
          subMcqOptions = ['A', 'B', 'C'];
        } else if (maxCode === 'D'.charCodeAt(0)) {
          subMcqType = 'MCQ_ABCD';
          subMcqOptions = ['A', 'B', 'C', 'D'];
        } else {
          subMcqType = 'MCQ_ABCDEF';
          subMcqOptions = ['A', 'B', 'C', 'D', 'E', 'F'];
        }
      }

      for (const it of items) {
        if (it.secType === 'WRITING') {
          questions.push({
            question_number: it.num,
            raw_answer: it.rawSlice,
            section_type: 'WRITING',
            question_type: it.rawSlice.length > 30 ? 'WRITING_ESSAY' : 'WRITING_FILL',
            options: [],
            needsReview: it.needsReview,
            reviewReason: it.reviewReason,
          });
          continue;
        }

        if (isTrueFalseSub) {
          const ans =
            it.extractedToken && ['×', '✗', 'X', '错', 'F', 'FALSE'].includes(it.extractedToken)
              ? 'FALSE'
              : 'TRUE';
          questions.push({
            question_number: it.num,
            raw_answer: ans,
            section_type: it.secType,
            question_type: 'TRUE_FALSE',
            options: ['✓', '✗'],
            needsReview: it.needsReview,
            reviewReason: it.reviewReason,
          });
        } else {
          const ans = it.extractedToken && /^[A-F]$/.test(it.extractedToken) ? it.extractedToken : 'A';
          questions.push({
            question_number: it.num,
            raw_answer: ans,
            section_type: it.secType,
            question_type: subMcqType,
            options: subMcqOptions,
            needsReview: it.needsReview || !it.extractedToken,
            reviewReason: it.reviewReason,
          });
        }
      }
    };

    const parseMajorBlock = (blockText: string, defaultSec: 'LISTENING' | 'READING' | 'WRITING') => {
      if (!blockText.trim()) return;
      const subs = splitIntoSubsections(blockText);
      for (const sub of subs) {
        parseSubsection(sub, defaultSec);
      }
    };

    if (listeningText) parseMajorBlock(listeningText, 'LISTENING');
    if (readingText) parseMajorBlock(readingText, 'READING');
    if (writingText) parseMajorBlock(writingText, 'WRITING');

    questions.sort((a, b) => a.question_number - b.question_number);
    return questions;
  }

  /**
   * Tạo bộ khung câu hỏi mẫu chuẩn HSK nếu file PDF không có text đáp án
   */
  private generateDefaultQuestionsSkeleton(level: HskLevel): RawParsedQuestion[] {
    const list: RawParsedQuestion[] = [];

    if (level === 'HSK1') {
      // 40 câu: 20 Nghe, 20 Đọc
      for (let i = 1; i <= 20; i++) {
        list.push({
          question_number: i,
          raw_answer: i <= 5 ? 'TRUE' : 'A',
          section_type: 'LISTENING',
        });
      }
      for (let i = 21; i <= 40; i++) {
        list.push({
          question_number: i,
          raw_answer: i <= 25 ? 'A' : 'B',
          section_type: 'READING',
        });
      }
    } else if (level === 'HSK2') {
      // 60 câu: 35 Nghe, 25 Đọc
      for (let i = 1; i <= 35; i++) {
        list.push({
          question_number: i,
          raw_answer: i <= 10 ? 'TRUE' : 'A',
          section_type: 'LISTENING',
        });
      }
      for (let i = 36; i <= 60; i++) {
        list.push({
          question_number: i,
          raw_answer: 'A',
          section_type: 'READING',
        });
      }
    } else {
      // HSK3 - HSK6 mặc định 80 - 100 câu
      const count = level === 'HSK3' ? 80 : 100;
      for (let i = 1; i <= count; i++) {
        let sec: 'LISTENING' | 'READING' | 'WRITING' = 'LISTENING';
        if (i > 70) sec = 'WRITING';
        else if (i > 40) sec = 'READING';

        list.push({
          question_number: i,
          raw_answer: i > 70 ? '' : 'A',
          section_type: sec,
        });
      }
    }

    return list;
  }

  /**
   * Phân loại question_type và chia section + điểm số
   */
  buildSections(
    questions: RawParsedQuestion[],
    level: HskLevel
  ): CreateSectionDto[] {
    const listeningQuestions = questions.filter((q) => q.section_type === 'LISTENING');
    const readingQuestions = questions.filter((q) => q.section_type === 'READING');
    const writingQuestions = questions.filter((q) => q.section_type === 'WRITING');

    const resultSections: CreateSectionDto[] = [];

    // Helper tạo danh sách CreateQuestionDto từ raw questions
    const convertQuestions = (
      rawList: RawParsedQuestion[],
      defaultSectionPoints: number
    ): CreateQuestionDto[] => {
      const qCount = rawList.length;
      const pointsPerQ = qCount > 0 ? Math.round((defaultSectionPoints / qCount) * 10) / 10 : 2.5;

      // Phân tích dạng câu hỏi tự động dựa trên kết quả tiểu mục hoặc đáp án fallback
      return rawList.map((q, idx) => {
        let qType:
          | 'TRUE_FALSE'
          | 'MCQ_ABC'
          | 'MCQ_ABCD'
          | 'MCQ_ABCDEF'
          | 'WRITING_FILL'
          | 'WRITING_ESSAY' = q.question_type || 'MCQ_ABCD';
        let options: string[] = q.options || ['A', 'B', 'C', 'D'];
        const correctAns = q.raw_answer;

        if (!q.question_type) {
          if (q.raw_answer === 'TRUE' || q.raw_answer === 'FALSE') {
            qType = 'TRUE_FALSE';
            options = ['✓', '✗'];
          } else if (['E', 'F'].includes(q.raw_answer)) {
            qType = 'MCQ_ABCDEF';
            options = ['A', 'B', 'C', 'D', 'E', 'F'];
          } else if (q.raw_answer === 'A' || q.raw_answer === 'B' || q.raw_answer === 'C') {
            if (
              (level === 'HSK1' && q.question_number >= 6 && q.question_number <= 10) ||
              (level === 'HSK1' && q.question_number >= 16 && q.question_number <= 20) ||
              (level === 'HSK2' && q.question_number >= 11 && q.question_number <= 25)
            ) {
              qType = 'MCQ_ABC';
              options = ['A', 'B', 'C'];
            } else {
              qType = 'MCQ_ABCD';
              options = ['A', 'B', 'C', 'D'];
            }
          } else if (q.raw_answer === 'D') {
            qType = 'MCQ_ABCD';
            options = ['A', 'B', 'C', 'D'];
          } else if (q.section_type === 'WRITING') {
            qType = 'WRITING_FILL';
            options = [];
          }
        }

        return {
          question_number: q.question_number,
          question_type: qType,
          prompt_text: `Câu ${q.question_number}`,
          options,
          correct_answer: correctAns,
          sample_answer: qType.startsWith('WRITING') ? correctAns : undefined,
          points: pointsPerQ,
          order_index: idx,
          needsReview: q.needsReview,
          reviewReason: q.reviewReason,
        };
      });
    };

    // 1. Phần Nghe (Listening)
    if (listeningQuestions.length > 0) {
      resultSections.push({
        section_type: 'LISTENING',
        title: 'Phần 1: Nghe hiểu (听力)',
        instructions: 'Thí sinh nghe đoạn âm thanh và làm theo hướng dẫn trong đề PDF.',
        order_index: 0,
        questions: convertQuestions(listeningQuestions, 100),
      });
    }

    // 2. Phần Đọc (Reading)
    if (readingQuestions.length > 0) {
      resultSections.push({
        section_type: 'READING',
        title: 'Phần 2: Đọc hiểu (阅读)',
        instructions: 'Thí sinh đọc đề thi PDF và điền đáp án tương ứng.',
        order_index: 1,
        questions: convertQuestions(readingQuestions, 100),
      });
    }

    // 3. Phần Viết (Writing) nếu có
    if (writingQuestions.length > 0) {
      resultSections.push({
        section_type: 'WRITING',
        title: 'Phần 3: Viết (书写)',
        instructions: 'Thí sinh sắp xếp câu hoặc viết chữ Hán theo đề thi PDF.',
        order_index: 2,
        questions: convertQuestions(writingQuestions, 100),
      });
    }

    return resultSections;
  }
}

export const examParserService = new ExamParserService();

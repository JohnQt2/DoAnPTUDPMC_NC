import { AppError } from '../../shared/errors/app-error';
import {
  QuestionType,
  ValidationErrorItem,
  ValidationWarningItem,
  PublishValidationResult,
} from './practice-admin.types';

// Danh sách các key rò rỉ đáp án bị cấm trong prompt
const LEAK_KEYS = [
  'answer',
  'correctanswer',
  'correctoption',
  'iscorrect',
  'explanation',
  'solution',
];

/**
 * Kiểm tra xem object có chứa key cấm nào đệ quy hay không (answer leakage detection)
 */
export function detectAnswerLeakage(obj: unknown, path: string = ''): string | null {
  if (!obj || typeof obj !== 'object') return null;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const leak = detectAnswerLeakage(obj[i], `${path}[${i}]`);
      if (leak) return leak;
    }
    return null;
  }

  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '');
    if (LEAK_KEYS.includes(normalizedKey)) {
      return `${path ? path + '.' : ''}${key}`;
    }
    const leak = detectAnswerLeakage(value, `${path ? path + '.' : ''}${key}`);
    if (leak) return leak;
  }

  return null;
}

/**
 * Validate cấu trúc Question Prompt và Answer theo từng Type cụ thể
 */
export function validatePracticeQuestion(
  type: string,
  prompt: Record<string, unknown>,
  answer: Record<string, unknown>
): { valid: boolean; error?: string } {
  // 1. Kiểm tra answer leak
  const leakedKey = detectAnswerLeakage(prompt);
  if (leakedKey) {
    return {
      valid: false,
      error: `Rò rỉ đáp án trong prompt: thuộc tính cấm "${leakedKey}" xuất hiện trong nội dung đề bài.`,
    };
  }

  // 2. Validate theo Type
  switch (type as QuestionType) {
    case 'TRUE_FALSE': {
      if (typeof answer.value !== 'boolean') {
        return { valid: false, error: 'Đáp án của TRUE_FALSE phải có "value" là kiểu boolean (true/false).' };
      }
      break;
    }

    case 'SINGLE_CHOICE': {
      if (!Array.isArray(prompt.options) || prompt.options.length < 2) {
        return { valid: false, error: 'SINGLE_CHOICE yêu cầu prompt.options là mảng có ít nhất 2 lựa chọn.' };
      }
      const keys = prompt.options.map((opt: any) => opt?.key || opt?.id);
      if (new Set(keys).size !== keys.length) {
        return { valid: false, error: 'Các lựa chọn trong prompt.options phải có key duy nhất.' };
      }
      if (!answer.value || !keys.includes(answer.value)) {
        return {
          valid: false,
          error: `Đáp án answer.value ("${String(answer.value)}") phải thuộc danh sách key lựa chọn: [${keys.join(', ')}].`,
        };
      }
      break;
    }

    case 'IMAGE_CHOICE': {
      if (!Array.isArray(prompt.options) || prompt.options.length < 2) {
        return { valid: false, error: 'IMAGE_CHOICE yêu cầu prompt.options là mảng có ít nhất 2 hình ảnh lựa chọn.' };
      }
      for (const opt of prompt.options as any[]) {
        if (!opt?.key || (!opt?.imageUrl && !opt?.image)) {
          return { valid: false, error: 'Mỗi lựa chọn của IMAGE_CHOICE phải có key và imageUrl.' };
        }
      }
      const imgKeys = prompt.options.map((opt: any) => opt.key);
      if (!answer.value || !imgKeys.includes(answer.value)) {
        return {
          valid: false,
          error: `Đáp án answer.value ("${String(answer.value)}") phải thuộc danh sách key hình ảnh: [${imgKeys.join(', ')}].`,
        };
      }
      break;
    }

    case 'LISTEN_AND_CHOOSE': {
      if (!Array.isArray(prompt.options) || prompt.options.length < 2) {
        return { valid: false, error: 'LISTEN_AND_CHOOSE yêu cầu prompt.options có ít nhất 2 lựa chọn.' };
      }
      const optKeys = prompt.options.map((opt: any) => opt?.key || opt?.id);
      if (!answer.value || !optKeys.includes(answer.value)) {
        return {
          valid: false,
          error: `Đáp án answer.value ("${String(answer.value)}") phải thuộc danh sách lựa chọn: [${optKeys.join(', ')}].`,
        };
      }
      break;
    }

    case 'TONE_SELECTION': {
      if (typeof answer.value !== 'string' && typeof answer.value !== 'number') {
        return { valid: false, error: 'TONE_SELECTION yêu cầu answer.value là thanh điệu hợp lệ.' };
      }
      break;
    }

    case 'CHARACTER_WRITING': {
      if (!prompt.character && !prompt.hanzi) {
        return { valid: false, error: 'CHARACTER_WRITING yêu cầu prompt.character hoặc prompt.hanzi.' };
      }
      break;
    }

    case 'TEXT_INPUT': {
      if (typeof answer.value !== 'string') {
        return { valid: false, error: 'TEXT_INPUT yêu cầu answer.value là chuỗi văn bản.' };
      }
      break;
    }

    default:
      return {
        valid: false,
        error: `Loại câu hỏi "${type}" hiện chưa được hỗ trợ end-to-end trong hệ thống.`,
      };
  }

  return { valid: true };
}

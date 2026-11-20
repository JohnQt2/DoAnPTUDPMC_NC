/**
 * Hanzi stroke-order data loader & offline fallback.
 * - Loads full calligraphic stroke outlines + medians for ANY Chinese character (9,500+ Hanzi)
 *   from open-source MakeMeAHanzi (`hanzi-writer-data@2.0` on jsDelivr) with in-memory caching.
 * - Includes built-in offline fallback SVG paths (viewBox 0..100) for core HSK1 starter characters
 *   so stroke animation works even offline or on an unseeded VPS database.
 */

export interface MakeMeAHanziData {
  strokes: string[];
  medians: number[][][];
}

const strokeCache = new Map<string, MakeMeAHanziData | null>();
const inflightRequests = new Map<string, Promise<MakeMeAHanziData | null>>();

/**
 * Built-in offline fallback SVG strokes (viewBox 0 0 100 100) for core HSK 1 characters.
 */
export const FALLBACK_SIMPLE_STROKES: Record<string, string[]> = {
  你: [
    'M35,18 c-0.1,5 -1.2,14 -4.8,22 c-4.2,9.3 -11.5,21.8 -21.2,29.7',
    'M27,42 c0.6,0.6 0.9,1.8 0.9,3.1 c0,13.6 -0.3,42.4 -0.3,49.4',
    'M58,16 c0.04,0.6 0.17,1.6 -0.08,2.3 c-2.3,6.3 -6.8,14.6 -12.4,20.8',
    'M54,34 c2.8,0 20.2,-2.7 22.8,-2.7 c2.6,0 3.7,1.8 1.9,3.8 C73.4,41.4 67.5,48.2 60,54',
    'M50,44 c0.7,0.7 1.1,1.8 1.1,3.1 c0,14.2 -0.4,41.9 -0.4,46.9',
    'M52,65 c6,-0.8 22,-2.5 28.5,-3.2',
    'M69,45 c0.8,0.8 1.2,2 1.2,3.3 c0,9.7 -0.2,35.2 -0.2,42.2 c0,9 5.5,8 14.5,8 c8,0 10.5,-1.5 10.5,-7.5',
  ],
  好: [
    'M28,18 c0.4,1 0.6,2.4 0.4,3.8 C26.7,35 20.3,55.8 15.8,63.2 c-0.9,1.5 -0.2,2.1 0.4,2.2 c7.8,1.4 16.5,5.2 21.8,11.8',
    'M39.5,33 c0.1,1.1 0.2,3.2 -0.2,4.8 C35.7,52 26.2,74.5 11,85',
    'M10,48 c0.7,0.3 2.6,0.4 3.7,0.3 c8.8,-0.8 19.3,-2.3 29.8,-3.1 c1.8,-0.1 3.5,0.2 4.5,0.4',
    'M59,20 c1.2,0.5 2.8,0.7 4.2,0.5 c4.6,-0.7 17.1,-3.5 18.6,-3.7 c2.2,-0.3 3.6,1.4 1.8,3.4 C77.5,27.5 69,38 64,42',
    'M64,41 c2.2,2.8 10.5,18.8 13.8,38.2 c0.9,5.5 -0.8,9.6 -6.8,9.6 c-5.2,0 -8.5,-5.2 -9.5,-6.2',
    'M47,52 c1.5,0.8 3.8,0.9 5.5,0.6 c9.2,-1.6 27.5,-3.8 38.5,-4.4 c2.3,-0.1 4.2,0.3 5.5,0.7',
  ],
  我: [
    'M36,15 c-0.1,0.9 -0.6,1.9 -1.2,2.4 c-4.6,3.6 -12.4,7.8 -23.8,11.2',
    'M18,39 c0.7,0.4 2.8,0.6 4.1,0.5 c7.9,-0.6 15.9,-2.4 23.4,-3.6 c1.3,-0.2 2.7,0.1 3.5,0.3',
    'M32.5,27 c0.9,0.9 1.4,2.2 1.4,3.7 c0,14.3 -0.2,49.2 -0.2,55.1 c0,4.2 -1.2,6.2 -4.2,3.2 c-3,-3 -5.5,-5.5 -7.5,-7.2',
    'M16,66 c1.5,1.2 2.8,1.2 4.2,0.5 c5.8,-3 14.8,-8.2 21.8,-12.7',
    'M64,12 c1,1.2 1.5,2.8 1.6,4.5 c1.5,22.5 8,62 23.4,78 c4.5,4.6 4,-2 3.8,-7.5',
    'M84,38 c0.1,0.9 -0.2,2.3 -0.7,3.3 c-3.5,6.5 -11.5,17.2 -24.8,25.2',
    'M77,16 c3.5,1.8 8.5,5.8 10.2,8.8',
  ],
  是: [
    'M29,14 c0.8,0.8 1.3,1.8 1.3,3 c0,10.2 -0.2,23.5 -0.2,27',
    'M31,16 c4.5,-0.6 34.5,-4 38,-4.2 c2.5,-0.2 3.8,1.2 3.8,3.5 c0,6.2 -0.5,17.5 -0.5,24.5',
    'M31,30 c6.5,-0.7 33.5,-3.2 40.5,-3.5',
    'M31,43 c9.5,-0.8 31.5,-2.8 40,-3.2',
    'M18,57 c1.8,0.6 4.5,0.4 6.5,0.2 c16.5,-1.6 38.5,-3.8 55.5,-4.6 c2.5,-0.1 4.5,0.3 6,0.6',
    'M49,45 c0.8,0.8 1.2,2 1.2,3.2 c0,6.5 -0.2,21.5 -0.2,27.5',
    'M32,67 c0.1,0.8 -0.1,1.8 -0.5,2.4 c-2.8,4.2 -8.5,10.8 -18.5,16.2',
    'M30,76 c4.5,-0.5 12.5,-1.5 17.5,-2.2',
    'M52,62 c5.5,5.2 21.5,18.5 32.5,24.5 c2.5,1.4 5.2,2.8 8,3.2',
  ],
  人: [
    'M52,15 c0.2,1.8 0.4,3.5 -0.4,5.2 C46.5,33.5 33.5,63.5 12,82',
    'M49,38 c6.5,8.8 24.5,31.2 36.5,41.5 c2.8,2.4 5.8,4.8 9.5,6',
  ],
};

/**
 * Fallback starter character list when DB has not been seeded yet.
 */
export const FALLBACK_STARTER_CHARACTERS = [
  { charId: 1, character: '你', pinyin: 'nǐ', sinoVietnamese: 'nhĩ', meaning: 'bạn, anh, chị', strokesCount: 7 },
  { charId: 2, character: '好', pinyin: 'hǎo', sinoVietnamese: 'hảo', meaning: 'tốt, đẹp, khỏe', strokesCount: 6 },
  { charId: 3, character: '我', pinyin: 'wǒ', sinoVietnamese: 'ngã', meaning: 'tôi, mình', strokesCount: 7 },
  { charId: 4, character: '是', pinyin: 'shì', sinoVietnamese: 'thị', meaning: 'là, đúng', strokesCount: 9 },
  { charId: 5, character: '人', pinyin: 'rén', sinoVietnamese: 'nhân', meaning: 'người', strokesCount: 2 },
  { charId: 6, character: '中', pinyin: 'zhōng', sinoVietnamese: 'trung', meaning: 'ở giữa, Trung Quốc', strokesCount: 4 },
  { charId: 7, character: '国', pinyin: 'guó', sinoVietnamese: 'quốc', meaning: 'đất nước, quốc gia', strokesCount: 8 },
  { charId: 8, character: '学', pinyin: 'xué', sinoVietnamese: 'học', meaning: 'học tập', strokesCount: 8 },
  { charId: 9, character: '习', pinyin: 'xí', sinoVietnamese: 'tập', meaning: 'ôn luyện, tập', strokesCount: 3 },
  { charId: 10, character: '谢', pinyin: 'xiè', sinoVietnamese: 'tạ', meaning: 'cảm ơn', strokesCount: 12 },
];

/**
 * Extract individual CJK characters from a word (e.g. "对不起" -> ["对", "不", "起"]).
 */
export function extractHanziChars(input: string): string[] {
  const chars = Array.from(input || '').filter((ch) => /[\u4e00-\u9fff]/.test(ch));
  return chars.length > 0 ? chars : input ? [Array.from(input)[0]] : [];
}

/**
 * Convert median point array [[x,y], ...] into an SVG polyline path string.
 */
export function medianToSvgPath(median: number[][]): string {
  if (!Array.isArray(median) || median.length === 0) return '';
  const [first, ...rest] = median;
  if (!first || first.length < 2) return '';
  const start = `M ${first[0]} ${first[1]}`;
  if (rest.length === 0) {
    return `${start} L ${first[0] + 1} ${first[1] + 1}`;
  }
  return `${start} ${rest.map(([x, y]) => `L ${x} ${y}`).join(' ')}`;
}

/**
 * Fetch authentic MakeMeAHanzi calligraphic stroke outlines + stroke-order medians
 * for a single Chinese character from jsDelivr CDN (cached in memory).
 */
export async function fetchHanziStrokeData(singleChar: string): Promise<MakeMeAHanziData | null> {
  const char = Array.from(singleChar || '')[0];
  if (!char || !/[\u4e00-\u9fff]/.test(char)) return null;

  if (strokeCache.has(char)) {
    return strokeCache.get(char) ?? null;
  }

  const existing = inflightRequests.get(char);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`;
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) {
        strokeCache.set(char, null);
        return null;
      }
      const json = await res.json();
      if (Array.isArray(json?.strokes) && json.strokes.length > 0) {
        const data: MakeMeAHanziData = {
          strokes: json.strokes,
          medians: Array.isArray(json.medians) ? json.medians : [],
        };
        strokeCache.set(char, data);
        return data;
      }
      strokeCache.set(char, null);
      return null;
    } catch {
      return null;
    } finally {
      inflightRequests.delete(char);
    }
  })();

  inflightRequests.set(char, promise);
  return promise;
}

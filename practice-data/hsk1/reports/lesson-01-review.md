# Lesson 1 Review Report

## Status

Lesson data reflects all eight numbered workbook activities on printed pages 7-10, grouped into the six requested CMS exercise sets. Reading drills are grouped by their printed activity; answerable numbered items are represented as separate questions.

| Section | Source Page | Answer Page | Audio | Questions | Verified | Needs Review |
|---|---:|---:|---|---:|---:|---:|
| PRONUNCIATION — 发音练习 (activities 1-3) | 7 | Activity 3: 1 | 01-1.mp3, 01-2.mp3 | 7 | 7 | 0 |
| INITIALS — 听录音，填写声母 (20 items) | 8 | 1 | 01-3.mp3 | 20 | 20 | 0 |
| FINALS — 听录音，填写韵母 (20 items) | 8 | 2 | 01-4.mp3 | 20 | 20 | 0 |
| TONES — 听录音，选择声调 (20 items) | 8 | 2 | 01-5.mp3 | 20 | 20 | 0 |
| DIALOGUE — 看图选择 (4 matches) | 9 | 2 | None printed for this activity | 4 | 4 | 0 |
| HANZI — 汉字练习 (5 stroke + 6 character items) | 9-10 | No answer-key entry | None | 11 | 11 | 0 |
| **Total** | **7-10** | **1-2** | **All five listed files mapped by printed audio markers** | **82** | **82** | **0** |

The pronunciation set contains 32 single-syllable tokens and 20 two-syllable words, grouped into two reading questions, plus five image-to-word questions. There are 132 individual learning targets across the 82 CMS questions.

## Audio Mapping

The workbook prints a disc marker beside each audio activity. The source page/audio mapping is:

- Page 7, activity 1 -> `01-1.mp3`
- Page 7, activity 2 -> `01-2.mp3`
- Page 8, activity 4 (initials) -> `01-3.mp3`
- Page 8, activity 5 (finals) -> `01-4.mp3`
- Page 8, activity 6 (tones) -> `01-5.mp3`

All five named files exist in both `practice-data/raw/audio/MP3 bài tập HSK 1/` and `backend/public/media/practice/hsk1/audio/`. JSON uses the corresponding `/media/practice/hsk1/audio/<file>.mp3` paths only. The dialogue activity on page 9 has no printed audio marker, so no audio has been assigned to it.

The mappings above are verified against the printed disc markers and filenames. The MP3s were not independently listened to or transcribed; no audio transcript is asserted in this draft.

## Image Mapping

Nine image crops were extracted directly from the workbook PDF and saved under `backend/public/media/practice/hsk1/images/lesson-01/`.

Page 7 activity 3 image order:

1. `vocab-pie.png` -> answer D, 派 (pài)
2. `vocab-ballet.png` -> answer C, 芭蕾 (bālěi)
3. `vocab-coffee.png` -> answer A, 咖啡 (kāfēi)
4. `vocab-guitar.png` -> answer E, 吉他 (jítā)
5. `vocab-cola.png` -> answer B, 可乐 (kělè)

Page 9 dialogue image order is preserved in `dialogue-01.png` through `dialogue-04.png`. The key maps images 1-4 to dialogues 4, 2, 1, 3 respectively; the JSON inverts this relation for each dialogue's image-choice question.

Every image URL in the JSON resolves to one of these extracted PNG files. No images are missing.

## OCR Issues

- Both PDF sources are scanned pages without a usable text layer. No unverified OCR output was used.
- Workbook prompts and answer values were transcribed from the rendered source pages and compared visually with the answer PDF.
- The two-syllable item printed on page 7 was zoomed and checked as `lǐwù`; the remaining list was checked against the page image.

## Unsupported Structures

- Only `TEXT_INPUT`, `TONE_SELECTION`, `IMAGE_CHOICE`, and `CHARACTER_WRITING` question types are used.
- The practice-admin validator accepts `TEXT_INPUT`, but `QuestionRenderer.tsx` has no dedicated `TEXT_INPUT` rendering branch. No frontend code was changed; verify runtime presentation before publishing/importing.
- The CMS `CHARACTER_WRITING` type accepts the extracted stroke/character prompts. The source shows tracing grids, not machine-gradable stroke paths; answers are reference characters only.

## Answer-Key Corrections

- The previous lesson draft's two grouped initials answers were sourced from the Lesson 2 answer page by mistake. Their stable question codes are retained, and the complete 20 initials are now taken from Lesson 1's answer page 1.
- Final/vowel answers and tone answers are both checked against Lesson 1 answer page 2.
- Dialogue answer mapping is transcribed from answer page 2 and inverted only to fit the question's dialogue-to-image choice format.
- The pronunciation activities and Hanzi tracing have no corresponding answer-key entries; printed source content is used as the expected reading/writing reference, not as invented audio transcript or stroke-path data.

## Verification Notes

- Workbook pages 7-10 were reviewed in full; answer PDF pages 1-2 contain the relevant Lesson 1 keys.
- Question codes are unique and stable within the requested set prefixes.
- `sourceAudio` is `null` only for activities without a printed audio association.
- No importer, publication, commit, or push was performed.

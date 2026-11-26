# Lesson 2 Review Report

## Status

Draft data for `HSK1-WORKBOOK-L02`; it has not been imported or published.
The source title is `谢谢你！` (`Xièxie nǐ!`, “Bài 2: Cảm ơn anh!”).
The workbook pages reviewed are printed pages 11–14; the answer key pages
reviewed are pages 2–3.

| Section | Source Page | Answer Page | Audio | Questions | Verified | Needs Review |
|---|---:|---:|---|---:|---:|---:|
| Pronunciation / reading | 11 | No key for reading lists; page 2 for picture-word matches | 02-1.mp3, 02-2.mp3 | 7 | 5 | 2 |
| Initials — 听声母 | 11 | 2–3 | 02-3.mp3 | 20 | 20 | 0 |
| Finals — 听韵母 | 12 | 3 | 02-4.mp3 | 20 | 20 | 0 |
| Tones — 听声调 | 12 | 3 | 02-5.mp3 | 20 | 20 | 0 |
| Dialogue — 看图选对话 | 12–13 | 3 | None printed | 4 | 4 | 0 |
| Hanzi — 汉字书写 | 13–14 | No key entry | None | 11 | 11 | 0 |
| **Total** | **11–14** | **2–3** | **All five Lesson 2 tracks mapped** | **82** | **80** | **2** |

The six exercise sets contain 82 questions: 42 `TEXT_INPUT`, 20
`TONE_SELECTION`, 9 `IMAGE_CHOICE`, and 11 `CHARACTER_WRITING`. All question
and exercise-set codes are unique.

## OCR Issues

- Both source PDFs are scanned; text extraction returned no usable text layer.
- No OCR output was used. Text, pinyin, answer keys, page numbers, and image
  order were checked visually against the rendered PDF pages.
- The two pronunciation reading lists are transcribed from workbook page 11.
  Their expected reading strings are references to the printed lists, not
  audio transcripts.

## Audio Mapping

| Workbook activity | Printed page | Printed marker | File |
|---|---:|---|---|
| Read single-syllable items | 11 | 02-1 | `02-1.mp3` |
| Read two-syllable words | 11 | 02-2 | `02-2.mp3` |
| Fill initials | 11 | 02-3 | `02-3.mp3` |
| Fill finals | 12 | 02-4 | `02-4.mp3` |
| Select tones | 12 | 02-5 | `02-5.mp3` |

All five audio files exist under
`backend/public/media/practice/hsk1/audio/`; SHA-256 checks matched the source
copies under `practice-data/raw/audio/`. Audio was not independently listened
to or transcribed. No audio is printed for the picture-dialogue or Hanzi
activities.

The importer preserves question-level `sourceAudio`, but the current student
player uses the exercise-set `audioUrl` only. The pronunciation set has one
set-level URL (`02-1.mp3`); `02-2.mp3` is recorded on its question but is not
available through that player. The two oral-reading questions are therefore
marked `NEEDS_REVIEW`.

## Image Mapping

All nine existing, non-empty PNG crops were visually checked against the
workbook; no additional crops were needed.

Page 11 vocabulary pictures, in printed order:

1. `vocab-hamburger.png` → E. 汉堡 (`hànbǎo`)
2. `vocab-champagne.png` → C. 香槟 (`xiāngbīn`)
3. `vocab-microphone.png` → D. 麦克风 (`màikèfēng`)
4. `vocab-chocolate.png` → A. 巧克力 (`qiǎokèlì`)
5. `vocab-sofa.png` → B. 沙发 (`shāfā`)

Page 12–13 dialogue pictures, in printed order:

1. `dialogue-01.png` → dialogue 4 (你好！)
2. `dialogue-02.png` → dialogue 1 (谢谢你！/不客气！)
3. `dialogue-03.png` → dialogue 2 (再见！)
4. `dialogue-04.png` → dialogue 3 (对不起！/没关系！)

The answer key gives picture-to-word/dialogue matches. The JSON expresses the
same matches in the inverse direction so `IMAGE_CHOICE` can show the target
word/dialogue and image options. The resulting answer mappings were checked
against the printed key.

## Unsupported Structures

- The book asks learners to read aloud in pronunciation activities 1–2. The
  allowed question types have no speech-recording input. They remain
  `TEXT_INPUT` drafts with the printed reading list visible, but are marked
  `NEEDS_REVIEW`; do not treat them as verified machine-gradable responses.
- Student playback does not consume question-level `sourceAudio`; see the
  `02-2.mp3` limitation above.
- Hanzi prompts use the existing `CHARACTER_WRITING` type and provide the
  characters and stroke names visible in the book. No stroke paths or
  unverified handwriting answer data were created.
- The current `TEXT_INPUT` renderer reads `promptText`, not `questionText`.
  Initials and finals prompts were represented with `promptText` so the
  printed blanks appear in the renderer.
- `IMAGE_CHOICE` renders image options, not the option text. Picture-to-word
  and picture-to-dialogue matches are represented as equivalent inverse
  prompts with image choices.

## Unanswered Content

- The answer key has no answer entry for the oral reading lists. The printed
  lists are present as references; no audio transcript is claimed.
- The answer key has no Hanzi-writing answer entry. Reference characters are
  taken directly from workbook pages 13–14; stroke paths are not supplied.
- All eight workbook activities on pages 11–14 are represented. No other
  unanswered numbered activity was found in those pages.

## Verification Notes

- The answer key confirms vocabulary picture matches `1-E, 2-C, 3-D, 4-A,
  5-B`; initials, finals, tones, and dialogue matches were checked against
  answer pages 2–3.
- Dialogue answer-key mapping is picture-to-dialogue
  `1-4, 2-1, 3-2, 4-3`; JSON uses the equivalent dialogue-to-picture mapping
  `1-2, 2-3, 3-4, 4-1`.
- The draft has 6 sets, 82 questions, 80 `VERIFIED`, and 2 `NEEDS_REVIEW`.
  Only the allowed question types are used; local audio and image references
  exist and are non-empty.
- The requested whole-manifest dry-run was attempted with
  `npx tsx src/scripts/import-practice-data.ts --dry-run`. Lesson 2 passed its
  importer file/type/media checks, but the run stopped at the pre-existing
  Lesson 3 question `HSK1-L03-LISTENING-P1-Q01`: the importer rejects type
  `TRUE_FALSE` (`import-practice-data.ts`, line 95). No import statistics
  were produced. No code or Lesson 3 data was changed.
- The dry-run did not write to the database. The pre-existing
  `practice-data/hsk1/reports/import-report.json` was restored byte-for-byte.
- No real import, publish, migration, commit, or push was performed.

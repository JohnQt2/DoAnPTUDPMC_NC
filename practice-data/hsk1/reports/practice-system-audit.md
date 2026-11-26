# Báo cáo kiểm tra toàn hệ thống bài luyện tập

Thời điểm kiểm tra: 2026-11-26. Dữ liệu lấy từ `backend/prisma/dev.db`; không thay đổi API. Số câu trong bảng thuộc phiên bản hiện hành, hoặc phiên bản mới nhất nếu collection chưa có currentVersion. Đã kiểm tra cả 90 phiên bản; lỗi lịch sử được gộp vào cột lỗi của collection.

## Tóm tắt

- 75 collections, 90 versions, 60 exercise sets, 214 PracticeQuestions.
- 45 legacy Exercise + 75 global Questions; bảng PracticeMediaAssets có 0 bản ghi.
- Đưa 29 fixture mã TEST-/PHASE1- từ Published về Draft; hiện còn 2 collection nội dung thật Published (L01/L03), tổng 132 câu.
- CMS: 42 collection không có câu hỏi; 4 exercise sets rỗng; 38 versions không có exercise set. Các collection này đều là Draft.
- CMS trên toàn bộ version: 50 exercise thiếu instruction, 2 câu thiếu explanation; 0 ID sai, 0 answer-key sai, 0 lỗi option, 0 prompt text null/rỗng. Thiếu instruction/explanation chỉ còn trong fixture/nháp hoặc version cũ.
- CMS media thiếu: 0 audio, 0 image. Trong `backend/public/media/practice` có 86 tệp được phục vụ: 37 audio và 49 image.
- Legacy: 28 media refs không có tệp cục bộ (24 audio, 4 image). Có 105 trường `text: null`; các option/item dùng content reference đều trỏ đến nội dung có thật (0 reference lỗi), còn các prompt đa phương tiện dùng instruction/loại bài thay cho text.
- Global Questions: 75/75 câu có nội dung, option và answer key; 0 lỗi.

## Báo cáo theo collection

| Collection | Số câu | Lỗi phát hiện |
|---|---:|---|
| HSK1-MOCK-01 | 0 | DRAFT; HSK1-MOCK-TEST-01 (v1): missing instruction; DRAFT; HSK1-MOCK-TEST-01 (v1): no questions; DRAFT; collection has no questions |
| HSK1-WORKBOOK-L01 | 82 | Không phát hiện |
| HSK1-WORKBOOK-L02 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L03 | 50 | Không phát hiện |
| HSK1-WORKBOOK-L04 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L05 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L06 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L07 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L08 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L09 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L10 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L11 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L12 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L13 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L14 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| HSK1-WORKBOOK-L15 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| PHASE1-TEXTINPUT-1795519667637 | 4 | DRAFT; PHASE1-TEXTINPUT-1795519667637-SET01 (v1): missing instruction |
| PHASE1-TEXTINPUT-1795519704128 | 4 | DRAFT; PHASE1-TEXTINPUT-1795519704128-SET01 (v1): missing instruction |
| PHASE1-TEXTINPUT-1795521557979 | 4 | DRAFT; PHASE1-TEXTINPUT-1795521557979-SET01 (v1): missing instruction |
| PHASE1-TEXTINPUT-1795522124385 | 4 | DRAFT; PHASE1-TEXTINPUT-1795522124385-SET01 (v1): missing instruction |
| PHASE1-TEXTINPUT-1795523498479 | 4 | DRAFT; PHASE1-TEXTINPUT-1795523498479-SET01 (v1): missing instruction |
| PHASE1-TEXTINPUT-1795629552854 | 4 | DRAFT; PHASE1-TEXTINPUT-1795629552854-SET01 (v1)/PHASE1-TEXTINPUT-1795629552854-Q04: missing explanation; DRAFT; PHASE1-TEXTINPUT-1795629552854-SET01 (v1): missing instruction |
| PHASE1-TEXTINPUT-1795632271641 | 4 | DRAFT; PHASE1-TEXTINPUT-1795632271641-SET01 (v1)/PHASE1-TEXTINPUT-1795632271641-Q04: missing explanation; DRAFT; PHASE1-TEXTINPUT-1795632271641-SET01 (v1): missing instruction |
| TEST-DRAFT-1795454977159 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795454996871 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455008785 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455027528 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455051117 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455077161 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455120686 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455133532 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455155063 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455186277 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455203551 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455223362 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455523644 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795455961344 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795515207706 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795515810676 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795515894360 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795519293376 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795519491393 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795519700913 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795521549176 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795522115561 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795523440631 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-DRAFT-1795629553517 | 0 | DRAFT; TEST-DRAFT-1795629553517-SET (v1): missing instruction; DRAFT; TEST-DRAFT-1795629553517-SET (v1): no questions; DRAFT; collection has no questions |
| TEST-DRAFT-1795632271990 | 0 | DRAFT; TEST-DRAFT-1795632271990-SET (v1): missing instruction; DRAFT; TEST-DRAFT-1795632271990-SET (v1): no questions; DRAFT; collection has no questions |
| TEST-E2E-1795455027641 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-E2E-1795455051215 | 0 | DRAFT; collection has no questions; DRAFT; v1: no exercise sets |
| TEST-E2E-1795455077252 | 0 | DRAFT; SET-READING-1795455077267 (v1): missing instruction; DRAFT; SET-READING-1795455077267 (v1): no questions; DRAFT; collection has no questions |
| TEST-E2E-1795455120803 | 1 | DRAFT; SET-READING-1795455120822 (v1): missing instruction |
| TEST-E2E-1795455133616 | 1 | DRAFT; SET-READING-1795455133631 (v1): missing instruction |
| TEST-E2E-1795455155150 | 1 | DRAFT; SET-READING-1795455155163 (v1): missing instruction |
| TEST-E2E-1795455186357 | 1 | DRAFT; SET-READING-1795455186372 (v1): missing instruction |
| TEST-E2E-1795455203638 | 1 | DRAFT; SET-READING-1795455203651 (v1): missing instruction; DRAFT; SET-READING-1795455203651-V2 (v2): missing instruction |
| TEST-E2E-1795455223446 | 1 | DRAFT; SET-READING-1795455223461 (v1): missing instruction; DRAFT; SET-READING-1795455223461-V2 (v2): missing instruction |
| TEST-E2E-1795455523731 | 1 | DRAFT; SET-READING-1795455523748 (v1): missing instruction; DRAFT; SET-READING-1795455523748-V2 (v2): missing instruction |
| TEST-E2E-1795455961486 | 1 | DRAFT; SET-READING-1795455961505 (v1): missing instruction; DRAFT; SET-READING-1795455961505-V2 (v2): missing instruction |
| TEST-E2E-1795515207835 | 1 | DRAFT; SET-READING-1795515207851 (v1): missing instruction; DRAFT; SET-READING-1795515207851-V2 (v2): missing instruction |
| TEST-E2E-1795515810926 | 1 | DRAFT; SET-READING-1795515810981 (v1): missing instruction; DRAFT; SET-READING-1795515810981-V2 (v2): missing instruction |
| TEST-E2E-1795515894602 | 1 | DRAFT; SET-READING-1795515894645 (v1): missing instruction; DRAFT; SET-READING-1795515894645-V2 (v2): missing instruction |
| TEST-E2E-1795519293466 | 1 | DRAFT; SET-READING-1795519293482 (v1): missing instruction; DRAFT; SET-READING-1795519293482-V2 (v2): missing instruction |
| TEST-E2E-1795519491482 | 1 | DRAFT; SET-READING-1795519491498 (v1): missing instruction; DRAFT; SET-READING-1795519491498-V2 (v2): missing instruction |
| TEST-E2E-1795519701003 | 1 | DRAFT; SET-READING-1795519701019 (v1): missing instruction; DRAFT; SET-READING-1795519701019-V2 (v2): missing instruction |
| TEST-E2E-1795521549274 | 1 | DRAFT; SET-READING-1795521549293 (v1): missing instruction; DRAFT; SET-READING-1795521549293-V2 (v2): missing instruction |
| TEST-E2E-1795522115661 | 1 | DRAFT; SET-READING-1795522115677 (v1): missing instruction; DRAFT; SET-READING-1795522115677-V2 (v2): missing instruction |
| TEST-E2E-1795523440735 | 1 | DRAFT; SET-READING-1795523440752 (v1): missing instruction; DRAFT; SET-READING-1795523440752-V2 (v2): missing instruction |
| TEST-E2E-1795629553750 | 1 | DRAFT; SET-READING-1795629553795 (v1): missing instruction; DRAFT; SET-READING-1795629553795-V2 (v2): missing instruction |
| TEST-E2E-1795632272852 | 1 | DRAFT; SET-READING-1795632272877 (v1): missing instruction; DRAFT; SET-READING-1795632272877-V2 (v2): missing instruction |
| TEST-TEXTINPUT-1795519151167 | 4 | DRAFT; TEST-TEXTINPUT-1795519151167-SET01 (v1): missing instruction |
| TEST-TEXTINPUT-1795519234808 | 4 | DRAFT; TEST-TEXTINPUT-1795519234808-SET01 (v1): missing instruction |
| TEST-TEXTINPUT-1795519272476 | 4 | DRAFT; TEST-TEXTINPUT-1795519272476-SET01 (v1): missing instruction |
| TEST-TEXTINPUT-1795519296558 | 4 | DRAFT; TEST-TEXTINPUT-1795519296558-SET01 (v1): missing instruction |
| TEST-TEXTINPUT-1795519494799 | 4 | DRAFT; TEST-TEXTINPUT-1795519494799-SET01 (v1): missing instruction |

## Legacy media chưa có file cục bộ

- hsk1_ex01: missing audio audio/hsk1/lesson01/phonetics/phonetics_01.mp3
- hsk1_ex02: missing audio audio/hsk1/lesson01/phonetics/phonetics_02.mp3
- hsk1_ex04: missing audio audio/hsk1/lesson01/quiz/quiz_01.mp3
- hsk1_ex04: missing image assets/images/hsk1/lesson01/quiz/img_quiz_bow.png
- hsk1_ex04: missing image assets/images/hsk1/lesson01/quiz/img_quiz_wave.png
- hsk1_ex05: missing audio audio/hsk1/lesson01/quiz/quiz_02.mp3
- hsk1_ex05: missing image assets/images/hsk1/lesson01/quiz/img_quiz_apology.png
- hsk1_ex05: missing image assets/images/hsk1/lesson01/quiz/img_quiz_handshake.png
- hsk1_ex08: missing audio listen_01.mp3
- hsk1_ex09: missing audio listen_02.mp3
- hsk1_ex10: missing audio listen_03.mp3
- hsk1_ex11: missing audio listen_04.mp3
- hsk1_ex12: missing audio listen_05.mp3
- hsk1_ex18: missing audio final_listen_01.mp3
- hsk1_ex19: missing audio final_listen_02.mp3
- hsk1_ex20: missing audio final_listen_03.mp3
- hsk1_ex23: missing audio listen_b3_01.mp3
- hsk1_ex24: missing audio listen_b3_02.mp3
- hsk1_ex25: missing audio listen_b3_03.mp3
- hsk1_ex26: missing audio listen_b3_04.mp3
- hsk1_ex27: missing audio listen_b3_05.mp3
- hsk1_ex28: missing audio listen_b3_06.mp3
- hsk1_ex29: missing audio listen_b3_07.mp3
- hsk1_ex30: missing audio listen_b3_08.mp3
- hsk1_ex37: missing audio final_b3_01.mp3
- hsk1_ex38: missing audio final_b3_02.mp3
- hsk1_ex39: missing audio final_b3_03.mp3
- hsk1_ex40: missing audio final_b3_04.mp3

## Global Questions

- 75/75 câu có nội dung, option và answer key; không phát hiện media bị thiếu.

## Kết luận / giới hạn

- Hai workbook xuất bản thực tế (L01, L03) vượt qua kiểm tra câu hỏi, option, answer key và media; thiếu instruction/explanation chỉ còn ở fixture test/nháp hoặc phiên bản lịch sử.

- Các collection Draft rỗng được giữ nguyên vì chưa có nội dung học thuật để tự tạo an toàn. Không tự tạo answer, instruction hoặc media giả.

- Legacy Exercise có media tham chiếu thiếu nên không thể render đầy đủ các câu nghe/tranh liên quan; cần bổ sung tài nguyên nguồn, không thể suy đoán thay thế.

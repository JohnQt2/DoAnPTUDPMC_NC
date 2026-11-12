# Đối chiếu JSON minh họa với nhau và với migration

**Ngày rà soát:** 2026-11-12  
**Phạm vi:** 7 file JSON trong `backend/prisma/seed-data/`, migration `20261111100146_init_database/migration.sql`, `schema.prisma` và `seed.ts`.

## Kết luận

Các file JSON đều **đúng cú pháp**, nhưng hiện **chưa nhất quán đủ để nạp dữ liệu trực tiếp hoặc bảo đảm tham chiếu hợp lệ**. Chúng mô tả một mô hình nội dung bài học (từ vựng, mẫu câu, ngữ pháp, bài tập và đáp án) phong phú hơn các bảng được tạo bởi migration. Vì JSON được ghi nhận là dữ liệu minh họa, các khác biệt dưới đây là rủi ro cần giải quyết trước khi biến chúng thành dữ liệu seed chính thức, không khẳng định rằng ứng dụng hiện tại đang lỗi runtime.

Trong phạm vi đã kiểm tra, `seed.ts` không đọc các file JSON này; script hiện tạo dữ liệu riêng bằng Prisma Client. Do đó, JSON chưa được kiểm chứng qua một luồng import/seed thực tế. Migration và Prisma schema có các bảng/cột cho khóa học, bài học, ký tự, câu hỏi và media, nhưng không có các thực thể nội dung riêng như Vocabulary, SentencePattern, Grammar, Exercise, Dialogue hay đáp án bài tập.

## Mâu thuẫn và rủi ro

| Mức độ | Phát hiện | Bằng chứng / ảnh hưởng |
|---|---|---|
| **Cao** | ID được tham chiếu không khớp hoặc không có dữ liệu định nghĩa | `Courses/hsk1/unit1.json` tham chiếu `hsk1_vocab03`, `hsk1_phonetic01`, `hsk1_dialogue01/02`, `hsk1_exercise01/02/03`. Trong khi đó `contents/vocabularies.json` chỉ có `hsk1_vocab01/02`; không có JSON phonetic/dialogue; `Exercise/Exercise.json` chỉ định nghĩa `hsk1_ex01`, và `exercise-answers.json` có đáp án `hsk1_ex01`–`05`. Ngay cả ID tương ứng bài tập đầu cũng lệch định dạng `hsk1_exercise01` / `hsk1_ex01`. Không thể resolve chắc chắn các tham chiếu nếu nạp theo ID hiện tại. |
| **Cao** | ID ví dụ trong unit không tồn tại trong dữ liệu nội dung | Unit tham chiếu `item_id` như `hsk1_pattern01_ex01` và `hsk1_gram01_ex01`, nhưng các ví dụ lồng trong `sentence-patterns.json` và `grammars.json` không có trường ID. Không có khóa để phân biệt hoặc liên kết ví dụ. |
| **Cao** | Dữ liệu bài tập và đáp án bất đồng về định dạng/ý nghĩa | Bài `hsk1_ex01` khai báo `exercise_type: MULTIPLE_CHOICE`, còn đáp án cùng ID khai báo `answer_type: SINGLE_CHOICE`. Lời giải ghi “你 có nghĩa là bạn”, nhưng câu hỏi và lựa chọn đang trỏ tới `hsk1_vocab01` có từ `你好` (nghĩa “Xin chào”). Các ID `ex02`–`ex05` có đáp án nhưng không có bản định nghĩa bài tập trong `Exercise.json`. |
| **Cao** | Migration không có mô hình quan hệ tương ứng với cấu trúc JSON nội dung | Migration có `Questions.options_json` và `correct_answer`, nhưng không có bảng Exercise/ExerciseAnswers hay các bảng Vocabulary/SentencePattern/Grammar/Dialogue. Cấu trúc lựa chọn/đáp án đa dạng (`correct_option_ids`, `correct_pairs`, `correct_order`, `accepted_answers`) chỉ có thể được giữ nếu tự đóng gói vào cột JSON/text hoặc thiết kế bảng mới; migration không thể lưu/chặn sai tham chiếu theo cấu trúc hiện tại. |
| **Cao** | ID dạng chuỗi trong JSON không ánh xạ trực tiếp đến khóa chính số của migration | JSON dùng `course_id`, `chapter_id`, `lesson_id`, `lesson_block_id`, `vocabulary_id`, `exercise_id` dạng chuỗi. Các bảng tương ứng hiện có dùng khóa `SERIAL`/`INTEGER` như `course_id`, `chapter_id`, `lesson_id`; không có cột `external_id` cho các mã chuỗi. Cần quy ước ánh xạ hoặc đổi thiết kế trước khi nhập. |
| **Trung bình** | Trường từ vựng không khớp mô hình `Characters` | JSON Vocabulary dùng `word`, `word_type`, `notes`, `examples`, `word_image_path`, `word_audio_path`; bảng `Characters` dùng `character`, `sino_vietnamese`, `strokes_count`, `stroke_order_svg`, `audio_resource_id`. Không có bảng/cột để giữ nguyên các trường từ vựng và ví dụ này. `hanzi.json` gần `Characters` hơn, nhưng vẫn khác `stroke_count` (JSON) với `strokes_count` (DB), `stroke_svg_path` với `stroke_order_svg`, và không cung cấp `sino_vietnamese` dù cột DB là bắt buộc. |
| **Trung bình** | Đường dẫn media trong JSON không phải quan hệ media của DB | JSON dùng các chuỗi đường dẫn như `audio/...`, `images/...` và `stroke-order.svg`. Migration lưu tham chiếu qua `media_resource_id` tới `MediaResources`, không có cột đường dẫn tương ứng trên `Characters`; ví dụ lồng cũng không có bảng lưu media riêng. Nếu không tạo bản ghi `MediaResources` và chuyển đường dẫn sang khóa ngoại, đường dẫn có thể bị bỏ hoặc không truy xuất được. |
| **Trung bình** | Cách lưu câu hỏi/đáp án trong migration khác cấu trúc bài tập minh họa | `Exercise.json` mô tả câu hỏi, các lựa chọn có thể trỏ tới nội dung hoặc chứa text, còn `exercise-answers.json` dùng nhiều dạng đáp án. `Questions.options_json` và `correct_answer` là `TEXT`; lưu chuỗi JSON là khả thi về mặt kỹ thuật nhưng không có ràng buộc cấu trúc/khóa ngoại tương ứng và không đồng nhất trực tiếp với các file này. Cần xác định định dạng serialize/parse và validate. |
| **Thấp** | Một số nội dung vẫn là placeholder hoặc chưa có quy ước rõ | `grammars.json` lặp nội dung mẫu như “Tên điểm ngữ pháp”, “Cấu trúc ngữ pháp”; `unit1.json` chứa tham chiếu đến các loại nội dung chưa có file dữ liệu. Có thể chấp nhận khi minh họa, nhưng không nên dùng để đánh giá tính đầy đủ hoặc import seed. |

## Đề xuất trước khi dùng làm seed thật

1. Chốt một quy ước ID ngoài (hoặc dùng khóa số DB xuyên suốt) và cập nhật toàn bộ tham chiếu trong unit, nội dung, bài tập và đáp án.
2. Thêm dữ liệu định nghĩa còn thiếu hoặc bỏ/thay các tham chiếu chưa có đích; bổ sung ID ổn định cho từng ví dụ được tham chiếu bằng `item_id`.
3. Chốt schema đáp án cho từng `exercise_type`, kiểm tra loại đáp án khớp loại câu hỏi, và sửa lời giải để phản ánh đúng nội dung câu hỏi.
4. Quyết định các JSON là dữ liệu để lưu trong `LessonBlocks.content_json`/cột JSON, hay là thực thể quan hệ riêng; nếu cần truy vấn và ràng buộc tham chiếu thì thiết kế bảng/model tương ứng trong Prisma rồi tạo migration.
5. Chuẩn hóa mapping tên trường và media: ví dụ `stroke_count` ↔ `strokes_count`, `stroke_svg_path` ↔ tài nguyên media, và cách biểu diễn ví dụ/ghi chú lồng.
6. Viết bước import/seed có validate schema và kiểm tra mọi foreign/external ID trước khi ghi; hiện `seed.ts` chưa nạp các JSON này.

## Kiểm tra cú pháp

Đã parse thành công cả 7 file JSON. Việc parse thành công chỉ xác nhận cú pháp JSON, không xác nhận tính đúng của ID tham chiếu, ngữ nghĩa đáp án hay khả năng ánh xạ sang migration.

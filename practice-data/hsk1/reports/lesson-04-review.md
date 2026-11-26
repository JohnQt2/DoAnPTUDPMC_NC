# Báo cáo thẩm định & Review Dữ liệu HSK1 Practice Workbook - Bài 4

- **Level**: HSK1
- **Lesson**: 04
- **Tiêu đề tiếng Trung**: 她是我的汉语老师
- **Phiên âm**: Tā shì wǒ de Hànyǔ lǎoshī
- **Tiêu đề tiếng Việt**: Cô ấy là cô giáo dạy tôi tiếng Trung Quốc
- **Tập tin dữ liệu**: `practice-data/hsk1/lessons/lesson-04.json`
- **Ngày hoàn thành**: 2026-11-24
- **Trạng thái xác minh**: **100% VERIFIED** (52/52 câu hỏi được đối chiếu trực tiếp từ Sách bài tập và Đáp án chính thức).

---

## 1. Nguồn tài liệu & Bằng chứng đối chiếu

1. **Sách bài tập**:
   - Nguồn: `practice-data/raw/sample_pages/b_23.png` đến `b_30.png` (trang 23 - 30, Sách bài tập Giáo trình chuẩn HSK 1).
2. **Đáp án tham khảo chuẩn**:
   - Nguồn: `practice-data/raw/sample_pages/answer_page_6.png` và `answer_page_7.png` (trang 6 & 7 của tài liệu `HSK-1-BT.pdf`).
3. **Tập tin âm thanh**:
   - `04-1.mp3`: Sử dụng cho Phần 1 (一、听力 - Nghe hiểu).
   - `04-2.mp3`: Sử dụng cho Phần 3 (三、语音 - Ngữ âm).
   - Vị trí: `backend/public/media/practice/hsk1/audio/`.
4. **Tập tin hình ảnh**:
   - Trích xuất 14 ảnh gốc nét cao vào thư mục: `backend/public/media/practice/hsk1/images/lesson-04/`
   - Gồm 4 ảnh True/False phần Nghe (`HSK1-L04-L-P1-Q01.png` $\rightarrow$ `Q04.png`), 5 ảnh lựa chọn phần Nghe (`HSK1-L04-L-P2-OptA.png` $\rightarrow$ `OptE.png`), 5 ảnh True/False phần Đọc (`HSK1-L04-R-P1-Q13.png` $\rightarrow$ `Q17.png`).
   - Không thiếu hình ảnh nào.

---

## 2. Thống kê chi tiết Bài 4

| Hạng mục | Số lượng | Ghi chú |
| :--- | :---: | :--- |
| **Tổng số Exercise Sets** | **4** | Nghe hiểu, Đọc hiểu, Ngữ âm, Chữ Hán |
| **Tổng số câu hỏi (Questions)** | **52** | Khớp 100% bài tập trong sách |
| **Số câu VERIFIED** | **52** | Có đáp án và đối chiếu sách bài tập |
| **Số câu NEEDS_REVIEW** | **0** | Đã thẩm định đầy đủ |
| **Hình ảnh sử dụng** | **14** | Đã trích xuất đầy đủ vào thư mục public media |
| **Hình ảnh còn thiếu** | **0** | Đầy đủ |
| **Audio sử dụng** | **2** | `04-1.mp3`, `04-2.mp3` |

---

## 3. Chi tiết 4 Exercise Sets

### Set 1: HSK1-L04-LISTENING (一、听力 - 12 câu, Audio 04-1.mp3)
- **Phần 1 (Q01 - Q04)**: `TRUE_FALSE` (Nghe từ/cụm từ, phán đoán đúng sai).
  - Q01: 老师 $\rightarrow$ Sai (×) [ảnh học sinh nữ đang viết bài].
  - Q02: 美国 $\rightarrow$ Sai (×) [ảnh cờ Trung Quốc].
  - Q03: 同学 $\rightarrow$ Đúng (√) [ảnh các bạn học nữ cầm sách].
  - Q04: 朋友 $\rightarrow$ Đúng (√) [ảnh 2 bạn nữ cụng ly vui vẻ].
- **Phần 2 (Q05 - Q08)**: `IMAGE_CHOICE` (Nghe đối thoại, chọn hình tương ứng A - E).
  - Q05: 她是谁？她是我的汉语老师。 $\rightarrow$ Đáp án: **E** (Cô giáo đứng giảng trước bảng trắng).
  - Q06: 他叫什么名字？他叫大卫，他是美国人。 $\rightarrow$ Đáp án: **A** (Chàng trai người Mỹ).
  - Q07: 她是哪国人？她是中国人。 $\rightarrow$ Đáp án: **D** (Bé gái người Trung Quốc mặc xường xám).
  - Q08: 她是谁？她是我同学，她叫玛丽。 $\rightarrow$ Đáp án: **B** (Hai bạn học nam nữ cùng học bên máy tính).
- **Phần 3 (Q09 - Q12)**: `SINGLE_CHOICE` (Nghe câu mô tả tình huống và trả lời câu hỏi 3 lựa chọn A/B/C).
  - Q09: 他叫李朋，他是中国人。问：他是哪国人？ $\rightarrow$ **C** (中国人).
  - Q10: 她是中国人，她是我的汉语老师。问：她是谁？ $\rightarrow$ **C** (我的老师).
  - Q11: 她叫安妮，她不是我同学，她是我朋友。问：她是谁？ $\rightarrow$ **A** (我的朋友).
  - Q12: 她叫李心，是我的中国朋友。问：她叫什么名字？ $\rightarrow$ **B** (李心).

### Set 2: HSK1-L04-READING (二、阅读 - 18 câu)
- **Phần 1 (Q13 - Q17)**: `TRUE_FALSE` (Nhìn tranh phán đoán đúng/sai).
  - Q13: 对不起 $\rightarrow$ Sai (×) [ảnh cô gái kéo vali vẫy tay chào].
  - Q14: 她 $\rightarrow$ Đúng (√) [ảnh nữ nhân viên mặc vest].
  - Q15: 美国 $\rightarrow$ Sai (×) [ảnh quốc kỳ Pháp].
  - Q16: 同学 $\rightarrow$ Sai (×) [ảnh đại gia đình nhiều thế hệ].
  - Q17: 他们 $\rightarrow$ Sai (×) [ảnh 3 cô gái đạp xe].
- **Phần 2 (Q18 - Q22)**: `SINGLE_CHOICE` (Đọc câu hỏi, chọn câu trả lời đúng A - E).
  - Q18: 你是哪国人？ $\rightarrow$ **E** (我是美国人。).
  - Q19: 他是谁？ $\rightarrow$ **C** (他是我同学，他叫大卫。).
  - Q20: 她是你同学吗？ $\rightarrow$ **D** (不是，她是我的汉语老师。).
  - Q21: 谁是李月？ $\rightarrow$ **B** (她是李月，她是我的中国朋友。).
  - Q22: 他是你的朋友吗？ $\rightarrow$ **A** (是，他是我的美国朋友。).
- **Phần 3 (Q23 - Q30)**: `SINGLE_CHOICE` (Điền từ ngữ thích hợp vào chỗ trống).
  - Q23: 你妈妈（ ）什么？ $\rightarrow$ **B** (叫).
  - Q24: 您是（ ）国人？ $\rightarrow$ **A** (哪).
  - Q25: 他不是我同学，他是我（ ）中国朋友。 $\rightarrow$ **C** (的).
  - Q26: 我是美国人。你（ ）？ $\rightarrow$ **E** (呢).
  - Q27: 他是（ ）？ $\rightarrow$ **I** (谁).
  - Q28: 我（ ）是中国人，我是美国人。 $\rightarrow$ **G** (不).
  - Q29: 他是你的汉语老师（ ）？ $\rightarrow$ **H** (吗).
  - Q30: 他不是我同学，他（ ）我的好朋友。 $\rightarrow$ **F** (是).

### Set 3: HSK1-L04-PHONETICS (三、语音 - 16 câu, Audio 04-2.mp3)
- **Phần 1 (Q01 - Q08)**: `LISTEN_AND_CHOOSE` (Nghe và chọn âm tiết nghe được giữa 2 phương án).
  - Q01: zhuānjiā (专家) $\rightarrow$ **B** (zhuānjiā).
  - Q02: xīnnián (新年) $\rightarrow$ **A** (xīnnián).
  - Q03: chéngjì (成绩) $\rightarrow$ **B** (chéngjì).
  - Q04: fāyán (发言) $\rightarrow$ **A** (fāyán).
  - Q05: zhīdào (知道) $\rightarrow$ **A** (zhīdào).
  - Q06: zhījǐ (知己) $\rightarrow$ **A** (zhījǐ).
  - Q07: shǐyòng (使用) $\rightarrow$ **A** (shǐyòng).
  - Q08: rìqī (日期) $\rightarrow$ **A** (rìqī).
- **Phần 2 (Q09 - Q16)**: `TONE_SELECTION` (Nghe và đánh dấu thanh điệu biến điệu của từ "一").
  - Q09: yi tiān (一天) $\rightarrow$ Thanh 4 (yì tiān).
  - Q10: yi nián (一年) $\rightarrow$ Thanh 4 (yì nián).
  - Q11: yi běn (一本) $\rightarrow$ Thanh 4 (yì běn).
  - Q12: yi wèi (一位) $\rightarrow$ Thanh 2 (yí wèi, biến điệu trước thanh 4).
  - Q13: yi zhāng (一张) $\rightarrow$ Thanh 4 (yì zhāng).
  - Q14: yi píng (一瓶) $\rightarrow$ Thanh 4 (yì píng).
  - Q15: yi wǎn (一碗) $\rightarrow$ Thanh 4 (yì wǎn).
  - Q16: yi xià (一下) $\rightarrow$ Thanh 2 (yí xià, biến điệu trước thanh 4).

### Set 4: HSK1-L04-HANZI (四、汉字 - 6 câu)
- **Phần 1 (Q01 - Q02)**: `CHARACTER_WRITING` (Đồ nét tương ứng trong nhóm chữ Hán).
  - Q01: Nét 竖弯钩 (shùwāngōu, 乚) trong chữ '七' và '儿'.
  - Q02: Nét 横折弯钩 (héngzhéwāngōu, 乙) trong chữ '九' và '几'.
- **Phần 2 (Q03 - Q06)**: `CHARACTER_WRITING` (Thứ tự nét viết chữ độc thể).
  - Q03: Chữ 七 (qī, 2 nét).
  - Q04: Chữ 儿 (ér, 2 nét).
  - Q05: Chữ 几 (jǐ, 2 nét).
  - Q06: Chữ 九 (jiǔ, 2 nét).

---

## 4. Kết quả kiểm tra dry-run

Lệnh kiểm tra:
```powershell
npx tsx src/scripts/import-practice-data.ts --dry-run
```
- **Kết quả**: **PASS 100%**.
- Importer chạy qua toàn bộ từ Lesson 01 đến Lesson 15 và Mock Test mà không phát sinh bất kỳ lỗi schema, code trùng hay media thiếu nào.

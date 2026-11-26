import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert } from 'lucide-react';
import { PracticeCategory, PracticeLevelOption } from '../../pages/admin/practice/practice-admin.types';
import { practiceAdminApi } from '../../pages/admin/practice/practice-admin.api';
import { ShimmerButton } from '../ui';
import { extractErrorMessage } from '../../pages/admin/practice/practice-admin.utils';

export interface CollectionFormData {
  levelCode?: string;
  code: string;
  category: PracticeCategory;
  titleZh: string;
  titlePinyin?: string | null;
  titleVi: string;
  description?: string | null;
  orderIndex?: number;
}

interface CollectionFormProps {
  initialValues?: Partial<CollectionFormData>;
  isEdit?: boolean;
  isSubmitting: boolean;
  onSubmit: (values: any) => Promise<void>;
  onCancel?: () => void;
}

const CODE_REGEX = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/;

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';
const labelClass = 'mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300';

export const CollectionForm: React.FC<CollectionFormProps> = ({
  initialValues,
  isEdit = false,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  const [levels, setLevels] = useState<PracticeLevelOption[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(!isEdit);
  const [levelsError, setLevelsError] = useState('');
  const [levelCode, setLevelCode] = useState(initialValues?.levelCode || 'HSK1');
  const [code, setCode] = useState(initialValues?.code || '');
  const [category, setCategory] = useState<PracticeCategory>(initialValues?.category || 'WORKBOOK_LESSON');
  const [titleZh, setTitleZh] = useState(initialValues?.titleZh || '');
  const [titlePinyin, setTitlePinyin] = useState(initialValues?.titlePinyin || '');
  const [titleVi, setTitleVi] = useState(initialValues?.titleVi || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [orderIndex, setOrderIndex] = useState(initialValues?.orderIndex ?? 1);
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isEdit) return;
    let active = true;
    practiceAdminApi.listLevels()
      .then((data) => {
        if (!active) return;
        setLevels(data);
        if (!data.some((level) => level.code === levelCode) && data[0]) {
          setLevelCode(data[0].code);
        }
      })
      .catch((error) => {
        if (active) setLevelsError(extractErrorMessage(error).message);
      })
      .finally(() => {
        if (active) setLevelsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isEdit]);

  const selectedLevel = useMemo(() => levels.find((level) => level.code === levelCode), [levelCode, levels]);
  const codeValid = CODE_REGEX.test(code.trim().toUpperCase());

  const submit = async () => {
    setFormError('');
    if (!isEdit && !selectedLevel) {
      setFormError('Không tìm thấy cấp độ HSK hợp lệ. Hãy tải lại danh sách cấp độ.');
      return;
    }
    if (!codeValid) {
      setFormError('Mã nội dung chỉ gồm chữ in hoa, số và dấu gạch ngang.');
      setStep(1);
      return;
    }
    if (!titleVi.trim() || !titleZh.trim()) {
      setFormError('Hãy nhập đủ tiêu đề tiếng Việt và tiếng Trung.');
      setStep(1);
      return;
    }
    await onSubmit({
      levelId: selectedLevel?.id,
      code: code.trim().toUpperCase(),
      category,
      titleZh: titleZh.trim(),
      titlePinyin: titlePinyin.trim() || null,
      titleVi: titleVi.trim(),
      description: description.trim() || null,
      orderIndex: Number(orderIndex) || 1,
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isEdit) {
      await submit();
      return;
    }
    setFormError('');
    if (step === 1) {
      if (levelsLoading || !selectedLevel) {
        setFormError('Đang tải hoặc chưa có cấp độ HSK khả dụng.');
        return;
      }
      if (!codeValid || !titleVi.trim() || !titleZh.trim()) {
        setFormError('Kiểm tra mã nội dung và nhập đủ hai tiêu đề trước khi tiếp tục.');
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!Number.isInteger(Number(orderIndex)) || Number(orderIndex) < 0) {
        setFormError('Thứ tự hiển thị phải là số nguyên không âm.');
        return;
      }
      setStep(3);
      return;
    }
    await submit();
  };

  const renderFields = (disabledLevel: boolean) => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div>
        <label htmlFor="collection-level" className={labelClass}>Cấp độ HSK</label>
        {isEdit ? (
          <select id="collection-level" disabled value={levelCode} className={inputClass}>
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={`HSK${n}`}>HSK {n}</option>)}
          </select>
        ) : (
          <select id="collection-level" required disabled={disabledLevel} value={levelCode} onChange={(event) => setLevelCode(event.target.value)} className={inputClass}>
            {levels.map((level) => <option key={level.id} value={level.code}>{level.code} · {level.name}</option>)}
          </select>
        )}
      </div>
      <div>
        <label htmlFor="collection-category" className={labelClass}>Loại nội dung</label>
        <select id="collection-category" disabled={isEdit} value={category} onChange={(event) => setCategory(event.target.value as PracticeCategory)} className={inputClass}>
          <option value="WORKBOOK_LESSON">Sách bài tập</option>
          <option value="SKILL_PRACTICE">Luyện kỹ năng</option>
          <option value="MIXED_PRACTICE">Tổng hợp</option>
          <option value="MOCK_EXAM">Đề thi mô phỏng</option>
          <option value="REAL_EXAM_SIMULATION">Thi thử thực tế</option>
        </select>
      </div>
      <div>
        <label htmlFor="collection-code" className={labelClass}>Mã nội dung <span className="text-rose-500">*</span></label>
        <input id="collection-code" required disabled={isEdit} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="Ví dụ: HSK1-WORKBOOK-L04" className={`${inputClass} font-mono`} />
        <p className={`mt-1 text-[11px] ${code && !codeValid ? 'text-rose-600' : 'text-slate-400'}`}>Chỉ gồm chữ in hoa, số và dấu gạch ngang; không thể đổi sau khi tạo.</p>
      </div>
      <div>
        <label htmlFor="collection-title-vi" className={labelClass}>Tiêu đề tiếng Việt <span className="text-rose-500">*</span></label>
        <input id="collection-title-vi" required value={titleVi} onChange={(event) => setTitleVi(event.target.value)} placeholder="Ví dụ: Bài 4 — Cô ấy là giáo viên" className={inputClass} />
      </div>
      <div>
        <label htmlFor="collection-title-zh" className={labelClass}>Tiêu đề tiếng Trung <span className="text-rose-500">*</span></label>
        <input id="collection-title-zh" required value={titleZh} onChange={(event) => setTitleZh(event.target.value)} placeholder="Ví dụ: 第4课 她是我的汉语老师" className={`${inputClass} font-chinese`} />
      </div>
      <div>
        <label htmlFor="collection-pinyin" className={labelClass}>Pinyin</label>
        <input id="collection-pinyin" value={titlePinyin} onChange={(event) => setTitlePinyin(event.target.value)} placeholder="Dì sì kè…" className={inputClass} />
      </div>
      <div className="md:col-span-2">
        <label htmlFor="collection-description" className={labelClass}>Mô tả</label>
        <textarea id="collection-description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mục tiêu hoặc phạm vi kiến thức của nội dung…" className={inputClass} />
      </div>
    </div>
  );

  if (!isEdit) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <ol aria-label="Các bước tạo nội dung" className="grid grid-cols-3 gap-2">
          {['Thông tin cơ bản', 'Cấu hình', 'Xác nhận'].map((label, index) => {
            const number = index + 1;
            return <li key={label} aria-current={step === number ? 'step' : undefined} className={`rounded-xl border p-3 text-center text-xs font-bold ${step === number ? 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300' : step > number ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}><span className="block text-[10px] uppercase tracking-wider">Bước {number}</span><span className="mt-1 block">{label}</span></li>;
          })}
        </ol>
        {step === 1 && <>
          <div className="space-y-1"><h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Thông tin cơ bản</h2><p className="text-sm text-slate-500 dark:text-slate-400">Đặt cấp độ, loại và tên để tạo hồ sơ nội dung.</p></div>
          {levelsError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{levelsError}</p>}
          {renderFields(levelsLoading || Boolean(levelsError))}
        </>}
        {step === 2 && <>
          <div className="space-y-1"><h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Cấu hình nội dung</h2><p className="text-sm text-slate-500 dark:text-slate-400">Thứ tự áp dụng cho danh sách collection.</p></div>
          <div className="max-w-sm"><label htmlFor="collection-order" className={labelClass}>Thứ tự hiển thị</label><input id="collection-order" type="number" min="0" step="1" value={orderIndex} onChange={(event) => setOrderIndex(Number(event.target.value))} className={inputClass} /></div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
            Thời lượng và điểm được cấu hình theo từng phần/câu hỏi trong trình biên soạn. Ảnh đại diện và phân công lúc tạo không thuộc contract tạo collection hiện tại; Admin có thể phân công sau khi tạo.
          </div>
        </>}
        {step === 3 && <>
          <div className="space-y-1"><h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">Xác nhận bản nháp</h2><p className="text-sm text-slate-500 dark:text-slate-400">Kiểm tra thông tin trước khi khởi tạo. Nội dung sẽ chưa được xuất bản.</p></div>
          <dl className="grid gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm dark:border-slate-700 dark:bg-slate-950/40 sm:grid-cols-2">
            <div><dt className="text-xs text-slate-500">Cấp độ · loại</dt><dd className="mt-1 font-bold text-slate-800 dark:text-slate-100">{levelCode} · {category.replace(/_/g, ' ')}</dd></div>
            <div><dt className="text-xs text-slate-500">Mã nội dung</dt><dd className="mt-1 font-mono font-bold text-slate-800 dark:text-slate-100">{code.trim().toUpperCase()}</dd></div>
            <div><dt className="text-xs text-slate-500">Tiêu đề</dt><dd className="mt-1 font-bold text-slate-800 dark:text-slate-100">{titleVi}</dd></div>
            <div><dt className="text-xs text-slate-500">Tiếng Trung · Pinyin</dt><dd className="mt-1 text-slate-800 dark:text-slate-100">{titleZh}{titlePinyin ? ` · ${titlePinyin}` : ''}</dd></div>
            <div><dt className="text-xs text-slate-500">Thứ tự</dt><dd className="mt-1 font-bold text-slate-800 dark:text-slate-100">{orderIndex}</dd></div>
            <div className="sm:col-span-2"><dt className="text-xs text-slate-500">Mô tả</dt><dd className="mt-1 text-slate-800 dark:text-slate-100">{description || 'Chưa có mô tả'}</dd></div>
          </dl>
          <p className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" />Mã hợp lệ, đủ trường bắt buộc. Tạo sẽ khởi tạo collection và Version 1 ở trạng thái nháp.</p>
        </>}
        {formError && <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/30 dark:text-rose-300"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />{formError}</p>}
        <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:flex-row">
          <div className="flex gap-2">
            {onCancel && <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:text-slate-300 dark:hover:bg-slate-800">Hủy</button>}
            {step > 1 && <button type="button" onClick={() => { setFormError(''); setStep((current) => current - 1); }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><ArrowLeft className="h-4 w-4" />Quay lại</button>}
          </div>
          <ShimmerButton disabled={isSubmitting || levelsLoading || Boolean(levelsError)} type="submit" className="inline-flex items-center justify-center gap-2">
            {isSubmitting ? 'Đang tạo bản nháp…' : step === 3 ? 'Tạo bản nháp' : 'Tiếp tục'}{step < 3 && <ArrowRight className="h-4 w-4" />}
          </ShimmerButton>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {renderFields(false)}
      <div className="max-w-sm"><label htmlFor="collection-order" className={labelClass}>Thứ tự hiển thị</label><input id="collection-order" type="number" min="0" value={orderIndex} onChange={(event) => setOrderIndex(Number(event.target.value))} className={inputClass} /></div>
      {formError && <p role="alert" className="text-sm text-rose-600">{formError}</p>}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
        {onCancel && <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Hủy bỏ</button>}
        <ShimmerButton disabled={isSubmitting} type="submit">{isSubmitting ? 'Đang lưu…' : 'Cập nhật nội dung'}</ShimmerButton>
      </div>
    </form>
  );
};

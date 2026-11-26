import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  FilterX,
  FolderKanban,
  Layers,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { practiceAdminApi } from './practice-admin.api';
import {
  PracticeAdminCollectionSummary,
  PracticeAssignableUser,
  PracticeCollectionSummaryCounts,
  PracticeCollectionStatus,
} from './practice-admin.types';
import { PracticeStatusBadge } from '../../../components/practice-admin/PracticeStatusBadge';
import { PracticeCategoryBadge } from '../../../components/practice-admin/PracticeCategoryBadge';
import { GlassCard, ShimmerButton } from '../../../components/ui';
import { extractErrorMessage, formatDateTime } from './practice-admin.utils';
import { appConfirm, appNotice } from '../../../lib/dialog';

type ViewMode = 'table' | 'cards' | 'board';
type StatusFilter = 'ALL' | PracticeCollectionStatus;

const PAGE_SIZE = 100;
const VIEW_MODE_KEY = 'practice-admin-view';
const HIDE_TEST_KEY = 'practice-admin-hide-test-data';
const TEST_CODE = /^(?:TEST-|TEST-E2E-|TEST-DRAFT-|PHASE1-)/i;
const IS_DEVELOPMENT = (import.meta as ImportMeta & { readonly env: { readonly DEV: boolean } }).env.DEV;

const EMPTY_SUMMARY: PracticeCollectionSummaryCounts = {
  draft: 0,
  inReview: 0,
  revisionRequired: 0,
  published: 0,
  archived: 0,
};

const STATUS_CARDS: Array<{
  key: StatusFilter;
  title: string;
  description: string;
  count: (summary: PracticeCollectionSummaryCounts, total: number) => number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  { key: 'ALL', title: 'Tất cả', description: 'Mọi nội dung', count: (_s, total) => total, icon: Layers, color: 'text-slate-600 dark:text-slate-300' },
  { key: 'DRAFT', title: 'Bản nháp', description: 'Đang biên soạn', count: (s) => s.draft, icon: BookOpen, color: 'text-slate-600 dark:text-slate-300' },
  { key: 'IN_REVIEW', title: 'Chờ duyệt', description: 'Đang chờ Admin', count: (s) => s.inReview, icon: Clock3, color: 'text-amber-600 dark:text-amber-400' },
  { key: 'REVISION_REQUIRED', title: 'Yêu cầu sửa', description: 'Cần cập nhật', count: (s) => s.revisionRequired, icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400' },
  { key: 'PUBLISHED', title: 'Đã xuất bản', description: 'Đang hiển thị', count: (s) => s.published, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'ARCHIVED', title: 'Lưu trữ', description: 'Đã lưu trữ', count: (s) => s.archived, icon: Archive, color: 'text-zinc-500 dark:text-zinc-400' },
];

const BOARD_STATUSES: PracticeCollectionStatus[] = [
  'DRAFT',
  'IN_REVIEW',
  'REVISION_REQUIRED',
  'PUBLISHED',
];

function isTestCollection(collection: PracticeAdminCollectionSummary) {
  return TEST_CODE.test(collection.code);
}

function relativeDate(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return '—';
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return 'Vừa cập nhật';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days} ngày trước` : formatDateTime(value);
}

function statusTitle(status: PracticeCollectionStatus) {
  const labels: Record<PracticeCollectionStatus, string> = {
    DRAFT: 'Bản nháp',
    IN_REVIEW: 'Chờ duyệt',
    REVISION_REQUIRED: 'Yêu cầu sửa',
    PUBLISHED: 'Đã xuất bản',
    ARCHIVED: 'Đã lưu trữ',
  };
  return labels[status];
}

function canEditCollection(collection: PracticeAdminCollectionSummary, userId: number) {
  return collection.createdById === userId || collection.assignedEditorId === userId;
}

function primaryAction(collection: PracticeAdminCollectionSummary, isAdmin: boolean, userId: number) {
  const detail = `#/admin/practice/${collection.id}`;
  const versionId = collection.currentVersionId;
  const editable = isAdmin || canEditCollection(collection, userId);

  if (collection.status === 'IN_REVIEW') {
    return isAdmin && versionId
      ? { href: `#/admin/practice/versions/${versionId}/review`, label: 'Duyệt ngay' }
      : { href: detail, label: 'Xem trạng thái' };
  }
  if (collection.status === 'DRAFT' || collection.status === 'REVISION_REQUIRED') {
    return editable && versionId
      ? { href: `#/admin/practice/versions/${versionId}/edit`, label: collection.status === 'DRAFT' ? 'Tiếp tục biên soạn' : 'Sửa theo phản hồi' }
      : { href: detail, label: 'Xem nội dung' };
  }
  if (collection.status === 'PUBLISHED') {
    return { href: detail, label: editable ? 'Tạo bản chỉnh sửa' : 'Xem nội dung' };
  }
  return { href: detail, label: 'Xem lịch sử' };
}

interface AssignmentDialogProps {
  collection: PracticeAdminCollectionSummary;
  onClose: () => void;
  onAssigned: () => void;
}

const AssignmentDialog: React.FC<AssignmentDialogProps> = ({ collection, onClose, onAssigned }) => {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<PracticeAssignableUser[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const [editors, admins] = await Promise.all([
          practiceAdminApi.listAssignableUsers({
            role: 'CONTENT_EDITOR',
            status: 'ACTIVE',
            search: search.trim() || undefined,
            page: 1,
            limit: 50,
          }),
          practiceAdminApi.listAssignableUsers({
            role: 'ADMIN',
            status: 'ACTIVE',
            search: search.trim() || undefined,
            page: 1,
            limit: 50,
          }),
        ]);
        if (active) setUsers([...editors.users, ...admins.users]);
      } catch (requestError) {
        if (active) setError(extractErrorMessage(requestError).message);
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search]);

  const handleAssign = async () => {
    if (!selectedId) return;
    const selected = users.find((user) => user.user_id === selectedId);
    const confirmed = await appConfirm({
      title: 'Xác nhận phân công',
      message: `Phân công "${collection.titleVi}" cho ${selected?.display_name || selected?.email}? Người phụ trách hiện tại: ${collection.assignedEditorName || 'chưa có'}.`,
      confirmLabel: 'Phân công',
    });
    if (!confirmed) return;
    setSaving(true);
    try {
      await practiceAdminApi.assignEditor(collection.id, selectedId);
      appNotice('Đã phân công biên tập viên.', 'success');
      onAssigned();
    } catch (requestError) {
      appNotice(extractErrorMessage(requestError).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-editor-title"
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="assign-editor-title" className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              Phân công biên tập viên
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{collection.titleVi} · {collection.code}</p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Hiện tại: <span className="font-semibold">{collection.assignedEditorName || 'Chưa phân công'}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hộp thoại" title="Đóng" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <label htmlFor="assign-editor-search" className="sr-only">Tìm biên tập viên hoặc Admin</label>
        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input id="assign-editor-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc email" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
        </div>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto" aria-live="polite">
          {loading && <p className="py-6 text-center text-sm text-slate-500">Đang tìm người dùng…</p>}
          {!loading && error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
          {!loading && !error && users.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Không tìm thấy người dùng đang hoạt động.</p>}
          {!loading && !error && users.map((user) => (
            <button key={user.user_id} type="button" aria-pressed={selectedId === user.user_id} onClick={() => setSelectedId(user.user_id)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 ${selectedId === user.user_id ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30' : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'}`}>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-slate-800 dark:text-slate-100">{user.display_name || user.email}</span>
                <span className="block truncate text-xs text-slate-500">{user.email}</span>
              </span>
              <span className="ml-3 shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{user.role === 'ADMIN' ? 'Admin' : 'Editor'}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:text-slate-300 dark:hover:bg-slate-800">Hủy</button>
          <button type="button" disabled={!selectedId || saving || loading} onClick={handleAssign} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500">
            {saving ? 'Đang phân công…' : 'Xác nhận phân công'}
          </button>
        </div>
      </section>
    </div>
  );
};

export const PracticeAdminListPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [items, setItems] = useState<PracticeAdminCollectionSummary[]>([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; status?: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [level, setLevel] = useState('');
  const [category, setCategory] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [view, setView] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      return saved === 'cards' || saved === 'board' ? saved : 'table';
    } catch {
      return 'table';
    }
  });
  const [hideTestData, setHideTestData] = useState(() => {
    try {
      return IS_DEVELOPMENT && localStorage.getItem(HIDE_TEST_KEY) !== '0';
    } catch {
      return IS_DEVELOPMENT;
    }
  });
  const [refreshToken, setRefreshToken] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [assigning, setAssigning] = useState<PracticeAdminCollectionSummary | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const updateViewport = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateViewport);
    return () => mediaQuery.removeEventListener('change', updateViewport);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const baseFilters = useMemo(() => ({
    levelCode: level || undefined,
    category: category || undefined,
    search: debouncedSearch || undefined,
  }), [category, debouncedSearch, level]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    const listParams = {
      ...baseFilters,
      page: pagination.page,
      limit: PAGE_SIZE,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
    };
    const listPromise = practiceAdminApi.listCollections(listParams, { signal: controller.signal });
    const summaryPromise = statusFilter === 'ALL'
      ? listPromise
      : practiceAdminApi.listCollections({ ...baseFilters, page: 1, limit: 1 }, { signal: controller.signal });
    Promise.all([listPromise, summaryPromise])
      .then(([listResponse, summaryResponse]) => {
        if (cancelled) return;
        setItems(listResponse.items);
        setPagination(listResponse.pagination);
        setSummary(summaryResponse.summary);
        setSelectedIds([]);
      })
      .catch((requestError) => {
        if (cancelled || (requestError as Error)?.name === 'AbortError') return;
        setError({
          message: extractErrorMessage(requestError).message,
          status: (requestError as { status?: number })?.status,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [baseFilters, pagination.page, refreshToken, statusFilter]);

  const visibleItems = useMemo(
    () => isAdmin && hideTestData ? items.filter((item) => !isTestCollection(item)) : items,
    [hideTestData, isAdmin, items]
  );
  const selectedItems = visibleItems.filter((item) => selectedIds.includes(item.id));
  const totalCount = summary.draft + summary.inReview + summary.revisionRequired + summary.published + summary.archived;
  const hasFilters = Boolean(search || level || category || statusFilter !== 'ALL');
  const filterVisible = visibleItems.length;
  const statusCards = useMemo(() => {
    const priority = isAdmin
      ? ['IN_REVIEW', 'DRAFT', 'PUBLISHED', 'REVISION_REQUIRED', 'ALL', 'ARCHIVED']
      : ['DRAFT', 'REVISION_REQUIRED', 'IN_REVIEW', 'ALL', 'PUBLISHED', 'ARCHIVED'];
    return [...STATUS_CARDS].sort((a, b) => priority.indexOf(a.key) - priority.indexOf(b.key));
  }, [isAdmin]);
  const displayedView: ViewMode = isMobile && view === 'table' ? 'cards' : view;

  const refresh = () => setRefreshToken((value) => value + 1);
  const clearFilters = () => {
    setSearch('');
    setLevel('');
    setCategory('');
    setStatusFilter('ALL');
    setMobileFiltersOpen(false);
    setPagination((current) => ({ ...current, page: 1 }));
  };
  const activeFilterCount = Number(Boolean(level)) + Number(Boolean(category)) + Number(statusFilter !== 'ALL');

  const setViewMode = (mode: ViewMode) => {
    setView(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      appNotice('Không thể lưu chế độ xem trên thiết bị này.', 'warning');
    }
  };

  const setHideTests = (checked: boolean) => {
    setHideTestData(checked);
    setSelectedIds([]);
    try {
      localStorage.setItem(HIDE_TEST_KEY, checked ? '1' : '0');
    } catch {
      appNotice('Không thể lưu tùy chọn ẩn dữ liệu kiểm thử.', 'warning');
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((ids) => ids.includes(id) ? ids.filter((itemId) => itemId !== id) : [...ids, id]);
  };

  const archiveSelected = async () => {
    const archivable = selectedItems.filter((item) => item.status !== 'ARCHIVED');
    if (!archivable.length) return;
    const confirmed = await appConfirm({
      title: `Lưu trữ ${archivable.length} nội dung`,
      message: `Đã chọn ${archivable.length} nội dung:\n${archivable.map((item) => item.code).join(', ')}\n\nCác nội dung sẽ bị ẩn khỏi học viên. Thao tác được gửi lần lượt; nếu có lỗi, kết quả từng phần sẽ được báo rõ.`,
      confirmLabel: 'Lưu trữ đã chọn',
      danger: true,
    });
    if (!confirmed) return;
    const failures: string[] = [];
    for (const item of archivable) {
      try {
        await practiceAdminApi.archiveCollection(item.id);
      } catch (requestError) {
        failures.push(`${item.code}: ${extractErrorMessage(requestError).message}`);
      }
    }
    if (failures.length) {
      appNotice(`Đã xử lý ${archivable.length - failures.length}/${archivable.length}. Lỗi: ${failures.join('; ')}`, 'warning');
    } else {
      appNotice(`Đã lưu trữ ${archivable.length} nội dung.`, 'success');
    }
    refresh();
  };

  const duplicateCollection = async (item: PracticeAdminCollectionSummary) => {
    const newCode = `${item.code}-COPY-${Date.now().toString().slice(-4)}`;
    const confirmed = await appConfirm({
      title: 'Nhân bản nội dung',
      message: `Tạo bản sao mới với mã ${newCode}?`,
      confirmLabel: 'Nhân bản',
    });
    if (!confirmed) return;
    try {
      await practiceAdminApi.duplicateCollection(item.id, { newCode, titleVi: `${item.titleVi} (Bản sao)` });
      appNotice('Đã nhân bản nội dung.', 'success');
      refresh();
    } catch (requestError) {
      appNotice(extractErrorMessage(requestError).message, 'error');
    }
  };

  const renderActions = (item: PracticeAdminCollectionSummary) => {
    const main = primaryAction(item, isAdmin, user?.userId || 0);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <a href={main.href} className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500">
          {main.label}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
        <details className="group relative">
          <summary className="flex min-h-9 cursor-pointer list-none items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
            <MoreHorizontal className="h-4 w-4" /> Thêm
          </summary>
          <div className="absolute right-0 z-30 mt-1 min-w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <a href={`#/admin/practice/${item.id}`} className="block rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Xem chi tiết & lịch sử</a>
            {item.currentVersionId && <a href={`#/admin/practice/versions/${item.currentVersionId}/preview`} className="block rounded-lg px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Xem trước</a>}
            <button type="button" onClick={() => void duplicateCollection(item)} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Nhân bản</button>
            {isAdmin && <>
              <button type="button" onClick={() => setAssigning(item)} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800">Phân công biên tập viên</button>
              {item.status === 'PUBLISHED' && item.currentVersionId && <button type="button" onClick={() => void retirePublished(item)} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40">Gỡ xuất bản</button>}
              {item.status !== 'ARCHIVED' && <button type="button" onClick={() => void archiveSelectedOne(item)} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40">Lưu trữ</button>}
            </>}
          </div>
        </details>
      </div>
    );
  };

  const archiveSelectedOne = async (item: PracticeAdminCollectionSummary) => {
    const confirmed = await appConfirm({
      title: 'Lưu trữ nội dung',
      message: `Đưa "${item.titleVi}" vào lưu trữ? Nội dung sẽ bị ẩn khỏi học viên.`,
      confirmLabel: 'Lưu trữ',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await practiceAdminApi.archiveCollection(item.id);
      appNotice('Đã lưu trữ nội dung.', 'success');
      refresh();
    } catch (requestError) {
      appNotice(extractErrorMessage(requestError).message, 'error');
    }
  };

  const retirePublished = async (item: PracticeAdminCollectionSummary) => {
    if (!item.currentVersionId) return;
    const confirmed = await appConfirm({
      title: 'Gỡ xuất bản phiên bản',
      message: `Gỡ phiên bản hiện hành của "${item.titleVi}" khỏi học viên? Collection sẽ trở về trạng thái bản nháp.`,
      confirmLabel: 'Gỡ xuất bản',
      danger: true,
    });
    if (!confirmed) return;
    try {
      await practiceAdminApi.retireVersion(item.currentVersionId);
      appNotice('Đã gỡ phiên bản khỏi xuất bản.', 'success');
      refresh();
    } catch (requestError) {
      appNotice(extractErrorMessage(requestError).message, 'error');
    }
  };

  const renderCollectionCard = (item: PracticeAdminCollectionSummary, selectable = false) => (
    <article key={item.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] font-bold text-slate-500">{item.code} · {item.levelCode}</p>
          <a href={`#/admin/practice/${item.id}`} className="mt-1 block text-base font-extrabold text-slate-900 hover:text-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:text-slate-100 dark:hover:text-rose-300">{item.titleVi}</a>
          <p className="mt-1 truncate font-chinese text-sm text-slate-500 dark:text-slate-400" lang="zh">{item.titleZh}{item.titlePinyin ? ` · ${item.titlePinyin}` : ''}</p>
        </div>
        {selectable && <input aria-label={`Chọn ${item.titleVi}`} type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} className="mt-1 h-4 w-4 accent-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500" />}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PracticeCategoryBadge category={item.category} />
        <span className="text-[11px] font-semibold text-slate-500">Collection</span>
        <PracticeStatusBadge status={item.status} type="collection" size="sm" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div><p className="text-slate-400">Bản hiện hành</p><p className="mt-1 font-bold text-slate-700 dark:text-slate-200">{item.currentVersionNumber ? `v${item.currentVersionNumber}` : 'Chưa có phiên bản'}</p></div>
        <div><p className="text-slate-400">Phụ trách</p><p className="mt-1 truncate font-bold text-slate-700 dark:text-slate-200">{item.assignedEditorName || 'Chưa phân công'}</p></div>
      </div>
      <p className="mt-3 text-[11px] text-slate-500" title={formatDateTime(item.updatedAt)}>Cập nhật {relativeDate(item.updatedAt)} · {item.updaterName || 'Không rõ'}</p>
      <div className="mt-auto pt-4">{renderActions(item)}</div>
    </article>
  );

  const renderTable = () => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          <tr>
            {isAdmin && <th className="w-10 px-4 py-3"><span className="sr-only">Chọn</span></th>}
            <th className="px-4 py-3">Nội dung</th><th className="px-4 py-3">Loại</th><th className="hidden px-4 py-3 xl:table-cell">Phiên bản</th><th className="px-4 py-3">Quy trình</th><th className="hidden px-4 py-3 xl:table-cell">Phụ trách</th><th className="hidden px-4 py-3 xl:table-cell">Cập nhật</th><th className="px-4 py-3">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {visibleItems.map((item) => (
            <tr key={item.id} className="align-top transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
              {isAdmin && <td className="px-4 py-4"><input type="checkbox" aria-label={`Chọn ${item.titleVi}`} checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} className="h-4 w-4 accent-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500" /></td>}
              <td className="max-w-[280px] px-4 py-4">
                <p className="font-mono text-[10px] font-bold text-slate-500">{item.code} · {item.levelCode}</p>
                <a href={`#/admin/practice/${item.id}`} className="mt-1 block truncate text-sm font-extrabold text-slate-900 hover:text-rose-700 dark:text-slate-100 dark:hover:text-rose-300">{item.titleVi}</a>
                <p className="mt-1 truncate font-chinese text-xs text-slate-500 dark:text-slate-400" lang="zh">{item.titleZh}{item.titlePinyin ? ` · ${item.titlePinyin}` : ''}</p>
              </td>
              <td className="px-4 py-4"><PracticeCategoryBadge category={item.category} /></td>
              <td className="hidden px-4 py-4 text-slate-600 dark:text-slate-300 xl:table-cell">
                <p className="font-semibold">{item.currentVersionNumber ? `Phiên bản v${item.currentVersionNumber}` : 'Chưa có phiên bản'}</p>
                <p className="mt-1 text-[10px] text-slate-400">{item.versionsCount} phiên bản</p>
              </td>
              <td className="px-4 py-4">
                <p className="mb-1 text-[10px] font-semibold text-slate-500">Trạng thái collection</p>
                <PracticeStatusBadge status={item.status} type="collection" size="sm" />
              </td>
              <td className="hidden max-w-[150px] px-4 py-4 xl:table-cell">
                <p className="truncate font-semibold text-slate-700 dark:text-slate-200">{item.assignedEditorName || 'Chưa phân công'}</p>
                <p className="mt-1 truncate text-[10px] text-slate-400">Cập nhật bởi {item.updaterName || '—'}</p>
              </td>
              <td className="hidden whitespace-nowrap px-4 py-4 text-slate-600 dark:text-slate-300 xl:table-cell">
                <time dateTime={item.updatedAt} title={formatDateTime(item.updatedAt)}>{relativeDate(item.updatedAt)}</time>
                <p className="mt-1 text-[10px] text-slate-400">{formatDateTime(item.updatedAt)}</p>
              </td>
              <td className="px-4 py-4">{renderActions(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderBoard = () => (
    <div className="grid gap-4 xl:grid-cols-4">
      {BOARD_STATUSES.map((status) => {
        const column = visibleItems.filter((item) => item.status === status);
        return (
          <section key={status} aria-label={statusTitle(status)} className="min-w-0 rounded-2xl bg-slate-100/70 p-3 dark:bg-slate-950/50">
            <header className="mb-3 flex items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{statusTitle(status)}</h2>
              <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{column.length}</span>
            </header>
            <div className="space-y-3">
              {column.map((item) => renderCollectionCard(item, isAdmin))}
              {column.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700">Chưa có nội dung</p>}
            </div>
          </section>
        );
      })}
    </div>
  );

  const statusTotal = (key: StatusFilter) => {
    if (key === 'ALL') return totalCount;
    if (key === 'DRAFT') return summary.draft;
    if (key === 'IN_REVIEW') return summary.inReview;
    if (key === 'REVISION_REQUIRED') return summary.revisionRequired;
    if (key === 'PUBLISHED') return summary.published;
    return summary.archived;
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400"><FolderKanban className="h-4 w-4" />Quản trị nội dung</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">Nội dung luyện tập</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Quản lý bài luyện theo sách, luyện kỹ năng, bài tổng hợp và đề mô phỏng HSK.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" aria-label="Làm mới danh sách" title="Làm mới" onClick={refresh} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /><span className="hidden sm:inline">Làm mới</span>
          </button>
          {isAdmin && summary.inReview > 0 && <a href="#/admin/practice?status=IN_REVIEW" onClick={() => setStatusFilter('IN_REVIEW')} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 text-sm font-bold text-amber-800 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"><ShieldCheck className="h-4 w-4" />Duyệt nội dung</a>}
          <ShimmerButton href="#/admin/practice/new" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm"><Plus className="h-4 w-4" /><span>Tạo nội dung</span></ShimmerButton>
        </div>
      </header>

      <section aria-label="Tổng quan theo trạng thái" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {statusCards.map((card) => {
          const Icon = card.icon;
          const active = statusFilter === card.key;
          return (
            <button key={card.key} type="button" aria-pressed={active} onClick={() => { setStatusFilter(card.key); setPagination((current) => ({ ...current, page: 1 })); }} className={`rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 ${active ? 'border-rose-400 bg-rose-50 shadow-sm shadow-rose-500/10 dark:bg-rose-950/30' : 'border-slate-200 bg-white/65 hover:border-rose-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900'}`}>
              <span className={`flex items-center gap-2 text-xs font-bold ${card.color}`}><Icon className="h-4 w-4" />{card.title}</span>
              <span className="mt-2 block text-2xl font-black text-slate-900 dark:text-slate-50">{statusTotal(card.key)}</span>
              <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">{card.description}</span>
            </button>
          );
        })}
      </section>

      {visibleItems.some((item) => ['DRAFT', 'IN_REVIEW', 'REVISION_REQUIRED'].includes(item.status)) && (
        <section aria-labelledby="work-queue-title" className="rounded-2xl border border-rose-200/80 bg-gradient-to-r from-rose-50/80 to-white/70 p-4 dark:border-rose-900/60 dark:from-rose-950/25 dark:to-slate-900/60 sm:p-5">
          <div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-rose-600" /><h2 id="work-queue-title" className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Cần xử lý</h2></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleItems.filter((item) => isAdmin
              ? item.status === 'IN_REVIEW' || (!item.assignedEditorId && ['DRAFT', 'REVISION_REQUIRED'].includes(item.status))
              : (item.status === 'DRAFT' || item.status === 'REVISION_REQUIRED') && canEditCollection(item, user?.userId || 0)
            ).slice(0, 6).map((item) => {
              const action = primaryAction(item, isAdmin, user?.userId || 0);
              const isUnassigned = isAdmin && !item.assignedEditorId;
              return (
                <article key={item.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/80 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                  <div className="min-w-0">
                    <a href={action.href} className="block truncate text-sm font-bold text-slate-800 hover:text-rose-700 dark:text-slate-100">{item.titleVi}</a>
                    <p className="mt-1 truncate text-[11px] text-slate-500">{item.code} · {item.levelCode} · {item.assignedEditorName || 'Chưa phân công'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2"><PracticeCategoryBadge category={item.category} /><PracticeStatusBadge status={item.status} type="collection" size="sm" /></div>
                    <p className="mt-1 text-[10px] text-slate-400">{isUnassigned ? 'Cần phân công' : ''}{isUnassigned ? ' · ' : ''}{relativeDate(item.updatedAt)}</p>
                  </div>
                  {isUnassigned ? <button type="button" onClick={() => setAssigning(item)} className="shrink-0 rounded-lg border border-rose-200 px-2.5 py-2 text-[11px] font-bold text-rose-700 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:text-rose-300">Phân công</button> : <a href={action.href} className="shrink-0 rounded-lg bg-rose-600 px-2.5 py-2 text-[11px] font-bold text-white hover:bg-rose-700">{action.label}</a>}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <GlassCard className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_170px_220px_150px]">
          <div className="relative">
            <label htmlFor="practice-search" className="sr-only">Tìm theo mã, tiêu đề Việt, Trung hoặc pinyin</label>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="practice-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }} placeholder="Tìm theo mã, tiêu đề Việt hoặc Trung…" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100" />
          </div>
          <button type="button" aria-expanded={mobileFiltersOpen} aria-controls="practice-mobile-filters" onClick={() => setMobileFiltersOpen((open) => !open)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 md:hidden">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {mobileFiltersOpen ? 'Ẩn bộ lọc' : 'Bộ lọc'}
            {activeFilterCount > 0 && <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">{activeFilterCount}</span>}
          </button>
          <div id="practice-mobile-filters" className={`${mobileFiltersOpen ? 'grid' : 'hidden'} gap-3 md:contents`}>
            <div><label htmlFor="practice-level" className="sr-only">Lọc theo cấp độ</label><select id="practice-level" value={level} onChange={(event) => { setLevel(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"><option value="">Tất cả cấp độ</option>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={`HSK${n}`}>HSK {n}</option>)}</select></div>
            <div><label htmlFor="practice-category" className="sr-only">Lọc theo thể loại</label><select id="practice-category" value={category} onChange={(event) => { setCategory(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"><option value="">Tất cả thể loại</option><option value="WORKBOOK_LESSON">Sách bài tập</option><option value="SKILL_PRACTICE">Luyện kỹ năng</option><option value="MIXED_PRACTICE">Tổng hợp</option><option value="MOCK_EXAM">Mô phỏng</option><option value="REAL_EXAM_SIMULATION">Thi thật</option></select></div>
            <div><label htmlFor="practice-status" className="sr-only">Lọc theo trạng thái</label><select id="practice-status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value as StatusFilter); setPagination((current) => ({ ...current, page: 1 })); }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"><option value="ALL">Mọi trạng thái</option>{STATUS_CARDS.filter((card) => card.key !== 'ALL').map((card) => <option key={card.key} value={card.key}>{card.title}</option>)}</select></div>
          </div>
        </div>
        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
            <span aria-live="polite">{loading ? 'Đang tải…' : `Hiển thị ${filterVisible} nội dung · ${pagination.total} kết quả API`}</span>
            {isAdmin && IS_DEVELOPMENT && <label className="inline-flex cursor-pointer items-center gap-2"><input type="checkbox" checked={hideTestData} onChange={(event) => setHideTests(event.target.checked)} className="h-4 w-4 accent-rose-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500" />Ẩn dữ liệu kiểm thử</label>}
            {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 font-semibold text-rose-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:text-rose-300"><FilterX className="h-3.5 w-3.5" />Xóa bộ lọc</button>}
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <div role="group" aria-label="Chế độ hiển thị" className="inline-flex rounded-xl border border-slate-200 p-1 dark:border-slate-700">
              {([
                ['table', 'Dạng bảng', List],
                ['cards', 'Dạng thẻ', LayoutGrid],
                ['board', 'Quy trình', FolderKanban],
              ] as const).map(([mode, label, Icon]) => <button key={mode} type="button" aria-label={label} aria-pressed={displayedView === mode} title={label} onClick={() => setViewMode(mode)} className={`${mode === 'table' ? 'hidden md:inline-flex' : 'inline-flex'} rounded-lg p-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 ${displayedView === mode ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}><Icon className="h-4 w-4" /></button>)}
            </div>
            {isAdmin && selectedIds.length > 0 && <button type="button" onClick={() => void archiveSelected()} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:border-rose-900 dark:text-rose-300"><Archive className="h-3.5 w-3.5" />Lưu trữ ({selectedIds.length})</button>}
          </div>
        </div>
      </GlassCard>

      {error ? (
        <GlassCard className="p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
          <h2 className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">{error.status === 403 ? 'Bạn không có quyền truy cập' : error.status === 404 ? 'Không tìm thấy tài nguyên' : 'Không tải được danh sách'}</h2>
          <p role="alert" className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-300">{error.message}</p>
          <button type="button" onClick={refresh} className="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">Thử lại</button>
        </GlassCard>
      ) : (
        <GlassCard className="min-w-0 overflow-hidden p-0">
          {loading ? (
            <div className="space-y-3 p-5" aria-label="Đang tải danh sách">
              {[0, 1, 2, 3].map((row) => <div key={row} className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300"><FilterX className="h-5 w-5" /></div>
              <h2 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-slate-100">{items.length ? 'Không có dữ liệu ngoài nhóm kiểm thử' : 'Chưa có nội dung phù hợp'}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{hasFilters ? 'Thử đổi từ khóa hoặc xóa bộ lọc để xem thêm.' : 'Tạo bản nháp đầu tiên để bắt đầu biên soạn.'}</p>
              <div className="mt-4 flex justify-center gap-2">{hasFilters && <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">Xóa bộ lọc</button>}<a href="#/admin/practice/new" className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700">Tạo nội dung</a></div>
            </div>
          ) : displayedView === 'table' ? renderTable() : displayedView === 'cards' ? <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">{visibleItems.map((item) => renderCollectionCard(item, isAdmin))}</div> : <div className="p-4">{renderBoard()}</div>}
          {!loading && pagination.totalPages > 1 && <footer className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"><span>Trang {pagination.page} / {pagination.totalPages} · {pagination.total} kết quả</span><div className="flex gap-2"><button type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:border-slate-700"><ChevronLeft className="h-3.5 w-3.5" />Trước</button><button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-500 dark:border-slate-700">Sau<ChevronRight className="h-3.5 w-3.5" /></button></div></footer>}
        </GlassCard>
      )}

      {assigning && <AssignmentDialog collection={assigning} onClose={() => setAssigning(null)} onAssigned={() => { setAssigning(null); refresh(); }} />}
    </div>
  );
};

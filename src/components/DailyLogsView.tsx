import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CloudOff,
  FilePlus2,
  Filter,
  Paperclip,
  Search,
  Send,
  Trash2,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatDateVN, SYSTEM_TODAY } from '../utils/dateUtils';
import { VpsSheetHeader } from './VpsSheetHeader';

export const DailyLogsView: React.FC = () => {
  const {
    currentPeriod,
    objectives,
    tasks,
    dailyLogs,
    profiles,
    departments,
    openQuickLogModal,
    addDailyLog,
    deleteDailyLog,
    submitDailyReport,
    dailySubmissions,
    canEditCurrentPeriod,
    settings,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterTaskId, setFilterTaskId] = useState('all');

  // Inline Quick Add Row
  const [quickDate, setQuickDate] = useState(SYSTEM_TODAY);
  const [quickTaskId, setQuickTaskId] = useState<string>(tasks[0]?.id || 'adhoc');
  const [quickContent, setQuickContent] = useState('');
  const [quickProgress, setQuickProgress] = useState<number>(80);

  const periodOwner = useMemo(
    () => profiles.find((p) => p.id === currentPeriod?.user_id),
    [profiles, currentPeriod]
  );

  // Sắp xếp theo ngày tăng dần để đánh số TT chuẩn như Sheet 4.1 hoặc hiển thị mới nhất
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredLogs = useMemo(() => {
    const list = dailyLogs.filter((log) => {
      if (filterDate && log.log_date !== filterDate) return false;
      if (filterTaskId === 'adhoc' && log.task_id !== null) return false;
      if (filterTaskId !== 'all' && filterTaskId !== 'adhoc' && log.task_id !== filterTaskId) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const linkedTask = tasks.find((t) => t.id === log.task_id);
        const matchContent = log.content.toLowerCase().includes(q);
        const matchIssue = (log.issues || '').toLowerCase().includes(q);
        const matchTask = (linkedTask?.title || '').toLowerCase().includes(q);
        return matchContent || matchIssue || matchTask;
      }
      return true;
    });

    return [...list].sort((a, b) =>
      sortOrder === 'asc'
        ? a.log_date.localeCompare(b.log_date) || a.created_at.localeCompare(b.created_at)
        : b.log_date.localeCompare(a.log_date) || b.created_at.localeCompare(a.created_at)
    );
  }, [dailyLogs, filterDate, filterTaskId, searchQuery, tasks, sortOrder]);

  if (!currentPeriod) return null;

  const totalHours = filteredLogs.reduce((sum, l) => sum + (l.hours || 0), 0);
  const hasSubmittedToday = dailySubmissions.some(
    (s) => s.user_id === currentPeriod.user_id && s.log_date === SYSTEM_TODAY
  );

  const periodDept = departments.find((d) => d.id === currentPeriod.department_id);
  const roleLabel =
    periodOwner?.role === 'leader'
      ? 'CẤP GIÁM ĐỐC'
      : periodOwner?.role === 'manager'
      ? 'CẤP TRƯỞNG PHÒNG'
      : 'CẤP TỔ TRƯỞNG';
  const unitDisplay = periodOwner?.team_name
    ? `Đơn vị: ${periodDept?.name || settings.unit_prefix} — ${periodOwner.team_name}`
    : `Đơn vị: ${periodDept?.name || settings.unit_prefix}`;

  const handleInlineAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickContent.trim()) return;
    const isAdhoc = quickTaskId === 'adhoc' || !quickTaskId;
    const ok = addDailyLog({
      log_date: quickDate,
      task_id: isAdhoc ? null : quickTaskId,
      content: quickContent.trim(),
      progress_after: isAdhoc ? undefined : quickProgress,
      hours: 2,
    });
    if (ok) {
      setQuickContent('');
    }
  };

  return (
    <div className="space-y-5">
      {/* TIÊU ĐỀ CHUẨN MẪU 5. NHẬT KÝ CÔNG VIỆC */}
      <VpsSheetHeader
        redTitle={settings.company_title}
        mainTitle="5. NHẬT KÝ CÔNG VIỆC"
        subTitle={`Công việc thực hiện: ${objectives.length} chỉ tiêu`}
        unitText={unitDisplay}
        periodText={`Tháng ${currentPeriod.month} năm ${currentPeriod.year} • ${roleLabel}: ${periodOwner?.full_name}`}
        roleBadge={
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {filteredLogs.length} dòng nhật ký ({totalHours.toFixed(1)}h)
          </span>
        }
        rightActions={
          <div className="flex flex-wrap items-center gap-2">
            {canEditCurrentPeriod && (
              <button
                type="button"
                onClick={() => openQuickLogModal(null, filterDate || SYSTEM_TODAY)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
              >
                <FilePlus2 className="w-4 h-4" />
                + Nhập chi tiết (Đính kèm / Vướng mắc)
              </button>
            )}
            {!hasSubmittedToday ? (
              <button
                type="button"
                onClick={() => submitDailyReport(SYSTEM_TODAY)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Nộp báo cáo ngày
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                Đã nộp báo cáo hôm nay
              </span>
            )}
          </div>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
        {/* KHUNG NHẬP NHANH NHẬT KÝ TRỰC TIẾP TRÊN BẢNG */}
        {canEditCurrentPeriod && (
          <form
            onSubmit={handleInlineAddLog}
            className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-slate-800/60 border border-blue-200/80 dark:border-slate-700 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-end"
          >
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                NGÀY/THÁNG
              </label>
              <input
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                required
              />
            </div>
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                THUỘC CÔNG VIỆC (BƯỚC 3)
              </label>
              <select
                value={quickTaskId}
                onChange={(e) => setQuickTaskId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    Việc #{t.seq}: {t.title.slice(0, 48)}
                  </option>
                ))}
                <option value="adhoc">⚡ Việc phát sinh ngoài kế hoạch</option>
              </select>
            </div>
            <div className="lg:col-span-4">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                CÔNG VIỆC THỰC HIỆN TRONG NGÀY <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={quickContent}
                onChange={(e) => setQuickContent(e.target.value)}
                placeholder="Gõ nội dung công việc đã thực hiện trong ngày..."
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                required
              />
            </div>
            <div className="lg:col-span-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                % ĐẠT
              </label>
              <select
                value={quickProgress}
                onChange={(e) => setQuickProgress(Number(e.target.value))}
                disabled={quickTaskId === 'adhoc'}
                className="w-full px-2 py-2 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              >
                {[0, 20, 40, 50, 60, 80, 90, 100].map((p) => (
                  <option key={p} value={p}>
                    {p}%
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu Nhật Ký
              </button>
            </div>
          </form>
        )}

        {/* BỘ LỌC TÌM KIẾM */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nội dung công việc, vướng mắc..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div className="lg:col-span-3 relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <select
              value={filterTaskId}
              onChange={(e) => setFilterTaskId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
            >
              <option value="all">Tất cả công việc ({dailyLogs.length})</option>
              <option value="adhoc">⚡ Việc phát sinh ngoài kế hoạch</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  Việc #{t.seq}: {t.title.slice(0, 45)}...
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2 relative">
            <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-9 pr-2 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div className="lg:col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition"
            >
              {sortOrder === 'desc' ? 'Mới nhất trước ↓' : 'Chuẩn biểu mẫu ↑'}
            </button>
            {(filterDate || filterTaskId !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFilterDate('');
                  setFilterTaskId('all');
                  setSearchQuery('');
                }}
                className="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl"
              >
                Xoá lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* GIAO DIỆN BẢNG TRÊN MÁY TÍNH (DESKTOP TABLE CHUẨN SHEET 4.1) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                <th className="py-3.5 px-3 text-center w-14 border-r border-slate-700">TT (A)</th>
                <th className="py-3.5 px-4 text-center w-32 border-r border-slate-700">
                  NGÀY/THÁNG (B)
                </th>
                <th className="py-3.5 px-4 text-left border-r border-slate-700">
                  CÔNG VIỆC THỰC HIỆN (C)
                </th>
                <th className="py-3.5 px-4 text-left w-72 border-r border-slate-700">
                  GẮN VỚI KẾ HOẠCH (BƯỚC 3)
                </th>
                <th className="py-3.5 px-3 text-center w-28 border-r border-slate-700">
                  TIẾN ĐỘ / GIỜ
                </th>
                <th className="py-3.5 px-3 text-center w-16">XOÁ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Không có dòng nhật ký nào khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => {
                  const linkedTask = tasks.find((t) => t.id === log.task_id);
                  const linkedObj = objectives.find((o) => o.id === linkedTask?.objective_id);
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition"
                    >
                      <td className="py-3.5 px-3 text-center font-bold text-slate-500 border-r border-slate-100 dark:border-slate-800">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <div>{formatDateVN(log.log_date)}</div>
                        {log.sync_status === 'pending' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-1">
                            <CloudOff className="w-3 h-3" /> Chờ đồng bộ
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 border-r border-slate-100 dark:border-slate-800">
                        <p className="text-slate-900 dark:text-slate-100 leading-relaxed">
                          {log.content}
                        </p>
                        {log.issues && (
                          <div className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg inline-block">
                            <strong>Vướng mắc/Đề xuất:</strong> {log.issues}
                          </div>
                        )}
                        {log.attachments && log.attachments.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {log.attachments.map((att) => (
                              <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline bg-blue-50 dark:bg-slate-800 px-2 py-0.5 rounded"
                              >
                                <Paperclip className="w-3 h-3" /> {att.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 border-r border-slate-100 dark:border-slate-800">
                        {linkedTask ? (
                          <div className="space-y-1">
                            {linkedObj && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                Chỉ tiêu {linkedObj.seq}
                              </span>
                            )}
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              Việc #{linkedTask.seq}: {linkedTask.title}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                            ⚡ Việc phát sinh ngoài kế hoạch
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col items-center gap-1">
                          {log.progress_after !== undefined && (
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {log.progress_after}%
                            </span>
                          )}
                          {log.hours && (
                            <span className="text-xs text-slate-500 font-medium">
                              {log.hours} giờ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {canEditCurrentPeriod && (
                          <button
                            type="button"
                            onClick={() => deleteDailyLog(log.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Xoá dòng nhật ký"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Chữ ký cuối biểu giống mẫu */}
        <div className="p-5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <div className="text-center min-w-[240px]">
            <p className="text-xs italic text-slate-500">
              {settings.location_city}, ngày {SYSTEM_TODAY.split('-')[2]} tháng{' '}
              {SYSTEM_TODAY.split('-')[1]} năm {SYSTEM_TODAY.split('-')[0]}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mt-1">
              NGƯỜI LẬP
            </p>
            <p className="text-sm font-extrabold text-blue-900 dark:text-blue-300 mt-6">
              {periodOwner?.full_name}
            </p>
          </div>
        </div>
      </div>

      {/* GIAO DIỆN THẺ TRÊN ĐIỆN THOẠI (MOBILE CARDS) */}
      <div className="md:hidden space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
            Chưa có dòng nhật ký nào. Bấm nút (+) để ghi việc đã làm hôm nay!
          </div>
        ) : (
          filteredLogs.map((log, idx) => {
            const linkedTask = tasks.find((t) => t.id === log.task_id);
            return (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      Ngày {formatDateVN(log.log_date)}
                    </span>
                    {log.sync_status === 'pending' && (
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                        Chờ đồng bộ
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {log.hours && (
                      <span className="text-xs font-semibold text-slate-500">{log.hours}h</span>
                    )}
                    {log.progress_after !== undefined && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {log.progress_after}%
                      </span>
                    )}
                    {canEditCurrentPeriod && (
                      <button
                        type="button"
                        onClick={() => deleteDailyLog(log.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                  {linkedTask
                    ? `📌 Việc #${linkedTask.seq}: ${linkedTask.title}`
                    : '⚡ Việc phát sinh ngoài kế hoạch'}
                </div>

                <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed">
                  {log.content}
                </p>

                {log.issues && (
                  <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/50 p-2 rounded-lg">
                    <strong>Vướng mắc:</strong> {log.issues}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};


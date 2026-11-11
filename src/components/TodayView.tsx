import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  FilePlus2,
  Flame,
  MessageSquareQuote,
  Send,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatDateTimeVN,
  formatDateVN,
  getTaskStatusMeta,
  SYSTEM_TODAY,
} from '../utils/dateUtils';

export const TodayView: React.FC = () => {
  const {
    currentUser,
    currentPeriod,
    objectives,
    tasks,
    dailyLogs,
    dailySubmissions,
    comments,
    profiles,
    openQuickLogModal,
    submitDailyReport,
    setActiveTab,
    settings,
  } = useApp();

  if (!currentUser || !currentPeriod) return null;

  const periodOwner = profiles.find((p) => p.id === currentPeriod.user_id) || currentUser;

  // Các dòng nhật ký ghi trong ngày hôm nay (10/11/2026)
  const todayLogs = dailyLogs.filter((l) => l.log_date === SYSTEM_TODAY);
  const todayHours = todayLogs.reduce((acc, l) => acc + (l.hours || 0), 0);

  const hasSubmittedToday = dailySubmissions.some(
    (s) => s.user_id === periodOwner.id && s.log_date === SYSTEM_TODAY
  );

  // Các công việc đang trong hạn hoặc trễ hạn cần ưu tiên hôm nay
  const priorityTasks = tasks.filter(
    (t) =>
      t.status === 'overdue' ||
      (t.status !== 'done' && t.start_date <= SYSTEM_TODAY && t.end_date >= SYSTEM_TODAY) ||
      t.status === 'in_progress'
  );

  const avgProgress =
    tasks.length > 0
      ? Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length)
      : 0;

  const overdueCount = tasks.filter((t) => t.status === 'overdue').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  const periodComments = comments.filter((c) => c.period_id === currentPeriod.id);

  return (
    <div className="space-y-6">
      {/* HERO BANNER: TRẠNG THÁI BÁO CÁO HÔM NAY */}
      <div
        className={`rounded-2xl p-5 sm:p-6 border shadow-sm transition ${
          hasSubmittedToday
            ? 'bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white border-emerald-700'
            : 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white border-blue-700'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/15 text-blue-100 backdrop-blur-xs">
                <CalendarCheck className="w-3.5 h-3.5 text-amber-300" />
                Hôm nay: Thứ Ba, {formatDateVN(SYSTEM_TODAY)}
              </span>
              {hasSubmittedToday ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  Đã nộp báo cáo ngày
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/20 text-amber-200 border border-amber-400/40">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  Chưa gửi báo cáo ngày (Nhắc trước {settings.reminder_time})
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Xin chào, {periodOwner.full_name}!
            </h2>
            <p className="text-sm text-blue-100/90 max-w-2xl">
              Hôm nay bạn đã ghi <strong>{todayLogs.length} dòng nhật ký</strong> ({todayHours} giờ làm việc).
              Mỗi dòng nhật ký sẽ tự động cập nhật % hoàn thành và tô màu trên <strong>Bảng Tiến Độ Gantt Bước 4</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => openQuickLogModal(null, SYSTEM_TODAY)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              + Thêm việc đã làm
            </button>

            {!hasSubmittedToday ? (
              <button
                type="button"
                onClick={() => submitDailyReport(SYSTEM_TODAY)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-white hover:bg-blue-50 text-blue-900 shadow-lg transition cursor-pointer"
              >
                <Send className="w-4 h-4 text-blue-700" />
                Gửi báo cáo ngày
              </button>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-white/15 text-white border border-white/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Đã hoàn tất nộp hôm nay
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 THẺ CHỈ SỐ CHU TRÌNH 4 BƯỚC */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('step1_objectives')}
          className="text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bước 1 & 2 • Chỉ tiêu
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {objectives.length} <span className="text-sm font-medium text-slate-500">chỉ tiêu</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            Đã đánh giá thực trạng {objectives.filter((o) => o.current_status).length}/{objectives.length}
            <ArrowRight className="w-3 h-3 ml-auto text-blue-600" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('step3_plan')}
          className="text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bước 3 • Kế hoạch
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {doneCount}/{tasks.length} <span className="text-sm font-medium text-slate-500">hoàn thành</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            {tasks.filter((t) => t.status === 'in_progress').length} việc đang thực hiện
            <ArrowRight className="w-3 h-3 ml-auto text-indigo-600" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('step4_gantt')}
          className="text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bước 4 • Tiến độ Gantt
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {avgProgress}% <span className="text-sm font-medium text-slate-500">trung bình</span>
          </div>
          <p className="text-xs mt-1 flex items-center gap-1">
            {overdueCount > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {overdueCount} việc trễ hạn
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Đúng tiến độ kế hoạch
              </span>
            )}
            <ArrowRight className="w-3 h-3 ml-auto text-emerald-600" />
          </p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('daily_logs')}
          className="text-left p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 transition group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              4.1 • Nhật ký tháng
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {dailyLogs.length} <span className="text-sm font-medium text-slate-500">dòng nhật ký</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            Hôm nay đã ghi {todayLogs.length} mục
            <ArrowRight className="w-3 h-3 ml-auto text-amber-600" />
          </p>
        </button>
      </div>

      {/* CHỈ ĐẠO / NHẬN XÉT MỚI TỪ LÃNH ĐẠO & TRƯỞNG BỘ PHẬN */}
      {periodComments.length > 0 && (
        <div className="rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 p-4">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm mb-2.5">
            <MessageSquareQuote className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Nhận xét & Chỉ đạo mới từ Quản lý / Lãnh đạo ({periodComments.length})</span>
          </div>
          <div className="space-y-2">
            {periodComments.slice(0, 2).map((cmt) => {
              const author = profiles.find((p) => p.id === cmt.author_id);
              const linkedTask = tasks.find((t) => t.id === cmt.task_id);
              return (
                <div
                  key={cmt.id}
                  className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/70 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {author?.full_name}
                      </span>
                      <span className="text-slate-500">({author?.job_title})</span>
                      {linkedTask && (
                        <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium">
                          Việc #{linkedTask.seq}: {linkedTask.title.slice(0, 40)}...
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">{cmt.body}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {formatDateTimeVN(cmt.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LƯỚI 2 CỘT: VIỆC CẦN LÀM HÔM NAY & NHẬT KÝ ĐÃ GHI HÔM NAY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (7/12): DANH SÁCH CÔNG VIỆC CẦN BÁO CÁO HÔM NAY */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Việc cần tập trung hôm nay ({priorityTasks.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bấm "Báo cáo ngay" để ghi nhật ký 4.1 và cập nhật % tiến độ trong 1 chạm
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('step3_plan')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Xem toàn bộ Kế hoạch →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {priorityTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Tuyệt vời! Toàn bộ công việc trong hạn đều đã hoàn thành.
              </div>
            ) : (
              priorityTasks.map((task) => {
                const obj = objectives.find((o) => o.id === task.objective_id);
                const statusMeta = getTaskStatusMeta(task.status);
                const loggedToday = todayLogs.some((l) => l.task_id === task.id);

                return (
                  <div
                    key={task.id}
                    className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {obj && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Chỉ tiêu {obj.seq}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${statusMeta.badgeClass}`}
                        >
                          {statusMeta.label}
                        </span>
                        {loggedToday && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                            ✓ Đã ghi nhật ký hôm nay
                          </span>
                        )}
                      </div>

                      <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                        {task.seq}. {task.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span>
                          Kế hoạch: <strong>{formatDateVN(task.start_date)}</strong> →{' '}
                          <strong className={task.status === 'overdue' ? 'text-rose-600 font-bold' : ''}>
                            {formatDateVN(task.end_date)}
                          </strong>
                        </span>
                        <span>Đầu ra: {task.expected_output}</span>
                      </div>

                      {/* Thanh tiến độ */}
                      <div className="pt-1 flex items-center gap-2.5 max-w-md">
                        <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${statusMeta.barClass}`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-10 text-right">
                          {task.progress}%
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={() => openQuickLogModal(task.id, SYSTEM_TODAY)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition cursor-pointer"
                      >
                        <FilePlus2 className="w-3.5 h-3.5" />
                        Báo cáo việc này
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CỘT PHẢI (5/12): NHẬT KÝ ĐÃ GHI TRONG NGÀY HÔM NAY */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Nhật ký hôm nay ({formatDateVN(SYSTEM_TODAY)})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trích xuất trực tiếp từ Sheet 4.1 Nhật ký công việc
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('daily_logs')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Mở Sheet 4.1 →
            </button>
          </div>

          <div className="p-4 flex-1 space-y-3">
            {todayLogs.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                  Bạn chưa ghi dòng nhật ký nào cho ngày hôm nay ({formatDateVN(SYSTEM_TODAY)}).
                </p>
                <button
                  type="button"
                  onClick={() => openQuickLogModal(null, SYSTEM_TODAY)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  + Ghi dòng nhật ký đầu tiên
                </button>
              </div>
            ) : (
              todayLogs.map((log, index) => {
                const linkedTask = tasks.find((t) => t.id === log.task_id);
                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-400 truncate">
                        #{index + 1} • {linkedTask ? linkedTask.title : '⚡ Việc phát sinh ngoài kế hoạch'}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {log.hours && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            {log.hours}h
                          </span>
                        )}
                        {log.progress_after !== undefined && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Đạt {log.progress_after}%
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {log.content}
                    </p>
                    {log.issues && (
                      <p className="text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-lg">
                        <strong>Vướng mắc/Đề xuất:</strong> {log.issues}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Eye,
  FilePlus2,
  Filter,
  LayoutGrid,
  Table2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GanttDayCell, TaskItem } from '../types';
import {
  formatDateVN,
  generateGantt35Days,
  getTaskStatusMeta,
  SYSTEM_TODAY,
} from '../utils/dateUtils';
import { VpsSheetHeader } from './VpsSheetHeader';

export const Step4GanttView: React.FC = () => {
  const {
    currentPeriod,
    objectives,
    tasks,
    dailyLogs,
    profiles,
    departments,
    openQuickLogModal,
    canEditCurrentPeriod,
    settings,
  } = useApp();

  const [selectedObjId, setSelectedObjId] = useState<string>('all');
  const [mobileMode, setMobileMode] = useState<'cards' | 'table'>('cards');
  const [activeWeekMobile, setActiveWeekMobile] = useState<number>(1); // Tuần 2 (chứa ngày 10/11)

  // Ô Gantt đang được bấm vào để xem chi tiết nhật ký ngày đó
  const [inspectedCell, setInspectedCell] = useState<{
    task: TaskItem;
    day: GanttDayCell;
  } | null>(null);

  const ganttDays = useMemo(() => {
    if (!currentPeriod) return [];
    return generateGantt35Days(currentPeriod.month, currentPeriod.year);
  }, [currentPeriod]);

  if (!currentPeriod) return null;

  const periodOwner = profiles.find((p) => p.id === currentPeriod.user_id);
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

  const filteredTasks =
    selectedObjId === 'all'
      ? tasks
      : tasks.filter((t) => t.objective_id === selectedObjId);

  const firstDayLabel = ganttDays[0]?.shortDateLabel || '';
  const lastDayLabel = ganttDays[ganttDays.length - 1]?.shortDateLabel || '';

  const inspectedLogs = useMemo(() => {
    if (!inspectedCell) return [];
    return dailyLogs.filter(
      (l) =>
        l.task_id === inspectedCell.task.id &&
        l.log_date === inspectedCell.day.dateStr
    );
  }, [inspectedCell, dailyLogs]);

  return (
    <div className="space-y-5">
      {/* HEADER BƯỚC 4 CHUẨN MẪU BIỂU TẬP ĐOÀN VPS */}
      <VpsSheetHeader
        redTitle={settings.company_title}
        mainTitle="BẢNG THEO DÕI TIẾN ĐỘ CÔNG VIỆC"
        unitText={unitDisplay}
        periodText={`Tháng ${currentPeriod.month} năm ${currentPeriod.year}`}
        roleBadge={
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {roleLabel}: {periodOwner?.full_name} • 5 Tuần × 7 Thứ = 35 ngày ({firstDayLabel} → {lastDayLabel})
          </span>
        }
        rightActions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="md:hidden inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setMobileMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  mobileMode === 'cards'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Thẻ Tuần
              </button>
              <button
                type="button"
                onClick={() => setMobileMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  mobileMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" /> Bảng 35 ngày
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-blue-600" />
              <select
                value={selectedObjId}
                onChange={(e) => setSelectedObjId(e.target.value)}
                className="px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
              >
                <option value="all">Tất cả chỉ tiêu ({tasks.length} việc)</option>
                {objectives.map((o) => (
                  <option key={o.id} value={o.id}>
                    Chỉ tiêu {o.seq}: {o.title.slice(0, 42)}...
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      />

      {/* CHÚ GIẢI MÀU SẮC CHUẨN HOÁ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <span className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            Chú giải ô ngày:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 inline-block" />
            <span className="text-slate-600 dark:text-slate-300">Trong hạn kế hoạch (Bước 3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-[#c5d6ec] border border-blue-300 inline-block" />
            <span className="text-slate-600 dark:text-slate-300">Cột Thứ 7 / Chủ Nhật (Mẫu biểu VPS)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              ●
            </span>
            <span className="text-slate-600 dark:text-slate-300">Có nhật ký thực hiện (Sheet 5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
              ✓
            </span>
            <span className="text-slate-600 dark:text-slate-300">Có nhật ký & Hoàn thành 100%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
              !
            </span>
            <span className="text-slate-600 dark:text-slate-300">Quá hạn kế hoạch chưa xong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded ring-2 ring-amber-400 bg-amber-50 dark:bg-amber-950 inline-block" />
            <span className="text-slate-600 dark:text-slate-300">Hôm nay ({formatDateVN(SYSTEM_TODAY)})</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CHẾ ĐỘ THẺ + LỊCH TUẦN TRÊN ĐIỆN THOẠI (MẶC ĐỊNH TRÊN MOBILE)
         ===================================================================== */}
      <div className={`${mobileMode === 'cards' ? 'block md:hidden' : 'hidden'} space-y-3`}>
        {/* Thanh chọn Tuần 1 -> Tuần 5 */}
        <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-5 gap-1">
          {[0, 1, 2, 3, 4].map((wIdx) => {
            const wStart = ganttDays[wIdx * 7]?.shortDateLabel;
            const wEnd = ganttDays[wIdx * 7 + 6]?.shortDateLabel;
            const isSelected = activeWeekMobile === wIdx;
            return (
              <button
                key={wIdx}
                type="button"
                onClick={() => setActiveWeekMobile(wIdx)}
                className={`py-2 px-1 rounded-xl text-center transition ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-[11px] uppercase">Tuần {wIdx + 1}</div>
                <div className="text-[9px] opacity-85">
                  {wStart}-{wEnd}
                </div>
              </button>
            );
          })}
        </div>

        {/* Danh sách thẻ công việc kèm 7 ô ngày của tuần đang chọn */}
        {filteredTasks.map((task, idx) => {
          const statusMeta = getTaskStatusMeta(task.status);
          const weekCells = ganttDays.slice(activeWeekMobile * 7, activeWeekMobile * 7 + 7);

          return (
            <div
              key={task.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400">
                    VIỆC #{idx + 1} • {formatDateVN(task.start_date)} → {formatDateVN(task.end_date)}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                    {task.title}
                  </h4>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold border shrink-0 ${statusMeta.badgeClass}`}
                >
                  {statusMeta.shortLabel} • {task.progress}%
                </span>
              </div>

              {/* 7 ngày trong tuần đang chọn */}
              <div className="grid grid-cols-7 gap-1.5 pt-1">
                {weekCells.map((day) => {
                  const inPlan = day.dateStr >= task.start_date && day.dateStr <= task.end_date;
                  const dayLogs = dailyLogs.filter(
                    (l) => l.task_id === task.id && l.log_date === day.dateStr
                  );
                  const hasLog = dayLogs.length > 0;
                  const isOverdueDay =
                    task.status === 'overdue' &&
                    day.dateStr > task.end_date &&
                    day.dateStr <= SYSTEM_TODAY;

                  let boxClass =
                    'bg-slate-50 dark:bg-slate-800/40 text-slate-500 border-slate-200 dark:border-slate-800';
                  if (hasLog && task.status === 'done') {
                    boxClass = 'bg-emerald-500 text-white border-emerald-600 font-bold';
                  } else if (hasLog) {
                    boxClass = 'bg-blue-600 text-white border-blue-700 font-bold';
                  } else if (isOverdueDay) {
                    boxClass = 'bg-rose-500 text-white border-rose-600 font-bold';
                  } else if (inPlan) {
                    boxClass =
                      'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-600 font-semibold';
                  }

                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => setInspectedCell({ task, day })}
                      className={`p-1.5 rounded-xl border text-center transition flex flex-col items-center justify-center ${boxClass} ${
                        day.isToday ? 'ring-2 ring-amber-400' : ''
                      } ${!day.isCurrentMonth ? 'opacity-50' : ''}`}
                    >
                      <span className="text-[10px] opacity-80">{day.dayOfWeekLabel}</span>
                      <span className="text-xs font-bold">{day.shortDateLabel}</span>
                      <span className="text-[10px] h-3.5 leading-none mt-0.5">
                        {hasLog ? (task.status === 'done' ? '✓' : '●') : isOverdueDay ? '!' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================================
          BẢNG GANTT 35 CỘT NGÀY CHUẨN SHEET 4 (MÁY TÍNH + MOBILE TABLE MODE)
         ===================================================================== */}
      <div
        className={`${
          mobileMode === 'table' ? 'block' : 'hidden md:block'
        } bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse select-none">
            <thead>
              {/* Dòng 1: TT | CÁC CÔNG VIỆC | TUẦN 1 .. TUẦN 5 | KQ */}
              <tr className="bg-blue-950 text-white uppercase tracking-wider">
                <th
                  rowSpan={3}
                  className="py-2 px-2 text-center w-10 border-r border-b border-blue-800 sticky left-0 z-20 bg-blue-950"
                >
                  TT
                </th>
                <th
                  rowSpan={3}
                  className="py-2 px-3 text-left min-w-[230px] max-w-[260px] border-r border-b border-blue-800 sticky left-10 z-20 bg-blue-950"
                >
                  CÁC CÔNG VIỆC (BƯỚC 3)
                </th>
                {[0, 1, 2, 3, 4].map((wIdx) => (
                  <th
                    key={wIdx}
                    colSpan={7}
                    className="py-1.5 px-2 text-center border-r border-b border-blue-800 font-extrabold text-[11px] bg-blue-900"
                  >
                    TUẦN {wIdx + 1}
                  </th>
                ))}
                <th
                  rowSpan={3}
                  className="py-2 px-2.5 text-center min-w-[110px] border-b border-slate-400 bg-[#fce4d6] text-slate-900 font-extrabold"
                >
                  KQ
                </th>
              </tr>

              {/* Dòng 2: T2, T3, T4, T5, T6, T7, CN (35 cột) */}
              <tr className="bg-blue-900 text-blue-100">
                {ganttDays.map((day, idx) => (
                  <th
                    key={`dow-${day.dateStr}`}
                    className={`py-1 px-0.5 text-center min-w-[34px] border-r border-b border-blue-800 font-bold text-[10px] ${
                      (idx + 1) % 7 === 0 ? 'border-r-2 border-r-blue-500' : ''
                    } ${day.isWeekend ? 'bg-[#b4c6e7] text-slate-900 font-extrabold' : ''}`}
                  >
                    {day.dayOfWeekLabel}
                  </th>
                ))}
              </tr>

              {/* Dòng 3: Ngày trong tháng bên dưới (28, 29, 30, 1, 2...) đúng mẫu Excel */}
              <tr className="bg-blue-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {ganttDays.map((day, idx) => (
                  <th
                    key={`date-${day.dateStr}`}
                    title={day.shortDateLabel}
                    className={`py-1 px-0.5 text-center min-w-[34px] border-r border-b border-slate-300 dark:border-slate-700 text-[10px] font-bold ${
                      (idx + 1) % 7 === 0 ? 'border-r-2 border-r-slate-400' : ''
                    } ${
                      day.isToday
                        ? 'bg-amber-300 text-slate-950 font-extrabold'
                        : day.isWeekend
                        ? 'bg-[#b4c6e7] text-slate-900 font-extrabold'
                        : !day.isCurrentMonth
                        ? 'opacity-45'
                        : ''
                    }`}
                  >
                    {day.dayOfMonth}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTasks.map((task, idx) => {
                const statusMeta = getTaskStatusMeta(task.status);
                const obj = objectives.find((o) => o.id === task.objective_id);

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Cột A: TT */}
                    <td className="py-2.5 px-2 text-center font-bold text-slate-500 border-r border-slate-200 dark:border-slate-800 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-blue-50/60 dark:group-hover:bg-slate-800">
                      {idx + 1}
                    </td>

                    {/* Cột B: CÁC CÔNG VIỆC */}
                    <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 sticky left-10 z-10 bg-white dark:bg-slate-900 group-hover:bg-blue-50/60 dark:group-hover:bg-slate-800">
                      <div className="font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {obj ? <span className="text-blue-600 font-bold">[CT{obj.seq}] </span> : null}
                        {task.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Kế hoạch: {formatDateVN(task.start_date)} → {formatDateVN(task.end_date)}
                      </div>
                    </td>

                    {/* 35 CỘT NGÀY */}
                    {ganttDays.map((day, dIdx) => {
                      const inPlan =
                        day.dateStr >= task.start_date && day.dateStr <= task.end_date;
                      const dayLogs = dailyLogs.filter(
                        (l) => l.task_id === task.id && l.log_date === day.dateStr
                      );
                      const hasLog = dayLogs.length > 0;
                      const isOverdueDay =
                        task.status === 'overdue' &&
                        day.dateStr > task.end_date &&
                        day.dateStr <= SYSTEM_TODAY;

                      let cellBg = '';
                      let symbol = '';
                      let textColor = '';

                      if (hasLog && task.status === 'done') {
                        cellBg = 'bg-emerald-500 hover:bg-emerald-600';
                        symbol = '✓';
                        textColor = 'text-white font-bold';
                      } else if (hasLog) {
                        cellBg = 'bg-blue-600 hover:bg-blue-700';
                        symbol = dayLogs.length > 1 ? `${dayLogs.length}` : '●';
                        textColor = 'text-white font-bold';
                      } else if (isOverdueDay) {
                        cellBg = 'bg-rose-500/90 hover:bg-rose-600';
                        symbol = '!';
                        textColor = 'text-white font-bold';
                      } else if (inPlan) {
                        cellBg =
                          'bg-slate-200/90 dark:bg-slate-700/80 hover:bg-blue-200 dark:hover:bg-slate-600';
                      } else if (day.isWeekend) {
                        cellBg = 'bg-[#c5d6ec]/65 dark:bg-blue-950/40 hover:bg-[#b4c6e7]';
                      } else {
                        cellBg = 'hover:bg-blue-50 dark:hover:bg-slate-800';
                      }

                      return (
                        <td
                          key={`${task.id}-${day.dateStr}`}
                          onClick={() => setInspectedCell({ task, day })}
                          title={`${task.title}\nNgày ${formatDateVN(day.dateStr)}${
                            hasLog ? `\nĐã có ${dayLogs.length} dòng nhật ký (Bấm để xem)` : '\nBấm để xem hoặc thêm nhật ký'
                          }`}
                          className={`p-0 text-center border-r border-slate-200 dark:border-slate-800 cursor-pointer transition h-11 ${
                            (dIdx + 1) % 7 === 0 ? 'border-r-2 border-r-slate-300 dark:border-r-slate-700' : ''
                          } ${cellBg} ${textColor} ${
                            day.isToday ? 'ring-2 ring-inset ring-amber-400' : ''
                          } ${!day.isCurrentMonth ? 'opacity-50' : ''}`}
                        >
                          <div className="w-full h-full flex items-center justify-center text-[11px]">
                            {symbol}
                          </div>
                        </td>
                      );
                    })}

                    {/* Cột cuối: KQ */}
                    <td className="py-2 px-2.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.shortLabel}
                      </span>
                      <div className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                        {task.progress}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Chữ ký cuối biểu */}
        <div className="p-5 bg-slate-50/70 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <div className="text-center min-w-[240px]">
            <p className="text-xs italic text-slate-500">
              {settings.location_city}, ngày {SYSTEM_TODAY.split('-')[2]} tháng{' '}
              {SYSTEM_TODAY.split('-')[1]} năm {SYSTEM_TODAY.split('-')[0]}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mt-1">
              NGƯỜI LẬP BIỂU
            </p>
            <p className="text-sm font-extrabold text-blue-900 dark:text-blue-300 mt-6">
              {periodOwner?.full_name}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAL XEM CHI TIẾT Ô NGÀY TRÊN BẢNG GANTT (INSPECTOR)
         ===================================================================== */}
      {inspectedCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-blue-300 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Chi tiết Ô Tiến Độ • Thứ {inspectedCell.day.dayOfWeekLabel}, Ngày{' '}
                  {formatDateVN(inspectedCell.day.dateStr)}
                </span>
                <h4 className="font-bold text-sm sm:text-base mt-0.5">
                  {inspectedCell.task.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectedCell(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <span>
                  Kế hoạch: <strong>{formatDateVN(inspectedCell.task.start_date)}</strong> →{' '}
                  <strong>{formatDateVN(inspectedCell.task.end_date)}</strong>
                </span>
                <span className="font-bold text-blue-700 dark:text-blue-300">
                  Tiến độ hiện tại: {inspectedCell.task.progress}%
                </span>
              </div>

              {inspectedLogs.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <Eye className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Chưa có dòng nhật ký nào cho công việc này vào ngày{' '}
                    <strong>{formatDateVN(inspectedCell.day.dateStr)}</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Nhật ký đã thực hiện trong ngày ({inspectedLogs.length}):
                  </h5>
                  {inspectedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-slate-800 border border-blue-200/70 dark:border-slate-700 space-y-1"
                    >
                      <p className="text-sm text-slate-900 dark:text-white">{log.content}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                        {log.hours && <span>⏱ Thời gian: {log.hours} giờ</span>}
                        {log.progress_after !== undefined && (
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            Tiến độ đạt: {log.progress_after}%
                          </span>
                        )}
                      </div>
                      {log.issues && (
                        <p className="text-xs text-rose-600 pt-1">
                          <strong>Vướng mắc:</strong> {log.issues}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInspectedCell(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Đóng
                </button>
                {canEditCurrentPeriod && (
                  <button
                    type="button"
                    onClick={() => {
                      const { task, day } = inspectedCell;
                      setInspectedCell(null);
                      openQuickLogModal(task.id, day.dateStr);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <FilePlus2 className="w-4 h-4" />
                    + Ghi nhật ký cho ngày {inspectedCell.day.shortDateLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


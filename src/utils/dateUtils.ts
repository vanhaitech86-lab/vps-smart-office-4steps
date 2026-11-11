import { GanttDayCell, TaskItem, TaskStatus } from '../types';

// Ngày hiện tại của hệ thống (theo thời gian thực 10/11/2026)
export const SYSTEM_TODAY = '2026-11-10';

export function getTodayStr(): string {
  return SYSTEM_TODAY;
}

export function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateVN(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatShortDateVN(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${Number(parts[2])}/${Number(parts[1])}`;
}

export function formatDateTimeVN(isoStr?: string | null): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins} - ${day}/${month}/${year}`;
}

export function diffDays(dateA: string, dateB: string): number {
  const a = parseDateLocal(dateA).getTime();
  const b = parseDateLocal(dateB).getTime();
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

/**
 * Sinh đúng 35 cột ngày (5 tuần x 7 ngày từ T2 -> CN) theo chuẩn Sheet 4 của Văn phòng VPS.
 * Ví dụ: Tháng 10/2026: 1/10 là Thứ Năm -> Tuần 1 bắt đầu Thứ Hai 28/9 -> Kết thúc CN 1/11 (35 ngày).
 */
export function generateGantt35Days(month: number, year: number, todayStr = SYSTEM_TODAY): GanttDayCell[] {
  const firstOfMonth = new Date(year, month - 1, 1);
  const dayOfWeek = firstOfMonth.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7

  let startMonday: Date;
  if (dayOfWeek === 0) {
    // Nếu mùng 1 rơi vào Chủ Nhật, bắt đầu Tuần 1 từ Thứ Hai mùng 2 để trọn vẹn các tuần làm việc trong tháng
    startMonday = new Date(year, month - 1, 2);
  } else {
    // Lùi về Thứ Hai đầu tuần chứa ngày mùng 1 (VD: 1/10/2026 là T5 -> lùi 3 ngày về 28/9/2026)
    const offset = dayOfWeek - 1;
    startMonday = new Date(year, month - 1, 1 - offset);
  }

  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const cells: GanttDayCell[] = [];

  for (let i = 0; i < 35; i++) {
    const current = new Date(startMonday.getFullYear(), startMonday.getMonth(), startMonday.getDate() + i);
    const dStr = toDateStr(current);
    const dMonth = current.getMonth() + 1;
    const dYear = current.getFullYear();
    const dDay = current.getDate();
    const dowIdx = i % 7;

    cells.push({
      dateStr: dStr,
      dayOfMonth: dDay,
      month: dMonth,
      year: dYear,
      dayOfWeekLabel: dayLabels[dowIdx],
      shortDateLabel: `${dDay}/${dMonth}`,
      weekIndex: Math.floor(i / 7),
      isCurrentMonth: dMonth === month && dYear === year,
      isWeekend: dowIdx >= 5, // T7, CN
      isToday: dStr === todayStr,
    });
  }

  return cells;
}

/**
 * Chuẩn hoá trạng thái công việc tự động dựa trên progress và hạn hoàn thành (end_date)
 */
export function computeTaskStatus(
  progress: number,
  startDate: string,
  endDate: string,
  referenceDate: string = SYSTEM_TODAY
): TaskStatus {
  if (progress >= 100) return 'done';
  if (referenceDate > endDate && progress < 100) return 'overdue';
  if (progress > 0) return 'in_progress';
  return 'not_started';
}

export function getTaskStatusMeta(status: TaskStatus) {
  switch (status) {
    case 'done':
      return {
        label: 'Hoàn thành',
        shortLabel: 'Hoàn thành',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
        barClass: 'bg-emerald-500',
      };
    case 'in_progress':
      return {
        label: 'Đang thực hiện',
        shortLabel: 'Đang làm',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
        dotClass: 'bg-blue-500',
        barClass: 'bg-blue-600',
      };
    case 'overdue':
      return {
        label: 'Trễ hạn',
        shortLabel: 'Trễ hạn',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
        dotClass: 'bg-rose-500',
        barClass: 'bg-rose-500',
      };
    case 'not_started':
    default:
      return {
        label: 'Chưa bắt đầu',
        shortLabel: 'Chưa BĐ',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        dotClass: 'bg-slate-400',
        barClass: 'bg-slate-400',
      };
  }
}

export function getPeriodStatusMeta(status: string) {
  switch (status) {
    case 'approved':
      return {
        label: 'Đã phê duyệt',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
      };
    case 'submitted':
      return {
        label: 'Chờ phê duyệt',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
      };
    case 'returned':
      return {
        label: 'Yêu cầu bổ sung',
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
      };
    case 'locked':
      return {
        label: 'Đã khoá sổ',
        badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
      };
    case 'draft':
    default:
      return {
        label: 'Bản nháp (Đang mở)',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
      };
  }
}

export function canEmployeeEditLogDate(logDate: string, allowBackdateDays = 3, todayStr = SYSTEM_TODAY): boolean {
  const diff = diffDays(todayStr, logDate);
  // Cho phép ghi ngày hôm nay hoặc lùi tối đa allowBackdateDays ngày
  return diff >= -1 && diff <= allowBackdateDays;
}

export function isObjectiveAtRisk(deadline: string, avgProgress: number, todayStr = SYSTEM_TODAY): boolean {
  if (!deadline || avgProgress >= 100) return false;
  const remainingDays = diffDays(deadline, todayStr);
  return remainingDays <= 7 && avgProgress < 50;
}


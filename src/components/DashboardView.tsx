import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BellRing,
  Building2,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FilePlus2,
  FileSpreadsheet,
  Filter,
  GanttChartSquare,
  GitFork,
  Layers,
  NotebookPen,
  Save,
  Search,
  SearchCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import {
  computeTaskStatus,
  formatDateVN,
  getPeriodStatusMeta,
  getTaskStatusMeta,
  isObjectiveAtRisk,
  SYSTEM_TODAY,
} from '../utils/dateUtils';
import { exportPeriodToExcel } from '../utils/excelExport';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    departments,
    profiles,
    allPeriods,
    allObjectives,
    allTasks,
    allDailyLogs,
    dailySubmissions,
    settings,
    sendReminderToUser,
    setSelectedPeriodId,
    setActiveTab,
    switchToMyOwnPeriod,
    openQuickLogModal,
    saveAllDataNow,
    lastSavedAt,
  } = useApp();

  const [roleFilter, setRoleFilter] = useState<'all' | 'leader' | 'manager' | 'team_lead' | 'mine'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [selectedPersonIdForDrilldown, setSelectedPersonIdForDrilldown] = useState<string>('all');
  const [logSearch, setLogSearch] = useState<string>('');

  // Danh sách nhân sự cả 3 cấp (Giám đốc, Trưởng phòng, Tổ trưởng) theo bộ lọc
  const scopedPeople = useMemo(() => {
    const activeUsers = profiles.filter(
      (p) => p.active && (p.role === 'leader' || p.role === 'manager' || p.role === 'team_lead')
    );

    return activeUsers.filter((person) => {
      // Nếu lọc "Của riêng tôi"
      if (roleFilter === 'mine') {
        return person.id === currentUser?.id;
      }
      // Nếu lọc theo cấp bậc
      if (roleFilter !== 'all' && person.role !== roleFilter) {
        return false;
      }
      // Nếu lọc theo phòng ban
      if (deptFilter !== 'all' && person.department_id !== deptFilter) {
        return false;
      }
      return true;
    });
  }, [profiles, roleFilter, deptFilter, currentUser]);

  const scopedPersonIds = useMemo(
    () => new Set(scopedPeople.map((p) => p.id)),
    [scopedPeople]
  );

  // Kỳ báo cáo Tháng 11/2026 của những người trong phạm vi lọc
  const novPeriods = useMemo(
    () =>
      allPeriods.filter(
        (p) => p.month === 11 && p.year === 2026 && scopedPersonIds.has(p.user_id)
      ),
    [allPeriods, scopedPersonIds]
  );

  const novPeriodIds = useMemo(() => new Set(novPeriods.map((p) => p.id)), [novPeriods]);

  const scopedObjectives = useMemo(
    () => allObjectives.filter((o) => novPeriodIds.has(o.period_id)),
    [allObjectives, novPeriodIds]
  );

  const scopedObjIds = useMemo(
    () => new Set(scopedObjectives.map((o) => o.id)),
    [scopedObjectives]
  );

  const scopedTasks = useMemo(
    () =>
      allTasks
        .filter((t) => scopedObjIds.has(t.objective_id))
        .map((t) => ({
          ...t,
          status: computeTaskStatus(t.progress, t.start_date, t.end_date),
        })),
    [allTasks, scopedObjIds]
  );

  const scopedLogs = useMemo(
    () => allDailyLogs.filter((l) => novPeriodIds.has(l.period_id)),
    [allDailyLogs, novPeriodIds]
  );

  // =========================================================================
  // CHỈ SỐ TỔNG HỢP THEO TỪNG BƯỚC (BƯỚC 1 -> BƯỚC 2 -> BƯỚC 3 -> BƯỚC 4 & 4.1)
  // =========================================================================
  // Bước 1: Đặt mục tiêu
  const peopleWithStep1 = useMemo(() => {
    return scopedPeople.filter((person) => {
      const p = novPeriods.find((per) => per.user_id === person.id);
      if (!p) return false;
      return scopedObjectives.some((o) => o.period_id === p.id);
    }).length;
  }, [scopedPeople, novPeriods, scopedObjectives]);

  // Bước 2: Đánh giá thực trạng, nguyên nhân & giải pháp
  const evaluatedObjectivesCount = useMemo(
    () =>
      scopedObjectives.filter(
        (o) =>
          Boolean(o.current_status?.trim()) &&
          Boolean(o.root_cause?.trim()) &&
          Boolean(o.solution?.trim())
      ).length,
    [scopedObjectives]
  );
  const step2Rate =
    scopedObjectives.length > 0
      ? Math.round((evaluatedObjectivesCount / scopedObjectives.length) * 100)
      : 0;

  // Bước 3: Lập kế hoạch thực hiện
  const objectivesWithTasksCount = useMemo(
    () =>
      scopedObjectives.filter((o) => scopedTasks.some((t) => t.objective_id === o.id)).length,
    [scopedObjectives, scopedTasks]
  );
  const step3Rate =
    scopedObjectives.length > 0
      ? Math.round((objectivesWithTasksCount / scopedObjectives.length) * 100)
      : 0;

  // Bước 4: Tiến độ thực hiện
  const avgStep4Progress =
    scopedTasks.length > 0
      ? Math.round(scopedTasks.reduce((s, t) => s + t.progress, 0) / scopedTasks.length)
      : 0;
  const doneTasksCount = scopedTasks.filter((t) => t.status === 'done').length;
  const inProgressTasksCount = scopedTasks.filter((t) => t.status === 'in_progress').length;
  const overdueTasks = useMemo(
    () => scopedTasks.filter((t) => t.status === 'overdue'),
    [scopedTasks]
  );

  // 4.1: Nộp báo cáo hôm nay
  const submittedTodayUsers = useMemo(
    () =>
      scopedPeople.filter((person) =>
        dailySubmissions.some((s) => s.user_id === person.id && s.log_date === SYSTEM_TODAY)
      ),
    [scopedPeople, dailySubmissions]
  );
  const submissionRateToday =
    scopedPeople.length > 0
      ? Math.round((submittedTodayUsers.length / scopedPeople.length) * 100)
      : 0;

  // Cảnh báo chỉ tiêu có nguy cơ
  const atRiskObjectives = useMemo(() => {
    return scopedObjectives.filter((o) => {
      const oTasks = scopedTasks.filter((t) => t.objective_id === o.id);
      const avg =
        oTasks.length > 0
          ? Math.round(oTasks.reduce((s, t) => s + t.progress, 0) / oTasks.length)
          : 0;
      return isObjectiveAtRisk(o.deadline, avg);
    });
  }, [scopedObjectives, scopedTasks]);

  // Dữ liệu Ma trận 4 Bước theo từng nhân sự (Giám đốc -> Trưởng phòng -> Tổ trưởng)
  const personRows = useMemo(() => {
    const roleOrder: Record<string, number> = { leader: 1, manager: 2, team_lead: 3, admin: 4 };
    return [...scopedPeople]
      .sort((a, b) => (roleOrder[a.role] || 9) - (roleOrder[b.role] || 9))
      .map((person) => {
        const period = novPeriods.find((p) => p.user_id === person.id);
        const dept = departments.find((d) => d.id === person.department_id);
        const pObjs = period
          ? scopedObjectives.filter((o) => o.period_id === period.id)
          : [];
        const pEvalCount = pObjs.filter(
          (o) =>
            Boolean(o.current_status?.trim()) &&
            Boolean(o.root_cause?.trim()) &&
            Boolean(o.solution?.trim())
        ).length;
        const objIds = new Set(pObjs.map((o) => o.id));
        const pTasks = scopedTasks.filter((t) => objIds.has(t.objective_id));
        const pDone = pTasks.filter((t) => t.status === 'done').length;
        const pOverdue = pTasks.filter((t) => t.status === 'overdue').length;
        const pAvgProgress =
          pTasks.length > 0
            ? Math.round(pTasks.reduce((s, t) => s + t.progress, 0) / pTasks.length)
            : 0;
        const pLogs = period ? scopedLogs.filter((l) => l.period_id === period.id) : [];
        const submittedToday = dailySubmissions.some(
          (s) => s.user_id === person.id && s.log_date === SYSTEM_TODAY
        );

        return {
          person,
          period,
          dept,
          pObjs,
          pEvalCount,
          pTasks,
          pDone,
          pOverdue,
          pAvgProgress,
          pLogs,
          submittedToday,
        };
      });
  }, [
    scopedPeople,
    novPeriods,
    departments,
    scopedObjectives,
    scopedTasks,
    scopedLogs,
    dailySubmissions,
  ]);

  // Danh sách chỉ tiêu hiển thị ở phần Theo dõi liên thông 4 bước (Drill-down)
  const drilldownObjectives = useMemo(() => {
    if (selectedPersonIdForDrilldown === 'all') {
      return scopedObjectives;
    }
    const p = novPeriods.find((per) => per.user_id === selectedPersonIdForDrilldown);
    if (!p) return [];
    return scopedObjectives.filter((o) => o.period_id === p.id);
  }, [scopedObjectives, selectedPersonIdForDrilldown, novPeriods]);

  // Biểu đồ so sánh 4 bước theo từng cá nhân / cấp bậc
  const chartByPersonData = useMemo(() => {
    return personRows.map((row) => ({
      name: row.person.full_name.split(' ').slice(-2).join(' '),
      fullName: row.person.full_name,
      roleLabel:
        row.person.role === 'leader'
          ? 'Giám đốc'
          : row.person.role === 'manager'
          ? 'Trưởng phòng'
          : 'Tổ trưởng',
      buoc2DanhGia:
        row.pObjs.length > 0 ? Math.round((row.pEvalCount / row.pObjs.length) * 100) : 0,
      buoc4TienDo: row.pAvgProgress,
      soNhatKy: row.pLogs.length,
    }));
  }, [personRows]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'leader':
        return {
          label: 'GIÁM ĐỐC',
          className:
            'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700',
        };
      case 'manager':
        return {
          label: 'TRƯỞNG PHÒNG',
          className:
            'bg-indigo-100 text-indigo-900 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-700',
        };
      default:
        return {
          label: 'TỔ TRƯỞNG',
          className:
            'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-700',
        };
    }
  };

  // Mở bước cụ thể của bất kỳ nhân sự nào (Giám đốc / Trưởng phòng / Tổ trưởng)
  const openPersonStep = (
    userId: string,
    tab:
      | 'step1_objectives'
      | 'step2_evaluation'
      | 'step3_plan'
      | 'step4_gantt'
      | 'daily_logs'
      | 'my_period'
  ) => {
    const period = allPeriods.find(
      (p) => p.user_id === userId && p.month === 11 && p.year === 2026
    );
    if (period) {
      setSelectedPeriodId(period.id);
      setActiveTab(tab);
    }
  };

  return (
    <div className="space-y-6">
      {/* =====================================================================
          1. BANNER TRUNG TÂM ĐIỀU HÀNH & THEO DÕI 4 BƯỚC (3 CẤP)
         ===================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-blue-800/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold bg-amber-400 text-slate-950">
                <Layers className="w-3.5 h-3.5" />
                ÁP DỤNG ĐỒNG BỘ 3 CẤP: GIÁM ĐỐC • TRƯỞNG PHÒNG • TỔ TRƯỞNG
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                Tự động lưu CSDL (Lúc {lastSavedAt})
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Dashboard Theo Dõi Chu Trình 4 Bước & Nhật Ký Công Việc
            </h2>
            <p className="text-xs sm:text-sm text-blue-200/90 max-w-3xl">
              Theo dõi xuyên suốt từ <strong>Bước 1 (Mục tiêu)</strong> →{' '}
              <strong>Bước 2 (Đánh giá thực trạng)</strong> →{' '}
              <strong>Bước 3 (Kế hoạch thực hiện)</strong> →{' '}
              <strong>Bước 4 (Tiến độ Gantt & Nhật ký 4.1)</strong> của Giám đốc, Trưởng phòng và Tổ trưởng.
            </p>
          </div>

          {/* Nút thao tác nhanh cho chính người đang đăng nhập */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('cascade')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-indigo-500/90 hover:bg-indigo-400 text-white shadow-md transition cursor-pointer"
            >
              <GitFork className="w-4 h-4" />
              Sơ đồ Phân rã 3 Cấp
            </button>

            <button
              type="button"
              onClick={() => {
                switchToMyOwnPeriod();
                setActiveTab('step1_objectives');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              Nhập 4 Bước của tôi ({currentUser?.full_name.split(' ').slice(-2).join(' ')})
            </button>

            <button
              type="button"
              onClick={() => {
                switchToMyOwnPeriod();
                openQuickLogModal(null, SYSTEM_TODAY);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              + Ghi nhật ký hôm nay
            </button>

            <button
              type="button"
              onClick={() => saveAllDataNow(false)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Lưu dữ liệu
            </button>
          </div>
        </div>

        {/* Thanh Bộ Lọc Theo Cấp Bậc (Giám đốc / Trưởng phòng / Tổ trưởng) & Phòng Ban */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-200 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-amber-300" />
              Lọc theo cấp:
            </span>
            {[
              { id: 'all', label: 'Tất cả 3 cấp (GĐ + TP + Tổ trưởng)' },
              { id: 'leader', label: '👑 Cấp Giám đốc' },
              { id: 'manager', label: '🛡️ Cấp Trưởng phòng' },
              { id: 'team_lead', label: '👥 Cấp Tổ trưởng' },
              { id: 'mine', label: `⭐ Báo cáo 4 bước của tôi (${currentUser?.full_name})` },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setRoleFilter(item.id as 'all' | 'leader' | 'manager' | 'team_lead' | 'mine')
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  roleFilter === item.id
                    ? 'bg-white text-blue-950 shadow-sm'
                    : 'bg-white/10 text-blue-100 hover:bg-white/20'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-300 shrink-0" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 text-white border border-white/20 outline-none cursor-pointer"
            >
              <option value="all" className="text-slate-900">
                Tất cả Đơn vị / Phòng ban ({departments.length})
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="text-slate-900">
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =====================================================================
          2. 4 THẺ THEO DÕI TRỰC QUAN TỪNG BƯỚC (BƯỚC 1 -> BƯỚC 2 -> BƯỚC 3 -> BƯỚC 4)
         ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BƯỚC 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                BƯỚC 1 • ĐẶT MỤC TIÊU
              </span>
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {scopedObjectives.length}{' '}
              <span className="text-sm font-semibold text-slate-500">mục tiêu / chỉ tiêu</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Đã lập mục tiêu: <strong>{peopleWithStep1}/{scopedPeople.length}</strong> nhân sự (GĐ, TP, Tổ trưởng)
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-600">
              ✓ Tự động đánh số TT
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('step1_objectives')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Mở Bước 1 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* BƯỚC 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-indigo-200 dark:border-indigo-900/60 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                BƯỚC 2 • ĐÁNH GIÁ THỰC TRẠNG
              </span>
              <SearchCheck className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {evaluatedObjectivesCount}/{scopedObjectives.length}{' '}
              <span className="text-sm font-bold text-indigo-600">({step2Rate}%)</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Đã đánh giá đủ <strong>Thực trạng, Nguyên nhân & Giải pháp</strong>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${step2Rate}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('step2_evaluation')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Mở Bước 2 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* BƯỚC 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-200 dark:border-amber-900/60 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                BƯỚC 3 • LẬP KẾ HOẠCH
              </span>
              <ClipboardList className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {scopedTasks.length}{' '}
              <span className="text-sm font-semibold text-slate-500">công việc kế hoạch</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Độ phủ kế hoạch: <strong>{step3Rate}%</strong> chỉ tiêu đã chia đầu việc
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500">
              {doneTasksCount} xong • {inProgressTasksCount} đang làm
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('step3_plan')}
              className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Mở Bước 3 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* BƯỚC 4 & 4.1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/60 p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                BƯỚC 4 & 4.1 • TIẾN ĐỘ GANTT
              </span>
              <GanttChartSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {avgStep4Progress}%{' '}
              <span className="text-sm font-semibold text-slate-500">
                ({scopedLogs.length} nhật ký)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Nộp hôm nay: <strong>{submittedTodayUsers.length}/{scopedPeople.length}</strong> ({submissionRateToday}%) •{' '}
              <strong className="text-rose-600">{overdueTasks.length} trễ hạn</strong>
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${avgStep4Progress}%` }}
              />
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('step4_gantt')}
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Mở Gantt Bước 4 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          3. BẢNG MA TRẬN THEO DÕI 4 BƯỚC CỦA CẢ 3 CẤP (GIÁM ĐỐC - TRƯỞNG PHÒNG - TỔ TRƯỞNG)
         ===================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Bảng Tổng Hợp Theo Dõi 4 Bước Theo Cấp Bậc ({personRows.length} nhân sự)
            </h3>
            <p className="text-xs text-slate-500">
              Bấm trực tiếp vào từng Bước (Bước 1, Bước 2, Bước 3, Bước 4) của bất kỳ Giám đốc, Trưởng phòng hay Tổ trưởng nào để xem hoặc nhập liệu & lưu ngay!
            </p>
          </div>
          <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl">
            Kỳ hiện tại: Tháng 11 năm 2026
          </span>
        </div>

        {/* Bảng Desktop */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase tracking-wider">
                <th className="py-3 px-4 text-left border-r border-slate-700">
                  Nhân sự & Cấp bậc
                </th>
                <th className="py-3 px-3 text-center border-r border-slate-700">
                  Bước 1: Đặt mục tiêu
                </th>
                <th className="py-3 px-3 text-center border-r border-slate-700">
                  Bước 2: Đánh giá thực trạng
                </th>
                <th className="py-3 px-3 text-center border-r border-slate-700">
                  Bước 3: Kế hoạch việc
                </th>
                <th className="py-3 px-4 text-left border-r border-slate-700 w-56">
                  Bước 4: Tiến độ Gantt
                </th>
                <th className="py-3 px-3 text-center border-r border-slate-700">
                  4.1 Nhật ký & Hôm nay
                </th>
                <th className="py-3 px-3 text-center">
                  Thao tác nhanh
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {personRows.map((row) => {
                const roleBadge = getRoleBadge(row.person.role);
                const periodMeta = row.period
                  ? getPeriodStatusMeta(row.period.status)
                  : null;
                const isMe = row.person.id === currentUser?.id;

                return (
                  <tr
                    key={row.person.id}
                    className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition ${
                      isMe ? 'bg-blue-50/25 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Cột 1: Nhân sự & Cấp bậc */}
                    <td className="py-3.5 px-4 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${roleBadge.className}`}
                        >
                          {roleBadge.label}
                        </span>
                        {isMe && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                            Của tôi
                          </span>
                        )}
                        {periodMeta && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${periodMeta.badgeClass}`}
                          >
                            {periodMeta.label}
                          </span>
                        )}
                      </div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {row.person.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {row.person.job_title} •{' '}
                        {row.dept?.name.replace('Văn phòng VPS – ', '')}
                      </div>
                    </td>

                    {/* Cột 2: Bước 1 */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => openPersonStep(row.person.id, 'step1_objectives')}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold transition cursor-pointer inline-flex flex-col items-center"
                      >
                        <span className="text-sm font-extrabold">{row.pObjs.length} chỉ tiêu</span>
                        <span className="text-[10px] underline">Xem / Nhập B1</span>
                      </button>
                    </td>

                    {/* Cột 3: Bước 2 */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => openPersonStep(row.person.id, 'step2_evaluation')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer inline-flex flex-col items-center ${
                          row.pEvalCount === row.pObjs.length && row.pObjs.length > 0
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        <span className="text-sm font-extrabold">
                          {row.pEvalCount}/{row.pObjs.length} đã ĐG
                        </span>
                        <span className="text-[10px] underline">Xem / Nhập B2</span>
                      </button>
                    </td>

                    {/* Cột 4: Bước 3 */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => openPersonStep(row.person.id, 'step3_plan')}
                        className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold transition cursor-pointer inline-flex flex-col items-center"
                      >
                        <span className="text-sm font-extrabold">{row.pTasks.length} đầu việc</span>
                        <span className="text-[10px] underline">Xem / Nhập B3</span>
                      </button>
                    </td>

                    {/* Cột 5: Bước 4 Gantt */}
                    <td className="py-3.5 px-4 border-r border-slate-100 dark:border-slate-800">
                      <div
                        onClick={() => openPersonStep(row.person.id, 'step4_gantt')}
                        className="cursor-pointer group space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600">
                            {row.pAvgProgress}%
                          </span>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                              {row.pDone} xong
                            </span>
                            {row.pOverdue > 0 && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                                {row.pOverdue} trễ
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all"
                            style={{ width: `${row.pAvgProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-blue-600 font-semibold group-hover:underline block">
                          Mở Bảng Gantt 35 ngày →
                        </span>
                      </div>
                    </td>

                    {/* Cột 6: Nhật ký 4.1 & Hôm nay */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => openPersonStep(row.person.id, 'daily_logs')}
                          className="font-extrabold text-slate-800 dark:text-slate-200 hover:text-blue-600 underline block mx-auto"
                        >
                          {row.pLogs.length} dòng nhật ký
                        </button>
                        {row.submittedToday ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Đã nộp hôm nay
                          </span>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Chưa nộp
                            </span>
                            <button
                              type="button"
                              onClick={() => sendReminderToUser(row.person.id)}
                              className="p-1 rounded bg-amber-500 text-white hover:bg-amber-600"
                              title="Nhắc nộp báo cáo"
                            >
                              <BellRing className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cột 7: Thao tác nhanh */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPersonStep(row.person.id, 'step1_objectives')}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white transition cursor-pointer"
                          title="Vào nhập / chỉnh sửa 4 bước"
                        >
                          Nhập 4 bước
                        </button>
                        {row.period && (
                          <button
                            type="button"
                            onClick={() => {
                              exportPeriodToExcel({
                                period: row.period!,
                                employee: row.person,
                                department: row.dept || departments[0],
                                objectives: row.pObjs,
                                tasks: row.pTasks,
                                logs: row.pLogs,
                                profiles,
                                settings,
                              });
                            }}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                            title="Xuất Excel 5 Sheet của nhân sự này"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Giao diện Thẻ trên Điện thoại cho Bảng Ma trận 3 cấp */}
        <div className="lg:hidden p-4 space-y-3">
          {personRows.map((row) => {
            const roleBadge = getRoleBadge(row.person.role);
            return (
              <div
                key={row.person.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${roleBadge.className}`}
                  >
                    {roleBadge.label}
                  </span>
                  {row.submittedToday ? (
                    <span className="text-[11px] font-bold text-emerald-600">
                      ✓ Đã nộp báo cáo ngày
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-600">
                      Chưa nộp hôm nay
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {row.person.full_name}
                  </h4>
                  <p className="text-xs text-slate-500">{row.person.job_title}</p>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => openPersonStep(row.person.id, 'step1_objectives')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-xs font-extrabold text-blue-600">{row.pObjs.length}</div>
                    <div className="text-[10px] text-slate-500">B1.Mục tiêu</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPersonStep(row.person.id, 'step2_evaluation')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-xs font-extrabold text-indigo-600">
                      {row.pEvalCount}/{row.pObjs.length}
                    </div>
                    <div className="text-[10px] text-slate-500">B2.Đánh giá</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPersonStep(row.person.id, 'step3_plan')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-xs font-extrabold text-amber-600">{row.pTasks.length}</div>
                    <div className="text-[10px] text-slate-500">B3.Kế hoạch</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => openPersonStep(row.person.id, 'step4_gantt')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="text-xs font-extrabold text-emerald-600">
                      {row.pAvgProgress}%
                    </div>
                    <div className="text-[10px] text-slate-500">B4.Tiến độ</div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          4. THEO DÕI LIÊN THÔNG XUYÊN SUỐT 4 BƯỚC (BƯỚC 1 -> BƯỚC 2 -> BƯỚC 3 -> BƯỚC 4)
         ===================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              THEO DÕI CHI TIẾT XUYÊN SUỐT 4 BƯỚC TRÊN 1 MÀN HÌNH
            </span>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
              Chuỗi liên kết: Bước 1 (Mục tiêu) → Bước 2 (Thực trạng) → Bước 3 (Kế hoạch) → Bước 4 (Tiến độ)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <select
              value={selectedPersonIdForDrilldown}
              onChange={(e) => setSelectedPersonIdForDrilldown(e.target.value)}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
            >
              <option value="all">Tất cả nhân sự đang lọc ({scopedObjectives.length} chỉ tiêu)</option>
              {scopedPeople.map((p) => (
                <option key={p.id} value={p.id}>
                  [{getRoleBadge(p.role).label}] {p.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {drilldownObjectives.map((obj) => {
            const period = allPeriods.find((p) => p.id === obj.period_id);
            const owner = profiles.find((u) => u.id === period?.user_id);
            const roleBadge = owner ? getRoleBadge(owner.role) : null;
            const objTasks = scopedTasks.filter((t) => t.objective_id === obj.id);
            const objAvg =
              objTasks.length > 0
                ? Math.round(objTasks.reduce((s, t) => s + t.progress, 0) / objTasks.length)
                : 0;

            return (
              <div
                key={obj.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-800/30"
              >
                {/* Thanh tiêu đề của Chỉ tiêu */}
                <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {roleBadge && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${roleBadge.className}`}
                      >
                        {roleBadge.label}: {owner?.full_name}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded text-xs font-extrabold bg-blue-900 text-white">
                      Chỉ tiêu #{obj.seq}
                    </span>
                    <span className="text-xs text-slate-500">
                      Hạn: <strong>{formatDateVN(obj.deadline)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                      Tiến độ tổng hợp: {objAvg}%
                    </span>
                    {owner && (
                      <button
                        type="button"
                        onClick={() => openPersonStep(owner.id, 'step1_objectives')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 text-blue-600 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 cursor-pointer"
                      >
                        Chỉnh sửa →
                      </button>
                    )}
                  </div>
                </div>

                {/* Lưới 4 cột tương ứng Bước 1 -> Bước 2 -> Bước 3 -> Bước 4 */}
                <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-3 text-xs">
                  {/* Cột Bước 1 */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 space-y-1.5">
                    <div className="font-extrabold text-blue-700 dark:text-blue-400 uppercase flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> Bước 1: Mục tiêu
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white leading-snug">
                      {obj.title}
                    </p>
                    <p className="text-slate-500">
                      <strong>KQ cần đạt:</strong> {obj.expected_result}
                    </p>
                  </div>

                  {/* Cột Bước 2 */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-800 space-y-1.5">
                    <div className="font-extrabold text-indigo-700 dark:text-indigo-400 uppercase flex items-center gap-1">
                      <SearchCheck className="w-3.5 h-3.5" /> Bước 2: Thực trạng, Nguyên nhân & Giải pháp
                    </div>
                    <p className="text-slate-700 dark:text-slate-300">
                      <strong>Thực trạng:</strong>{' '}
                      {obj.current_status || <span className="italic text-amber-600">Chưa nhập</span>}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>Nguyên nhân:</strong>{' '}
                      {obj.root_cause || <span className="italic text-amber-600">Chưa nhập</span>}
                    </p>
                    <p className="text-emerald-700 dark:text-emerald-400">
                      <strong>Giải pháp:</strong>{' '}
                      {obj.solution || <span className="italic text-amber-600">Chưa nhập</span>}
                    </p>
                  </div>

                  {/* Cột Bước 3 */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-100 dark:border-slate-800 space-y-1.5">
                    <div className="font-extrabold text-amber-700 dark:text-amber-400 uppercase flex items-center gap-1">
                      <ClipboardList className="w-3.5 h-3.5" /> Bước 3: Kế hoạch ({objTasks.length} việc)
                    </div>
                    {objTasks.length === 0 ? (
                      <p className="italic text-slate-400">Chưa có đầu việc kế hoạch</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {objTasks.map((t) => (
                          <li
                            key={t.id}
                            className="text-slate-800 dark:text-slate-200 flex items-start justify-between gap-1"
                          >
                            <span className="line-clamp-2">
                              • {t.title} ({formatDateVN(t.end_date)})
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Cột Bước 4 & 4.1 */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 space-y-2">
                    <div className="font-extrabold text-emerald-700 dark:text-emerald-400 uppercase flex items-center gap-1">
                      <GanttChartSquare className="w-3.5 h-3.5" /> Bước 4: Tiến độ & Nhật ký
                    </div>
                    {objTasks.map((t) => {
                      const meta = getTaskStatusMeta(t.status);
                      return (
                        <div key={t.id} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="truncate max-w-[140px] font-semibold">{t.title}</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold border ${meta.badgeClass}`}>
                              {t.progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${meta.barClass}`}
                              style={{ width: `${t.progress}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {owner && (
                      <button
                        type="button"
                        onClick={() => {
                          if (period) setSelectedPeriodId(period.id);
                          openQuickLogModal(objTasks[0]?.id || null, SYSTEM_TODAY);
                        }}
                        className="w-full mt-1 py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 text-blue-700 dark:text-blue-300 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <NotebookPen className="w-3 h-3" /> + Ghi nhật ký 4.1
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          5. BIỂU ĐỒ SO SÁNH TIẾN ĐỘ 4 BƯỚC & CẢNH BÁO CÔNG VIỆC TRỄ HẠN
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Biểu đồ Tỷ lệ Đánh giá Bước 2 & Tiến độ Bước 4 theo Nhân sự (3 Cấp)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            So sánh trực quan mức độ hoàn thành Đánh giá chỉ tiêu (Bước 2) và Tiến độ thực tế (Bước 4)
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartByPersonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                <Tooltip />
                <Bar
                  dataKey="buoc2DanhGia"
                  name="Bước 2: % Đánh giá thực trạng"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="buoc4TienDo"
                  name="Bước 4: % Tiến độ hoàn thành"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CẢNH BÁO TRỄ HẠN & TRA CỨU NHẬT KÝ */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Cảnh báo Công việc Trễ hạn ({overdueTasks.length}) & Nguy cơ ({atRiskObjectives.length})
            </h3>
            <Award className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto">
            {overdueTasks.map((t) => {
              const assignee = profiles.find((p) => p.id === t.assignee_id);
              return (
                <div
                  key={t.id}
                  className="p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">
                      TRỄ HẠN • {t.progress}%
                    </span>
                    <span className="font-bold text-rose-700 dark:text-rose-300">
                      Hạn: {formatDateVN(t.end_date)}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">{t.title}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Phụ trách: {assignee?.full_name}</span>
                    {assignee && (
                      <button
                        type="button"
                        onClick={() => openPersonStep(assignee.id, 'step4_gantt')}
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                      >
                        Mở Gantt →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tìm kiếm nhanh nhật ký */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Tra cứu nhanh nhật ký công việc của GĐ, TP, Tổ trưởng..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
              />
            </div>
            {logSearch.trim() && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {scopedLogs
                  .filter((l) => l.content.toLowerCase().includes(logSearch.toLowerCase()))
                  .slice(0, 5)
                  .map((l) => {
                    const u = profiles.find((p) => p.id === l.user_id);
                    return (
                      <div
                        key={l.id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs"
                      >
                        <strong className="text-blue-600">{u?.full_name}</strong> ({formatDateVN(l.log_date)}):{' '}
                        {l.content}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

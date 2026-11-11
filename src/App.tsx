import React, { useState } from 'react';
import {
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Download,
  FilePlus2,
  FileSpreadsheet,
  FolderKanban,
  GanttChartSquare,
  GitFork,
  LayoutDashboard,
  LogOut,
  Moon,
  NotebookPen,
  Save,
  SearchCheck,
  Settings,
  Sun,
  Target,
  UserCheck,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { AdminView } from './components/AdminView';
import { ApprovalsView } from './components/ApprovalsView';
import { CascadeView } from './components/CascadeView';
import { DailyLogsView } from './components/DailyLogsView';
import { DashboardView } from './components/DashboardView';
import { LoginScreen } from './components/LoginScreen';
import { MyPeriodOverview } from './components/MyPeriodOverview';
import { QuickLogModal } from './components/QuickLogModal';
import { Step1ObjectivesView } from './components/Step1ObjectivesView';
import { Step2EvaluationView } from './components/Step2EvaluationView';
import { Step3PlanView } from './components/Step3PlanView';
import { Step4GanttView } from './components/Step4GanttView';
import { TodayView } from './components/TodayView';
import { AppProvider, useApp } from './context/AppContext';
import { NavigationTab } from './types';
import { formatDateTimeVN, getPeriodStatusMeta } from './utils/dateUtils';
import { exportPeriodToExcel } from './utils/excelExport';

const MainShell: React.FC = () => {
  const {
    currentUser,
    logout,
    switchDemoUser,
    switchToMyOwnPeriod,
    activeTab,
    setActiveTab,
    darkMode,
    toggleDarkMode,
    isOfflineMode,
    toggleOfflineMode,
    lastSavedAt,
    isSaving,
    saveAllDataNow,
    exportDatabaseJson,
    selectedPeriodId,
    setSelectedPeriodId,
    currentPeriod,
    myOwnPeriod,
    visiblePeriods,
    departments,
    profiles,
    objectives,
    tasks,
    dailyLogs,
    notifications,
    markAllNotificationsRead,
    openQuickLogModal,
    settings,
    toasts,
    dismissToast,
    showToast,
  } = useApp();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  if (!currentUser) {
    return <LoginScreen />;
  }

  const userNotifications = notifications.filter((n) => n.user_id === currentUser.id);
  const unreadCount = userNotifications.filter((n) => !n.read).length;

  const periodOwner =
    profiles.find((p) => p.id === currentPeriod?.user_id) || currentUser;
  const periodDept =
    departments.find((d) => d.id === currentPeriod?.department_id) || departments[0];
  const periodApprover =
    profiles.find((p) => p.id === currentPeriod?.approved_by) || null;
  const periodStatusMeta = currentPeriod
    ? getPeriodStatusMeta(currentPeriod.status)
    : null;

  const pendingLogsCount = dailyLogs.filter((l) => l.sync_status === 'pending').length;

  const handleQuickExportExcel = async () => {
    if (!currentPeriod) return;
    await exportPeriodToExcel({
      period: currentPeriod,
      employee: periodOwner,
      department: periodDept,
      approver: periodApprover,
      objectives,
      tasks,
      logs: dailyLogs,
      profiles,
      settings,
    });
    showToast(
      'Đã tải xuống file Excel (.xlsx) 5 Sheet!',
      `Bao_Cao_4_Buoc_VPS_T${currentPeriod.month}_${currentPeriod.year}`
    );
  };

  const canSeeApprovals =
    currentUser.role === 'manager' ||
    currentUser.role === 'leader' ||
    currentUser.role === 'admin';

  const getRoleShortTag = (role?: string) => {
    if (role === 'leader') return 'GIÁM ĐỐC';
    if (role === 'manager') return 'TRƯỞNG PHÒNG';
    if (role === 'admin') return 'ADMIN';
    return 'TỔ TRƯỞNG';
  };

  const navGroups: {
    groupTitle: string;
    items: {
      id: NavigationTab;
      label: string;
      shortLabel: string;
      icon: React.ReactNode;
      badge?: string | number;
    }[];
  }[] = [
    {
      groupTitle: 'Theo dõi & Báo cáo nhanh',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard Theo dõi 4 Bước',
          shortLabel: 'Dashboard',
          icon: <LayoutDashboard className="w-4 h-4 text-amber-400" />,
          badge: '3 Cấp',
        },
        {
          id: 'cascade',
          label: 'Sơ đồ Phân rã Mục tiêu 3 Cấp',
          shortLabel: 'Phân rã 3 Cấp',
          icon: <GitFork className="w-4 h-4 text-emerald-400" />,
          badge: 'Hoshin',
        },
        {
          id: 'today',
          label: 'Hôm nay (Việc cần làm)',
          shortLabel: 'Hôm nay',
          icon: <Calendar className="w-4 h-4" />,
        },
        {
          id: 'daily_logs',
          label: '5. Nhật ký công việc (4.1)',
          shortLabel: 'Nhật ký 5',
          icon: <NotebookPen className="w-4 h-4" />,
          badge: dailyLogs.length,
        },
      ],
    },
    {
      groupTitle: `Nhập & Quản lý 4 Bước (${periodOwner.full_name.split(' ').slice(-2).join(' ')})`,
      items: [
        {
          id: 'step1_objectives',
          label: 'Bước 1: Mục tiêu tổng thể',
          shortLabel: 'Bước 1',
          icon: <Target className="w-4 h-4" />,
          badge: objectives.length,
        },
        {
          id: 'step2_evaluation',
          label: 'Bước 2: Đánh giá chỉ tiêu',
          shortLabel: 'Bước 2',
          icon: <SearchCheck className="w-4 h-4" />,
        },
        {
          id: 'step3_plan',
          label: 'Bước 3: Kế hoạch thực hiện',
          shortLabel: 'Bước 3',
          icon: <ClipboardList className="w-4 h-4" />,
          badge: tasks.length,
        },
        {
          id: 'step4_gantt',
          label: 'Bước 4: Tiến độ (Gantt)',
          shortLabel: 'Bước 4 Gantt',
          icon: <GanttChartSquare className="w-4 h-4" />,
        },
        {
          id: 'my_period',
          label: 'Biểu mẫu & Xuất 5 Sheet',
          shortLabel: 'Biểu mẫu',
          icon: <FolderKanban className="w-4 h-4" />,
        },
      ],
    },
  ];

  if (canSeeApprovals) {
    navGroups.push({
      groupTitle: 'Phê duyệt & Quản trị',
      items: [
        {
          id: 'approvals',
          label: 'Duyệt báo cáo & Giao việc',
          shortLabel: 'Duyệt BC',
          icon: <ClipboardCheck className="w-4 h-4" />,
          badge: visiblePeriods.filter((p) => p.status === 'submitted').length || undefined,
        },
        ...(currentUser.role === 'admin' || currentUser.role === 'leader'
          ? [
              {
                id: 'admin' as NavigationTab,
                label: 'Quản trị hệ thống & CSDL',
                shortLabel: 'Quản trị',
                icon: <Settings className="w-4 h-4" />,
              },
            ]
          : []),
      ],
    });
  }

  const isViewingOwnPeriod = currentPeriod?.user_id === currentUser.id;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* =====================================================================
          SIDEBAR BÊN TRÁI TRÊN MÁY TÍNH (DESKTOP >= 1024px)
         ===================================================================== */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-slate-900 text-white border-r border-slate-800 z-30">
        {/* Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
              VĂN PHÒNG VPS • 3 CẤP
            </div>
            <div className="font-extrabold text-sm leading-tight text-white">
              Quản Trị Mục Tiêu 4 Bước
            </div>
          </div>
        </div>

        {/* Bộ chọn Kỳ báo cáo (Giám đốc / Trưởng phòng / Tổ trưởng) */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Hồ sơ 4 bước đang mở:
            </label>
            {!isViewingOwnPeriod && myOwnPeriod && (
              <button
                type="button"
                onClick={switchToMyOwnPeriod}
                className="text-[10px] font-extrabold text-amber-400 hover:underline cursor-pointer"
              >
                ← Về hồ sơ của tôi
              </button>
            )}
          </div>

          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            {visiblePeriods.map((p) => {
              const u = profiles.find((prof) => prof.id === p.user_id);
              const tag = getRoleShortTag(u?.role);
              return (
                <option key={p.id} value={p.id}>
                  [{tag}] {u?.full_name} (T{p.month}/{p.year})
                </option>
              );
            })}
          </select>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => openQuickLogModal(null)}
              className="py-2 px-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-amber-300" />
              + Nhật ký
            </button>
            <button
              type="button"
              onClick={() => saveAllDataNow(false)}
              className="py-2 px-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Lưu CSDL
            </button>
          </div>
        </div>

        {/* Menu điều hướng */}
        <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                {group.groupTitle}
              </div>
              {group.items.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </span>
                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Thông tin người dùng đang đăng nhập */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-amber-400 text-slate-950 uppercase">
                {getRoleShortTag(currentUser.role)}
              </span>
              <div className="text-xs font-extrabold text-white truncate mt-0.5">
                {currentUser.full_name}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {currentUser.job_title}
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition"
              title="Đăng xuất / Đổi tài khoản"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[10px] text-emerald-400 flex items-center justify-between pt-1 border-t border-slate-800">
            <span>✓ Đã lưu tự động lúc {lastSavedAt}</span>
            <button
              type="button"
              onClick={exportDatabaseJson}
              className="text-blue-400 hover:underline flex items-center gap-0.5"
              title="Tải file sao lưu JSON"
            >
              <Download className="w-3 h-3" /> Backup
            </button>
          </div>
        </div>
      </aside>

      {/* =====================================================================
          MAIN WORKSPACE (CỘT PHẢI TRÊN DESKTOP / TOÀN MÀN HÌNH TRÊN MOBILE)
         ===================================================================== */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen pb-24 lg:pb-10">
        {/* TOP HEADER BAR */}
        <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Tiêu đề chung của 5 Sheet */}
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-9 h-9 rounded-xl bg-blue-800 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                VPS
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    {settings.company_title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-900 text-amber-300">
                    {getRoleShortTag(periodOwner.role)}: {periodOwner.full_name}
                  </span>
                  {periodStatusMeta && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${periodStatusMeta.badgeClass}`}
                    >
                      {periodStatusMeta.label}
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex flex-wrap items-center gap-x-2">
                  <span>{periodDept?.name}</span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-blue-700 dark:text-blue-400">
                    Kỳ Tháng {currentPeriod?.month} năm {currentPeriod?.year}
                  </span>
                </div>
              </div>
            </div>

            {/* Cụm công cụ: Đổi nhanh Cấp bậc (Giám đốc / Trưởng phòng / Tổ trưởng), Lưu dữ liệu, Xuất Excel */}
            <div className="flex items-center gap-2">
              {/* Chuyển nhanh người dùng (Giám đốc / Trưởng phòng / Tổ trưởng) */}
              <div className="hidden sm:flex items-center gap-1.5 bg-blue-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-blue-200 dark:border-slate-700">
                <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-500 hidden xl:inline">
                  Đang đăng nhập:
                </span>
                <select
                  value={currentUser.id}
                  onChange={(e) => switchDemoUser(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-blue-900 dark:text-blue-300 outline-none cursor-pointer"
                >
                  {profiles.map((u) => (
                    <option key={u.id} value={u.id} className="text-slate-900">
                      [{getRoleShortTag(u.role)}] {u.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nút Lưu dữ liệu ngay */}
              <button
                type="button"
                onClick={() => saveAllDataNow(false)}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Lưu toàn bộ thông tin đã nhập vào Cơ sở dữ liệu"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {isSaving ? 'Đang lưu...' : `Lưu (${lastSavedAt})`}
                </span>
              </button>

              {/* Nút Xuất nhanh Excel 5 Sheet */}
              <button
                type="button"
                onClick={handleQuickExportExcel}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                title="Xuất file Excel (.xlsx) đúng chuẩn 5 sheet mẫu"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Xuất Excel</span>
              </button>

              {/* Nút bật/tắt Offline Mode (PWA) */}
              <button
                type="button"
                onClick={toggleOfflineMode}
                className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-1 transition cursor-pointer ${
                  isOfflineMode
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                title="Chế độ ghi nhật ký Offline khi mạng yếu (PWA)"
              >
                {isOfflineMode ? (
                  <>
                    <WifiOff className="w-4 h-4 text-amber-600" />
                    {pendingLogsCount > 0 && <span>{pendingLogsCount}</span>}
                  </>
                ) : (
                  <Wifi className="w-4 h-4 text-emerald-600" />
                )}
              </button>

              {/* Chuông thông báo */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifDropdown((prev) => !prev);
                    if (!showNotifDropdown) markAllNotificationsRead();
                  }}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 relative cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center absolute -top-1 -right-1">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifDropdown && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                        Thông báo của bạn ({userNotifications.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowNotifDropdown(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {userNotifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">
                          Không có thông báo mới.
                        </p>
                      ) : (
                        userNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (n.tab_target) setActiveTab(n.tab_target);
                              setShowNotifDropdown(false);
                            }}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition space-y-0.5"
                          >
                            <div className="font-bold text-xs text-slate-900 dark:text-white">
                              {n.title}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300">{n.body}</p>
                            <span className="text-[10px] text-slate-400 block">
                              {formatDateTimeVN(n.created_at)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Nút Dark mode */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 cursor-pointer"
                title="Chế độ Sáng / Tối"
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Thanh chọn nhanh Vai trò & Kỳ báo cáo trên Điện thoại */}
          <div className="flex sm:hidden items-center gap-2 mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <select
              value={currentUser.id}
              onChange={(e) => switchDemoUser(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {profiles.map((u) => (
                <option key={u.id} value={u.id}>
                  [{getRoleShortTag(u.role)}] {u.full_name}
                </option>
              ))}
            </select>

            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-slate-700"
            >
              {visiblePeriods.map((p) => {
                const u = profiles.find((prof) => prof.id === p.user_id);
                return (
                  <option key={p.id} value={p.id}>
                    T{p.month}/{p.year} • {u?.full_name.split(' ').slice(-2).join(' ')}
                  </option>
                );
              })}
            </select>
          </div>
        </header>

        {/* THANH SƠ ĐỒ VÒNG KHÉP KÍN: DASHBOARD + 4 BƯỚC + 4.1 NHẬT KÝ */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max text-xs">
            {[
              { id: 'dashboard' as NavigationTab, step: 'Dashboard', title: 'Theo dõi 4 Bước (GĐ - TP - Tổ trưởng)' },
              { id: 'cascade' as NavigationTab, step: '3 Cấp', title: 'Phân rã GĐ → TP → Tổ trưởng' },
              { id: 'step1_objectives' as NavigationTab, step: 'Bước 1', title: 'Mục tiêu tổng thể' },
              { id: 'step2_evaluation' as NavigationTab, step: 'Bước 2', title: 'Đánh giá thực trạng & Giải pháp' },
              { id: 'step3_plan' as NavigationTab, step: 'Bước 3', title: 'Kế hoạch thực hiện' },
              { id: 'step4_gantt' as NavigationTab, step: 'Bước 4', title: 'Bảng Tiến độ (Gantt)' },
              { id: 'daily_logs' as NavigationTab, step: 'Sheet 5', title: 'Nhật ký công việc' },
            ].map((s, idx) => {
              const isCurrent = activeTab === s.id;
              return (
                <React.Fragment key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActiveTab(s.id)}
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700 font-medium'
                    }`}
                  >
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                        isCurrent
                          ? 'bg-white/20 text-white'
                          : 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400'
                      }`}
                    >
                      {s.step}
                    </span>
                    <span>{s.title}</span>
                  </button>
                  {idx < 6 && (
                    <span className="text-slate-300 dark:text-slate-700 font-bold">
                      {idx <= 1 ? '|' : idx === 5 ? '←' : '→'}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* MAIN PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {activeTab === 'today' && <TodayView />}
          {activeTab === 'daily_logs' && <DailyLogsView />}
          {activeTab === 'step1_objectives' && <Step1ObjectivesView />}
          {activeTab === 'step2_evaluation' && <Step2EvaluationView />}
          {activeTab === 'step3_plan' && <Step3PlanView />}
          {activeTab === 'step4_gantt' && <Step4GanttView />}
          {activeTab === 'my_period' && <MyPeriodOverview />}
          {activeTab === 'approvals' && <ApprovalsView />}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'cascade' && <CascadeView />}
          {activeTab === 'admin' && <AdminView />}
        </main>
      </div>

      {/* =====================================================================
          NÚT NỔI (+) CỐ ĐỊNH TRÊN ĐIỆN THOẠI & THANH TAB DƯỚI ĐÁY (< 1024px)
         ===================================================================== */}
      <button
        type="button"
        onClick={() => openQuickLogModal(null)}
        className="lg:hidden fixed right-4 bottom-20 z-30 flex items-center gap-1.5 px-4 py-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xl shadow-blue-600/40 active:scale-95 transition"
      >
        <FilePlus2 className="w-5 h-5 text-amber-300" />
        <span>+ Ghi Nhật Ký</span>
      </button>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 px-1 py-1.5">
        {[
          {
            id: 'dashboard' as NavigationTab,
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />,
          },
          {
            id: 'step1_objectives' as NavigationTab,
            label: 'B1-B2 Mục tiêu',
            icon: <Target className="w-5 h-5" />,
          },
          {
            id: 'step3_plan' as NavigationTab,
            label: 'B3 Kế hoạch',
            icon: <ClipboardList className="w-5 h-5" />,
          },
          {
            id: 'step4_gantt' as NavigationTab,
            label: 'B4 Gantt',
            icon: <GanttChartSquare className="w-5 h-5" />,
          },
          {
            id: 'daily_logs' as NavigationTab,
            label: 'Nhật ký 5',
            icon: <NotebookPen className="w-5 h-5" />,
          },
        ].map((tab) => {
          const isAct = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition ${
                isAct
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* MODAL THÊM NHANH NHẬT KÝ 4.1 TOÀN CỤC */}
      <QuickLogModal />

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto p-3.5 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-700 flex items-start gap-2.5 animate-fadeIn"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="font-bold">{t.title}</div>
              {t.description && <div className="text-slate-300 mt-0.5">{t.description}</div>}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainShell />
    </AppProvider>
  );
}

export default App;

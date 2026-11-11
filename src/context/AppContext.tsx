import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_COMMENTS,
  INITIAL_DAILY_LOGS,
  INITIAL_DEPARTMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_OBJECTIVES,
  INITIAL_PERIODS,
  INITIAL_PROFILES,
  INITIAL_SETTINGS,
  INITIAL_SUBMISSIONS,
  INITIAL_TASKS,
} from '../data/mockData';
import {
  AttachmentItem,
  AuditLogItem,
  CommentItem,
  DailyLog,
  DailySubmission,
  Department,
  NavigationTab,
  NotificationItem,
  Objective,
  PeriodStatus,
  Profile,
  ReportPeriod,
  SystemSettings,
  TaskItem,
} from '../types';
import { computeTaskStatus, SYSTEM_TODAY } from '../utils/dateUtils';

const STORAGE_KEY = 'vps_smart_office_4steps_state_v2';

interface QuickLogPreset {
  isOpen: boolean;
  taskId?: string | null;
  logDate?: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}

interface AppContextType {
  // Auth & Current Context
  currentUser: Profile | null;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  switchDemoUser: (userId: string) => void;
  switchToMyOwnPeriod: () => void;

  // Navigation & UI
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isOfflineMode: boolean;
  toggleOfflineMode: () => void;
  syncPendingOfflineLogs: () => void;

  // Persistence Status & Actions
  lastSavedAt: string;
  isSaving: boolean;
  saveAllDataNow: (silent?: boolean) => Promise<void>;
  exportDatabaseJson: () => void;
  importDatabaseJson: (jsonText: string) => boolean;

  // Selected Period
  selectedPeriodId: string;
  setSelectedPeriodId: (id: string) => void;
  currentPeriod: ReportPeriod | null;
  myOwnPeriod: ReportPeriod | null;
  canEditCurrentPeriod: boolean;

  // Data collections
  departments: Department[];
  profiles: Profile[];
  visiblePeriods: ReportPeriod[];
  allPeriods: ReportPeriod[];
  objectives: Objective[];
  tasks: TaskItem[];
  dailyLogs: DailyLog[];
  allObjectives: Objective[];
  allTasks: TaskItem[];
  allDailyLogs: DailyLog[];
  dailySubmissions: DailySubmission[];
  comments: CommentItem[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
  settings: SystemSettings;

  // Quick Add Daily Log Modal
  quickLogModal: QuickLogPreset;
  openQuickLogModal: (taskId?: string | null, logDate?: string) => void;
  closeQuickLogModal: () => void;

  // Toast Notifications
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;

  // Actions: Step 1 & Step 2 (Objectives)
  addObjective: (data: {
    periodId?: string;
    title: string;
    expected_result: string;
    deadline: string;
    current_status?: string;
    root_cause?: string;
    solution?: string;
    parent_objective_id?: string | null;
  }) => void;
  updateObjective: (id: string, patch: Partial<Objective>) => void;
  deleteObjective: (id: string) => void;
  copyObjectivesFromPreviousMonth: () => void;

  // Actions: Step 3 (Tasks)
  addTask: (data: {
    objective_id: string;
    title: string;
    start_date: string;
    end_date: string;
    assignee_id: string;
    assignee_name?: string;
    expected_output: string;
    progress?: number;
  }) => boolean;
  updateTask: (id: string, patch: Partial<TaskItem>) => boolean;
  deleteTask: (id: string) => void;

  // Actions: 4.1 Daily Logs & Submissions
  addDailyLog: (data: {
    log_date: string;
    task_id: string | null;
    content: string;
    progress_after?: number;
    hours?: number;
    issues?: string;
    attachments?: AttachmentItem[];
  }) => boolean;
  deleteDailyLog: (id: string) => void;
  submitDailyReport: (dateStr?: string, note?: string) => void;
  sendReminderToUser: (targetUserId: string) => void;

  // Actions: Period Workflow
  changePeriodStatus: (periodId: string, newStatus: PeriodStatus, note?: string) => void;
  createOrOpenPeriod: (userId: string, month: number, year: number) => ReportPeriod;

  // Actions: Comments & Notifications
  addComment: (data: {
    period_id: string;
    objective_id?: string | null;
    task_id?: string | null;
    log_id?: string | null;
    body: string;
  }) => void;
  markAllNotificationsRead: () => void;

  // Actions: Admin Management
  addProfile: (profileData: Omit<Profile, 'id'>) => void;
  updateProfile: (id: string, patch: Partial<Profile>) => void;
  addDepartment: (code: string, name: string) => void;
  updateSettings: (patch: Partial<SystemSettings>) => void;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Chuyển đổi dữ liệu đã lưu từ phiên bản cũ:
 * - Vai trò 'employee' (Nhân viên) -> 'team_lead' (Tổ trưởng)
 * - Bổ sung cột "Giải pháp" (Bước 2) và liên kết chỉ tiêu cấp trên cho các chỉ tiêu cũ
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateState(data: any) {
  if (!data) return data;
  if (Array.isArray(data.profiles)) {
    data.profiles = data.profiles.map((p: Profile & { role: string }) => {
      if ((p.role as string) !== 'employee') return p;
      const seed = INITIAL_PROFILES.find((s) => s.id === p.id);
      return seed ? { ...p, role: 'team_lead', job_title: seed.job_title, team_name: seed.team_name } : { ...p, role: 'team_lead' };
    });
  }
  if (Array.isArray(data.allObjectives)) {
    data.allObjectives = data.allObjectives.map((o: Objective) => {
      const seed = INITIAL_OBJECTIVES.find((s) => s.id === o.id);
      return {
        ...o,
        solution: o.solution ?? seed?.solution ?? '',
        parent_objective_id: o.parent_objective_id !== undefined ? o.parent_objective_id : seed?.parent_objective_id ?? null,
      };
    });
  }
  return data;
}

function getNowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(
    d.getSeconds()
  ).padStart(2, '0')}`;
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadStored = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return migrateState(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Failed to read local storage', e);
    }
    return null;
  };

  const saved = useMemo(() => loadStored(), []);

  const [departments, setDepartments] = useState<Department[]>(saved?.departments || INITIAL_DEPARTMENTS);
  const [profiles, setProfiles] = useState<Profile[]>(saved?.profiles || INITIAL_PROFILES);
  const [allPeriods, setAllPeriods] = useState<ReportPeriod[]>(saved?.allPeriods || INITIAL_PERIODS);
  const [allObjectives, setAllObjectives] = useState<Objective[]>(saved?.allObjectives || INITIAL_OBJECTIVES);
  const [allTasks, setAllTasks] = useState<TaskItem[]>(saved?.allTasks || INITIAL_TASKS);
  const [allDailyLogs, setAllDailyLogs] = useState<DailyLog[]>(saved?.allDailyLogs || INITIAL_DAILY_LOGS);
  const [dailySubmissions, setDailySubmissions] = useState<DailySubmission[]>(
    saved?.dailySubmissions || INITIAL_SUBMISSIONS
  );
  const [comments, setComments] = useState<CommentItem[]>(saved?.comments || INITIAL_COMMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    saved?.notifications || INITIAL_NOTIFICATIONS
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(saved?.auditLogs || INITIAL_AUDIT_LOGS);
  const [settings, setSettings] = useState<SystemSettings>(saved?.settings || INITIAL_SETTINGS);

  const [currentUserId, setCurrentUserId] = useState<string | null>(saved?.currentUserId ?? 'user-long');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    saved?.selectedPeriodId || 'period-long-2026-11'
  );
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(saved?.darkMode || false);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);

  const [lastSavedAt, setLastSavedAt] = useState<string>(getNowTimeStr());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const isHydratedFromServer = useRef<boolean>(false);

  const [quickLogModal, setQuickLogModal] = useState<QuickLogPreset>({
    isOpen: false,
    taskId: null,
    logDate: SYSTEM_TODAY,
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (title: string, description?: string, type: ToastMessage['type'] = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Khi khởi động: kiểm tra xem trên ổ đĩa máy chủ (/api/db -> data/database.json) đã có dữ liệu lưu chưa
  useEffect(() => {
    fetch('/api/db')
      .then((r) => {
        const ct = r.headers.get('content-type') || '';
        if (!r.ok || !ct.includes('application/json')) return null;
        return r.json();
      })
      .then((rawServerData) => {
        if (!rawServerData) return;
        const serverData = migrateState(rawServerData);
        if (serverData && !serverData.empty && serverData.allPeriods && serverData.allObjectives) {
          setDepartments(serverData.departments || INITIAL_DEPARTMENTS);
          setProfiles(serverData.profiles || INITIAL_PROFILES);
          setAllPeriods(serverData.allPeriods);
          setAllObjectives(serverData.allObjectives);
          setAllTasks(serverData.allTasks || []);
          setAllDailyLogs(serverData.allDailyLogs || []);
          setDailySubmissions(serverData.dailySubmissions || []);
          setComments(serverData.comments || []);
          setNotifications(serverData.notifications || []);
          setAuditLogs(serverData.auditLogs || []);
          setSettings(serverData.settings || INITIAL_SETTINGS);
          setLastSavedAt(getNowTimeStr());
        }
      })
      .catch(() => {
        // Fallback localStorage nếu chạy static
      })
      .finally(() => {
        isHydratedFromServer.current = true;
      });
  }, []);

  // Hàm lưu toàn bộ dữ liệu vào cả LocalStorage VÀ Ổ đĩa Server (/api/db -> data/database.json)
  const saveAllDataNow = useCallback(
    async (silent = false) => {
      const payload = {
        departments,
        profiles,
        allPeriods,
        allObjectives,
        allTasks,
        allDailyLogs,
        dailySubmissions,
        comments,
        notifications,
        auditLogs,
        settings,
        currentUserId,
        selectedPeriodId,
        darkMode,
        updatedAt: new Date().toISOString(),
      };

      try {
        setIsSaving(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload, null, 2),
        }).catch(() => {});
        const timeStr = getNowTimeStr();
        setLastSavedAt(timeStr);
        if (!silent) {
          showToast(
            'Đã lưu toàn bộ dữ liệu thành công!',
            `Dữ liệu 4 bước của Tổ trưởng, Trưởng phòng & Giám đốc đã được ghi xuống CSDL lúc ${timeStr}.`,
            'success'
          );
        }
      } catch (e) {
        console.error('Save error', e);
      } finally {
        setIsSaving(false);
      }
    },
    [
      departments,
      profiles,
      allPeriods,
      allObjectives,
      allTasks,
      allDailyLogs,
      dailySubmissions,
      comments,
      notifications,
      auditLogs,
      settings,
      currentUserId,
      selectedPeriodId,
      darkMode,
      showToast,
    ]
  );

  // Tự động lưu mỗi khi người dùng nhập hoặc sửa bất kỳ dữ liệu nào
  useEffect(() => {
    try {
      const payload = {
        departments,
        profiles,
        allPeriods,
        allObjectives,
        allTasks,
        allDailyLogs,
        dailySubmissions,
        comments,
        notifications,
        auditLogs,
        settings,
        currentUserId,
        selectedPeriodId,
        darkMode,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setLastSavedAt(getNowTimeStr());

      if (isHydratedFromServer.current) {
        fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload, null, 2),
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Auto-save failed', e);
    }
  }, [
    departments,
    profiles,
    allPeriods,
    allObjectives,
    allTasks,
    allDailyLogs,
    dailySubmissions,
    comments,
    notifications,
    auditLogs,
    settings,
    currentUserId,
    selectedPeriodId,
    darkMode,
  ]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const appendAudit = (tableName: string, recordId: string, action: string, summary: string) => {
    const newAudit: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: currentUserId || 'system',
      table_name: tableName,
      record_id: recordId,
      action,
      summary,
      created_at: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const currentUser = useMemo(
    () => profiles.find((p) => p.id === currentUserId) || null,
    [profiles, currentUserId]
  );

  // Kỳ báo cáo 4 bước của chính người đang đăng nhập (Dù là Tổ trưởng, Trưởng phòng hay Giám đốc!)
  const myOwnPeriod = useMemo(() => {
    if (!currentUser) return null;
    return (
      allPeriods.find(
        (p) => p.user_id === currentUser.id && p.month === 11 && p.year === 2026
      ) ||
      allPeriods.find((p) => p.user_id === currentUser.id) ||
      null
    );
  }, [allPeriods, currentUser]);

  // Danh sách các kỳ báo cáo mà người dùng hiện tại được quyền xem
  const visiblePeriods = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'team_lead') {
      return allPeriods.filter((p) => p.user_id === currentUser.id);
    }
    if (currentUser.role === 'manager') {
      // Trưởng phòng thấy kỳ báo cáo của chính mình VÀ toàn bộ nhân sự trong phòng mình
      return allPeriods.filter(
        (p) =>
          p.user_id === currentUser.id ||
          p.department_id === currentUser.department_id
      );
    }
    // Giám đốc (leader) & Admin thấy kỳ báo cáo của chính mình, các Trưởng phòng và toàn bộ Tổ trưởng
    return allPeriods;
  }, [allPeriods, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const isAllowed = visiblePeriods.some((p) => p.id === selectedPeriodId);
    if (!isAllowed && visiblePeriods.length > 0) {
      const ownNov = visiblePeriods.find(
        (p) => p.user_id === currentUser.id && p.month === 11 && p.year === 2026
      );
      setSelectedPeriodId((ownNov || visiblePeriods[0]).id);
    }
  }, [currentUser, visiblePeriods, selectedPeriodId]);

  const currentPeriod = useMemo(
    () => visiblePeriods.find((p) => p.id === selectedPeriodId) || visiblePeriods[0] || null,
    [visiblePeriods, selectedPeriodId]
  );

  /**
   * QUYỀN NHẬP LIỆU & LƯU THÔNG TIN 4 BƯỚC:
   * - Cả Tổ trưởng, Trưởng phòng, Giám đốc, Admin đều được quyền nhập/sửa/lưu trên kỳ báo cáo của chính mình (khi chưa khoá sổ 'locked').
   * - Trưởng phòng được quyền nhập/cập nhật/giao việc trên kỳ báo cáo của tổ trưởng thuộc phòng mình.
   * - Giám đốc & Admin được quyền nhập/cập nhật/giao chỉ tiêu cho Trưởng phòng và Tổ trưởng toàn công ty.
   */
  const canEditCurrentPeriod = useMemo(() => {
    if (!currentUser || !currentPeriod) return false;
    if (currentPeriod.status === 'locked') {
      return currentUser.role === 'admin' || currentUser.role === 'leader';
    }
    // 1. Bất kỳ ai (Tổ trưởng, Trưởng phòng, Giám đốc) đang mở kỳ báo cáo của chính mình -> Được phép nhập & lưu!
    if (currentPeriod.user_id === currentUser.id) {
      return true;
    }
    // 2. Trưởng phòng được phép nhập/chỉnh sửa kỳ của nhân sự trong phòng
    if (
      currentUser.role === 'manager' &&
      currentPeriod.department_id === currentUser.department_id
    ) {
      return true;
    }
    // 3. Giám đốc (leader) và Admin được phép nhập/giao chỉ tiêu/chỉnh sửa mọi kỳ chưa khoá
    if (currentUser.role === 'leader' || currentUser.role === 'admin') {
      return true;
    }
    return false;
  }, [currentUser, currentPeriod]);

  const objectives = useMemo(() => {
    if (!currentPeriod) return [];
    return allObjectives
      .filter((o) => o.period_id === currentPeriod.id)
      .sort((a, b) => a.seq - b.seq);
  }, [allObjectives, currentPeriod]);

  const tasks = useMemo(() => {
    if (!currentPeriod) return [];
    const objIds = new Set(objectives.map((o) => o.id));
    return allTasks
      .filter((t) => objIds.has(t.objective_id))
      .map((t) => ({
        ...t,
        status: computeTaskStatus(t.progress, t.start_date, t.end_date),
      }))
      .sort((a, b) => a.seq - b.seq);
  }, [allTasks, objectives, currentPeriod]);

  const dailyLogs = useMemo(() => {
    if (!currentPeriod) return [];
    return allDailyLogs
      .filter((l) => l.period_id === currentPeriod.id)
      .sort((a, b) => b.log_date.localeCompare(a.log_date) || b.created_at.localeCompare(a.created_at));
  }, [allDailyLogs, currentPeriod]);

  // Chuyển nhanh về kỳ báo cáo 4 bước của chính người đang đăng nhập
  const switchToMyOwnPeriod = () => {
    if (!currentUser) return;
    if (myOwnPeriod) {
      setSelectedPeriodId(myOwnPeriod.id);
      showToast(
        `Đã mở Báo cáo 4 bước của ${currentUser.full_name}`,
        `Bạn có thể nhập liệu và lưu trực tiếp Bước 1, 2, 3, 4 và Nhật ký 4.1.`,
        'info'
      );
    } else {
      const created = createOrOpenPeriod(currentUser.id, 11, 2026);
      setSelectedPeriodId(created.id);
    }
  };

  // Auth Actions
  const login = (email: string, password?: string): boolean => {
    const found = profiles.find(
      (p) => p.email.toLowerCase() === email.trim().toLowerCase() && p.active
    );
    if (!found) {
      showToast('Đăng nhập thất bại', 'Email không tồn tại hoặc tài khoản đã khoá.', 'error');
      return false;
    }
    if (password && found.password && found.password !== password) {
      showToast('Sai mật khẩu', 'Vui lòng kiểm tra lại mật khẩu (mặc định demo: 123).', 'error');
      return false;
    }
    setCurrentUserId(found.id);

    // Tự động chọn kỳ báo cáo 4 bước của chính người đó
    const ownPeriod = allPeriods.find(
      (p) => p.user_id === found.id && p.month === 11 && p.year === 2026
    );
    if (ownPeriod) {
      setSelectedPeriodId(ownPeriod.id);
    }

    showToast(`Xin chào, ${found.full_name}!`, `Vai trò: ${found.job_title}`, 'success');
    return true;
  };

  const logout = () => {
    setCurrentUserId(null);
  };

  const switchDemoUser = (userId: string) => {
    const target = profiles.find((p) => p.id === userId);
    if (!target) return;
    setCurrentUserId(target.id);

    // Luôn ưu tiên mở kỳ báo cáo 4 bước Tháng 11/2026 của chính người đó (dù là Giám đốc, Trưởng phòng hay Tổ trưởng)
    let ownPeriod = allPeriods.find(
      (p) => p.user_id === target.id && p.month === 11 && p.year === 2026
    );
    if (!ownPeriod) {
      ownPeriod = {
        id: `period-${target.id}-2026-11`,
        user_id: target.id,
        department_id: target.department_id,
        month: 11,
        year: 2026,
        status: 'draft',
      };
      setAllPeriods((prev) => [ownPeriod!, ...prev]);
    }
    setSelectedPeriodId(ownPeriod.id);

    showToast(
      `Đã chuyển sang: ${target.full_name}`,
      `${target.job_title} — Đang mở kỳ báo cáo 4 bước của ${target.full_name}`,
      'info'
    );
  };

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const toggleOfflineMode = () => {
    setIsOfflineMode((prev) => {
      const next = !prev;
      if (next) {
        showToast(
          'Đang ở chế độ Offline (Mạng yếu)',
          'Nhật ký mới sẽ lưu tạm trên máy và tự đồng bộ khi có mạng.',
          'warning'
        );
      } else {
        syncPendingOfflineLogs();
      }
      return next;
    });
  };

  const syncPendingOfflineLogs = () => {
    const pendingCount = allDailyLogs.filter((l) => l.sync_status === 'pending').length;
    if (pendingCount > 0) {
      setAllDailyLogs((prev) => prev.map((l) => ({ ...l, sync_status: 'synced' })));
      showToast(
        'Đã đồng bộ dữ liệu thành công!',
        `${pendingCount} dòng nhật ký lưu offline đã được đẩy lên máy chủ.`,
        'success'
      );
    } else {
      showToast('Đã kết nối trực tuyến', 'Mọi dữ liệu đã được đồng bộ thời gian thực.', 'info');
    }
  };

  const openQuickLogModal = (taskId: string | null = null, logDate: string = SYSTEM_TODAY) => {
    setQuickLogModal({ isOpen: true, taskId, logDate });
  };

  const closeQuickLogModal = () => {
    setQuickLogModal((prev) => ({ ...prev, isOpen: false }));
  };

  // =========================================================================
  // BƯỚC 1 & 2: QUẢN LÝ CHỈ TIÊU (OBJECTIVES)
  // =========================================================================
  const addObjective = (data: {
    periodId?: string;
    title: string;
    expected_result: string;
    deadline: string;
    current_status?: string;
    root_cause?: string;
    solution?: string;
    parent_objective_id?: string | null;
  }) => {
    const targetPeriodId = data.periodId || currentPeriod?.id;
    if (!targetPeriodId) return;

    const existing = allObjectives.filter((o) => o.period_id === targetPeriodId);
    const nextSeq = existing.length + 1;
    const newObj: Objective = {
      id: `obj-${Date.now()}`,
      period_id: targetPeriodId,
      seq: nextSeq,
      title: data.title.trim(),
      expected_result: data.expected_result.trim(),
      deadline: data.deadline,
      current_status: data.current_status?.trim() || '',
      root_cause: data.root_cause?.trim() || '',
      solution: data.solution?.trim() || '',
      parent_objective_id: data.parent_objective_id || null,
    };

    setAllObjectives((prev) => [...prev, newObj]);
    appendAudit('objectives', newObj.id, 'CREATE_OBJECTIVE', `Lưu chỉ tiêu #${nextSeq}: ${newObj.title}`);
    showToast(
      `Đã lưu Chỉ tiêu số ${nextSeq} thành công!`,
      'Đã tự động liên kết sang Bước 2 (Đánh giá), Bước 3 (Kế hoạch) và Dashboard.'
    );
  };

  const updateObjective = (id: string, patch: Partial<Objective>) => {
    setAllObjectives((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
    );
    appendAudit('objectives', id, 'UPDATE_OBJECTIVE', `Cập nhật và lưu chỉ tiêu / đánh giá thực trạng`);
    showToast('Đã lưu thông tin chỉ tiêu!', 'Dữ liệu Bước 1, Bước 2 và Dashboard đã được cập nhật.');
  };

  const deleteObjective = (id: string) => {
    const target = allObjectives.find((o) => o.id === id);
    if (!target) return;

    setAllObjectives((prev) => {
      const remaining = prev.filter((o) => o.id !== id);
      let seqCounter = 1;
      return remaining.map((o) => {
        if (o.period_id === target.period_id) {
          return { ...o, seq: seqCounter++ };
        }
        return o;
      });
    });

    setAllTasks((prev) => prev.filter((t) => t.objective_id !== id));
    appendAudit('objectives', id, 'DELETE_OBJECTIVE', `Xoá chỉ tiêu: ${target.title} và tự đánh lại số TT`);
    showToast('Đã xoá chỉ tiêu & Lưu thay đổi', 'Số thứ tự TT các chỉ tiêu còn lại đã tự động đánh lại.');
  };

  const copyObjectivesFromPreviousMonth = () => {
    if (!currentPeriod) return;
    const prevMonth = currentPeriod.month === 1 ? 12 : currentPeriod.month - 1;
    const prevYear = currentPeriod.month === 1 ? currentPeriod.year - 1 : currentPeriod.year;
    const prevPeriod = allPeriods.find(
      (p) => p.user_id === currentPeriod.user_id && p.month === prevMonth && p.year === prevYear
    );
    if (!prevPeriod) {
      showToast('Không tìm thấy kỳ tháng trước', `Chưa có dữ liệu Tháng ${prevMonth}/${prevYear}.`, 'warning');
      return;
    }
    const prevObjs = allObjectives.filter((o) => o.period_id === prevPeriod.id);
    if (prevObjs.length === 0) {
      showToast('Kỳ trước chưa có chỉ tiêu', 'Không có chỉ tiêu nào để kế thừa.', 'warning');
      return;
    }

    const currentCount = objectives.length;
    const cloned: Objective[] = prevObjs.map((o, idx) => ({
      id: `obj-clone-${Date.now()}-${idx}`,
      period_id: currentPeriod.id,
      seq: currentCount + idx + 1,
      title: o.title,
      expected_result: o.expected_result,
      deadline: `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, '0')}-28`,
      current_status: o.current_status,
      root_cause: o.root_cause,
      solution: o.solution || '',
      parent_objective_id: o.parent_objective_id || null,
    }));

    setAllObjectives((prev) => [...prev, ...cloned]);
    showToast(
      `Đã kế thừa & lưu ${cloned.length} chỉ tiêu`,
      `Từ kỳ báo cáo Tháng ${prevMonth}/${prevYear} sang kỳ hiện tại.`
    );
  };

  // =========================================================================
  // BƯỚC 3: QUẢN LÝ CÔNG VIỆC KẾ HOẠCH (TASKS)
  // =========================================================================
  const addTask = (data: {
    objective_id: string;
    title: string;
    start_date: string;
    end_date: string;
    assignee_id: string;
    assignee_name?: string;
    expected_output: string;
    progress?: number;
  }): boolean => {
    if (data.end_date < data.start_date) {
      showToast(
        'Ngày kết thúc không hợp lệ',
        'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
        'error'
      );
      return false;
    }

    const nextSeq = tasks.length + 1;
    const initProgress = data.progress ?? 0;
    const initialStatus = computeTaskStatus(initProgress, data.start_date, data.end_date);
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      objective_id: data.objective_id,
      seq: nextSeq,
      title: data.title.trim(),
      start_date: data.start_date,
      end_date: data.end_date,
      assignee_id: data.assignee_id || currentPeriod?.user_id || currentUser?.id || 'user-an',
      assignee_name: data.assignee_name?.trim() || '',
      expected_output: data.expected_output.trim(),
      progress: initProgress,
      status: initialStatus,
    };

    setAllTasks((prev) => [...prev, newTask]);
    appendAudit('tasks', newTask.id, 'CREATE_TASK', `Lưu công việc #${nextSeq}: ${newTask.title}`);
    showToast('Đã lưu công việc vào Kế hoạch Bước 3!', 'Bảng tiến độ Gantt (Bước 4) & Dashboard đã tự động cập nhật.');
    return true;
  };

  const updateTask = (id: string, patch: Partial<TaskItem>): boolean => {
    const target = allTasks.find((t) => t.id === id);
    if (!target) return false;

    const merged = { ...target, ...patch };
    if (merged.end_date < merged.start_date) {
      showToast('Lỗi thời gian', 'Ngày kết thúc không được nhỏ hơn ngày bắt đầu.', 'error');
      return false;
    }

    merged.status = computeTaskStatus(merged.progress, merged.start_date, merged.end_date);
    setAllTasks((prev) => prev.map((t) => (t.id === id ? merged : t)));
    appendAudit('tasks', id, 'UPDATE_TASK', `Cập nhật công việc: ${merged.title} (${merged.progress}%)`);
    showToast('Đã lưu cập nhật công việc!', `Tiến độ: ${merged.progress}%`);
    return true;
  };

  const deleteTask = (id: string) => {
    const target = allTasks.find((t) => t.id === id);
    if (!target) return;
    setAllTasks((prev) => prev.filter((t) => t.id !== id));
    appendAudit('tasks', id, 'DELETE_TASK', `Xoá công việc: ${target.title}`);
    showToast('Đã xoá công việc & lưu thay đổi');
  };

  // =========================================================================
  // BƯỚC 4.1: NHẬT KÝ CÔNG VIỆC HÀNG NGÀY (DAILY LOGS -> AUTO GANTT)
  // =========================================================================
  const addDailyLog = (data: {
    log_date: string;
    task_id: string | null;
    content: string;
    progress_after?: number;
    hours?: number;
    issues?: string;
    attachments?: AttachmentItem[];
  }): boolean => {
    if (!currentPeriod || !currentUser) return false;
    if (!data.content.trim()) {
      showToast('Thiếu nội dung', 'Vui lòng nhập nội dung công việc đã thực hiện.', 'error');
      return false;
    }

    const newLog: DailyLog = {
      id: `log-${Date.now()}`,
      period_id: currentPeriod.id,
      user_id: currentPeriod.user_id,
      log_date: data.log_date,
      task_id: data.task_id,
      content: data.content.trim(),
      progress_after: data.progress_after,
      hours: data.hours,
      issues: data.issues?.trim() || '',
      attachments: data.attachments || [],
      created_at: new Date().toISOString(),
      sync_status: isOfflineMode ? 'pending' : 'synced',
    };

    setAllDailyLogs((prev) => [newLog, ...prev]);

    if (data.task_id && data.progress_after !== undefined) {
      setAllTasks((prev) =>
        prev.map((t) => {
          if (t.id === data.task_id) {
            const newStatus = computeTaskStatus(
              data.progress_after!,
              t.start_date,
              t.end_date
            );
            return {
              ...t,
              progress: data.progress_after!,
              status: newStatus,
            };
          }
          return t;
        })
      );
    }

    appendAudit(
      'daily_logs',
      newLog.id,
      'CREATE_DAILY_LOG',
      `Lưu nhật ký ngày ${data.log_date}: ${data.content.slice(0, 60)}...`
    );

    showToast(
      isOfflineMode ? 'Đã lưu nhật ký vào bộ nhớ Offline' : 'Đã lưu nhật ký công việc!',
      data.task_id
        ? `Ô ngày ${data.log_date.split('-').reverse().slice(0, 2).join('/')} trên bảng Gantt Bước 4 đã tự động tô màu.`
        : 'Đã ghi nhận vào nhóm Việc phát sinh ngoài kế hoạch.'
    );
    return true;
  };

  const deleteDailyLog = (id: string) => {
    setAllDailyLogs((prev) => prev.filter((l) => l.id !== id));
    appendAudit('daily_logs', id, 'DELETE_DAILY_LOG', 'Xoá 1 dòng nhật ký công việc');
    showToast('Đã xoá dòng nhật ký & lưu thay đổi');
  };

  const submitDailyReport = (dateStr: string = SYSTEM_TODAY, note?: string) => {
    if (!currentUser) return;
    const targetUserId = currentPeriod?.user_id || currentUser.id;
    const exists = dailySubmissions.some(
      (s) => s.user_id === targetUserId && s.log_date === dateStr
    );
    if (exists) {
      showToast('Đã gửi báo cáo ngày này rồi', 'Hệ thống đã ghi nhận báo cáo ngày của bạn.', 'info');
      return;
    }

    const sub: DailySubmission = {
      user_id: targetUserId,
      log_date: dateStr,
      submitted_at: new Date().toISOString(),
      note,
    };
    setDailySubmissions((prev) => [...prev, sub]);
    appendAudit(
      'daily_submissions',
      `${targetUserId}-${dateStr}`,
      'SUBMIT_DAILY',
      `Hoàn tất gửi báo cáo ngày ${dateStr}`
    );
    showToast(
      'Đã lưu & gửi báo cáo ngày thành công!',
      'Trạng thái nộp báo cáo hôm nay đã chuyển sang ĐÃ NỘP trên Dashboard 4 Bước.'
    );
  };

  const sendReminderToUser = (targetUserId: string) => {
    const target = profiles.find((p) => p.id === targetUserId);
    if (!target) return;
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      user_id: targetUserId,
      title: `Nhắc nộp báo cáo 4 bước ngày ${SYSTEM_TODAY.split('-').reverse().join('/')}`,
      body: `${currentUser?.full_name || 'Lãnh đạo'} nhắc bạn cập nhật nhật ký 4.1 và bấm Gửi báo cáo ngày.`,
      tab_target: 'today',
      read: false,
      created_at: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
    showToast(`Đã gửi thông báo nhắc ${target.full_name}`, 'Thông báo đã được lưu vào hộp thư người nhận.');
  };

  // =========================================================================
  // LUỒNG DUYỆT KỲ BÁO CÁO
  // =========================================================================
  const changePeriodStatus = (periodId: string, newStatus: PeriodStatus, note?: string) => {
    const target = allPeriods.find((p) => p.id === periodId);
    if (!target || !currentUser) return;

    setAllPeriods((prev) =>
      prev.map((p) => {
        if (p.id !== periodId) return p;
        return {
          ...p,
          status: newStatus,
          submitted_at: newStatus === 'submitted' ? new Date().toISOString() : p.submitted_at,
          approved_by:
            newStatus === 'approved' || newStatus === 'locked' ? currentUser.id : p.approved_by,
          approved_at:
            newStatus === 'approved' || newStatus === 'locked'
              ? new Date().toISOString()
              : p.approved_at,
          manager_note: note !== undefined ? note : p.manager_note,
        };
      })
    );

    const emp = profiles.find((u) => u.id === target.user_id);
    const statusMap: Record<PeriodStatus, string> = {
      draft: 'Bản nháp',
      submitted: 'Đã gửi chờ duyệt',
      approved: 'Đã phê duyệt',
      returned: 'Trả lại yêu cầu bổ sung',
      locked: 'Đã khoá sổ kỳ báo cáo',
    };

    if (target.user_id !== currentUser.id) {
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          user_id: target.user_id,
          title: `Kỳ báo cáo T${target.month}/${target.year}: ${statusMap[newStatus]}`,
          body: note || `${currentUser.full_name} đã chuyển trạng thái kỳ báo cáo sang "${statusMap[newStatus]}".`,
          tab_target: 'my_period',
          period_id: periodId,
          read: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    appendAudit(
      'report_periods',
      periodId,
      `STATUS_${newStatus.toUpperCase()}`,
      `${currentUser.full_name} chuyển kỳ T${target.month}/${target.year} của ${emp?.full_name} sang ${statusMap[newStatus]}`
    );

    showToast(`Đã lưu trạng thái: ${statusMap[newStatus]}`, note || undefined);
  };

  const createOrOpenPeriod = (userId: string, month: number, year: number): ReportPeriod => {
    const existing = allPeriods.find(
      (p) => p.user_id === userId && p.month === month && p.year === year
    );
    if (existing) {
      setSelectedPeriodId(existing.id);
      return existing;
    }

    const user = profiles.find((u) => u.id === userId);
    const newPeriod: ReportPeriod = {
      id: `period-${userId}-${year}-${month}-${Date.now()}`,
      user_id: userId,
      department_id: user?.department_id || 'dept-tech',
      month,
      year,
      status: 'draft',
    };

    setAllPeriods((prev) => [newPeriod, ...prev]);
    setSelectedPeriodId(newPeriod.id);
    appendAudit(
      'report_periods',
      newPeriod.id,
      'CREATE_PERIOD',
      `Khởi tạo kỳ báo cáo Tháng ${month}/${year} cho ${user?.full_name}`
    );
    showToast(`Đã tạo & mở kỳ báo cáo Tháng ${month}/${year}`, `Nhân sự: ${user?.full_name}`);
    return newPeriod;
  };

  // =========================================================================
  // NHẬN XÉT / CHỈ ĐẠO (COMMENTS)
  // =========================================================================
  const addComment = (data: {
    period_id: string;
    objective_id?: string | null;
    task_id?: string | null;
    log_id?: string | null;
    body: string;
  }) => {
    if (!currentUser || !data.body.trim()) return;
    const newCmt: CommentItem = {
      id: `cmt-${Date.now()}`,
      author_id: currentUser.id,
      period_id: data.period_id,
      objective_id: data.objective_id || null,
      task_id: data.task_id || null,
      log_id: data.log_id || null,
      body: data.body.trim(),
      created_at: new Date().toISOString(),
    };
    setComments((prev) => [newCmt, ...prev]);

    const period = allPeriods.find((p) => p.id === data.period_id);
    if (period && period.user_id !== currentUser.id) {
      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          user_id: period.user_id,
          title: `Nhận xét mới từ ${currentUser.full_name}`,
          body: data.body.trim(),
          tab_target: 'my_period',
          period_id: period.id,
          read: false,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    appendAudit('comments', newCmt.id, 'ADD_COMMENT', `${currentUser.full_name} gửi nhận xét: ${data.body.slice(0, 50)}`);
    showToast('Đã lưu nhận xét / chỉ đạo');
  };

  const markAllNotificationsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => (n.user_id === currentUser.id ? { ...n, read: true } : n))
    );
  };

  // =========================================================================
  // ADMIN & BACKUP ACTIONS
  // =========================================================================
  const addProfile = (profileData: Omit<Profile, 'id'>) => {
    const newUser: Profile = {
      ...profileData,
      id: `user-${Date.now()}`,
    };
    setProfiles((prev) => [...prev, newUser]);
    // Tự động tạo kỳ báo cáo Tháng 11/2026 cho người mới
    const newPeriod: ReportPeriod = {
      id: `period-${newUser.id}-2026-11`,
      user_id: newUser.id,
      department_id: newUser.department_id,
      month: 11,
      year: 2026,
      status: 'draft',
    };
    setAllPeriods((prev) => [newPeriod, ...prev]);
    appendAudit('profiles', newUser.id, 'CREATE_USER', `Tạo tài khoản & kỳ báo cáo 4 bước: ${newUser.full_name}`);
    showToast('Đã thêm nhân sự & khởi tạo kỳ báo cáo 4 bước!', `${newUser.full_name} (${newUser.job_title})`);
  };

  const updateProfile = (id: string, patch: Partial<Profile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    showToast('Đã lưu thông tin nhân sự');
  };

  const addDepartment = (code: string, name: string) => {
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      parent_id: null,
    };
    setDepartments((prev) => [...prev, newDept]);
    showToast('Đã lưu Bộ phận mới', newDept.name);
  };

  const updateSettings = (patch: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    showToast('Đã lưu cấu hình hệ thống');
  };

  const exportDatabaseJson = () => {
    const payload = {
      departments,
      profiles,
      allPeriods,
      allObjectives,
      allTasks,
      allDailyLogs,
      dailySubmissions,
      comments,
      notifications,
      auditLogs,
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VPS_4Buoc_Backup_${SYSTEM_TODAY}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file Sao lưu dữ liệu (.json)');
  };

  const importDatabaseJson = (jsonText: string): boolean => {
    try {
      const data = migrateState(JSON.parse(jsonText));
      if (!data.allPeriods || !data.allObjectives) {
        showToast('File không hợp lệ', 'Không tìm thấy cấu trúc dữ liệu 4 bước.', 'error');
        return false;
      }
      setDepartments(data.departments || INITIAL_DEPARTMENTS);
      setProfiles(data.profiles || INITIAL_PROFILES);
      setAllPeriods(data.allPeriods);
      setAllObjectives(data.allObjectives);
      setAllTasks(data.allTasks || []);
      setAllDailyLogs(data.allDailyLogs || []);
      setDailySubmissions(data.dailySubmissions || []);
      setComments(data.comments || []);
      setNotifications(data.notifications || []);
      setAuditLogs(data.auditLogs || []);
      setSettings(data.settings || INITIAL_SETTINGS);
      showToast('Đã khôi phục dữ liệu từ file sao lưu thành công!');
      return true;
    } catch {
      showToast('Lỗi đọc file JSON', 'Vui lòng kiểm tra lại định dạng file.', 'error');
      return false;
    }
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    fetch('/api/db', { method: 'DELETE' }).catch(() => {});
    setDepartments(INITIAL_DEPARTMENTS);
    setProfiles(INITIAL_PROFILES);
    setAllPeriods(INITIAL_PERIODS);
    setAllObjectives(INITIAL_OBJECTIVES);
    setAllTasks(INITIAL_TASKS);
    setAllDailyLogs(INITIAL_DAILY_LOGS);
    setDailySubmissions(INITIAL_SUBMISSIONS);
    setComments(INITIAL_COMMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setSettings(INITIAL_SETTINGS);
    setCurrentUserId('user-long');
    setSelectedPeriodId('period-long-2026-11');
    setActiveTab('dashboard');
    showToast('Đã khôi phục dữ liệu mẫu 3 cấp (Giám đốc - Trưởng phòng - Tổ trưởng)', 'Toàn bộ dữ liệu đã được làm mới.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        login,
        logout,
        switchDemoUser,
        switchToMyOwnPeriod,
        activeTab,
        setActiveTab,
        darkMode,
        toggleDarkMode,
        isOfflineMode,
        toggleOfflineMode,
        syncPendingOfflineLogs,
        lastSavedAt,
        isSaving,
        saveAllDataNow,
        exportDatabaseJson,
        importDatabaseJson,
        selectedPeriodId,
        setSelectedPeriodId,
        currentPeriod,
        myOwnPeriod,
        canEditCurrentPeriod,
        departments,
        profiles,
        visiblePeriods,
        allPeriods,
        objectives,
        tasks,
        dailyLogs,
        allObjectives,
        allTasks,
        allDailyLogs,
        dailySubmissions,
        comments,
        notifications,
        auditLogs,
        settings,
        quickLogModal,
        openQuickLogModal,
        closeQuickLogModal,
        toasts,
        showToast,
        dismissToast,
        addObjective,
        updateObjective,
        deleteObjective,
        copyObjectivesFromPreviousMonth,
        addTask,
        updateTask,
        deleteTask,
        addDailyLog,
        deleteDailyLog,
        submitDailyReport,
        sendReminderToUser,
        changePeriodStatus,
        createOrOpenPeriod,
        addComment,
        markAllNotificationsRead,
        addProfile,
        updateProfile,
        addDepartment,
        updateSettings,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

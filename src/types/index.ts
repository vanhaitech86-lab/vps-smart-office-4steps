export type UserRole = 'team_lead' | 'manager' | 'leader' | 'admin'; // Tổ trưởng | Trưởng phòng | Giám đốc | Quản trị

export type PeriodStatus = 'draft' | 'submitted' | 'approved' | 'returned' | 'locked';

export type TaskStatus = 'not_started' | 'in_progress' | 'done' | 'overdue';

export interface Department {
  id: string;
  code: string;
  name: string;
  parent_id?: string | null;
}

export interface Profile {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  job_title: string;
  role: UserRole;
  department_id: string;
  team_name?: string;         // Tên Tổ (dành cho cấp Tổ trưởng)
  avatar_url?: string;
  active: boolean;
}

export interface ReportPeriod {
  id: string;
  user_id: string;
  department_id: string;
  month: number;
  year: number;
  status: PeriodStatus;
  submitted_at?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  manager_note?: string | null;
}

export interface Objective {
  id: string;
  period_id: string;
  seq: number;                // A - TT (Tự động đánh số)
  title: string;              // B - MỤC TIÊU (Bước 1 & 2)
  expected_result: string;    // C - KẾT QUẢ CẦN ĐẠT (Bước 1)
  deadline: string;           // D - TG THỰC HIỆN YYYY-MM-DD (Bước 1)
  current_status: string;     // C - THỰC TRẠNG (Bước 2)
  root_cause: string;         // D - NGUYÊN NHÂN (Bước 2)
  solution?: string;          // E - GIẢI PHÁP (Bước 2)
  parent_objective_id?: string | null; // Chỉ tiêu cấp trên được phân rã (Giám đốc → Trưởng phòng → Tổ trưởng)
}

export interface TaskItem {
  id: string;
  objective_id: string;
  seq: number;                // A - TT
  title: string;              // B - CÔNG VIỆC THỰC HIỆN
  start_date: string;         // C - THỜI GIAN BẮT ĐẦU (YYYY-MM-DD)
  end_date: string;           // D - THỜI GIAN KẾT THÚC (YYYY-MM-DD)
  assignee_id: string;        // E - NGƯỜI THỰC HIỆN
  assignee_name?: string;     // E - NGƯỜI THỰC HIỆN (nhập tự do: thành viên Tổ / Phòng)
  expected_output: string;    // F - KẾT QUẢ (đầu ra)
  progress: number;           // 0 - 100
  status: TaskStatus;
}

export interface AttachmentItem {
  id: string;
  name: string;
  size: number;
  url: string;
  type: string;
}

export interface DailyLog {
  id: string;
  period_id: string;
  user_id: string;
  log_date: string;           // YYYY-MM-DD (NGÀY/THÁNG)
  task_id: string | null;     // null = Việc phát sinh ngoài kế hoạch
  content: string;            // CÔNG VIỆC THỰC HIỆN
  progress_after?: number;    // % hoàn thành sau hôm nay (0-100)
  hours?: number;             // Số giờ làm
  issues?: string;            // Vướng mắc / Đề xuất
  attachments?: AttachmentItem[];
  created_at: string;
  sync_status?: 'synced' | 'pending';
}

export interface DailySubmission {
  user_id: string;
  log_date: string;           // YYYY-MM-DD
  submitted_at: string;
  note?: string;
}

export interface CommentItem {
  id: string;
  author_id: string;
  period_id: string;
  objective_id?: string | null;
  task_id?: string | null;
  log_id?: string | null;
  body: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  tab_target?: NavigationTab;
  period_id?: string;
  read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  user_id: string;
  table_name: string;
  record_id: string;
  action: string;
  summary: string;
  created_at: string;
}

export interface SystemSettings {
  company_title: string;
  unit_prefix: string;
  location_city: string;
  reminder_time: string;
  work_days: number[];        // 1=T2 ... 5=T6, 6=T7
  allow_backdate_days: number;
}

export type NavigationTab =
  | 'today'
  | 'daily_logs'
  | 'step1_objectives'
  | 'step2_evaluation'
  | 'step3_plan'
  | 'step4_gantt'
  | 'my_period'
  | 'approvals'
  | 'dashboard'
  | 'cascade'
  | 'admin';

export interface GanttDayCell {
  dateStr: string;            // YYYY-MM-DD
  dayOfMonth: number;
  month: number;
  year: number;
  dayOfWeekLabel: string;     // T2, T3, T4, T5, T6, T7, CN
  shortDateLabel: string;     // 28/9, 1/10...
  weekIndex: number;          // 0..4 (TUẦN 1 .. TUẦN 5)
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isToday: boolean;
}


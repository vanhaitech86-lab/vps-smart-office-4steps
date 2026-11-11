-- =============================================================================
-- GIẢI PHÁP VĂN PHÒNG THÔNG MINH VPS - HỆ THỐNG BÁO CÁO CÔNG VIỆC 4 BƯỚC
-- PostgreSQL / Supabase Schema + Row Level Security (RLS) + Triggers + Seed Data
-- =============================================================================

-- 1. Đơn vị / Bộ phận (vd: Văn phòng VPS – Bộ phận Kỹ thuật & Giải pháp)
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  parent_id uuid references departments(id),
  created_at timestamptz default now()
);

-- 2. Hồ sơ người dùng (liên kết với auth.users của Supabase)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  job_title text,
  role text not null check (role in ('employee','manager','leader','admin')),
  department_id uuid references departments(id),
  avatar_url text,
  active boolean default true,
  created_at timestamptz default now()
);

-- 3. Kỳ báo cáo: một người một tháng một bản (tiêu đề chung của 5 sheet)
create table if not exists report_periods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  department_id uuid not null references departments(id),
  month int not null check (month between 1 and 12),
  year int not null,
  status text not null default 'draft'
    check (status in ('draft','submitted','approved','returned','locked')),
  submitted_at timestamptz,
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  manager_note text,
  created_at timestamptz default now(),
  unique (user_id, month, year)
);

-- 4. BƯỚC 1 + 2: Chỉ tiêu (gộp sheet "1. MỤC TIÊU TỔNG THỂ" và "2. ĐÁNH GIÁ CHỈ TIÊU")
create table if not exists objectives (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references report_periods(id) on delete cascade,
  seq int not null,                 -- TT, tự đánh số
  title text not null,              -- MỤC TIÊU
  expected_result text,             -- KẾT QUẢ CẦN ĐẠT
  deadline date,                    -- TG THỰC HIỆN
  current_status text,              -- THỰC TRẠNG   (Bước 2)
  root_cause text,                  -- NGUYÊN NHÂN  (Bước 2)
  created_at timestamptz default now()
);

-- 5. BƯỚC 3: Công việc trong kế hoạch ("3. KẾ HOẠCH THỰC HIỆN")
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references objectives(id) on delete cascade,
  seq int not null,
  title text not null,              -- CÔNG VIỆC THỰC HIỆN
  start_date date not null,         -- BẮT ĐẦU
  end_date date not null,           -- KẾT THÚC
  assignee_id uuid references profiles(id), -- NGƯỜI THỰC HIỆN
  expected_output text,             -- KẾT QUẢ (đầu ra)
  progress int default 0 check (progress between 0 and 100),
  status text default 'not_started'
    check (status in ('not_started','in_progress','done','overdue')),
  created_at timestamptz default now(),
  check (end_date >= start_date)
);

-- 6. NHẬT KÝ 4.1: Báo cáo hàng ngày (nguồn dữ liệu tự sinh cho Bước 4 Gantt)
create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references report_periods(id) on delete cascade,
  user_id uuid not null references profiles(id),
  log_date date not null,           -- NGÀY/THÁNG
  task_id uuid references tasks(id) on delete set null, -- null = việc phát sinh
  content text not null,            -- CÔNG VIỆC THỰC HIỆN
  progress_after int check (progress_after between 0 and 100),
  hours numeric(4,1),
  issues text,                      -- vướng mắc / đề xuất
  created_at timestamptz default now()
);

-- 7. Nộp báo cáo ngày (để thống kê "đã nộp / chưa nộp")
create table if not exists daily_submissions (
  user_id uuid references profiles(id) on delete cascade,
  log_date date,
  submitted_at timestamptz default now(),
  note text,
  primary key (user_id, log_date)
);

-- 8. File đính kèm nhật ký
create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  log_id uuid references daily_logs(id) on delete cascade,
  file_url text not null,
  file_name text,
  file_size int,
  created_at timestamptz default now()
);

-- 9. Nhận xét / chỉ đạo của trưởng bộ phận và lãnh đạo
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id),
  period_id uuid references report_periods(id) on delete cascade,
  objective_id uuid references objectives(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  log_id uuid references daily_logs(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

-- 10. Thông báo trong ứng dụng
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- 11. Lịch sử thay đổi (Audit Logs)
create table if not exists audit_logs (
  id bigserial primary key,
  user_id uuid,
  table_name text,
  record_id uuid,
  action text,
  changes jsonb,
  created_at timestamptz default now()
);

-- =============================================================================
-- TRIGGERS: TỰ ĐỘNG CẬP NHẬT TIẾN ĐỘ CÔNG VIỆC KHI GHI NHẬT KÝ 4.1
-- =============================================================================
create or replace function sync_task_progress_from_log()
returns trigger as $$
begin
  if new.task_id is not null and new.progress_after is not null then
    update tasks
    set
      progress = new.progress_after,
      status = case
        when new.progress_after >= 100 then 'done'
        when current_date > end_date and new.progress_after < 100 then 'overdue'
        when new.progress_after > 0 then 'in_progress'
        else 'not_started'
      end
    where id = new.task_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_task_progress on daily_logs;
create trigger trg_sync_task_progress
after insert or update on daily_logs
for each row execute function sync_task_progress_from_log();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) THEO PHẦN 6.2
-- =============================================================================
alter table departments enable row level security;
alter table profiles enable row level security;
alter table report_periods enable row level security;
alter table objectives enable row level security;
alter table tasks enable row level security;
alter table daily_logs enable row level security;
alter table daily_submissions enable row level security;
alter table comments enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- Helper lấy vai trò và bộ phận người dùng hiện tại
create or replace function current_user_role()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function current_user_dept()
returns uuid as $$
  select department_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Policies cho report_periods:
-- Nhân viên chỉ xem của mình; Trưởng BP xem cùng bộ phận; Lãnh đạo/Admin xem toàn công ty
create policy "period_select_policy" on report_periods
for select using (
  user_id = auth.uid()
  or (current_user_role() = 'manager' and department_id = current_user_dept())
  or current_user_role() in ('leader', 'admin')
);

-- Nhân viên chỉ sửa khi kỳ ở trạng thái draft hoặc returned; Admin mở khoá
create policy "period_write_employee" on report_periods
for update using (
  (user_id = auth.uid() and status in ('draft', 'returned'))
  or (current_user_role() = 'manager' and department_id = current_user_dept() and status != 'locked')
  or current_user_role() = 'admin'
);


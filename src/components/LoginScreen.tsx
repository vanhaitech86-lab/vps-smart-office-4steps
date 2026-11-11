import React, { useState } from 'react';
import { Building2, CheckCircle2, KeyRound, Lock, Mail, ShieldCheck, UserCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LoginScreen: React.FC = () => {
  const { login, switchDemoUser, profiles, departments } = useApp();

  const [email, setEmail] = useState('an.nguyen@vps.vn');
  const [password, setPassword] = useState('123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  const roleLabels: Record<string, { label: string; color: string }> = {
    team_lead: { label: 'Tổ trưởng (Người lập biểu)', color: 'bg-blue-100 text-blue-800' },
    manager: { label: 'Trưởng bộ phận (Duyệt & Giao việc)', color: 'bg-indigo-100 text-indigo-800' },
    leader: { label: 'Lãnh đạo (Ban Giám đốc)', color: 'bg-emerald-100 text-emerald-800' },
    admin: { label: 'Quản trị hệ thống (Admin)', color: 'bg-purple-100 text-purple-800' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200/20">
        {/* Cột trái: Giới thiệu & Đăng nhập */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-gradient-to-br from-blue-900 to-indigo-950 text-white">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold text-blue-200">
              <Building2 className="w-4 h-4 text-amber-300" />
              VĂN PHÒNG VPS • SMART OFFICE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Hệ Thống Báo Cáo Công Việc 4 Bước & Nhật Ký Hàng Ngày
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
              Số hoá khép kín từ <strong>1. Đặt mục tiêu</strong> →{' '}
              <strong>2. Đánh giá thực trạng</strong> → <strong>3. Lập kế hoạch</strong> →{' '}
              <strong>4. Tiến độ Gantt tự động</strong> và <strong>4.1 Nhật ký công việc</strong>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 my-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                Email công vụ VPS
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-blue-300 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-200 mb-1">
                Mật khẩu (Demo: 123)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-blue-300 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300 text-sm outline-none focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-extrabold text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              Đăng Nhập Hệ Thống
            </button>
          </form>

          <div className="text-[11px] text-blue-300/80 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Bảo mật phân quyền Row Level Security (RLS) theo từng cá nhân & bộ phận.</span>
          </div>
        </div>

        {/* Cột phải: Chọn nhanh tài khoản Demo 4 vai trò để kiểm thử nghiệm thu */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-4 bg-slate-50 dark:bg-slate-900">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" />
              Chuyển nhanh tài khoản kiểm thử (4 Vai trò chuẩn đặc tả)
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              Bấm chọn 1 tài khoản để vào thẳng ứng dụng
            </h2>
            <p className="text-xs text-slate-500">
              Kiểm tra phân quyền: Tổ trưởng A không xem được Tổ trưởng B; Trưởng bộ phận duyệt báo cáo; Lãnh đạo xem Dashboard toàn công ty.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
            {profiles.map((user) => {
              const dept = departments.find((d) => d.id === user.department_id);
              const badge = roleLabels[user.role];
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => switchDemoUser(user.id)}
                  className="text-left p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-md transition group cursor-pointer flex flex-col justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${badge.color}`}>
                        {badge.label}
                      </span>
                      <UserCheck className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600">
                      {user.full_name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{user.job_title}</div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate">{dept?.name.replace('Văn phòng VPS – ', '')}</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                      Vào ngay →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-blue-50 dark:bg-slate-800/80 border border-blue-200/70 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Bạn cũng có thể đổi nhanh giữa các vai trò ngay trên thanh công cụ trên cùng mà không cần đăng xuất.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


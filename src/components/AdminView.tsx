import React, { useState } from 'react';
import {
  Building2,
  CalendarPlus,
  History,
  Lock,
  RefreshCw,
  Settings,
  Shield,
  Unlock,
  UserPlus,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { formatDateTimeVN, getPeriodStatusMeta } from '../utils/dateUtils';

export const AdminView: React.FC = () => {
  const {
    profiles,
    departments,
    allPeriods,
    auditLogs,
    settings,
    addProfile,
    updateProfile,
    addDepartment,
    changePeriodStatus,
    createOrOpenPeriod,
    updateSettings,
    resetDemoData,
  } = useApp();

  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newJobTitle, setNewJobTitle] = useState('Chuyên viên');
  const [newRole, setNewRole] = useState<UserRole>('team_lead');
  const [newDeptId, setNewDeptId] = useState(departments[0]?.id || 'dept-tech');

  const [deptCode, setDeptCode] = useState('');
  const [deptName, setDeptName] = useState('');

  const [openUserId, setOpenUserId] = useState(profiles[0]?.id || 'user-an');
  const [openMonth, setOpenMonth] = useState(11);
  const [openYear, setOpenYear] = useState(2026);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) return;
    addProfile({
      full_name: newFullName.trim(),
      email: newEmail.trim(),
      password: '123',
      job_title: newJobTitle.trim(),
      role: newRole,
      department_id: newDeptId,
      active: true,
    });
    setNewFullName('');
    setNewEmail('');
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptCode.trim() || !deptName.trim()) return;
    addDepartment(deptCode, deptName);
    setDeptCode('');
    setDeptName('');
  };

  return (
    <div className="space-y-6">
      {/* HEADER ADMIN */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
            QUẢN TRỊ HỆ THỐNG (ADMIN) • PHÂN QUYỀN RLS & DANH MỤC
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Cấu hình Đơn vị, Nhân sự, Kỳ báo cáo & Nhật ký kiểm toán
          </h2>
        </div>
        <button
          type="button"
          onClick={resetDemoData}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          Khôi phục dữ liệu mẫu gốc
        </button>
      </div>

      {/* GRID: QUẢN LÝ NGƯỜI DÙNG & BỘ PHẬN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* QUẢN LÝ NGƯỜI DÙNG (7/12) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Danh sách Người dùng & Phân quyền 4 Vai trò ({profiles.length})
          </h3>

          <form
            onSubmit={handleAddUser}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          >
            <input
              type="text"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="Họ và tên nhân sự mới..."
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              required
            />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Email công ty (vd: ten@vps.vn)"
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              required
            />
            <input
              type="text"
              value={newJobTitle}
              onChange={(e) => setNewJobTitle(e.target.value)}
              placeholder="Chức danh..."
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
            >
              <option value="team_lead">Tổ trưởng (Người lập biểu)</option>
              <option value="manager">Trưởng bộ phận (Quản lý & Duyệt)</option>
              <option value="leader">Lãnh đạo (Giám đốc / Xem toàn công ty)</option>
              <option value="admin">Quản trị viên (Admin)</option>
            </select>
            <select
              value={newDeptId}
              onChange={(e) => setNewDeptId(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Thêm tài khoản
            </button>
          </form>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {profiles.map((user) => {
              const dept = departments.find((d) => d.id === user.department_id);
              return (
                <div
                  key={user.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {user.full_name}{' '}
                      <span className="text-xs font-normal text-slate-500">({user.email})</span>
                    </div>
                    <div className="text-slate-500">
                      {user.job_title} • {dept?.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        updateProfile(user.id, { role: e.target.value as UserRole })
                      }
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                    >
                      <option value="team_lead">team_lead (Tổ trưởng)</option>
                      <option value="manager">manager (Trưởng BP)</option>
                      <option value="leader">leader (Lãnh đạo)</option>
                      <option value="admin">admin (Quản trị)</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI (5/12): BỘ PHẬN & CẤU HÌNH NHẮC BÁO CÁO */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quản lý Bộ phận */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Đơn vị / Bộ phận ({departments.length})
            </h3>
            <form onSubmit={handleAddDept} className="flex gap-2">
              <input
                type="text"
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value)}
                placeholder="Mã (VD: VPS-TCKT)"
                className="w-28 px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
              <input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="Tên đơn vị / bộ phận..."
                className="flex-1 px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                required
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 text-white"
              >
                Thêm
              </button>
            </form>
            <div className="space-y-1.5">
              {departments.map((d) => (
                <div
                  key={d.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{d.name}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">
                    {d.code}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cấu hình hệ thống */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-600" />
              Cấu hình Quy tắc Nghiệp vụ (Phần 7)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Giờ nhắc báo cáo hàng ngày:
                </label>
                <input
                  type="time"
                  value={settings.reminder_time}
                  onChange={(e) => updateSettings({ reminder_time: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                  Số ngày cho phép ghi bù:
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={settings.allow_backdate_days}
                  onChange={(e) =>
                    updateSettings({ allow_backdate_days: Number(e.target.value) })
                  }
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MỞ / KHOÁ KỲ BÁO CÁO THÁNG */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarPlus className="w-5 h-5 text-blue-600" />
              Quản lý Mở / Khoá Kỳ báo cáo tháng ({allPeriods.length} kỳ)
            </h3>
            <p className="text-xs text-slate-500">
              Kỳ đã "locked" thì tổ trưởng không sửa được; chỉ Admin có quyền mở khoá lại.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={openUserId}
              onChange={(e) => setOpenUserId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
            <select
              value={openMonth}
              onChange={(e) => setOpenMonth(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={openYear}
              onChange={(e) => setOpenYear(Number(e.target.value))}
              className="w-20 px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
            />
            <button
              type="button"
              onClick={() => createOrOpenPeriod(openUserId, openMonth, openYear)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            >
              + Mở kỳ báo cáo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allPeriods.map((p) => {
            const emp = profiles.find((u) => u.id === p.user_id);
            const meta = getPeriodStatusMeta(p.status);
            return (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white">
                    Tháng {p.month}/{p.year} — {emp?.full_name}
                  </div>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeClass}`}
                  >
                    {meta.label}
                  </span>
                </div>

                {p.status === 'locked' ? (
                  <button
                    type="button"
                    onClick={() =>
                      changePeriodStatus(p.id, 'draft', 'Admin mở khoá kỳ báo cáo để chỉnh sửa.')
                    }
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 hover:bg-amber-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Mở khoá
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      changePeriodStatus(p.id, 'locked', 'Admin khoá sổ kỳ báo cáo.')
                    }
                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-100 text-purple-800 hover:bg-purple-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" /> Khoá sổ
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* NHẬT KÝ KIỂM TOÁN (AUDIT LOGS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <History className="w-5 h-5 text-slate-600" />
          Lịch sử thay đổi dữ liệu (Audit Logs • {auditLogs.length})
        </h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto text-xs">
          {auditLogs.map((a) => {
            const actor = profiles.find((p) => p.id === a.user_id);
            return (
              <div key={a.id} className="py-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {actor?.full_name || 'Hệ thống'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px]">
                    {a.action}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400">{a.summary}</span>
                </div>
                <span className="text-slate-400 shrink-0">{formatDateTimeVN(a.created_at)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


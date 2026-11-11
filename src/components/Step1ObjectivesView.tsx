import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  CopyPlus,
  Edit3,
  Plus,
  Save,
  Target,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Objective } from '../types';
import { formatDateVN, SYSTEM_TODAY } from '../utils/dateUtils';
import { VpsSheetHeader } from './VpsSheetHeader';

export const Step1ObjectivesView: React.FC = () => {
  const {
    currentPeriod,
    objectives,
    tasks,
    profiles,
    departments,
    allPeriods,
    allObjectives,
    canEditCurrentPeriod,
    addObjective,
    updateObjective,
    deleteObjective,
    copyObjectivesFromPreviousMonth,
    saveAllDataNow,
    lastSavedAt,
    setActiveTab,
    settings,
  } = useApp();

  const [showAddForm, setShowAddForm] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newExpected, setNewExpected] = useState('');
  const [newCurrentStatus, setNewCurrentStatus] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newParentId, setNewParentId] = useState('');
  const [newDeadline, setNewDeadline] = useState(
    currentPeriod
      ? `${currentPeriod.year}-${String(currentPeriod.month).padStart(2, '0')}-28`
      : '2026-11-28'
  );

  // State sửa trực tiếp trên dòng (inline edit)
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Objective>>({});

  if (!currentPeriod) return null;

  const periodOwner = profiles.find((p) => p.id === currentPeriod.user_id);
  const roleLabel =
    periodOwner?.role === 'leader'
      ? 'CẤP GIÁM ĐỐC'
      : periodOwner?.role === 'manager'
      ? 'CẤP TRƯỞNG PHÒNG'
      : 'CẤP TỔ TRƯỞNG';

  // Chỉ tiêu cấp trên để phân rã: Tổ trưởng ← Trưởng phòng cùng phòng; Trưởng phòng ← Giám đốc
  const superiorProfiles = profiles.filter((p) => {
    if (!periodOwner || !p.active) return false;
    if (periodOwner.role === 'team_lead') return p.role === 'manager' && p.department_id === periodOwner.department_id;
    if (periodOwner.role === 'manager') return p.role === 'leader';
    return false;
  });
  const superiorPeriodIds = new Set(
    allPeriods
      .filter(
        (p) =>
          superiorProfiles.some((s) => s.id === p.user_id) &&
          p.month === currentPeriod.month &&
          p.year === currentPeriod.year
      )
      .map((p) => p.id)
  );
  const parentCandidates = allObjectives
    .filter((o) => superiorPeriodIds.has(o.period_id))
    .sort((a, b) => a.seq - b.seq);
  const superiorLabel = periodOwner?.role === 'team_lead' ? 'Trưởng phòng' : 'Giám đốc';
  const getParentObjective = (id?: string | null) => (id ? allObjectives.find((o) => o.id === id) : undefined);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addObjective({
      title: newTitle,
      expected_result: newExpected,
      deadline: newDeadline,
      current_status: newCurrentStatus,
      root_cause: newRootCause,
      parent_objective_id: newParentId || null,
    });
    setNewTitle('');
    setNewExpected('');
    setNewCurrentStatus('');
    setNewRootCause('');
    setNewParentId('');
  };

  const startEditing = (obj: Objective) => {
    if (!canEditCurrentPeriod) return;
    setEditingId(obj.id);
    setEditDraft({
      title: obj.title,
      expected_result: obj.expected_result,
      deadline: obj.deadline,
      parent_objective_id: obj.parent_objective_id || null,
    });
  };

  const saveEditing = (id: string) => {
    updateObjective(id, editDraft);
    setEditingId(null);
  };

  const periodDept = departments.find((d) => d.id === currentPeriod.department_id);
  const unitDisplay = periodOwner?.team_name
    ? `Đơn vị: ${periodDept?.name || settings.unit_prefix} — ${periodOwner.team_name}`
    : `Đơn vị: ${periodDept?.name || settings.unit_prefix}`;

  return (
    <div className="space-y-5">
      {/* HEADER BƯỚC 1 CHUẨN MẪU BIỂU TẬP ĐOÀN VPS */}
      <VpsSheetHeader
        redTitle={settings.company_title}
        mainTitle="1. MỤC TIÊU TỔNG THỂ"
        unitText={unitDisplay}
        periodText={`Tháng ${currentPeriod.month} năm ${currentPeriod.year}`}
        roleBadge={
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 inline-flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            {roleLabel}: {periodOwner?.full_name} • Đã lưu {lastSavedAt}
          </span>
        }
        rightActions={
          <>
            {canEditCurrentPeriod && (
              <>
                <button
                  type="button"
                  onClick={() => saveAllDataNow(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lưu Bước 1
                </button>
                <button
                  type="button"
                  onClick={copyObjectivesFromPreviousMonth}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                >
                  <CopyPlus className="w-4 h-4 text-blue-600" />
                  Kế thừa tháng trước
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {showAddForm ? 'Ẩn khung nhập' : '+ Nhập chỉ tiêu mới'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('step2_evaluation')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
            >
              Sang Bước 2: Đánh giá thực trạng
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">

        {/* KHUNG NHẬP LIỆU & LƯU CHỈ TIÊU MỚI */}
        {showAddForm && canEditCurrentPeriod && (
          <form
            onSubmit={handleCreate}
            className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 bg-blue-50/60 dark:bg-slate-800/60 p-4 rounded-2xl space-y-3 border border-blue-200/70"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-blue-600" />
                Nhập & Lưu Chỉ tiêu số #{objectives.length + 1} cho {periodOwner?.full_name} ({roleLabel})
              </h4>
              <span className="text-[11px] text-slate-500">
                * Nhập xong bấm "Lưu Chỉ Tiêu Vào Hệ Thống"
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {periodOwner?.role !== 'leader' && (
                <div className="lg:col-span-12">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    🔗 PHÂN RÃ TỪ CHỈ TIÊU CẤP TRÊN ({superiorLabel}) — giúp liên kết mục tiêu 3 cấp
                  </label>
                  <select
                    value={newParentId}
                    onChange={(e) => setNewParentId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="">— Chỉ tiêu riêng (không gắn chỉ tiêu cấp trên) —</option>
                    {parentCandidates.map((o) => {
                      const ownerName = profiles.find(
                        (p) => p.id === allPeriods.find((pp) => pp.id === o.period_id)?.user_id
                      )?.full_name;
                      return (
                        <option key={o.id} value={o.id}>
                          [{ownerName}] CT{o.seq}: {o.title}
                        </option>
                      );
                    })}
                  </select>
                  {parentCandidates.length === 0 && (
                    <p className="text-[11px] text-amber-600 mt-1">
                      {superiorLabel} chưa nhập chỉ tiêu tháng {currentPeriod.month}/{currentPeriod.year}.
                    </p>
                  )}
                </div>
              )}
              <div className="lg:col-span-5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  B. MỤC TIÊU / CHỈ TIÊU THÁNG <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Nhập nội dung mục tiêu của Giám đốc / Trưởng phòng / Tổ trưởng..."
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>
              <div className="lg:col-span-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  C. KẾT QUẢ CẦN ĐẠT (Chỉ số định lượng) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={newExpected}
                  onChange={(e) => setNewExpected(e.target.value)}
                  placeholder="KPI, doanh số, thời gian phản hồi, tỷ lệ % cần đạt..."
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  D. THỜI GIAN THỰC HIỆN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>

              {/* Cho phép nhập sẵn Thực trạng & Nguyên nhân (Bước 2) ngay lúc tạo nếu muốn */}
              <div className="lg:col-span-5">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Thực trạng hiện tại (Tự động lưu sang Bước 2 - Tuỳ chọn):
                </label>
                <input
                  type="text"
                  value={newCurrentStatus}
                  onChange={(e) => setNewCurrentStatus(e.target.value)}
                  placeholder="Hiện tại đang ở mức nào? (Có thể nhập bổ sung ở Bước 2)"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                />
              </div>
              <div className="lg:col-span-4">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nguyên nhân (Tự động lưu sang Bước 2 - Tuỳ chọn):
                </label>
                <input
                  type="text"
                  value={newRootCause}
                  onChange={(e) => setNewRootCause(e.target.value)}
                  placeholder="Vì sao chưa đạt / khoảng cách so với mục tiêu?"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                />
              </div>
              <div className="lg:col-span-3 flex items-end justify-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs sm:text-sm font-extrabold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lưu Chỉ Tiêu Vào Hệ Thống
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* BẢNG CHUẨN SHEET 1 TRÊN MÁY TÍNH (DESKTOP TABLE) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white text-xs uppercase tracking-wider">
                <th className="py-3.5 px-3 text-center w-14 border-r border-blue-800">TT (A)</th>
                <th className="py-3.5 px-4 text-left border-r border-blue-800">
                  MỤC TIÊU (B)
                </th>
                <th className="py-3.5 px-4 text-left w-80 border-r border-blue-800">
                  KẾT QUẢ CẦN ĐẠT (C)
                </th>
                <th className="py-3.5 px-4 text-center w-44 border-r border-blue-800">
                  TG THỰC HIỆN (D)
                  <span className="block text-[10px] font-normal text-blue-200">
                    (Ngày/tháng/năm)
                  </span>
                </th>
                <th className="py-3.5 px-3 text-center w-36 border-r border-blue-800">
                  LIÊN KẾT BƯỚC 3 & 4
                </th>
                <th className="py-3.5 px-3 text-center w-28">SỬA / LƯU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {objectives.map((obj) => {
                const isEditing = editingId === obj.id;
                const objTasks = tasks.filter((t) => t.objective_id === obj.id);
                const avgProg =
                  objTasks.length > 0
                    ? Math.round(objTasks.reduce((s, t) => s + t.progress, 0) / objTasks.length)
                    : 0;

                return (
                  <tr
                    key={obj.id}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="py-4 px-3 text-center font-extrabold text-blue-800 dark:text-blue-300 border-r border-slate-100 dark:border-slate-800">
                      {obj.seq}
                    </td>

                    {/* MỤC TIÊU */}
                    <td className="py-4 px-4 border-r border-slate-100 dark:border-slate-800">
                      {isEditing ? (
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={editDraft.title || ''}
                            onChange={(e) =>
                              setEditDraft((prev) => ({ ...prev, title: e.target.value }))
                            }
                            className="w-full p-2 text-sm rounded-lg border border-blue-400 bg-white dark:bg-slate-800 outline-none"
                          />
                          {periodOwner?.role !== 'leader' && (
                            <select
                              value={editDraft.parent_objective_id || ''}
                              onChange={(e) =>
                                setEditDraft((prev) => ({ ...prev, parent_objective_id: e.target.value || null }))
                              }
                              className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                            >
                              <option value="">— Không gắn chỉ tiêu cấp trên —</option>
                              {parentCandidates.map((o) => (
                                <option key={o.id} value={o.id}>
                                  🔗 CT{o.seq}: {o.title}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditing(obj)}
                          className={`font-semibold text-slate-900 dark:text-white leading-relaxed ${
                            canEditCurrentPeriod ? 'cursor-pointer hover:text-blue-700' : ''
                          }`}
                        >
                          {obj.title}
                          {getParentObjective(obj.parent_objective_id) && (
                            <span className="mt-1 flex items-start gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                              🔗 Phân rã từ: {getParentObjective(obj.parent_objective_id)?.title}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* KẾT QUẢ CẦN ĐẠT */}
                    <td className="py-4 px-4 border-r border-slate-100 dark:border-slate-800">
                      {isEditing ? (
                        <textarea
                          rows={2}
                          value={editDraft.expected_result || ''}
                          onChange={(e) =>
                            setEditDraft((prev) => ({ ...prev, expected_result: e.target.value }))
                          }
                          className="w-full p-2 text-sm rounded-lg border border-blue-400 bg-white dark:bg-slate-800 outline-none"
                        />
                      ) : (
                        <div
                          onClick={() => startEditing(obj)}
                          className="text-slate-700 dark:text-slate-300 leading-relaxed"
                        >
                          {obj.expected_result || <span className="italic text-slate-400">Chưa nhập...</span>}
                        </div>
                      )}
                    </td>

                    {/* TG THỰC HIỆN */}
                    <td className="py-4 px-4 text-center border-r border-slate-100 dark:border-slate-800">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDraft.deadline || ''}
                          onChange={(e) =>
                            setEditDraft((prev) => ({ ...prev, deadline: e.target.value }))
                          }
                          className="px-2 py-1.5 text-xs rounded-lg border border-blue-400 bg-white dark:bg-slate-800"
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          {formatDateVN(obj.deadline)}
                        </span>
                      )}
                    </td>

                    {/* LIÊN KẾT BƯỚC 3 & 4 */}
                    <td className="py-4 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          {objTasks.length} đầu việc • {avgProg}%
                        </span>
                        <div className="w-24 mx-auto h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${avgProg}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* THAO TÁC */}
                    <td className="py-4 px-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => saveEditing(obj.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold flex items-center gap-1"
                            title="Lưu"
                          >
                            <Check className="w-3.5 h-3.5" /> Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                            title="Huỷ"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          {canEditCurrentPeriod && (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditing(obj)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 flex items-center gap-1"
                                title="Sửa chỉ tiêu"
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteObjective(obj.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                                title="Xoá chỉ tiêu"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
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
              NGƯỜI LẬP BIỂU ({roleLabel})
            </p>
            <p className="text-sm font-extrabold text-blue-900 dark:text-blue-300 mt-6">
              {periodOwner?.full_name}
            </p>
          </div>
        </div>
      </div>

      {/* GIAO DIỆN THẺ TRÊN ĐIỆN THOẠI (MOBILE CARDS) */}
      <div className="md:hidden space-y-3">
        {objectives.map((obj) => {
          const isEditing = editingId === obj.id;
          const objTasks = tasks.filter((t) => t.objective_id === obj.id);
          const avgProg =
            objTasks.length > 0
              ? Math.round(objTasks.reduce((s, t) => s + t.progress, 0) / objTasks.length)
              : 0;

          return (
            <div
              key={obj.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-900 text-white">
                  Chỉ tiêu #{obj.seq}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Hạn: {formatDateVN(obj.deadline)}
                  </span>
                  {canEditCurrentPeriod && !isEditing && (
                    <button
                      type="button"
                      onClick={() => startEditing(obj)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-blue-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-500">Mục tiêu:</label>
                    <textarea
                      rows={2}
                      value={editDraft.title || ''}
                      onChange={(e) =>
                        setEditDraft((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full p-2 text-sm rounded-lg border border-blue-400 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Kết quả cần đạt:</label>
                    <textarea
                      rows={2}
                      value={editDraft.expected_result || ''}
                      onChange={(e) =>
                        setEditDraft((prev) => ({ ...prev, expected_result: e.target.value }))
                      }
                      className="w-full p-2 text-sm rounded-lg border border-blue-400 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Thời hạn:</label>
                    <input
                      type="date"
                      value={editDraft.deadline || ''}
                      onChange={(e) =>
                        setEditDraft((prev) => ({ ...prev, deadline: e.target.value }))
                      }
                      className="w-full p-2 text-sm rounded-lg border border-blue-400 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 rounded-lg"
                    >
                      Huỷ
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEditing(obj.id)}
                      className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{obj.title}</h4>
                  {getParentObjective(obj.parent_objective_id) && (
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                      🔗 Phân rã từ: {getParentObjective(obj.parent_objective_id)?.title}
                    </p>
                  )}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-xs text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white block mb-0.5">
                      Kết quả cần đạt:
                    </strong>
                    {obj.expected_result}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>
                      {objTasks.length} công việc kế hoạch ({avgProg}%)
                    </span>
                    {canEditCurrentPeriod && (
                      <button
                        type="button"
                        onClick={() => deleteObjective(obj.id)}
                        className="text-rose-500 font-semibold"
                      >
                        Xoá
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

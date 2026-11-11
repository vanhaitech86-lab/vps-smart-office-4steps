import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Edit3,
  FilePlus2,
  Filter,
  Plus,
  Save,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TaskItem } from '../types';
import {
  formatDateVN,
  getTaskStatusMeta,
  SYSTEM_TODAY,
} from '../utils/dateUtils';
import { VpsSheetHeader } from './VpsSheetHeader';

export const Step3PlanView: React.FC = () => {
  const {
    currentPeriod,
    objectives,
    tasks,
    dailyLogs,
    profiles,
    departments,
    canEditCurrentPeriod,
    addTask,
    updateTask,
    deleteTask,
    openQuickLogModal,
    saveAllDataNow,
    lastSavedAt,
    setActiveTab,
    settings,
  } = useApp();

  const [selectedObjId, setSelectedObjId] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState<boolean>(true);

  // Form thêm mới
  const [formObjId, setFormObjId] = useState<string>(objectives[0]?.id || '');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formStart, setFormStart] = useState<string>(SYSTEM_TODAY);
  const [formEnd, setFormEnd] = useState<string>('2026-11-25');
  const [formAssignee, setFormAssignee] = useState<string>(currentPeriod?.user_id || 'user-an');
  const [formOutput, setFormOutput] = useState<string>('');
  const [formAssigneeName, setFormAssigneeName] = useState<string>('');
  const [formProgress, setFormProgress] = useState<number>(0);

  // Inline Edit
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<TaskItem>>({});

  useEffect(() => {
    if (objectives.length > 0 && !objectives.some((o) => o.id === formObjId)) {
      setFormObjId(objectives[0].id);
    }
    if (currentPeriod) {
      setFormAssignee(currentPeriod.user_id);
    }
  }, [objectives, currentPeriod, formObjId]);

  if (!currentPeriod) return null;

  const periodOwner = profiles.find((p) => p.id === currentPeriod.user_id);
  const roleLabel =
    periodOwner?.role === 'leader'
      ? 'CẤP GIÁM ĐỐC'
      : periodOwner?.role === 'manager'
      ? 'CẤP TRƯỞNG PHÒNG'
      : 'CẤP TỔ TRƯỞNG';

  const assignablePeople = profiles.filter((p) => p.active);

  const filteredTasks =
    selectedObjId === 'all'
      ? tasks
      : tasks.filter((t) => t.objective_id === selectedObjId);

  const selectedObjHeader =
    selectedObjId === 'all'
      ? `TẤT CẢ CHỈ TIÊU (${objectives.length} CHỈ TIÊU)`
      : objectives.find((o) => o.id === selectedObjId)?.title || '';

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const targetObjId = formObjId || objectives[0]?.id;
    if (!targetObjId || !formTitle.trim()) return;

    const ok = addTask({
      objective_id: targetObjId,
      title: formTitle,
      start_date: formStart,
      end_date: formEnd,
      assignee_id: formAssignee || currentPeriod.user_id,
      assignee_name: formAssigneeName,
      expected_output: formOutput,
      progress: formProgress,
    });

    if (ok) {
      setFormTitle('');
      setFormOutput('');
      setFormAssigneeName('');
      setFormProgress(0);
    }
  };

  const startEditing = (task: TaskItem) => {
    if (!canEditCurrentPeriod) return;
    setEditingTaskId(task.id);
    setEditDraft({
      title: task.title,
      start_date: task.start_date,
      end_date: task.end_date,
      assignee_id: task.assignee_id,
      assignee_name: task.assignee_name || '',
      expected_output: task.expected_output,
      progress: task.progress,
    });
  };

  const saveEditing = (id: string) => {
    const ok = updateTask(id, editDraft);
    if (ok) setEditingTaskId(null);
  };

  const periodDept = departments.find((d) => d.id === currentPeriod.department_id);
  const unitDisplay = periodOwner?.team_name
    ? `Đơn vị: ${periodDept?.name || settings.unit_prefix} — ${periodOwner.team_name}`
    : `Đơn vị: ${periodDept?.name || settings.unit_prefix}`;

  return (
    <div className="space-y-5">
      {/* HEADER BƯỚC 3 CHUẨN MẪU BIỂU TẬP ĐOÀN VPS */}
      <VpsSheetHeader
        redTitle={settings.company_title}
        mainTitle={
          <>
            2. KẾ HOẠCH THỰC HIỆN CHỈ TIÊU:{' '}
            <span className="text-blue-700 dark:text-blue-400">{selectedObjHeader}</span>
          </>
        }
        unitText={unitDisplay}
        periodText={`Tháng ${currentPeriod.month} năm ${currentPeriod.year}`}
        roleBadge={
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 inline-flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            {roleLabel}: {periodOwner?.full_name} ({tasks.length} đầu việc)
          </span>
        }
        rightActions={
          <>
            <button
              type="button"
              onClick={() => setActiveTab('step2_evaluation')}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Bước 2
            </button>
            {canEditCurrentPeriod && (
              <>
                <button
                  type="button"
                  onClick={() => saveAllDataNow(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lưu Kế hoạch Bước 3
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  {showAddForm ? 'Ẩn khung nhập' : '+ Thêm công việc'}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('step4_gantt')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
            >
              Sang Bước 4: Bảng Tiến độ
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">

        {/* Bộ lọc theo Chỉ tiêu */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Lọc theo chỉ tiêu:
          </span>
          <select
            value={selectedObjId}
            onChange={(e) => setSelectedObjId(e.target.value)}
            className="w-full sm:max-w-lg px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="all">Tất cả chỉ tiêu ({tasks.length} công việc)</option>
            {objectives.map((o) => {
              const count = tasks.filter((t) => t.objective_id === o.id).length;
              return (
                <option key={o.id} value={o.id}>
                  Chỉ tiêu {o.seq} ({count} việc): {o.title}
                </option>
              );
            })}
          </select>
        </div>

        {/* FORM NHẬP & LƯU CÔNG VIỆC KẾ HOẠCH */}
        {showAddForm && canEditCurrentPeriod && (
          <form
            onSubmit={handleCreateTask}
            className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 bg-blue-50/60 dark:bg-slate-800/50 p-4 rounded-2xl space-y-3 border border-blue-200/70"
          >
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-300">
              Nhập & Lưu Công việc mới vào Kế hoạch thực hiện (Bước 3) — {periodOwner?.full_name}
            </h4>
            {(() => {
              const sol = objectives.find((o) => o.id === (formObjId || objectives[0]?.id))?.solution?.trim();
              if (!sol) return null;
              return (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <span>
                    💡 <strong>Giải pháp ở Bước 2:</strong> {sol}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormTitle(sol.length > 140 ? sol.slice(0, 140) : sol)}
                    className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer"
                  >
                    Dùng làm công việc
                  </button>
                </div>
              );
            })()}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Thuộc Chỉ tiêu (Bước 1) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formObjId}
                  onChange={(e) => setFormObjId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                >
                  {objectives.map((o) => (
                    <option key={o.id} value={o.id}>
                      Chỉ tiêu {o.seq}: {o.title.slice(0, 55)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  B. CÔNG VIỆC THỰC HIỆN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Mô tả đầu việc cần thực hiện..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  C. BẮT ĐẦU <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  D. KẾT THÚC <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formEnd}
                  onChange={(e) => setFormEnd(e.target.value)}
                  className="w-full px-2.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  E. NGƯỜI THỰC HIỆN
                </label>
                <select
                  value={formAssignee}
                  onChange={(e) => setFormAssignee(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                >
                  {assignablePeople.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.job_title})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={formAssigneeName}
                  onChange={(e) => setFormAssigneeName(e.target.value)}
                  placeholder="Hoặc gõ tên thành viên Tổ (VD: Anh Hùng, Chị Lan...)"
                  className="mt-1.5 w-full px-3 py-1.5 text-xs rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
              </div>

              <div className="lg:col-span-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  F. KẾT QUẢ ĐẦU RA <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formOutput}
                  onChange={(e) => setFormOutput(e.target.value)}
                  placeholder="Sản phẩm / biên bản / kết quả nghiệm thu..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  required
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tiến độ ban đầu (%)
                </label>
                <select
                  value={formProgress}
                  onChange={(e) => setFormProgress(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                >
                  {[0, 20, 40, 50, 75, 100].map((pct) => (
                    <option key={pct} value={pct}>
                      {pct}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-3 flex items-end justify-end">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs sm:text-sm font-extrabold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lưu Công Việc Vào Kế Hoạch
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* BẢNG CHUẨN SHEET 3 TRÊN MÁY TÍNH */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white text-xs uppercase tracking-wider">
                <th rowSpan={2} className="py-2.5 px-3 text-center w-12 border-r border-b border-blue-800">
                  TT (A)
                </th>
                <th rowSpan={2} className="py-2.5 px-4 text-left border-r border-b border-blue-800">
                  CÔNG VIỆC THỰC HIỆN (B)
                </th>
                <th colSpan={2} className="py-2 px-3 text-center border-r border-b border-blue-800">
                  THỜI GIAN (C - D)
                </th>
                <th rowSpan={2} className="py-2.5 px-3 text-left w-44 border-r border-b border-blue-800">
                  NGƯỜI THỰC HIỆN (E)
                </th>
                <th rowSpan={2} className="py-2.5 px-4 text-left w-64 border-r border-b border-blue-800">
                  KẾT QUẢ (F)
                </th>
                <th rowSpan={2} className="py-2.5 px-3 text-center w-40 border-r border-b border-blue-800">
                  CẬP NHẬT TIẾN ĐỘ (B4)
                </th>
                <th rowSpan={2} className="py-2.5 px-3 text-center w-28 border-b border-blue-800">
                  THAO TÁC
                </th>
              </tr>
              <tr className="bg-blue-800 text-blue-100 text-[11px] uppercase tracking-wider">
                <th className="py-2 px-3 text-center w-28 border-r border-blue-700">BẮT ĐẦU (C)</th>
                <th className="py-2 px-3 text-center w-28 border-r border-blue-700">KẾT THÚC (D)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTasks.map((task, idx) => {
                const isEditing = editingTaskId === task.id;
                const obj = objectives.find((o) => o.id === task.objective_id);
                const assignee = profiles.find((p) => p.id === task.assignee_id);
                const statusMeta = getTaskStatusMeta(task.status);
                const taskLogCount = dailyLogs.filter((l) => l.task_id === task.id).length;

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="py-3.5 px-3 text-center font-bold text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                      {idx + 1}
                    </td>

                    {/* CÔNG VIỆC */}
                    <td className="py-3.5 px-4 border-r border-slate-100 dark:border-slate-800">
                      {obj && (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 mb-1">
                          Chỉ tiêu {obj.seq}: {obj.title.slice(0, 48)}...
                        </span>
                      )}
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDraft.title || ''}
                          onChange={(e) =>
                            setEditDraft((prev) => ({ ...prev, title: e.target.value }))
                          }
                          className="w-full p-2 text-sm rounded-lg border border-blue-400 bg-white dark:bg-slate-800"
                        />
                      ) : (
                        <div className="font-semibold text-slate-900 dark:text-white leading-snug">
                          {task.title}
                        </div>
                      )}
                    </td>

                    {/* BẮT ĐẦU */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDraft.start_date || ''}
                          onChange={(e) =>
                            setEditDraft((prev) => ({ ...prev, start_date: e.target.value }))
                          }
                          className="p-1 text-xs rounded border border-blue-400 bg-white dark:bg-slate-800"
                        />
                      ) : (
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {formatDateVN(task.start_date)}
                        </span>
                      )}
                    </td>

                    {/* KẾT THÚC */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editDraft.end_date || ''}
                          onChange={(e) =>
                            setEditDraft((prev) => ({ ...prev, end_date: e.target.value }))
                          }
                          className="p-1 text-xs rounded border border-blue-400 bg-white dark:bg-slate-800"
                        />
                      ) : (
                        <span
                          className={`text-xs font-bold ${
                            task.status === 'overdue'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {formatDateVN(task.end_date)}
                        </span>
                      )}
                    </td>

                    {/* NGƯỜI THỰC HIỆN */}
                    <td className="py-3.5 px-3 border-r border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{task.assignee_name || assignee?.full_name || periodOwner?.full_name}</span>
                      </div>
                    </td>

                    {/* KẾT QUẢ */}
                    <td className="py-3.5 px-4 border-r border-slate-100 dark:border-slate-800">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editDraft.expected_output || ''}
                          onChange={(e) =>
                            setEditDraft((prev) => ({ ...prev, expected_output: e.target.value }))
                          }
                          className="w-full p-2 text-xs rounded-lg border border-blue-400 bg-white dark:bg-slate-800"
                        />
                      ) : (
                        <span className="text-xs text-slate-700 dark:text-slate-300">
                          {task.expected_output}
                        </span>
                      )}
                    </td>

                    {/* TIẾN ĐỘ / NHẬT KÝ (CHO PHÉP ĐỔI NHANH % LƯU NGAY) */}
                    <td className="py-3.5 px-3 text-center border-r border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusMeta.badgeClass}`}
                          >
                            {statusMeta.shortLabel}
                          </span>
                          {canEditCurrentPeriod ? (
                            <select
                              value={task.progress}
                              onChange={(e) =>
                                updateTask(task.id, { progress: Number(e.target.value) })
                              }
                              className="px-1.5 py-0.5 rounded text-xs font-extrabold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-pointer"
                            >
                              {[0, 15, 25, 35, 45, 50, 60, 65, 70, 75, 80, 85, 90, 100].map(
                                (pct) => (
                                  <option key={pct} value={pct}>
                                    {pct}%
                                  </option>
                                )
                              )}
                            </select>
                          ) : (
                            <span className="text-xs font-bold">{task.progress}%</span>
                          )}
                        </div>
                        <span className="block text-[11px] text-slate-400">
                          {taskLogCount} dòng nhật ký
                        </span>
                      </div>
                    </td>

                    {/* THAO TÁC */}
                    <td className="py-3.5 px-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => saveEditing(task.id)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTaskId(null)}
                            className="p-1.5 rounded-lg bg-slate-200 text-slate-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openQuickLogModal(task.id, SYSTEM_TODAY)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300"
                            title="Ghi nhật ký 4.1 cho việc này"
                          >
                            <FilePlus2 className="w-4 h-4" />
                          </button>
                          {canEditCurrentPeriod && (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditing(task)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                                title="Sửa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Xoá"
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

      {/* GIAO DIỆN THẺ TRÊN ĐIỆN THOẠI */}
      <div className="md:hidden space-y-3">
        {filteredTasks.map((task, idx) => {
          const obj = objectives.find((o) => o.id === task.objective_id);
          const statusMeta = getTaskStatusMeta(task.status);
          return (
            <div
              key={task.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-900 text-white">
                  Việc #{idx + 1} {obj ? `• Chỉ tiêu ${obj.seq}` : ''}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-bold border ${statusMeta.badgeClass}`}
                >
                  {statusMeta.label} ({task.progress}%)
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{task.title}</h4>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                <div>
                  <span className="text-slate-400 block">Bắt đầu:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {formatDateVN(task.start_date)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Kết thúc:</span>
                  <strong
                    className={
                      task.status === 'overdue'
                        ? 'text-rose-600'
                        : 'text-slate-800 dark:text-slate-200'
                    }
                  >
                    {formatDateVN(task.end_date)}
                  </strong>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                <strong>Kết quả đầu ra:</strong> {task.expected_output}
              </p>

              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openQuickLogModal(task.id, SYSTEM_TODAY)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 text-white flex items-center justify-center gap-1.5"
                >
                  <FilePlus2 className="w-3.5 h-3.5" />
                  Ghi nhật ký việc này
                </button>
                {canEditCurrentPeriod && (
                  <button
                    type="button"
                    onClick={() => deleteTask(task.id)}
                    className="p-2 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Lock,
  PlusCircle,
  RotateCcw,
  ShieldCheck,
  Target,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatDateTimeVN,
  getPeriodStatusMeta,
} from '../utils/dateUtils';

export const ApprovalsView: React.FC = () => {
  const {
    currentUser,
    visiblePeriods,
    profiles,
    departments,
    allObjectives,
    allTasks,
    allDailyLogs,
    changePeriodStatus,
    setSelectedPeriodId,
    setActiveTab,
    addObjective,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [noteByPeriod, setNoteByPeriod] = useState<Record<string, string>>({});

  // Modal Giao chỉ tiêu xuống cho tổ trưởng
  const [assignModalPeriodId, setAssignModalPeriodId] = useState<string | null>(null);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignExpected, setAssignExpected] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('2026-11-28');

  if (!currentUser) return null;

  const filteredPeriods = visiblePeriods.filter((p) =>
    statusFilter === 'all' ? true : p.status === statusFilter
  );

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalPeriodId || !assignTitle.trim()) return;
    addObjective({
      periodId: assignModalPeriodId,
      title: assignTitle,
      expected_result: assignExpected,
      deadline: assignDeadline,
    });
    setAssignTitle('');
    setAssignExpected('');
    setAssignModalPeriodId(null);
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
            PHÂN HỆ QUẢN LÝ • PHÊ DUYỆT & GIAO CHỈ TIÊU
          </span>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Danh sách Kỳ báo cáo 4 Bước của Nhân sự ({filteredPeriods.length})
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Trưởng bộ phận kiểm tra kế hoạch 4 bước, để lại nhận xét, Phê duyệt / Trả lại hoặc Giao chỉ tiêu trực tiếp cho tổ trưởng.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'submitted', label: 'Chờ duyệt' },
            { id: 'approved', label: 'Đã duyệt' },
            { id: 'draft', label: 'Bản nháp' },
            { id: 'returned', label: 'Trả lại' },
            { id: 'locked', label: 'Đã khoá' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* DANH SÁCH KỲ BÁO CÁO */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPeriods.map((period) => {
          const emp = profiles.find((u) => u.id === period.user_id);
          const dept = departments.find((d) => d.id === period.department_id);
          const pObjs = allObjectives.filter((o) => o.period_id === period.id);
          const objIds = new Set(pObjs.map((o) => o.id));
          const pTasks = allTasks.filter((t) => objIds.has(t.objective_id));
          const pLogs = allDailyLogs.filter((l) => l.period_id === period.id);
          const avgProg =
            pTasks.length > 0
              ? Math.round(pTasks.reduce((s, t) => s + t.progress, 0) / pTasks.length)
              : 0;
          const statusMeta = getPeriodStatusMeta(period.status);

          return (
            <div
              key={period.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-slate-900 text-white">
                      Tháng {period.month}/{period.year}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}
                    >
                      {statusMeta.label}
                    </span>
                    <span className="text-xs text-slate-500">{dept?.name}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    {emp?.full_name}{' '}
                    <span className="text-xs font-medium text-slate-500">({emp?.job_title})</span>
                  </h3>
                  {period.submitted_at && (
                    <p className="text-xs text-slate-400">
                      Gửi trình lúc: {formatDateTimeVN(period.submitted_at)}
                    </p>
                  )}
                </div>

                {/* Chỉ số tóm tắt */}
                <div className="grid grid-cols-4 gap-2 sm:gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-center">
                  <div>
                    <div className="text-sm sm:text-base font-extrabold text-blue-700 dark:text-blue-400">
                      {pObjs.length}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">Chỉ tiêu</div>
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-extrabold text-indigo-700 dark:text-indigo-400">
                      {pTasks.length}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">Đầu việc</div>
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                      {avgProg}%
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">Tiến độ</div>
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-extrabold text-amber-600 dark:text-amber-400">
                      {pLogs.length}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">Nhật ký</div>
                  </div>
                </div>
              </div>

              {/* Ô nhập nhận xét duyệt & Các nút thao tác */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <input
                  type="text"
                  value={noteByPeriod[period.id] ?? period.manager_note ?? ''}
                  onChange={(e) =>
                    setNoteByPeriod((prev) => ({ ...prev, [period.id]: e.target.value }))
                  }
                  placeholder="Nhập ý kiến nhận xét / chỉ đạo của Trưởng bộ phận..."
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
                />

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPeriodId(period.id);
                      setActiveTab('my_period');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-600" />
                    Xem chi tiết 4 bước
                  </button>

                  {(currentUser.role === 'manager' ||
                    currentUser.role === 'leader' ||
                    currentUser.role === 'admin') && (
                    <>
                      <button
                        type="button"
                        onClick={() => setAssignModalPeriodId(period.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 transition cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Giao chỉ tiêu
                      </button>

                      {period.status !== 'locked' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              changePeriodStatus(
                                period.id,
                                'approved',
                                noteByPeriod[period.id] ||
                                  period.manager_note ||
                                  'Đồng ý phê duyệt kế hoạch và báo cáo.'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Phê duyệt
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              changePeriodStatus(
                                period.id,
                                'returned',
                                noteByPeriod[period.id] ||
                                  'Yêu cầu rà soát và bổ sung thêm chi tiết kế hoạch.'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Trả lại
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              changePeriodStatus(
                                period.id,
                                'locked',
                                noteByPeriod[period.id] || 'Đã nghiệm thu và khoá sổ kỳ báo cáo.'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            Khoá kỳ
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL GIAO CHỈ TIÊU XUỐNG CHO TỔ TRƯỞNG */}
      {assignModalPeriodId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-blue-900 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-300" />
                Giao chỉ tiêu mới cho tổ trưởng (Bước 1)
              </h4>
              <button
                type="button"
                onClick={() => setAssignModalPeriodId(null)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Nội dung Chỉ tiêu / Mục tiêu giao <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={assignTitle}
                  onChange={(e) => setAssignTitle(e.target.value)}
                  placeholder="Nhập tên mục tiêu giao xuống..."
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Kết quả định lượng cần đạt <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={assignExpected}
                  onChange={(e) => setAssignExpected(e.target.value)}
                  placeholder="Chỉ số KPI nghiệm thu..."
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Hạn hoàn thành
                </label>
                <input
                  type="date"
                  value={assignDeadline}
                  onChange={(e) => setAssignDeadline(e.target.value)}
                  className="w-full p-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalPeriodId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận giao chỉ tiêu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


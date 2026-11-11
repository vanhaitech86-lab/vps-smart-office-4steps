import React, { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ChevronRight,
  Crown,
  GitFork,
  Layers,
  Plus,
  Save,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavigationTab, Objective, Profile } from '../types';
import { formatDateVN } from '../utils/dateUtils';
import { VpsSheetHeader } from './VpsSheetHeader';

export const CascadeView: React.FC = () => {
  const {
    currentUser,
    profiles,
    departments,
    allPeriods,
    allObjectives,
    allTasks,
    allDailyLogs,
    addObjective,
    createOrOpenPeriod,
    setSelectedPeriodId,
    setActiveTab,
    settings,
  } = useApp();

  const [selectedMonth] = useState(11);
  const [selectedYear] = useState(2026);

  // Modal Phân bổ / Giao chỉ tiêu xuống cấp dưới (Giám đốc -> Trưởng phòng, Trưởng phòng -> Tổ trưởng)
  const [cascadeModal, setCascadeModal] = useState<{
    parentObj: Objective;
    parentOwner: Profile;
    targetRole: 'manager' | 'team_lead';
  } | null>(null);

  const [targetUserId, setTargetUserId] = useState('');
  const [childTitle, setChildTitle] = useState('');
  const [childExpected, setChildExpected] = useState('');
  const [childDeadline, setChildDeadline] = useState('2026-11-28');
  const [childSolution, setChildSolution] = useState('');

  // Lấy kỳ báo cáo Tháng 11/2026 của tất cả nhân sự
  const monthPeriods = useMemo(
    () => allPeriods.filter((p) => p.month === selectedMonth && p.year === selectedYear),
    [allPeriods, selectedMonth, selectedYear]
  );

  const getOwnerOfObjective = (obj: Objective): Profile | undefined => {
    const per = allPeriods.find((p) => p.id === obj.period_id);
    return profiles.find((u) => u.id === per?.user_id);
  };

  // Tính % tiến độ trung bình của 1 chỉ tiêu từ các công việc Bước 3
  const getObjectiveProgress = (objId: string): { progress: number; taskCount: number; logCount: number } => {
    const objTasks = allTasks.filter((t) => t.objective_id === objId);
    const taskIds = new Set(objTasks.map((t) => t.id));
    const logCount = allDailyLogs.filter((l) => l.task_id && taskIds.has(l.task_id)).length;
    if (objTasks.length === 0) return { progress: 0, taskCount: 0, logCount };
    const avg = Math.round(objTasks.reduce((s, t) => s + t.progress, 0) / objTasks.length);
    return { progress: avg, taskCount: objTasks.length, logCount };
  };

  // Danh sách chỉ tiêu cấp Giám đốc (Leader)
  const leaderProfiles = useMemo(
    () => profiles.filter((p) => p.role === 'leader' && p.active),
    [profiles]
  );

  const leaderObjectives = useMemo(() => {
    const leaderPeriodIds = new Set(
      monthPeriods.filter((p) => leaderProfiles.some((l) => l.id === p.user_id)).map((p) => p.id)
    );
    return allObjectives
      .filter((o) => leaderPeriodIds.has(o.period_id))
      .sort((a, b) => a.seq - b.seq);
  }, [monthPeriods, leaderProfiles, allObjectives]);

  const openPersonStep = (userId: string, tab: NavigationTab) => {
    const p = createOrOpenPeriod(userId, selectedMonth, selectedYear);
    setSelectedPeriodId(p.id);
    setActiveTab(tab);
  };

  const openCascadeModalFor = (parentObj: Objective, targetRole: 'manager' | 'team_lead') => {
    const parentOwner = getOwnerOfObjective(parentObj);
    if (!parentOwner) return;
    const candidates = profiles.filter((p) => {
      if (!p.active || p.role !== targetRole) return false;
      if (targetRole === 'team_lead' && parentOwner.role === 'manager') {
        return p.department_id === parentOwner.department_id;
      }
      return true;
    });
    setTargetUserId(candidates[0]?.id || '');
    setChildTitle('');
    setChildExpected(parentObj.expected_result);
    setChildDeadline(parentObj.deadline);
    setChildSolution(parentObj.solution || '');
    setCascadeModal({ parentObj, parentOwner, targetRole });
  };

  const handleConfirmCascade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cascadeModal || !targetUserId || !childTitle.trim()) return;
    const targetPeriod = createOrOpenPeriod(targetUserId, selectedMonth, selectedYear);
    addObjective({
      periodId: targetPeriod.id,
      title: childTitle.trim(),
      expected_result: childExpected.trim(),
      deadline: childDeadline,
      solution: childSolution.trim(),
      parent_objective_id: cascadeModal.parentObj.id,
    });
    setCascadeModal(null);
  };

  const canCascade =
    currentUser?.role === 'leader' ||
    currentUser?.role === 'manager' ||
    currentUser?.role === 'admin';

  return (
    <div className="space-y-6">
      <VpsSheetHeader
        redTitle={settings.company_title}
        mainTitle="SƠ ĐỒ KHOA HỌC PHÂN RÃ MỤC TIÊU 4 BƯỚC (3 CẤP: GIÁM ĐỐC → TRƯỞNG PHÒNG → TỔ TRƯỞNG)"
        subTitle="Mô hình quản trị Hoshin Kanri & MBO: Phân bổ chỉ tiêu từ trên xuống (Top-Down) & Tự động tổng hợp tiến độ từ dưới lên (Bottom-Up)"
        unitText="Đơn vị: Toàn Tổ hợp Văn phòng VPS (Ban Giám đốc • Các Phòng chuyên môn • Các Tổ nghiệp vụ)"
        periodText={`Tháng ${selectedMonth} năm ${selectedYear}`}
        roleBadge={
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 inline-flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5" /> Liên thông 3 cấp × 4 bước
          </span>
        }
      />

      {/* SƠ ĐỒ KHOA HỌC 3 CẤP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500/15 to-amber-600/5 border border-amber-300/70 dark:border-amber-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-sm">
            <Crown className="w-4 h-4 text-amber-600" />
            CẤP 1: GIÁM ĐỐC (Chiến lược Toàn công ty)
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
            Xác lập <strong>Mục tiêu tổng thể Công ty (Bước 1)</strong>, đánh giá thực trạng – nguyên nhân – giải pháp vĩ mô (Bước 2) và phân bổ chỉ tiêu xuống các <strong>Trưởng phòng</strong>.
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/15 to-indigo-600/5 border border-indigo-300/70 dark:border-indigo-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-extrabold text-sm">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            CẤP 2: TRƯỞNG PHÒNG (Điều phối Phòng ban)
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
            Nhận chỉ tiêu từ Giám đốc, xây dựng <strong>4 bước cấp Phòng</strong>, phân tích điểm nghẽn của phòng (Bước 2) và phân rã thành chỉ tiêu cho từng <strong>Tổ trưởng</strong>.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/5 border border-blue-300/70 dark:border-blue-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-extrabold text-sm">
            <Users className="w-4 h-4 text-blue-600" />
            CẤP 3: TỔ TRƯỞNG (Thực thi tại Tổ chuyên môn)
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
            Nhận chỉ tiêu từ Trưởng phòng, lập <strong>Kế hoạch công việc (Bước 3)</strong> giao cho các thành viên trong Tổ, theo dõi <strong>Bảng tiến độ Gantt (Bước 4)</strong> & ghi <strong>Nhật ký (Sheet 5)</strong>.
          </p>
        </div>
      </div>

      {/* CÂY PHÂN RÃ MỤC TIÊU 3 CẤP */}
      <div className="space-y-6">
        {leaderObjectives.map((leaderObj) => {
          const leaderOwner = getOwnerOfObjective(leaderObj);
          const leaderStat = getObjectiveProgress(leaderObj.id);

          // Các chỉ tiêu Trưởng phòng gắn với chỉ tiêu Giám đốc này
          const managerObjs = allObjectives
            .filter((o) => o.parent_objective_id === leaderObj.id)
            .sort((a, b) => a.seq - b.seq);

          return (
            <div
              key={leaderObj.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-300 dark:border-amber-800/80 shadow-sm overflow-hidden"
            >
              {/* KHỐI CẤP 1: CHỈ TIÊU GIÁM ĐỐC */}
              <div className="p-5 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/40 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border-b border-amber-200 dark:border-amber-900">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-amber-500 text-slate-950 flex items-center gap-1">
                        <Crown className="w-3.5 h-3.5" />
                        CẤP GIÁM ĐỐC • CHỈ TIÊU #{leaderObj.seq}
                      </span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {leaderOwner?.full_name} ({leaderOwner?.job_title})
                      </span>
                      <span className="text-xs text-slate-500">
                        • Hạn: <strong>{formatDateVN(leaderObj.deadline)}</strong>
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      {leaderObj.title}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-blue-700 dark:text-blue-400 block">
                          Bước 1 • Kết quả cần đạt:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{leaderObj.expected_result}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 block">
                          Bước 2 • Thực trạng:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {leaderObj.current_status || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-rose-700 dark:text-rose-400 block">
                          Bước 2 • Nguyên nhân:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {leaderObj.root_cause || 'Chưa cập nhật'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                          Bước 2 • Giải pháp chỉ đạo:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {leaderObj.solution || 'Chưa cập nhật'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tiến độ & Nút thao tác cấp Giám đốc */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-2 shrink-0 min-w-[210px]">
                    <div className="bg-white dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-amber-200 dark:border-slate-700 text-right">
                      <div className="text-[11px] text-slate-500">Tiến độ Bước 3 & 4 (Giám đốc)</div>
                      <div className="text-lg font-extrabold text-amber-700 dark:text-amber-400">
                        {leaderStat.progress}%{' '}
                        <span className="text-xs font-normal text-slate-500">
                          ({leaderStat.taskCount} việc • {leaderStat.logCount} nhật ký)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {leaderOwner && (
                        <button
                          type="button"
                          onClick={() => openPersonStep(leaderOwner.id, 'step1_objectives')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                        >
                          Mở 4 bước Giám đốc
                        </button>
                      )}
                      {canCascade && (
                        <button
                          type="button"
                          onClick={() => openCascadeModalFor(leaderObj, 'manager')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Phân bổ cho Trưởng phòng
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* KHỐI CẤP 2: CÁC CHỈ TIÊU TRƯỞNG PHÒNG THUỘC CHỈ TIÊU GIÁM ĐỐC */}
              <div className="p-4 sm:p-5 space-y-4 bg-slate-50/60 dark:bg-slate-950/40">
                <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-indigo-600" />
                  Phân rã xuống Cấp Trưởng phòng ({managerObjs.length} chỉ tiêu cấp Phòng):
                </div>

                {managerObjs.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500">
                    Chưa có chỉ tiêu Trưởng phòng nào gắn với mục tiêu này. Bấm{' '}
                    <strong>"Phân bổ cho Trưởng phòng"</strong> để giao chỉ tiêu xuống phòng ban.
                  </div>
                ) : (
                  <div className="space-y-4 pl-2 sm:pl-4 border-l-2 border-indigo-300 dark:border-indigo-800">
                    {managerObjs.map((mgrObj) => {
                      const mgrOwner = getOwnerOfObjective(mgrObj);
                      const mgrDept = departments.find((d) => d.id === mgrOwner?.department_id);
                      const mgrStat = getObjectiveProgress(mgrObj.id);

                      // Các chỉ tiêu Tổ trưởng gắn với chỉ tiêu Trưởng phòng này
                      const teamLeadObjs = allObjectives
                        .filter((o) => o.parent_objective_id === mgrObj.id)
                        .sort((a, b) => a.seq - b.seq);

                      return (
                        <div
                          key={mgrObj.id}
                          className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900 shadow-2xs overflow-hidden"
                        >
                          {/* Header Chỉ tiêu Trưởng phòng */}
                          <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/60">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                              <div className="space-y-1 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-indigo-600 text-white flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    CẤP TRƯỞNG PHÒNG • CT#{mgrObj.seq}
                                  </span>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    {mgrOwner?.full_name} — {mgrDept?.name}
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    • Hạn: {formatDateVN(mgrObj.deadline)}
                                  </span>
                                </div>

                                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                                  {mgrObj.title}
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1 text-xs">
                                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                                    <strong className="text-slate-900 dark:text-white">Thực trạng: </strong>
                                    <span className="text-slate-600 dark:text-slate-300">
                                      {mgrObj.current_status || 'Chưa nhập'}
                                    </span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                                    <strong className="text-slate-900 dark:text-white">Nguyên nhân: </strong>
                                    <span className="text-slate-600 dark:text-slate-300">
                                      {mgrObj.root_cause || 'Chưa nhập'}
                                    </span>
                                  </div>
                                  <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900">
                                    <strong className="text-emerald-800 dark:text-emerald-300">Giải pháp: </strong>
                                    <span className="text-slate-700 dark:text-slate-300">
                                      {mgrObj.solution || 'Chưa nhập'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <span className="px-3 py-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-xs font-extrabold">
                                  Tiến độ Phòng: {mgrStat.progress}% ({mgrStat.taskCount} việc)
                                </span>
                                {mgrOwner && (
                                  <button
                                    type="button"
                                    onClick={() => openPersonStep(mgrOwner.id, 'step2_evaluation')}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                                  >
                                    Xem 4 bước TP
                                  </button>
                                )}
                                {canCascade && (
                                  <button
                                    type="button"
                                    onClick={() => openCascadeModalFor(mgrObj, 'team_lead')}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Giao xuống Tổ trưởng
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* KHỐI CẤP 3: CÁC CHỈ TIÊU TỔ TRƯỞNG THUỘC CHỈ TIÊU TRƯỞNG PHÒNG */}
                          <div className="p-3.5 sm:p-4 space-y-2.5">
                            <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1">
                              <ChevronRight className="w-3.5 h-3.5" />
                              Phân rã xuống Cấp Tổ trưởng ({teamLeadObjs.length} chỉ tiêu cấp Tổ chuyên môn):
                            </div>

                            {teamLeadObjs.length === 0 ? (
                              <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                                Chưa có chỉ tiêu Tổ trưởng nào gắn với mục tiêu phòng này.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                {teamLeadObjs.map((tlObj) => {
                                  const tlOwner = getOwnerOfObjective(tlObj);
                                  const tlStat = getObjectiveProgress(tlObj.id);

                                  return (
                                    <div
                                      key={tlObj.id}
                                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-blue-400 transition space-y-2"
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <div>
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                              TỔ TRƯỞNG • CT#{tlObj.seq}
                                            </span>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                                              {tlOwner?.full_name}
                                            </span>
                                            {tlOwner?.team_name && (
                                              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                                                ({tlOwner.team_name})
                                              </span>
                                            )}
                                          </div>
                                          <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-1">
                                            {tlObj.title}
                                          </h5>
                                        </div>

                                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                                          {tlStat.progress}%
                                        </span>
                                      </div>

                                      <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                                        <div>
                                          <strong>KQ cần đạt (B1):</strong> {tlObj.expected_result}
                                        </div>
                                        {tlObj.solution && (
                                          <div className="text-emerald-700 dark:text-emerald-400">
                                            <strong>Giải pháp (B2):</strong> {tlObj.solution}
                                          </div>
                                        )}
                                      </div>

                                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-[11px]">
                                        <span className="text-slate-500">
                                          Bước 3: <strong>{tlStat.taskCount} việc</strong> • Sheet 5:{' '}
                                          <strong>{tlStat.logCount} nhật ký</strong>
                                        </span>
                                        {tlOwner && (
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => openPersonStep(tlOwner.id, 'step2_evaluation')}
                                              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                                            >
                                              B2: Đánh giá
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => openPersonStep(tlOwner.id, 'step3_plan')}
                                              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-blue-600 hover:bg-blue-50 cursor-pointer"
                                            >
                                              B3: Kế hoạch
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => openPersonStep(tlOwner.id, 'step4_gantt')}
                                              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                                            >
                                              B4: Gantt
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL PHÂN BỔ CHỈ TIÊU XUỐNG CẤP DƯỚI */}
      {cascadeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="font-bold text-sm sm:text-base">
                    Phân bổ chỉ tiêu xuống{' '}
                    {cascadeModal.targetRole === 'manager' ? 'Cấp Trưởng phòng' : 'Cấp Tổ trưởng'}
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    Từ chỉ tiêu #{cascadeModal.parentObj.seq} của {cascadeModal.parentOwner.full_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCascadeModal(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCascade} className="p-5 space-y-4">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs">
                <strong className="text-amber-900 dark:text-amber-300 block">
                  🔗 Chỉ tiêu cấp trên đang phân rã:
                </strong>
                <span className="text-slate-700 dark:text-slate-300">{cascadeModal.parentObj.title}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn {cascadeModal.targetRole === 'manager' ? 'Trưởng phòng' : 'Tổ trưởng'} nhận chỉ tiêu:{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                >
                  {profiles
                    .filter((p) => p.active && p.role === cascadeModal.targetRole)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name} — {p.job_title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nội dung Mục tiêu (Bước 1) giao xuống: <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={childTitle}
                  onChange={(e) => setChildTitle(e.target.value)}
                  placeholder="Nhập tên mục tiêu cụ thể giao cho cấp dưới..."
                  className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kết quả cần đạt (KPI): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={childExpected}
                    onChange={(e) => setChildExpected(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Hạn hoàn thành: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={childDeadline}
                    onChange={(e) => setChildDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Định hướng Giải pháp (Bước 2 - Tuỳ chọn):
                </label>
                <input
                  type="text"
                  value={childSolution}
                  onChange={(e) => setChildSolution(e.target.value)}
                  placeholder="Gợi ý giải pháp trọng tâm từ cấp trên..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCascadeModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lưu & Giao Chỉ Tiêu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

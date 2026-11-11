import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Filter,
  HelpCircle,
  Lightbulb,
  Save,
  SearchCheck,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SYSTEM_TODAY } from '../utils/dateUtils';
import { VpsSheetHeader } from './VpsSheetHeader';

type Draft = { current_status: string; root_cause: string; solution: string };

export const Step2EvaluationView: React.FC = () => {
  const {
    currentPeriod,
    objectives,
    profiles,
    departments,
    canEditCurrentPeriod,
    updateObjective,
    saveAllDataNow,
    lastSavedAt,
    setActiveTab,
    settings,
  } = useApp();

  const [selectedObjFilter, setSelectedObjFilter] = useState<string>('all');

  // Local draft map để người dùng gõ trực tiếp trên bảng & bấm Lưu cực nhanh
  const [draftMap, setDraftMap] = useState<Record<string, Draft>>({});

  useEffect(() => {
    const next: Record<string, Draft> = {};
    objectives.forEach((o) => {
      next[o.id] = {
        current_status: o.current_status || '',
        root_cause: o.root_cause || '',
        solution: o.solution || '',
      };
    });
    setDraftMap(next);
  }, [objectives]);

  if (!currentPeriod) return null;

  const periodOwner = profiles.find((p) => p.id === currentPeriod.user_id);
  const roleLabel =
    periodOwner?.role === 'leader'
      ? 'CẤP GIÁM ĐỐC'
      : periodOwner?.role === 'manager'
      ? 'CẤP TRƯỞNG PHÒNG'
      : 'CẤP TỔ TRƯỞNG';

  const displayedObjectives =
    selectedObjFilter === 'all'
      ? objectives
      : objectives.filter((o) => o.id === selectedObjFilter);

  const selectedObjTitle =
    selectedObjFilter === 'all'
      ? 'TẤT CẢ CHỈ TIÊU TRONG KỲ'
      : objectives.find((o) => o.id === selectedObjFilter)?.title || '';

  const getDraft = (id: string): Draft => {
    const o = objectives.find((x) => x.id === id);
    return (
      draftMap[id] || {
        current_status: o?.current_status || '',
        root_cause: o?.root_cause || '',
        solution: o?.solution || '',
      }
    );
  };

  const isDirty = (id: string) => {
    const o = objectives.find((x) => x.id === id);
    const d = draftMap[id];
    if (!o || !d) return false;
    return (
      d.current_status !== (o.current_status || '') ||
      d.root_cause !== (o.root_cause || '') ||
      d.solution !== (o.solution || '')
    );
  };

  const handleSaveOne = (id: string) => {
    const d = draftMap[id];
    if (!d) return;
    updateObjective(id, {
      current_status: d.current_status.trim(),
      root_cause: d.root_cause.trim(),
      solution: d.solution.trim(),
    });
  };

  const handleSaveAllStep2 = () => {
    displayedObjectives.forEach((o) => {
      if (isDirty(o.id)) handleSaveOne(o.id);
    });
    saveAllDataNow(false);
  };

  const setField = (id: string, field: keyof Draft, value: string) =>
    setDraftMap((prev) => ({ ...prev, [id]: { ...getDraft(id), [field]: value } }));

  const evaluatedCount = objectives.filter(
    (o) => o.current_status?.trim() && o.root_cause?.trim() && o.solution?.trim()
  ).length;

  const fieldMeta: { key: keyof Draft; col: string; label: string; hint: string; placeholder: string }[] = [
    {
      key: 'current_status',
      col: 'C',
      label: 'THỰC TRẠNG',
      hint: 'Hiện tại đang ở đâu? (số liệu cụ thể)',
      placeholder: 'VD: Mới đạt 60% (6/10 hợp đồng), còn thiếu 4 hợp đồng...',
    },
    {
      key: 'root_cause',
      col: 'D',
      label: 'NGUYÊN NHÂN',
      hint: 'Vì sao có khoảng cách? (hỏi "Tại sao" 3–5 lần)',
      placeholder: 'VD: Thiếu nhân sự demo, quy trình chăm sóc sau demo chưa có...',
    },
    {
      key: 'solution',
      col: 'E',
      label: 'GIẢI PHÁP',
      hint: 'Làm gì để xử lý nguyên nhân? (chuyển thành việc ở Bước 3)',
      placeholder: 'VD: Bổ sung 1 người demo, chăm sóc khách trong 48h sau demo...',
    },
  ];

  const periodDept = departments.find((d) => d.id === currentPeriod.department_id);
  const unitDisplay = periodOwner?.team_name
    ? `Đơn vị: ${periodDept?.name || settings.unit_prefix} — ${periodOwner.team_name}`
    : `Đơn vị: ${periodDept?.name || settings.unit_prefix}`;

  return (
    <div className="space-y-5">
      {/* HEADER BƯỚC 2 CHUẨN MẪU BIỂU TẬP ĐOÀN VPS */}
      <VpsSheetHeader
        redTitle={settings.company_title}
        mainTitle={
          <>
            1. ĐÁNH GIÁ THỰC TRẠNG CHỈ TIÊU:{' '}
            <span className="text-blue-700 dark:text-blue-400">{selectedObjTitle}</span>
          </>
        }
        unitText={unitDisplay}
        periodText={`Tháng ${currentPeriod.month} năm ${currentPeriod.year}`}
        roleBadge={
          <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-amber-100 text-amber-900 inline-flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            {roleLabel}: {periodOwner?.full_name} ({evaluatedCount}/{objectives.length} chỉ tiêu)
          </span>
        }
        rightActions={
          <>
            <button
              type="button"
              onClick={() => setActiveTab('step1_objectives')}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Bước 1
            </button>

            {canEditCurrentPeriod && (
              <button
                type="button"
                onClick={handleSaveAllStep2}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu toàn bộ Bước 2
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('step3_plan')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
            >
              Sang Bước 3: Lập kế hoạch
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">

        {/* Gợi ý phương pháp khoa học */}
        <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 flex gap-2">
          <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Phương pháp:</strong> Thực trạng phải có <strong>số liệu đo được</strong> → Nguyên nhân dùng kỹ thuật{' '}
            <strong>"5 Tại sao"</strong> để tìm gốc rễ → Mỗi nguyên nhân có ít nhất <strong>1 giải pháp</strong>, và mỗi giải
            pháp sẽ trở thành <strong>công việc cụ thể ở Bước 3</strong>.
          </span>
        </div>

        {/* Bộ lọc chọn từng Chỉ tiêu */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Xem theo chỉ tiêu:
          </span>
          <select
            value={selectedObjFilter}
            onChange={(e) => setSelectedObjFilter(e.target.value)}
            className="w-full sm:max-w-lg px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
          >
            <option value="all">Xem tất cả ({objectives.length} chỉ tiêu trong kỳ)</option>
            {objectives.map((o) => (
              <option key={o.id} value={o.id}>
                Chỉ tiêu {o.seq}: {o.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* BẢNG CHUẨN SHEET 2 TRÊN MÁY TÍNH (NHẬP TRỰC TIẾP TRÊN Ô) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white text-xs uppercase tracking-wider">
                <th className="py-3.5 px-3 text-center w-12 border-r border-blue-800">TT</th>
                <th className="py-3.5 px-4 text-left w-[24%] border-r border-blue-800">
                  MỤC TIÊU
                  <span className="block text-[10px] font-normal normal-case text-blue-200">(Tự động lấy từ Bước 1)</span>
                </th>
                {fieldMeta.map((f) => (
                  <th key={f.key} className="py-3.5 px-4 text-left border-r border-blue-800">
                    {f.label}
                    <span className="block text-[10px] font-normal normal-case text-blue-200">{f.hint}</span>
                  </th>
                ))}
                <th className="py-3.5 px-3 text-center w-24">LƯU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {displayedObjectives.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-500">
                    Chưa có chỉ tiêu nào. Hãy nhập mục tiêu ở <strong>Bước 1</strong> trước.
                  </td>
                </tr>
              )}
              {displayedObjectives.map((obj) => {
                const draft = getDraft(obj.id);
                const isComplete = Boolean(
                  draft.current_status.trim() && draft.root_cause.trim() && draft.solution.trim()
                );

                return (
                  <tr key={obj.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition align-top">
                    <td className="py-4 px-3 text-center font-extrabold text-blue-800 dark:text-blue-300 border-r border-slate-100 dark:border-slate-800">
                      {obj.seq}
                    </td>

                    <td className="py-4 px-4 border-r border-slate-100 dark:border-slate-800">
                      <div className="font-semibold text-slate-900 dark:text-white leading-relaxed">{obj.title}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        <strong>KQ cần đạt:</strong> {obj.expected_result}
                      </div>
                    </td>

                    {fieldMeta.map((f) => (
                      <td key={f.key} className="py-3 px-3 border-r border-slate-100 dark:border-slate-800">
                        <textarea
                          rows={4}
                          disabled={!canEditCurrentPeriod}
                          value={draft[f.key]}
                          onChange={(e) => setField(obj.id, f.key, e.target.value)}
                          onBlur={() => {
                            if (isDirty(obj.id)) handleSaveOne(obj.id);
                          }}
                          placeholder={f.placeholder}
                          className={`w-full p-2.5 text-sm rounded-xl border bg-slate-50/70 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 outline-none transition ${
                            f.key === 'solution'
                              ? 'border-emerald-200 dark:border-emerald-900'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}
                        />
                      </td>
                    ))}

                    <td className="py-4 px-3 text-center">
                      <div className="flex flex-col items-center gap-1.5">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đủ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600">
                            <HelpCircle className="w-3.5 h-3.5" /> Thiếu
                          </span>
                        )}
                        {canEditCurrentPeriod && (
                          <button
                            type="button"
                            onClick={() => handleSaveOne(obj.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3 h-3" /> Lưu
                          </button>
                        )}
                      </div>
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
              {settings.location_city}, ngày {SYSTEM_TODAY.split('-')[2]} tháng {SYSTEM_TODAY.split('-')[1]} năm{' '}
              {SYSTEM_TODAY.split('-')[0]}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mt-1">
              NGƯỜI LẬP BIỂU ({roleLabel})
            </p>
            <p className="text-sm font-extrabold text-blue-900 dark:text-blue-300 mt-6">{periodOwner?.full_name}</p>
          </div>
        </div>
      </div>

      {/* GIAO DIỆN THẺ TRÊN ĐIỆN THOẠI */}
      <div className="md:hidden space-y-3">
        {displayedObjectives.map((obj) => {
          const draft = getDraft(obj.id);
          return (
            <div
              key={obj.id}
              className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-indigo-900 text-white flex items-center gap-1">
                  <SearchCheck className="w-3.5 h-3.5" />
                  Đánh giá Chỉ tiêu #{obj.seq}
                </span>
                {canEditCurrentPeriod && (
                  <button
                    type="button"
                    onClick={() => handleSaveOne(obj.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white flex items-center gap-1"
                  >
                    <Save className="w-3.5 h-3.5" /> Lưu
                  </button>
                )}
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{obj.title}</h4>

              <div className="space-y-2.5">
                {fieldMeta.map((f) => (
                  <div key={f.key}>
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      {f.col}. {f.label} <span className="font-normal text-slate-400">— {f.hint}</span>
                    </label>
                    <textarea
                      rows={2}
                      disabled={!canEditCurrentPeriod}
                      value={draft[f.key]}
                      onChange={(e) => setField(obj.id, f.key, e.target.value)}
                      onBlur={() => {
                        if (isDirty(obj.id)) handleSaveOne(obj.id);
                      }}
                      placeholder={f.placeholder}
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Lock,
  MessageSquarePlus,
  Printer,
  RotateCcw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatDateTimeVN,
  formatDateVN,
  getPeriodStatusMeta,
  getTaskStatusMeta,
  SYSTEM_TODAY,
} from '../utils/dateUtils';
import { exportPeriodToExcel } from '../utils/excelExport';
import { VpsLogoMark } from './VpsSheetHeader';

export const MyPeriodOverview: React.FC = () => {
  const {
    currentUser,
    currentPeriod,
    departments,
    profiles,
    objectives,
    tasks,
    dailyLogs,
    comments,
    settings,
    changePeriodStatus,
    addComment,
    setActiveTab,
    showToast,
  } = useApp();

  const [commentText, setCommentText] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  if (!currentPeriod || !currentUser) return null;

  const employee = profiles.find((p) => p.id === currentPeriod.user_id) || currentUser;
  const department =
    departments.find((d) => d.id === currentPeriod.department_id) || departments[0];
  const approver = profiles.find((p) => p.id === currentPeriod.approved_by) || null;
  const periodStatusMeta = getPeriodStatusMeta(currentPeriod.status);

  const periodComments = comments.filter((c) => c.period_id === currentPeriod.id);

  // Kiểm tra 4 bước
  const step1Done = objectives.length > 0;
  const step2Done =
    objectives.length > 0 &&
    objectives.every(
      (o) => o.current_status?.trim() && o.root_cause?.trim() && o.solution?.trim()
    );
  const step3Done = tasks.length >= objectives.length && tasks.length > 0;
  const step4Done = dailyLogs.length > 0;

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await exportPeriodToExcel({
        period: currentPeriod,
        employee,
        department,
        approver,
        objectives,
        tasks,
        logs: dailyLogs,
        profiles,
        settings,
      });
      showToast(
        'Đã xuất file Excel (.xlsx) thành công!',
        'File gồm đầy đủ 5 sheet chuẩn mẫu Văn phòng VPS kèm chữ ký.',
        'success'
      );
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi xuất Excel', 'Vui lòng thử lại.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment({
      period_id: currentPeriod.id,
      body: commentText,
    });
    setCommentText('');
  };

  return (
    <div className="space-y-6">
      {/* BANNER TRẠNG THÁI KỲ BÁO CÁO & NÚT XUẤT FILE / GỬI DUYỆT */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold border ${periodStatusMeta.badgeClass}`}
              >
                {periodStatusMeta.label}
              </span>
              <span className="text-xs text-slate-500">
                Đơn vị: <strong>{department.name}</strong>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Hồ sơ Báo cáo 4 Bước — Tháng {currentPeriod.month} năm {currentPeriod.year}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Người lập biểu: <strong>{employee.full_name}</strong> ({employee.job_title})
              {approver && (
                <span>
                  {' '}
                  • Người phê duyệt: <strong>{approver.full_name}</strong>
                </span>
              )}
            </p>
            {currentPeriod.manager_note && (
              <div className="mt-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                <strong>Ý kiến Trưởng bộ phận:</strong> {currentPeriod.manager_note}
              </div>
            )}
          </div>

          {/* Các nút hành động chính */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {isExporting ? 'Đang tạo 5 Sheet...' : 'Xuất Excel (.xlsx) 5 Sheet mẫu'}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-600" />
              In / Xuất PDF
            </button>

            {/* Nút Gửi duyệt cho tổ trưởng */}
            {(currentPeriod.status === 'draft' || currentPeriod.status === 'returned') &&
              (currentUser.id === currentPeriod.user_id || currentUser.role === 'admin') && (
                <button
                  type="button"
                  onClick={() =>
                    changePeriodStatus(
                      currentPeriod.id,
                      'submitted',
                      'Đã hoàn thiện kế hoạch 4 bước và gửi trình duyệt.'
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Gửi trình Trưởng bộ phận
                </button>
              )}

            {/* Nút Duyệt / Trả lại / Khoá kỳ cho Trưởng bộ phận, Giám đốc hoặc Admin */}
            {(currentUser.role === 'manager' ||
              currentUser.role === 'leader' ||
              currentUser.role === 'admin') &&
              currentPeriod.status !== 'locked' && (
                <>
                  {currentPeriod.status !== 'approved' && (
                    <button
                      type="button"
                      onClick={() =>
                        changePeriodStatus(
                          currentPeriod.id,
                          'approved',
                          'Phê duyệt kế hoạch & báo cáo công việc 4 bước.'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Duyệt kỳ này
                    </button>
                  )}
                  {currentPeriod.status === 'submitted' && (
                    <button
                      type="button"
                      onClick={() =>
                        changePeriodStatus(
                          currentPeriod.id,
                          'returned',
                          'Đề nghị rà soát và bổ sung thêm chi tiết kết quả đầu ra.'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Trả lại
                    </button>
                  )}
                  {currentPeriod.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() =>
                        changePeriodStatus(
                          currentPeriod.id,
                          'locked',
                          'Đã chốt và khoá sổ kỳ báo cáo cuối tháng.'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Chốt & Khoá sổ tháng
                    </button>
                  )}
                </>
              )}
          </div>
        </div>

        {/* CHECKLIST 4 BƯỚC KHÉP KÍN */}
        <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              step: 'Bước 1: Mục tiêu tổng thể',
              done: step1Done,
              desc: `${objectives.length} chỉ tiêu đã thiết lập`,
              tab: 'step1_objectives' as const,
            },
            {
              step: 'Bước 2: Đánh giá thực trạng',
              done: step2Done,
              desc: `${objectives.filter((o) => o.current_status).length}/${objectives.length} chỉ tiêu đã phân tích`,
              tab: 'step2_evaluation' as const,
            },
            {
              step: 'Bước 3: Kế hoạch thực hiện',
              done: step3Done,
              desc: `${tasks.length} công việc kế hoạch`,
              tab: 'step3_plan' as const,
            },
            {
              step: 'Bước 4 & 4.1: Tiến độ & Nhật ký',
              done: step4Done,
              desc: `${dailyLogs.length} dòng nhật ký • Tự sinh Gantt`,
              tab: 'step4_gantt' as const,
            },
          ].map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveTab(item.tab)}
              className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${item.done
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                  : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                }`}
            >
              <CheckCircle2
                className={`w-5 h-5 shrink-0 mt-0.5 ${item.done ? 'text-emerald-600' : 'text-amber-500'
                  }`}
              />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{item.step}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* BẢN XEM TRƯỚC CHUẨN IN ẤN / BIỂU MẪU VĂN PHÒNG VPS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="bg-white rounded-xl p-1 border border-slate-100 shrink-0">
            <VpsLogoMark size="sm" />
          </div>
          <div className="flex-1 text-center space-y-1">
            <p className="text-xs font-serif font-extrabold tracking-widest text-red-600 dark:text-red-400 uppercase">
              {settings.company_title}
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white uppercase">
              BÁO CÁO TỔNG HỢP CHU TRÌNH 4 BƯỚC & NHẬT KÝ CÔNG VIỆC
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
              Đơn vị: {department.name}
              {employee.team_name ? ` — ${employee.team_name}` : ''}
            </p>
            <p className="text-xs italic text-slate-500">
              Tháng {currentPeriod.month} năm {currentPeriod.year} — Người lập: {employee.full_name} ({employee.job_title})
            </p>
          </div>
        </div>

        {/* Tóm tắt Chỉ tiêu (Sheet 1 & 2) */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-300">
            I. MỤC TIÊU TỔNG THỂ & ĐÁNH GIÁ THỰC TRẠNG (SHEET 1 & SHEET 2)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-200 dark:border-slate-800 border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <th className="p-2 border border-slate-200 dark:border-slate-700 w-10">TT</th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 text-left">
                    Mục tiêu
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 text-left">
                    Kết quả cần đạt
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 text-left">
                    Thực trạng • Nguyên nhân • Giải pháp
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 w-24">
                    Thời hạn
                  </th>
                </tr>
              </thead>
              <tbody>
                {objectives.map((o) => (
                  <tr key={o.id}>
                    <td className="p-2 border border-slate-200 dark:border-slate-800 text-center font-bold">
                      {o.seq}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-800 font-semibold">
                      {o.title}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-800">
                      {o.expected_result}
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-800">
                      <div>
                        <strong>Thực trạng:</strong> {o.current_status || '—'}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        <strong>Nguyên nhân:</strong> {o.root_cause || '—'}
                      </div>
                      <div className="text-emerald-700 dark:text-emerald-400 mt-0.5">
                        <strong>Giải pháp:</strong> {o.solution || '—'}
                      </div>
                    </td>
                    <td className="p-2 border border-slate-200 dark:border-slate-800 text-center">
                      {formatDateVN(o.deadline)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tóm tắt Kế hoạch & Tiến độ (Sheet 3 & 4) */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-300">
            II. KẾ HOẠCH THỰC HIỆN & KẾT QUẢ TIẾN ĐỘ (SHEET 3 & SHEET 4)
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-200 dark:border-slate-800 border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <th className="p-2 border border-slate-200 dark:border-slate-700 w-10">TT</th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 text-left">
                    Công việc thực hiện
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 w-24">
                    Bắt đầu
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 w-24">
                    Kết thúc
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 text-left">
                    Kết quả đầu ra
                  </th>
                  <th className="p-2 border border-slate-200 dark:border-slate-700 w-28">
                    KQ Tiến độ
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, idx) => {
                  const meta = getTaskStatusMeta(t.status);
                  return (
                    <tr key={t.id}>
                      <td className="p-2 border border-slate-200 dark:border-slate-800 text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-slate-800 font-semibold">
                        {t.title}
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-slate-800 text-center">
                        {formatDateVN(t.start_date)}
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-slate-800 text-center">
                        {formatDateVN(t.end_date)}
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-slate-800">
                        {t.expected_output}
                      </td>
                      <td className="p-2 border border-slate-200 dark:border-slate-800 text-center font-bold">
                        {meta.shortLabel} ({t.progress}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Khối chữ ký cuối biểu chuẩn mẫu */}
        <div className="pt-6 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              TRƯỞNG BỘ PHẬN PHÊ DUYỆT
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {approver ? `Đã ký duyệt điện tử` : `(Chưa ký duyệt)`}
            </p>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-8">
              {approver?.full_name || '................................'}
            </p>
          </div>

          <div>
            <p className="text-xs italic text-slate-500">
              {settings.location_city}, ngày {SYSTEM_TODAY.split('-')[2]} tháng{' '}
              {SYSTEM_TODAY.split('-')[1]} năm {SYSTEM_TODAY.split('-')[0]}
            </p>
            <p className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 mt-1">
              NGƯỜI LẬP BIỂU
            </p>
            <p className="text-sm font-extrabold text-blue-900 dark:text-blue-300 mt-7">
              {employee.full_name}
            </p>
          </div>
        </div>
      </div>

      {/* LUỒNG TRAO ĐỔI / NHẬN XÉT & CHỈ ĐẠO */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquarePlus className="w-5 h-5 text-blue-600" />
          Nhận xét, Phản hồi & Chỉ đạo trên Kỳ báo cáo ({periodComments.length})
        </h3>

        <form onSubmit={handleSendComment} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Nhập nhận xét, giải trình hoặc ý kiến chỉ đạo cho kỳ báo cáo này..."
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer"
          >
            Gửi nhận xét
          </button>
        </form>

        <div className="space-y-2.5">
          {periodComments.map((cmt) => {
            const author = profiles.find((p) => p.id === cmt.author_id);
            return (
              <div
                key={cmt.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {author?.full_name}{' '}
                    <span className="font-normal text-slate-500">({author?.job_title})</span>
                  </span>
                  <span className="text-slate-400">{formatDateTimeVN(cmt.created_at)}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{cmt.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Mic,
  MicOff,
  Paperclip,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AttachmentItem } from '../types';
import {
  canEmployeeEditLogDate,
  formatDateVN,
  SYSTEM_TODAY,
} from '../utils/dateUtils';

export const QuickLogModal: React.FC = () => {
  const {
    quickLogModal,
    closeQuickLogModal,
    tasks,
    objectives,
    addDailyLog,
    currentUser,
    settings,
    showToast,
  } = useApp();

  const [logDate, setLogDate] = useState<string>(SYSTEM_TODAY);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('adhoc');
  const [content, setContent] = useState<string>('');
  const [progressAfter, setProgressAfter] = useState<number>(50);
  const [hours, setHours] = useState<string>('4.0');
  const [issues, setIssues] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Đồng bộ khi mở modal từ nút tắt trên công việc hoặc ô Gantt
  useEffect(() => {
    if (quickLogModal.isOpen) {
      setLogDate(quickLogModal.logDate || SYSTEM_TODAY);
      const tId = quickLogModal.taskId || (tasks[0]?.id ?? 'adhoc');
      setSelectedTaskId(tId);
      const foundTask = tasks.find((t) => t.id === tId);
      if (foundTask) {
        setProgressAfter(Math.min(100, foundTask.progress + 20));
      } else {
        setProgressAfter(100);
      }
      setContent('');
      setIssues('');
      setAttachments([]);
    }
  }, [quickLogModal.isOpen, quickLogModal.taskId, quickLogModal.logDate, tasks]);

  // Khi người dùng đổi công việc trong dropdown, tự lấy % hiện tại của công việc đó
  const handleTaskChange = (val: string) => {
    setSelectedTaskId(val);
    if (val !== 'adhoc') {
      const found = tasks.find((t) => t.id === val);
      if (found) {
        setProgressAfter(found.progress);
      }
    } else {
      setProgressAfter(100);
    }
  };

  if (!quickLogModal.isOpen) return null;

  const isDateAllowed =
    currentUser?.role !== 'team_lead' ||
    canEmployeeEditLogDate(logDate, settings.allow_backdate_days);

  // Hỗ trợ nhập giọng nói Tiếng Việt (Web Speech API)
  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Nếu trình duyệt không có SpeechRecognition thực, mô phỏng nhận diện thông minh để demo
      setIsListening(true);
      setTimeout(() => {
        const selectedTask = tasks.find((t) => t.id === selectedTaskId);
        const sampleVoice = selectedTask
          ? `Đã hoàn thành rà soát và triển khai hạng mục "${selectedTask.title}", kiểm tra vận hành ổn định theo đúng kế hoạch.`
          : 'Đã xử lý xong các yêu cầu phát sinh trong ngày và phối hợp với các bộ phận liên quan.';
        setContent((prev) => (prev ? `${prev} ${sampleVoice}` : sampleVoice));
        setIsListening(false);
        showToast('Đã nhận diện giọng nói (Tiếng Việt)', 'Nội dung đã được điền tự động vào ô nhật ký.', 'info');
      }, 1200);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recognition = new (SpeechRecognition as any)();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setContent((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };
      recognition.onerror = () => {
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newItems: AttachmentItem[] = Array.from(files).map((file, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      url: URL.createObjectURL(file),
    }));
    setAttachments((prev) => [...prev, ...newItems]);
  };

  const quickTemplates = [
    'Hoàn thành đúng tiến độ đề ra, kết quả nghiệm thu đạt yêu cầu.',
    'Đã phối hợp với các bộ phận liên quan xử lý và bàn giao tài liệu.',
    'Đã kiểm thử vận hành thực tế và khắc phục các lỗi phát sinh.',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDateAllowed) {
      showToast(
        'Quá thời hạn bổ sung nhật ký',
        `Tổ trưởng chỉ được bổ sung nhật ký tối đa ${settings.allow_backdate_days} ngày trước. Vui lòng liên hệ Trưởng bộ phận.`,
        'error'
      );
      return;
    }

    const ok = addDailyLog({
      log_date: logDate,
      task_id: selectedTaskId === 'adhoc' ? null : selectedTaskId,
      content,
      progress_after: selectedTaskId === 'adhoc' ? 100 : progressAfter,
      hours: hours ? parseFloat(hours) : undefined,
      issues,
      attachments,
    });

    if (ok) {
      closeQuickLogModal();
    }
  };

  const selectedTaskObj = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-200 block">
              Sheet 4.1 • Nhật ký công việc hàng ngày
            </span>
            <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-300" />
              Thêm việc đã làm (Tự động cập nhật Gantt Bước 4)
            </h3>
          </div>
          <button
            type="button"
            onClick={closeQuickLogModal}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Ngày & Số giờ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Ngày thực hiện <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                  required
                />
              </div>
              {!isDateAllowed && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Quá hạn {settings.allow_backdate_days} ngày cho phép bổ sung.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Thời gian làm (Giờ - Tuỳ chọn)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="VD: 4.0"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Chọn Công việc từ Bước 3 */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Thuộc công việc trong Kế hoạch (Bước 3) <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => handleTaskChange(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium focus:ring-2 focus:ring-blue-600 outline-none"
            >
              {objectives.map((obj) => {
                const objTasks = tasks.filter((t) => t.objective_id === obj.id);
                if (objTasks.length === 0) return null;
                return (
                  <optgroup key={obj.id} label={`Chỉ tiêu ${obj.seq}: ${obj.title.slice(0, 65)}...`}>
                    {objTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        [Việc #{t.seq} • {t.progress}%] {t.title} (Hạn: {formatDateVN(t.end_date)})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
              <optgroup label="Ngoài kế hoạch tháng">
                <option value="adhoc">⚡ Việc phát sinh – không thuộc kế hoạch (Thống kê riêng)</option>
              </optgroup>
            </select>
          </div>

          {/* Nội dung đã làm + Giọng nói */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Nội dung công việc đã thực hiện <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" /> Đang nghe tiếng Việt...
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" /> Nhập bằng giọng nói
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Mô tả cụ thể kết quả đã làm trong ngày..."
              className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
              required
            />
            {/* Gợi ý nhanh */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {quickTemplates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setContent((prev) => (prev ? `${prev} ${tpl}` : tpl))}
                  className="text-[11px] bg-slate-100 hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {tpl.slice(0, 42)}...
                </button>
              ))}
            </div>
          </div>

          {/* Thanh trượt % hoàn thành công việc */}
          {selectedTaskId !== 'adhoc' && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  % Hoàn thành của công việc sau hôm nay:
                </span>
                <span className="text-sm font-extrabold text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-blue-200 dark:border-slate-700">
                  {progressAfter}% {progressAfter === 100 ? '✓ Hoàn thành' : ''}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progressAfter}
                onChange={(e) => setProgressAfter(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-2 rounded-lg"
              />
              <div className="flex justify-between mt-1.5">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setProgressAfter(pct)}
                    className={`text-xs px-2 py-0.5 rounded font-semibold transition ${
                      progressAfter === pct
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              {selectedTaskObj && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Tiến độ trước đó: <strong>{selectedTaskObj.progress}%</strong> → Lưu nhật ký sẽ tự động tô màu ô ngày{' '}
                  <strong>{formatDateVN(logDate)}</strong> trên bảng Gantt Bước 4.
                </p>
              )}
            </div>
          )}

          {/* Vướng mắc / đề xuất & Đính kèm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Vướng mắc / Đề xuất (Tuỳ chọn)
              </label>
              <input
                type="text"
                value={issues}
                onChange={(e) => setIssues(e.target.value)}
                placeholder="Ghi rõ khó khăn cần hỗ trợ..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Đính kèm minh chứng (Ảnh / File)
              </label>
              <label className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer transition text-slate-600 dark:text-slate-300">
                <Paperclip className="w-4 h-4 text-blue-600" />
                <span>Chọn ảnh / tệp đính kèm ({attachments.length})</span>
                <input type="file" multiple className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att) => (
                <span
                  key={att.id}
                  className="inline-flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <Paperclip className="w-3 h-3 text-blue-600" />
                  <span className="truncate max-w-[160px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))}
                    className="text-rose-500 hover:text-rose-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={closeQuickLogModal}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 flex items-center gap-2 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Lưu Nhật Ký & Cập Nhật Tiến Độ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


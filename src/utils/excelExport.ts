import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  DailyLog,
  Department,
  Objective,
  Profile,
  ReportPeriod,
  SystemSettings,
  TaskItem,
} from '../types';
import {
  formatDateVN,
  generateGantt35Days,
  getTaskStatusMeta,
  SYSTEM_TODAY,
} from './dateUtils';

interface ExportPeriodBundle {
  period: ReportPeriod;
  employee: Profile;
  department: Department;
  approver?: Profile | null;
  objectives: Objective[];
  tasks: TaskItem[];
  logs: DailyLog[];
  profiles: Profile[];
  settings: SystemSettings;
}

export async function exportPeriodToExcel(bundle: ExportPeriodBundle): Promise<void> {
  const {
    period,
    employee,
    department,
    approver,
    objectives,
    tasks,
    logs,
    profiles,
    settings,
  } = bundle;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'VPS Smart Office - Báo cáo 4 bước';
  workbook.created = new Date();

  const sortedObjectives = [...objectives].sort((a, b) => a.seq - b.seq);
  const sortedTasks = [...tasks].sort((a, b) => a.seq - b.seq);
  const sortedLogs = [...logs].sort((a, b) => a.log_date.localeCompare(b.log_date));

  const [todayYear, todayMonth, todayDay] = SYSTEM_TODAY.split('-');
  const signatureDateText = `${settings.location_city}, ngày ${todayDay} tháng ${todayMonth} năm ${todayYear}`;
  const periodTitleText = `Tháng ${period.month} năm ${period.year}`;
  const unitText = `Đơn vị: ${department.name}`;

  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    left: { style: 'thin', color: { argb: 'FF94A3B8' } },
    bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
    right: { style: 'thin', color: { argb: 'FF94A3B8' } },
  };

  const headerFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' },
  };

  const subHeaderFill: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDBEAFE' },
  };

  // =========================================================================
  // SHEET 1: 1. MỤC TIÊU TỔNG THỂ
  // =========================================================================
  const ws1 = workbook.addWorksheet('1. MỤC TIÊU TỔNG THỂ', {
    views: [{ showGridLines: true }],
  });

  ws1.columns = [
    { key: 'seq', width: 8 },
    { key: 'title', width: 52 },
    { key: 'expected', width: 38 },
    { key: 'deadline', width: 22 },
  ];

  addCommonSheetHeader(
    ws1,
    4,
    settings.company_title,
    '1. MỤC TIÊU TỔNG THỂ',
    unitText,
    periodTitleText
  );

  const s1HeaderRow = ws1.getRow(6);
  s1HeaderRow.values = ['TT', 'MỤC TIÊU', 'KẾT QUẢ CẦN ĐẠT', 'TG THỰC HIỆN\n(Ngày/tháng/năm)'];
  s1HeaderRow.height = 30;
  styleTableHeaderRow(s1HeaderRow, 4, headerFill, borderThin);

  let rowIdx = 7;
  sortedObjectives.forEach((obj, idx) => {
    const r = ws1.getRow(rowIdx++);
    r.values = [
      idx + 1,
      obj.title,
      obj.expected_result || '',
      formatDateVN(obj.deadline),
    ];
    r.height = 36;
    styleDataRow(r, 4, borderThin, [1, 4]);
  });

  // Đảm bảo tối thiểu 8 dòng theo mẫu nếu ít hơn
  while (rowIdx < 7 + 8) {
    const r = ws1.getRow(rowIdx);
    r.values = [rowIdx - 6, '', '', ''];
    r.height = 26;
    styleDataRow(r, 4, borderThin, [1, 4]);
    rowIdx++;
  }

  addSignatureBlock(ws1, rowIdx + 1, 3, 4, signatureDateText, employee.full_name, approver?.full_name);

  // =========================================================================
  // SHEET 2: 2. ĐÁNH GIÁ CHỈ TIÊU
  // =========================================================================
  const ws2 = workbook.addWorksheet('2. ĐÁNH GIÁ CHỈ TIÊU', {
    views: [{ showGridLines: true }],
  });

  ws2.columns = [
    { key: 'seq', width: 8 },
    { key: 'title', width: 38 },
    { key: 'status', width: 32 },
    { key: 'cause', width: 32 },
    { key: 'solution', width: 32 },
  ];

  addCommonSheetHeader(
    ws2,
    5,
    settings.company_title,
    '1. ĐÁNH GIÁ THỰC TRẠNG CHỈ TIÊU',
    unitText,
    periodTitleText
  );

  const s2HeaderRow = ws2.getRow(6);
  s2HeaderRow.values = ['TT', 'MỤC TIÊU', 'THỰC TRẠNG', 'NGUYÊN NHÂN', 'GIẢI PHÁP'];
  s2HeaderRow.height = 30;
  styleTableHeaderRow(s2HeaderRow, 5, headerFill, borderThin);

  let r2Idx = 7;
  sortedObjectives.forEach((obj, idx) => {
    const r = ws2.getRow(r2Idx++);
    r.values = [
      idx + 1,
      obj.title,
      obj.current_status || '',
      obj.root_cause || '',
      obj.solution || '',
    ];
    r.height = 42;
    styleDataRow(r, 5, borderThin, [1]);
  });

  while (r2Idx < 7 + 8) {
    const r = ws2.getRow(r2Idx);
    r.values = [r2Idx - 6, '', '', '', ''];
    r.height = 26;
    styleDataRow(r, 5, borderThin, [1]);
    r2Idx++;
  }

  addSignatureBlock(ws2, r2Idx + 1, 4, 5, signatureDateText, employee.full_name, approver?.full_name);

  // =========================================================================
  // SHEET 3: 3. KẾ HOẠCH THỰC HIỆN
  // =========================================================================
  const ws3 = workbook.addWorksheet('3. KẾ HOẠCH THỰC HIỆN', {
    views: [{ showGridLines: true }],
  });

  ws3.columns = [
    { key: 'seq', width: 8 },
    { key: 'title', width: 45 },
    { key: 'start', width: 16 },
    { key: 'end', width: 16 },
    { key: 'assignee', width: 24 },
    { key: 'output', width: 36 },
  ];

  addCommonSheetHeader(
    ws3,
    6,
    settings.company_title,
    '2. KẾ HOẠCH THỰC HIỆN CHỈ TIÊU',
    unitText,
    periodTitleText
  );

  // Hai dòng tiêu đề gộp ngang cột THỜI GIAN (C6:D6) đúng mẫu
  const s3H1 = ws3.getRow(6);
  const s3H2 = ws3.getRow(7);
  s3H1.values = ['TT', 'CÔNG VIỆC THỰC HIỆN', 'THỜI GIAN', '', 'NGƯỜI THỰC HIỆN', 'KẾT QUẢ'];
  s3H2.values = ['', '', 'BẮT ĐẦU', 'KẾT THÚC', '', ''];
  ws3.mergeCells('A6:A7');
  ws3.mergeCells('B6:B7');
  ws3.mergeCells('C6:D6');
  ws3.mergeCells('E6:E7');
  ws3.mergeCells('F6:F7');
  s3H1.height = 22;
  s3H2.height = 22;
  styleTableHeaderRow(s3H1, 6, headerFill, borderThin);
  styleTableHeaderRow(s3H2, 6, headerFill, borderThin);

  let r3Idx = 8;
  sortedTasks.forEach((t, idx) => {
    const assignee = t.assignee_name?.trim() || profiles.find((p) => p.id === t.assignee_id)?.full_name || employee.full_name;
    const obj = sortedObjectives.find((o) => o.id === t.objective_id);
    const r = ws3.getRow(r3Idx++);
    r.values = [
      idx + 1,
      obj ? `[CT${obj.seq}] ${t.title}` : t.title,
      formatDateVN(t.start_date),
      formatDateVN(t.end_date),
      assignee,
      t.expected_output || '',
    ];
    r.height = 34;
    styleDataRow(r, 6, borderThin, [1, 3, 4]);
  });

  while (r3Idx < 8 + 15) {
    const r = ws3.getRow(r3Idx);
    r.values = [r3Idx - 7, '', '', '', '', ''];
    r.height = 24;
    styleDataRow(r, 6, borderThin, [1, 3, 4]);
    r3Idx++;
  }

  addSignatureBlock(ws3, r3Idx + 1, 4, 6, signatureDateText, employee.full_name, approver?.full_name);

  // =========================================================================
  // SHEET 4: 4. TIẾN ĐỘ (GANTT LỊCH 5 TUẦN x 7 NGÀY = 35 CỘT NGÀY + KQ)
  // =========================================================================
  const ws4 = workbook.addWorksheet('4. TIẾN ĐỘ', {
    views: [{ showGridLines: true }],
  });

  const ganttDays = generateGantt35Days(period.month, period.year);
  const totalCols4 = 2 + 35 + 1; // A=TT, B=CÁC CÔNG VIỆC, 35 cột ngày, cột 38=KQ

  ws4.getColumn(1).width = 6;
  ws4.getColumn(2).width = 38;
  for (let c = 3; c <= 37; c++) {
    ws4.getColumn(c).width = 5.2;
  }
  ws4.getColumn(38).width = 18;

  addCommonSheetHeader(
    ws4,
    totalCols4,
    settings.company_title,
    'BẢNG THEO DÕI TIẾN ĐỘ CÔNG VIỆC',
    unitText,
    periodTitleText
  );

  // Hàng 6: TUẦN 1 .. TUẦN 5
  const s4R6 = ws4.getRow(6);
  const s4R7 = ws4.getRow(7);
  const s4R8 = ws4.getRow(8);

  s4R6.getCell(1).value = 'TT';
  s4R6.getCell(2).value = 'CÁC CÔNG VIỆC';
  for (let w = 0; w < 5; w++) {
    const startCol = 3 + w * 7;
    const endCol = startCol + 6;
    s4R6.getCell(startCol).value = `TUẦN ${w + 1}`;
    ws4.mergeCells(6, startCol, 6, endCol);
  }
  s4R6.getCell(38).value = 'KQ';

  ws4.mergeCells('A6:A8');
  ws4.mergeCells('B6:B8');
  ws4.mergeCells(6, 38, 8, 38);

  ganttDays.forEach((cell, idx) => {
    const col = 3 + idx;
    s4R7.getCell(col).value = cell.dayOfWeekLabel;
    s4R8.getCell(col).value = cell.shortDateLabel;
  });

  s4R6.height = 22;
  s4R7.height = 20;
  s4R8.height = 20;
  styleTableHeaderRow(s4R6, totalCols4, headerFill, borderThin);
  styleTableHeaderRow(s4R7, totalCols4, headerFill, borderThin);
  styleTableHeaderRow(s4R8, totalCols4, subHeaderFill, borderThin, 'FF1E3A8A');

  let r4Idx = 9;
  sortedTasks.forEach((t, idx) => {
    const r = ws4.getRow(r4Idx++);
    r.height = 28;
    r.getCell(1).value = idx + 1;
    r.getCell(2).value = t.title;

    const statusMeta = getTaskStatusMeta(t.status);
    r.getCell(38).value = `${statusMeta.shortLabel} (${t.progress}%)`;

    styleDataRow(r, totalCols4, borderThin, [1, 38]);

    ganttDays.forEach((dayCell, dIdx) => {
      const col = 3 + dIdx;
      const cell = r.getCell(col);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };

      const inPlan = dayCell.dateStr >= t.start_date && dayCell.dateStr <= t.end_date;
      const hasLog = sortedLogs.some(
        (l) => l.task_id === t.id && l.log_date === dayCell.dateStr
      );
      const isOverdueDay =
        t.status === 'overdue' &&
        dayCell.dateStr > t.end_date &&
        dayCell.dateStr <= SYSTEM_TODAY;

      if (hasLog && t.status === 'done') {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF10B981' }, // Xanh lá đậm
        };
        cell.value = '✓';
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      } else if (hasLog) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF3B82F6' }, // Xanh dương có nhật ký
        };
        cell.value = '●';
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      } else if (isOverdueDay) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF87171' }, // Đỏ quá hạn
        };
        cell.value = '!';
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 };
      } else if (inPlan) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' }, // Xám nhạt kế hoạch
        };
      } else if (dayCell.isWeekend) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC7D7EA' } }; // T7/CN tô xanh nhạt đúng mẫu
      }
    });
  });

  addSignatureBlock(ws4, r4Idx + 1, 30, 38, signatureDateText, employee.full_name, approver?.full_name);

  // =========================================================================
  // SHEET 4.1: 4.1 NHẬT KÝ CÔNG VIỆC
  // =========================================================================
  const ws5 = workbook.addWorksheet('4.1 NHẬT KÝ CÔNG VIỆC', {
    views: [{ showGridLines: true }],
  });

  ws5.columns = [
    { key: 'seq', width: 8 },
    { key: 'date', width: 18 },
    { key: 'content', width: 75 },
    { key: 'task_ref', width: 32 },
    { key: 'hours', width: 12 },
  ];

  addCommonSheetHeader(
    ws5,
    5,
    settings.company_title,
    '5. NHẬT KÝ CÔNG VIỆC',
    unitText,
    `${periodTitleText} — Công việc thực hiện: ${sortedObjectives.length} chỉ tiêu`
  );

  const s5HeaderRow = ws5.getRow(6);
  s5HeaderRow.values = [
    'TT',
    'NGÀY/THÁNG',
    'CÔNG VIỆC THỰC HIỆN',
    'THUỘC HẠNG MỤC KẾ HOẠCH',
    'SỐ GIỜ / %',
  ];
  s5HeaderRow.height = 28;
  styleTableHeaderRow(s5HeaderRow, 5, headerFill, borderThin);

  let r5Idx = 7;
  sortedLogs.forEach((log, idx) => {
    const linkedTask = sortedTasks.find((t) => t.id === log.task_id);
    const r = ws5.getRow(r5Idx++);
    const contentWithIssue = log.issues
      ? `${log.content}\n(Vướng mắc/Đề xuất: ${log.issues})`
      : log.content;
    r.values = [
      idx + 1,
      formatDateVN(log.log_date),
      contentWithIssue,
      linkedTask ? linkedTask.title : 'Việc phát sinh ngoài kế hoạch',
      `${log.hours ? `${log.hours}h` : ''}${log.progress_after !== undefined ? ` (${log.progress_after}%)` : ''}`,
    ];
    r.height = 32;
    styleDataRow(r, 5, borderThin, [1, 2, 5]);
  });

  while (r5Idx < 7 + 25) {
    const r = ws5.getRow(r5Idx);
    r.values = [r5Idx - 6, '', '', '', ''];
    r.height = 22;
    styleDataRow(r, 5, borderThin, [1, 2, 5]);
    r5Idx++;
  }

  addSignatureBlock(ws5, r5Idx + 1, 4, 5, signatureDateText, employee.full_name, approver?.full_name);

  // Xuất file
  const buffer = await workbook.xlsx.writeBuffer();
  const safeName = employee.full_name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
  const fileName = `Bao_Cao_4_Buoc_VPS_T${period.month}_${period.year}_${safeName}.xlsx`;
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
}

function addCommonSheetHeader(
  ws: ExcelJS.Worksheet,
  totalCols: number,
  companyTitle: string,
  stepTitle: string,
  unitText: string,
  periodText: string
) {
  ws.mergeCells(1, 1, 1, totalCols);
  ws.mergeCells(2, 1, 2, totalCols);
  ws.mergeCells(3, 1, 3, totalCols);
  ws.mergeCells(4, 1, 4, totalCols);

  const r1 = ws.getRow(1);
  r1.getCell(1).value = companyTitle;
  r1.getCell(1).font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF1E3A8A' } };
  r1.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  r1.height = 22;

  const r2 = ws.getRow(2);
  r2.getCell(1).value = stepTitle;
  r2.getCell(1).font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FF0F172A' } };
  r2.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  r2.height = 26;

  const r3 = ws.getRow(3);
  r3.getCell(1).value = unitText;
  r3.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF334155' } };
  r3.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  r3.height = 20;

  const r4 = ws.getRow(4);
  r4.getCell(1).value = periodText;
  r4.getCell(1).font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF475569' } };
  r4.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  r4.height = 20;
}

function styleTableHeaderRow(
  row: ExcelJS.Row,
  totalCols: number,
  fill: ExcelJS.Fill,
  border: Partial<ExcelJS.Borders>,
  textColor = 'FFFFFFFF'
) {
  for (let c = 1; c <= totalCols; c++) {
    const cell = row.getCell(c);
    cell.fill = fill;
    cell.border = border;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: textColor } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  }
}

function styleDataRow(
  row: ExcelJS.Row,
  totalCols: number,
  border: Partial<ExcelJS.Borders>,
  centerCols: number[] = []
) {
  for (let c = 1; c <= totalCols; c++) {
    const cell = row.getCell(c);
    cell.border = border;
    cell.font = { name: 'Arial', size: 10, color: { argb: 'FF0F172A' } };
    cell.alignment = {
      horizontal: centerCols.includes(c) ? 'center' : 'left',
      vertical: 'middle',
      wrapText: true,
    };
  }
}

function addSignatureBlock(
  ws: ExcelJS.Worksheet,
  startRow: number,
  colStart: number,
  colEnd: number,
  dateText: string,
  creatorName: string,
  approverName?: string
) {
  ws.mergeCells(startRow, colStart, startRow, colEnd);
  ws.mergeCells(startRow + 1, colStart, startRow + 1, colEnd);
  ws.mergeCells(startRow + 5, colStart, startRow + 5, colEnd);

  const rDate = ws.getRow(startRow);
  rDate.getCell(colStart).value = dateText;
  rDate.getCell(colStart).font = { name: 'Arial', size: 10, italic: true };
  rDate.getCell(colStart).alignment = { horizontal: 'center', vertical: 'middle' };

  const rTitle = ws.getRow(startRow + 1);
  rTitle.getCell(colStart).value = 'NGƯỜI LẬP BIỂU';
  rTitle.getCell(colStart).font = { name: 'Arial', size: 11, bold: true };
  rTitle.getCell(colStart).alignment = { horizontal: 'center', vertical: 'middle' };

  const rName = ws.getRow(startRow + 5);
  rName.getCell(colStart).value = creatorName;
  rName.getCell(colStart).font = { name: 'Arial', size: 11, bold: true };
  rName.getCell(colStart).alignment = { horizontal: 'center', vertical: 'middle' };

  if (approverName && colStart > 2) {
    ws.mergeCells(startRow + 1, 1, startRow + 1, 2);
    ws.mergeCells(startRow + 5, 1, startRow + 5, 2);
    ws.getRow(startRow + 1).getCell(1).value = 'TRƯỞNG BỘ PHẬN DUYỆT';
    ws.getRow(startRow + 1).getCell(1).font = { name: 'Arial', size: 11, bold: true };
    ws.getRow(startRow + 1).getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    ws.getRow(startRow + 5).getCell(1).value = approverName;
    ws.getRow(startRow + 5).getCell(1).font = { name: 'Arial', size: 11, bold: true };
    ws.getRow(startRow + 5).getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
  }
}


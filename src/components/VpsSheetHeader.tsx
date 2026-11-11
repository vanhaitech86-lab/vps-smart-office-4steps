import React from 'react';

interface VpsSheetHeaderProps {
  redTitle?: string;
  mainTitle: React.ReactNode;
  subTitle?: React.ReactNode;
  unitText: string;
  periodText: string;
  roleBadge?: React.ReactNode;
  rightActions?: React.ReactNode;
}

/**
 * Logo & Quốc hiệu Biểu mẫu chuẩn "VPS GROUP - TẬP ĐOÀN VPS"
 * Thiết kế khớp 100% với 5 mẫu biểu Excel gốc của Tập đoàn VPS.
 */
export const VpsLogoMark: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const w = size === 'sm' ? 92 : 124;
  const h = size === 'sm' ? 60 : 78;
  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 160 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 select-none"
    >
      {/* Vòm 9 ngôi sao đỏ */}
      {[
        { cx: 22, cy: 38 },
        { cx: 30, cy: 25 },
        { cx: 43, cy: 15 },
        { cx: 60, cy: 9 },
        { cx: 80, cy: 7 },
        { cx: 100, cy: 9 },
        { cx: 117, cy: 15 },
        { cx: 130, cy: 25 },
        { cx: 138, cy: 38 },
      ].map((s, idx) => (
        <polygon
          key={idx}
          points={`${s.cx},${s.cy - 4.5} ${s.cx + 1.3},${s.cy - 1.3} ${s.cx + 4.6},${s.cy - 1.3} ${
            s.cx + 2
          },${s.cy + 0.8} ${s.cx + 3},${s.cy + 4.2} ${s.cx},${s.cy + 2.2} ${s.cx - 3},${
            s.cy + 4.2
          } ${s.cx - 2},${s.cy + 0.8} ${s.cx - 4.6},${s.cy - 1.3} ${s.cx - 1.3},${s.cy - 1.3}`}
          fill="#EE1C25"
        />
      ))}

      {/* Chữ VPS đậm xanh dương */}
      <text
        x="80"
        y="46"
        textAnchor="middle"
        fill="#0066B3"
        fontFamily="Arial Black, Inter, sans-serif"
        fontWeight="900"
        fontSize="30"
        letterSpacing="1"
      >
        VPS
      </text>

      {/* Ngôi sao vàng ở chữ V */}
      <polygon
        points="47,26 48.5,30.2 53,30.2 49.3,32.8 50.7,37 47,34.4 43.3,37 44.7,32.8 41,30.2 45.5,30.2"
        fill="#FFD200"
      />

      {/* Chữ GROUP */}
      <text
        x="80"
        y="58"
        textAnchor="middle"
        fill="#0066B3"
        fontFamily="Arial, Inter, sans-serif"
        fontWeight="800"
        fontSize="10"
        letterSpacing="2.5"
      >
        GROUP
      </text>

      {/* Đường vòng cung đỏ bên dưới */}
      <path
        d="M18 70 Q80 54 142 70 Q80 61 18 70 Z"
        fill="#EE1C25"
      />

      {/* Chữ TẬP ĐOÀN VPS */}
      <text
        x="80"
        y="89"
        textAnchor="middle"
        fill="#00549A"
        fontFamily="Arial, Inter, sans-serif"
        fontWeight="900"
        fontSize="14.5"
        letterSpacing="0.6"
      >
        TẬP ĐOÀN VPS
      </text>
    </svg>
  );
};

export const VpsSheetHeader: React.FC<VpsSheetHeaderProps> = ({
  redTitle = 'GIẢI PHÁP VĂN PHÒNG THÔNG MINH',
  mainTitle,
  subTitle,
  unitText,
  periodText,
  roleBadge,
  rightActions,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Khối Quốc hiệu & Tiêu đề biểu mẫu chuẩn VPS Group */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 flex-1">
          <div className="flex items-center justify-center bg-white rounded-xl px-2 py-1 border border-slate-100 shadow-2xs">
            <VpsLogoMark />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs sm:text-sm font-serif font-bold tracking-wide text-red-600 dark:text-red-400 uppercase">
                {redTitle}
              </span>
              {roleBadge}
            </div>

            <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase">
              {mainTitle}
            </h2>

            {subTitle && (
              <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                {subTitle}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 pt-0.5">
              <span>{unitText}</span>
              <span className="font-bold text-slate-900 dark:text-white">{periodText}</span>
            </div>
          </div>
        </div>

        {/* Các nút thao tác bên phải */}
        {rightActions && (
          <div className="flex flex-wrap items-center justify-center xl:justify-end gap-2 shrink-0">
            {rightActions}
          </div>
        )}
      </div>
    </div>
  );
};


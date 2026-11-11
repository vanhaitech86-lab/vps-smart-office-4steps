# GIẢI PHÁP VĂN PHÒNG THÔNG MINH VPS — HỆ THỐNG BÁO CÁO CÔNG VIỆC 4 BƯỚC & NHẬT KÝ HÀNG NGÀY

Ứng dụng Web & Mobile PWA chuyên nghiệp được xây dựng theo đúng tài liệu **Đặc tả App Báo cáo công việc hàng ngày (Mẫu báo cáo 04 bước - 5 Sheet của Văn phòng VPS)**.

## 1. Kiến trúc Chu trình 4 Bước Khép kín + Nhật ký 4.1

```
Bước 1: ĐẶT MỤC TIÊU  →  Bước 2: ĐÁNH GIÁ THỰC TRẠNG  →  Bước 3: LẬP KẾ HOẠCH  →  Bước 4: THEO DÕI TIẾN ĐỘ (Gantt 5 Tuần)
                                                                                         ↑
                                                                         4.1 NHẬT KÝ CÔNG VIỆC (Ghi hàng ngày)
```

- **Nhập một lần, tự liên kết bằng khoá ngoại**:
  - **Sheet 1 (`1. MỤC TIÊU TỔNG THỂ`)**: Tự động đánh số thứ tự `TT` liên tục (xoá tự đánh lại số, khắc phục lỗi nhảy số trong Excel).
  - **Sheet 2 (`2. ĐÁNH GIÁ CHỈ TIÊU`)**: Tự động đồng bộ danh sách chỉ tiêu từ Bước 1 để phân tích `Thực trạng` và `Nguyên nhân`.
  - **Sheet 3 (`3. KẾ HOẠCH THỰC HIỆN`)**: Chia nhỏ từng chỉ tiêu thành các đầu việc có `Ngày bắt đầu` – `Ngày kết thúc`, `Người thực hiện`, `Kết quả đầu ra`.
  - **Sheet 4.1 (`4.1 NHẬT KÝ CÔNG VIỆC`)**: Nhân viên ghi nhật ký hàng ngày (hỗ trợ nhập giọng nói Tiếng Việt, đính kèm file, ghi nhận % hoàn thành và vướng mắc). Tự động đếm `"Công việc thực hiện: N chỉ tiêu"`.
  - **Sheet 4 (`4. TIẾN ĐỘ` - Biểu đồ Gantt 5 tuần × 7 ngày = 35 cột ngày)**: Tự động tô màu từ Kế hoạch (Bước 3) và Nhật ký (4.1), tự động chuyển đỏ `Trễ hạn` khi quá ngày kết thúc mà chưa đạt 100%, bấm vào từng ô ngày để xem chi tiết nhật ký hoặc ghi bổ sung.

## 2. Phân quyền 4 Vai trò (Row Level Security - RLS)

| Vai trò | Tài khoản Demo | Quyền hạn |
|---|---|---|
| **Nhân viên** (`employee`) | `an.nguyen@vps.vn` / `anh.tran@vps.vn` / `nam.le@vps.vn` / `ha.pham@vps.vn` | Chỉ xem & sửa dữ liệu của mình (khi kỳ ở trạng thái `draft` hoặc `returned`); ghi nhật ký hàng ngày; gửi báo cáo ngày |
| **Trưởng bộ phận** (`manager`) | `tuan.vu@vps.vn` (Kỹ thuật) / `duc.hoang@vps.vn` (Kinh doanh) | Xem toàn bộ nhân viên trong bộ phận; nhận xét; Phê duyệt / Trả lại / Khoá kỳ; Giao chỉ tiêu xuống cho nhân viên; Nhắc nộp báo cáo |
| **Lãnh đạo** (`leader`) | `long.dang@vps.vn` (Giám đốc) | Xem Dashboard thời gian thực toàn công ty; cảnh báo việc trễ hạn; gửi chỉ đạo; xuất báo cáo |
| **Quản trị** (`admin`) | `admin@vps.vn` | Quản lý người dùng, bộ phận, mở/khoá kỳ báo cáo, cấu hình giờ nhắc 16:30, xem Audit Logs |

*(Mật khẩu mặc định của mọi tài khoản demo: `123` — hoặc chuyển nhanh 1 chạm ngay trên thanh Header)*

## 3. Cách chạy ứng dụng

```bash
npm install
npm run dev
```


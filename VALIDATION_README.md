# Defense Session Management - Validation Implementation

## Tổng quan

Đã thực hiện validation cho phần chọn hội đồng và giảng viên phản biện trong trường hợp họ bị vướng lịch trong file `DefenseSessionsSchedule.jsx`.

## Các cải tiến đã thực hiện

### 1. Cải thiện xử lý lỗi từ backend

- **Trước**: Chỉ xử lý format lỗi cơ bản từ `error.response.data.error`
- **Sau**: Xử lý nhiều format lỗi khác nhau:
  - `error.response.data.error`
  - `error.response.data.message`
  - `error.response.data` (string)

### 2. Mapping ID giảng viên thành tên thực

- Tự động thay thế "Giảng viên ID X" thành "Giảng viên [Tên thực]"
- Sử dụng regex để tìm và thay thế tất cả các pattern ID trong thông báo lỗi
- Fallback về ID gốc nếu không tìm thấy tên

### 3. Cải thiện UI/UX

#### Thành viên hội đồng:

- Thêm cảnh báo: "⚠️ Hệ thống sẽ kiểm tra lịch trống của các giảng viên được chọn"
- Hiển thị danh sách giảng viên đã chọn với số thứ tự
- Màu sắc phân biệt (xanh dương)

#### Giảng viên phản biện:

- Thêm cảnh báo: "⚠️ Hệ thống sẽ kiểm tra lịch trống của giảng viên phản biện"
- Hiển thị giảng viên phản biện đã chọn
- Màu sắc phân biệt (xanh indigo)

#### Thông báo tổng quan:

- Thêm section thông tin quan trọng về validation
- Giải thích rõ ràng các kiểm tra sẽ được thực hiện
- Icon cảnh báo và màu sắc phù hợp

## Backend Integration

Validation đã được tích hợp với backend eval-service:

### Các validation được thực hiện:

1. **Kiểm tra lịch trống giảng viên hội đồng**
2. **Kiểm tra lịch trống giảng viên phản biện**
3. **Kiểm tra xung đột phòng học**
4. **Kiểm tra số lượng thành viên** (tối đa 3 hội đồng, 1 phản biện)

### Error handling:

- Backend trả về `DefenseSessionValidationException` với thông báo chi tiết
- Frontend xử lý và hiển thị thông báo user-friendly
- Tự động mapping ID thành tên giảng viên

## Test Cases

Đã tạo file `validationTest.js` với các test cases:

1. **Lecturer Schedule Conflict**: Giảng viên bị vướng lịch
2. **Room Schedule Conflict**: Phòng học bị vướng lịch
3. **Multiple Lecturer Conflict**: Nhiều giảng viên bị vướng lịch

## Cách sử dụng

1. Mở modal "Tạo buổi bảo vệ mới"
2. Chọn ngày, giờ, phòng
3. Chọn thành viên hội đồng và giảng viên phản biện
4. Hệ thống sẽ tự động kiểm tra lịch trống khi submit
5. Nếu có xung đột, hiển thị thông báo lỗi chi tiết với tên giảng viên thực

## Files đã chỉnh sửa

- `phenikaa-thesis-management-fe/src/pages/admin/DefenseSessionsSchedule.jsx`
- `phenikaa-thesis-management-fe/src/utils/validationTest.js` (mới)

## Lưu ý

- Validation hoạt động real-time với backend
- Thông báo lỗi được hiển thị bằng toast notification
- UI được cải thiện để người dùng hiểu rõ hơn về validation
- Code đã được test với các trường hợp lỗi phổ biến

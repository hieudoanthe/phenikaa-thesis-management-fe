# Hướng dẫn Test Real-time Validation

## 🧪 Cách test tính năng Real-time Validation

### Bước 1: Mở modal tạo buổi bảo vệ

1. Vào trang Defense Sessions Schedule
2. Click nút "Thêm buổi bảo vệ"
3. Modal sẽ mở ra

### Bước 2: Chọn ngày và giờ

1. **Chọn ngày**: Chọn một ngày trong tuần (thứ 2-6)
2. **Chọn giờ**: Chọn một khung giờ (ví dụ: 09:00 AM)

### Bước 3: Quan sát quá trình kiểm tra

Sau khi chọn ngày/giờ, bạn sẽ thấy:

#### 🔄 Khi đang kiểm tra:

```
🔄 Đang kiểm tra lịch trống của X giảng viên...
Kiểm tra cho ngày YYYY-MM-DD lúc HH:MM
```

#### ✅ Khi tất cả giảng viên khả dụng:

```
✅ Tất cả X giảng viên đều khả dụng trong khung giờ này
Bạn có thể chọn bất kỳ giảng viên nào
```

#### ⚠️ Khi có giảng viên bị vướng lịch:

```
⚠️ Có X giảng viên bị vướng lịch trong khung giờ này
Các giảng viên này sẽ không thể chọn được
```

### Bước 4: Kiểm tra dropdown giảng viên

1. **Mở dropdown "Thành viên hội đồng"**
2. **Quan sát các option**:
   - ✅ Giảng viên khả dụng: có thể chọn bình thường
   - ❌ Giảng viên bị vướng lịch: hiển thị "(Bị vướng lịch)" và bị disable

### Bước 5: Kiểm tra dropdown phản biện

1. **Mở dropdown "Giảng viên phản biện"**
2. **Quan sát tương tự** như dropdown hội đồng

### Bước 6: Thay đổi ngày/giờ để test

1. **Thay đổi giờ** (ví dụ từ 09:00 AM sang 10:00 AM)
2. **Quan sát**: Hệ thống sẽ tự động kiểm tra lại sau 500ms
3. **Thay đổi ngày** và quan sát tương tự

## 🔍 Debug Information

### Console Logs

Mở Developer Tools (F12) và xem Console để thấy:

```
🔍 Kiểm tra lịch trống cho: 2024-01-15 09:00
📊 Kết quả kiểm tra: {
  totalTeachers: 10,
  busyTeachers: 2,
  busyIds: [3, 7]
}
```

### Network Tab

Trong Network tab, bạn sẽ thấy các request:

```
GET /api/eval-service/teacher/evaluator/1/sessions
GET /api/eval-service/teacher/evaluator/2/sessions
GET /api/eval-service/teacher/evaluator/3/sessions
...
```

## 🎯 Test Cases

### Test Case 1: Không có xung đột

- **Chọn**: Ngày trong tương lai, giờ sáng sớm
- **Kết quả mong đợi**: Tất cả giảng viên khả dụng

### Test Case 2: Có xung đột

- **Chọn**: Ngày/giờ đã có buổi bảo vệ
- **Kết quả mong đợi**: Một số giảng viên bị disable

### Test Case 3: Thay đổi nhanh

- **Thực hiện**: Thay đổi ngày/giờ liên tục
- **Kết quả mong đợi**: Debounce hoạt động, không gọi API quá nhiều

### Test Case 4: Chọn giảng viên bị vướng lịch

- **Thực hiện**: Chọn giảng viên từ trước khi bị vướng lịch
- **Kết quả mong đợi**: Hiển thị cảnh báo trong danh sách đã chọn

## 🐛 Troubleshooting

### Vấn đề: Không thấy loading indicator

- **Nguyên nhân**: API call quá nhanh
- **Giải pháp**: Thêm delay trong backend hoặc kiểm tra network

### Vấn đề: Giảng viên không bị disable

- **Nguyên nhân**: API endpoint không trả về đúng data
- **Giải pháp**: Kiểm tra response format trong Network tab

### Vấn đề: Debounce không hoạt động

- **Nguyên nhân**: Timeout không được clear đúng cách
- **Giải pháp**: Kiểm tra console logs và cleanup function

## 📊 Performance Metrics

### Thời gian phản hồi mong đợi:

- **Loading indicator**: Hiển thị ngay lập tức
- **API calls**: < 1 giây cho mỗi giảng viên
- **UI update**: < 100ms sau khi có data

### Số lượng API calls:

- **Tối đa**: 1 call per giảng viên
- **Debounce**: 500ms delay
- **Cleanup**: Clear timeout khi đóng modal

## 🎉 Expected Behavior

1. **Real-time**: Kiểm tra ngay khi chọn ngày/giờ
2. **Preventive**: Disable giảng viên bị vướng lịch
3. **Visual**: Feedback rõ ràng với màu sắc và icon
4. **Performance**: Debounce để tránh spam API
5. **User-friendly**: Thông báo dễ hiểu và hữu ích

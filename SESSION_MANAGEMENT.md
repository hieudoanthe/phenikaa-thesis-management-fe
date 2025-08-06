# Hệ thống Quản lý Session

## Vấn đề ban đầu

Khi đăng nhập Admin và Lecturer trên 2 tab khác nhau của cùng trình duyệt, khi reload trang sẽ bị chuyển sang trang khác do cả 2 role đều sử dụng chung `localStorage` để lưu thông tin đăng nhập.

## Giải pháp

### 1. Session Management theo Tab

- Mỗi tab sẽ có một **Session ID** duy nhất
- Thông tin đăng nhập được lưu trong `sessionStorage` với prefix là Session ID
- Mỗi tab có thể đăng nhập với role khác nhau mà không ảnh hưởng lẫn nhau

### 2. Cấu trúc Session Storage

```
sessionStorage:
├── sessionId: "session_1234567890_abc123"
├── session_1234567890_abc123_accessToken: "jwt_token"
├── session_1234567890_abc123_refreshToken: "refresh_token"
└── session_1234567890_abc123_userInfo: "{user_data}"

localStorage (backup):
├── accessToken: "jwt_token"
├── refreshToken: "refresh_token"
└── userInfo: "{user_data}"
```

### 3. Các Component và Utils mới

#### `authUtils.js`

- `getSessionId()`: Tạo hoặc lấy Session ID cho tab hiện tại
- `getSessionKey(key)`: Tạo key với prefix session
- `getToken()`: Lấy token từ session storage (fallback về localStorage)
- `setToken(token)`: Lưu token vào session storage và localStorage
- `logout()`: Xóa tất cả data liên quan đến session hiện tại

#### `SessionManager.jsx`

- Component quản lý session cho từng tab
- Khởi tạo Session ID khi tab được mở
- Cleanup khi tab đóng

#### `AuthContext.jsx`

- Cập nhật để sử dụng session storage
- Lắng nghe sự thay đổi của session storage giữa các tab
- Quản lý authentication state theo session

#### `SessionDebugPanel.jsx`

- Component debug (chỉ hiển thị trong development)
- Hiển thị thông tin session hiện tại
- Các nút để debug và clear session

### 4. Cách hoạt động

1. **Khi mở tab mới**: `SessionManager` tạo Session ID duy nhất
2. **Khi đăng nhập**: Thông tin được lưu với prefix Session ID
3. **Khi reload**: `AuthContext` đọc thông tin từ session storage của tab hiện tại
4. **Khi đăng xuất**: Chỉ xóa data của session hiện tại

### 5. Lợi ích

- Mỗi tab có thể đăng nhập với role khác nhau
- Không bị chuyển trang khi reload
- Session được quản lý độc lập
- Fallback về localStorage nếu cần
- Debug tools trong development

### 6. Debug

Trong development mode, có panel debug ở góc dưới bên phải:

- Hiển thị Session ID hiện tại
- Thông tin user đang đăng nhập
- Số lượng active sessions
- Các nút để debug và clear session

### 7. Lưu ý

- Session storage sẽ bị xóa khi đóng tab
- LocalStorage vẫn được sử dụng làm backup
- Chỉ hoạt động trong cùng domain (localhost)

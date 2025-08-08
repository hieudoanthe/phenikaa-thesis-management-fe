# Hệ thống Quản lý

### 1. Cấu trúc

```
sessionStorage (tab-specific):
├── sessionId: "session_1234567890_abc123"
├── session_1234567890_abc123_accessToken: "jwt_token"
├── session_1234567890_abc123_refreshToken: "refresh_token"
└── session_1234567890_abc123_userInfo: "{user_data}"

localStorage (backup):
├── accessToken: "jwt_token"
├── refreshToken: "refresh_token"
└── userInfo: "{user_data}"

Cookies (persistent):
├── accessToken: "jwt_token" (7 ngày)
├── refreshToken: "refresh_token" (30 ngày)
└── userInfo: "{user_data}" (7 ngày)
```

### 2. Các Component và Utils mới

#### `authUtils.js`

- `getSessionId()`: Tạo hoặc lấy Session ID cho tab hiện tại
- `getSessionKey(key)`: Tạo key với prefix session
- `getToken()`: Lấy token từ session storage → localStorage → cookie
- `setToken(token, persistent)`: Lưu token vào session storage, localStorage và cookie nếu persistent
- `setCookie(name, value, options)`: Lưu cookie với options
- `getCookie(name)`: Lấy giá trị cookie
- `removeCookie(name)`: Xóa cookie
- `logout()`: Xóa tất cả data liên quan đến session hiện tại

#### `SessionManager.jsx`

- Component quản lý session cho từng tab
- Khởi tạo Session ID khi tab được mở
- Cleanup khi tab đóng

#### `AuthContext.jsx`

- Cập nhật để sử dụng session storage
- Lắng nghe sự thay đổi của session storage giữa các tab
- Quản lý authentication state theo session

### 3. Cách hoạt động

1. **Khi mở tab mới**: `SessionManager` tạo Session ID duy nhất
2. **Khi đăng nhập**:
   - Thông tin được lưu với prefix Session ID
   - Nếu chọn "Ghi nhớ đăng nhập": Lưu vào cookie (7-30 ngày)
3. **Khi reload**: `AuthContext` đọc thông tin từ session storage → localStorage → cookie
4. **Khi đăng xuất**: Xóa tất cả data (session, localStorage, cookie)
5. **Khi đóng tab**: Session storage bị xóa, nhưng cookie vẫn tồn tại

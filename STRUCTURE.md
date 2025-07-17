# Cấu trúc dự án Phenikaa Thesis Management System

## 📁 Cấu trúc thư mục

```
phenikaa-thesis-management-fe/
├── public/                          # Static files
│   ├── logo.png                     # Logo Phenikaa
│   ├── students.svg                 # Illustration
│   └── vite.svg                     # Vite logo
├── src/                             # Source code
│   ├── assets/                      # Assets (images, icons)
│   │   ├── images/
│   │   │   ├── logos/              # Logo files
│   │   │   ├── icons/              # Icon files
│   │   │   ├── avatars/            # Avatar images
│   │   │   └── backgrounds/        # Background images
│   │   └── index.js                 # Export assets
│   ├── auth/                        # Authentication
│   │   ├── authUtils.js            # Auth utilities
│   │   └── PrivateRoute.jsx        # Protected route component
│   ├── components/                  # Reusable components
│   │   ├── common/                  # Common components
│   │   │   ├── Button.jsx          # Button component
│   │   │   ├── Input.jsx           # Input component
│   │   │   ├── Select.jsx          # Select component
│   │   │   ├── Textarea.jsx        # Textarea component
│   │   │   ├── Card.jsx            # Card component
│   │   │   ├── Badge.jsx           # Badge component
│   │   │   ├── Modal.jsx           # Modal component
│   │   │   ├── Table.jsx           # Table component
│   │   │   ├── LoadingSpinner.jsx  # Loading spinner
│   │   │   ├── ErrorAlert.jsx      # Error alert
│   │   │   ├── SuccessAlert.jsx    # Success alert
│   │   │   ├── ErrorBoundary.jsx   # Error boundary
│   │   │   └── index.js            # Export common components
│   │   ├── layout/                  # Layout components
│   │   │   ├── Layout.jsx          # Main layout
│   │   │   ├── Header.jsx          # Header component
│   │   │   ├── Sidebar.jsx         # Sidebar component
│   │   │   └── index.js            # Export layout components
│   │   └── modals/                  # Modal components
│   │       └── add_topic_modal.jsx # Add topic modal
│   ├── config/                      # Configuration
│   │   └── api.js                  # API configuration
│   ├── constants/                   # Constants
│   │   ├── roles.js                # User roles & permissions
│   │   ├── thesis.js               # Thesis status & types
│   │   ├── routes.js               # Route constants
│   │   └── index.js                # Export constants
│   ├── contexts/                    # React Contexts
│   │   └── AuthContext.jsx         # Authentication context
│   ├── hooks/                       # Custom hooks
│   │   ├── useApi.js               # API hook
│   │   ├── useAuth.js              # Auth hook
│   │   ├── useLocalStorage.js      # LocalStorage hook
│   │   ├── useDebounce.js          # Debounce hook
│   │   └── index.js                # Export hooks
│   ├── pages/                       # Page components
│   │   ├── user-fe/                # User frontend pages
│   │   │   ├── home.jsx            # User home page
│   │   │   ├── login.jsx           # Login page
│   │   │   └── static/             # Static files
│   │   │       └── css/
│   │   │           └── login.css   # Login styles
│   │   ├── admin-ui/               # Admin UI pages
│   │   │   ├── templates/          # Admin templates
│   │   │   │   ├── dashboard.jsx   # Admin dashboard
│   │   │   │   ├── topic_management.jsx
│   │   │   │   └── user_management.jsx
│   │   │   └── static/             # Admin static files
│   │   │       └── css/
│   │   │           └── style.css   # Admin styles
│   │   └── thesis-fe/              # Thesis frontend
│   │       └── index.jsx           # Thesis list
│   ├── services/                    # API services
│   │   ├── httpClient.js           # HTTP client
│   │   ├── authService.js          # Auth service
│   │   ├── thesisService.js        # Thesis service
│   │   └── index.js                # Export services
│   ├── styles/                      # Global styles
│   │   ├── auth/                   # Auth styles
│   │   ├── common/                 # Common styles
│   │   ├── layout/                 # Layout styles
│   │   └── pages/                  # Page styles
│   ├── utils/                       # Utility functions
│   │   ├── validation.js           # Validation utilities
│   │   ├── formatting.js           # Formatting utilities
│   │   └── index.js                # Export utilities
│   ├── App.jsx                     # Main App component
│   └── main.jsx                    # Entry point
├── env.example                      # Environment variables template
├── package.json                     # Dependencies
├── vite.config.js                   # Vite configuration
└── README.md                        # Project documentation
```

## 🎯 Hướng dẫn sử dụng

### 1. **Authentication Flow**

```jsx
// Sử dụng AuthContext
import { useAuth } from "../contexts/AuthContext";

const MyComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  // Login
  const handleLogin = async (credentials) => {
    await login(token, userData);
  };

  // Logout
  const handleLogout = () => {
    logout();
  };
};
```

### 2. **Protected Routes**

```jsx
// Sử dụng PrivateRoute
import PrivateRoute from "../auth/PrivateRoute";

<Route
  path="/dashboard"
  element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  }
/>;
```

### 3. **API Services**

```jsx
// Sử dụng API services
import { authService, thesisService } from "../services";

// Login
const result = await authService.login(credentials);

// Get thesis list
const result = await thesisService.getThesisList();
```

### 4. **Custom Hooks**

```jsx
// Sử dụng custom hooks
import { useApi, useAuth, useLocalStorage } from "../hooks";

// API hook
const { data, loading, error, execute } = useApi(apiFunction);

// Auth hook
const { user, isAuthenticated } = useAuth();

// LocalStorage hook
const [theme, setTheme] = useLocalStorage("theme", "light");
```

### 5. **Common Components**

```jsx
// Sử dụng common components
import { Button, Input, Card, Modal } from '../components/common';

// Button
<Button variant="primary" size="medium" loading={isLoading}>
  Submit
</Button>

// Input
<Input
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
/>

// Card
<Card title="Dashboard" subtitle="Welcome back">
  <p>Content here</p>
</Card>

// Modal
<Modal isOpen={isOpen} onClose={onClose} title="Add User">
  <form>...</form>
</Modal>
```

### 6. **Constants & Utilities**

```jsx
// Sử dụng constants
import { USER_ROLES, hasPermission, isAdmin } from "../constants";

// Check permissions
if (hasPermission(userRole, "CREATE_THESIS")) {
  // Allow create thesis
}

// Sử dụng utilities
import { isValidEmail, formatDate, validatePassword } from "../utils";

// Validation
const emailValid = isValidEmail(email);
const passwordValidation = validatePassword(password);

// Formatting
const formattedDate = formatDate(new Date(), "long");
```

## 🔧 Cấu hình Environment Variables

Tạo file `.env` từ `env.example`:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8081/api
VITE_API_TIMEOUT=10000

# Authentication
VITE_AUTH_ENDPOINT=/auth
VITE_REFRESH_ENDPOINT=/auth/refresh

# App Configuration
VITE_APP_NAME=Phenikaa Thesis Management
VITE_APP_VERSION=1.0.0

# Development
VITE_DEBUG_MODE=true
```

## 📱 Responsive Design

Dự án sử dụng Tailwind CSS với responsive breakpoints:

- `sm:` - 640px+
- `md:` - 768px+
- `lg:` - 1024px+
- `xl:` - 1280px+
- `2xl:` - 1536px+

## 🎨 Styling Guidelines

### 1. **Tailwind CSS Classes**

```jsx
// Layout
<div className="flex items-center justify-center min-h-screen">

// Colors
<div className="bg-blue-600 text-white hover:bg-blue-700">

// Spacing
<div className="p-6 m-4 space-y-4">

// Responsive
<div className="w-full md:w-1/2 lg:w-1/3">
```

### 2. **Component Styling**

```jsx
// Base classes
const baseClasses =
  "inline-flex items-center justify-center font-medium rounded-md";

// Variant classes
const variantClasses = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-gray-600 text-white hover:bg-gray-700",
};

// Combine classes
const buttonClasses = [baseClasses, variantClasses[variant]].join(" ");
```

## 🚀 Development Workflow

### 1. **Cài đặt dependencies**

```bash
npm install
```

### 2. **Chạy development server**

```bash
npm run dev
```

### 3. **Build production**

```bash
npm run build
```

### 4. **Lint code**

```bash
npm run lint
```

## 📋 Best Practices

### 1. **File Naming**

- Components: `PascalCase.jsx`
- Utilities: `camelCase.js`
- Constants: `camelCase.js`
- Styles: `camelCase.css`

### 2. **Import Order**

```jsx
// 1. React imports
import React, { useState, useEffect } from "react";

// 2. Third-party libraries
import axios from "axios";
import { useNavigate } from "react-router-dom";

// 3. Internal components
import { Button, Input } from "../components/common";

// 4. Hooks
import { useAuth } from "../hooks/useAuth";

// 5. Services
import { authService } from "../services";

// 6. Utilities
import { formatDate } from "../utils";

// 7. Constants
import { USER_ROLES } from "../constants";

// 8. Styles
import "./styles.css";
```

### 3. **Error Handling**

```jsx
try {
  const result = await apiCall();
  // Handle success
} catch (error) {
  console.error("Error:", error);
  // Handle error
}
```

### 4. **Loading States**

```jsx
const [loading, setLoading] = useState(false);

if (loading) {
  return <LoadingSpinner />;
}
```

## 🔒 Security Considerations

### 1. **Authentication**

- Sử dụng JWT tokens
- Validate tokens trên server
- Auto refresh tokens
- Secure logout

### 2. **Authorization**

- Role-based access control
- Permission checking
- Protected routes

### 3. **Data Validation**

- Client-side validation
- Server-side validation
- Input sanitization

## 📊 Performance Optimization

### 1. **Code Splitting**

```jsx
// Lazy load components
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
```

### 2. **Memoization**

```jsx
// Memoize expensive calculations
const memoizedValue = useMemo(() => expensiveCalculation(data), [data]);
```

### 3. **Debouncing**

```jsx
// Debounce search input
const debouncedSearchTerm = useDebounce(searchTerm, 500);
```

## 🧪 Testing Strategy

### 1. **Unit Tests**

- Component testing
- Hook testing
- Utility function testing

### 2. **Integration Tests**

- API integration
- Authentication flow
- User interactions

### 3. **E2E Tests**

- Complete user journeys
- Critical paths

## 📈 Monitoring & Analytics

### 1. **Error Tracking**

- Error boundaries
- Error logging
- Performance monitoring

### 2. **User Analytics**

- Page views
- User interactions
- Performance metrics

## 🔄 Version Control

### 1. **Git Workflow**

- Feature branches
- Pull requests
- Code reviews
- Semantic versioning

### 2. **Commit Messages**

```
feat: add user authentication
fix: resolve login redirect issue
docs: update API documentation
style: format code with prettier
refactor: restructure components
test: add unit tests for auth
```

## 📚 Documentation

### 1. **Code Documentation**

- JSDoc comments
- README files
- API documentation

### 2. **User Documentation**

- User guides
- Admin guides
- Troubleshooting

---

**Lưu ý:** Cấu trúc này được thiết kế để dễ dàng mở rộng và bảo trì. Hãy tuân thủ các quy tắc và best practices để đảm bảo code quality và team collaboration hiệu quả.

# 📚 Mô tả chi tiết chức năng các thư mục và file

## Gốc dự án

- **env.example**: Mẫu file biến môi trường, dùng để cấu hình các thông số như API, tên app, v.v.
- **eslint.config.js**: Cấu hình ESLint để kiểm tra chuẩn code.
- **index.html**: File HTML gốc, nơi mount ứng dụng React.
- **package.json / package-lock.json**: Quản lý dependencies, scripts, metadata dự án.
- **README.md**: Tài liệu hướng dẫn sử dụng, cài đặt dự án.
- **vite.config.js**: Cấu hình cho Vite (build tool).
- **STRUCTURE.md**: Mô tả cấu trúc, hướng dẫn sử dụng dự án.

## Thư mục `public/`

- Chứa các file tĩnh như logo, hình ảnh, SVG dùng chung cho toàn bộ app.

## Thư mục `src/`

- **App.jsx**: Component gốc của ứng dụng, nơi khai báo router, context, layout tổng.
- **main.jsx**: Điểm khởi động ứng dụng, render App vào DOM.

### 1. **auth/**

- **authUtils.js**: Chứa các hàm tiện ích liên quan xác thực (lưu, lấy token, kiểm tra đăng nhập...).
- **PrivateRoute.jsx**: Component bảo vệ route, chỉ cho phép truy cập nếu đã đăng nhập.

### 2. **assets/**

- **images/**: (Hiện trống) - Dùng để chứa hình ảnh, logo, icon cho app.
- **react.svg**: Logo React, dùng cho giao diện.

### 3. **components/**

- **admin_layout.jsx**: Layout dành cho giao diện quản trị.
- **navbar.jsx**: Thanh điều hướng trên cùng.
- **sidebar.jsx**: Thanh điều hướng bên trái.
- **layout/Header.jsx**: Header cho layout chính.
- **modals/add_topic_modal.jsx**: Modal thêm đề tài mới.
- **common/**: Các component dùng chung như Button, Input, Select, Table, Modal, Card, Badge, LoadingSpinner, ErrorAlert, SuccessAlert, ErrorBoundary, Textarea, index.js (export các component).

### 4. **config/**

- **api.js**: Cấu hình endpoint API, timeout, baseURL, v.v.

### 5. **constants/**

- **roles.js**: Định nghĩa các vai trò người dùng, quyền hạn.
- **routes.js**: Định nghĩa các route, path cố định.
- **thesis.js**: Định nghĩa trạng thái, loại luận văn.
- **index.js**: Export các constant.

### 6. **contexts/**

- **AuthContext.jsx**: Context quản lý trạng thái xác thực, thông tin người dùng toàn app.

### 7. **hooks/**

- **useApi.js**: Custom hook gọi API, quản lý loading, error, data.
- **useAuth.js**: Custom hook truy cập AuthContext.
- **useLocalStorage.js**: Custom hook thao tác với localStorage.
- **useDebounce.js**: Custom hook debounce giá trị.
- **index.js**: Export các hook.

### 8. **pages/**

- **admin-ui/templates/**: Các trang giao diện quản trị:
  - **dashboard.jsx**: Trang tổng quan admin.
  - **topic_management.jsx**: Quản lý đề tài.
  - **user_management.jsx**: Quản lý người dùng.
- **user-fe/**: Giao diện người dùng:
  - **home.jsx**: Trang chủ người dùng.
  - **login.jsx**: Trang đăng nhập.
  - **static/css/login.css**: Style cho trang đăng nhập.
- **thesis-fe/index.jsx**: Trang danh sách luận văn.
- (Các thư mục admin, thesis, user, auth hiện trống hoặc chưa sử dụng.)

### 9. **services/**

- **httpClient.js**: Cấu hình axios, interceptor, xử lý request/response.
- **authService.js**: Gọi API xác thực (login, logout, refresh token...).
- **thesisService.js**: Gọi API liên quan luận văn.
- **index.js**: Export các service.

### 10. **styles/**

- **pages/admin/style.css**: Style cho trang admin.
- **pages/auth/login.css**: Style cho trang đăng nhập (hiện trống).
- (Các thư mục auth, common, layout hiện trống.)

### 11. **utils/**

- **validation.js**: Hàm kiểm tra hợp lệ dữ liệu (email, password...).
- **formatting.js**: Hàm định dạng dữ liệu (ngày tháng, số...).
- **index.js**: Export các hàm tiện ích.

### 12. **routers/**

- (Hiện trống) - Dự kiến dùng để khai báo các router riêng biệt nếu cần.

### 13. **static/**

- (Hiện trống) - Dự kiến chứa các file tĩnh khác.

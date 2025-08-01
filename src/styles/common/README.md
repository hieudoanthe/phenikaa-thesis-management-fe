# Design Tokens - Phenikaa Thesis Management

Hệ thống design tokens thống nhất cho toàn bộ dự án Phenikaa Thesis Management.

## Tổng quan

Design tokens là các giá trị thiết kế được chuẩn hóa (màu sắc, font chữ, spacing, shadows, etc.) được sử dụng xuyên suốt ứng dụng để đảm bảo tính nhất quán trong thiết kế.

## Cấu trúc

```
src/styles/common/
├── design-tokens.css    # CSS variables và utility classes
├── placeholder.css      # CSS cho placeholder components
├── index.js            # Import và export design tokens
└── README.md           # Hướng dẫn sử dụng
```

## Sử dụng

### 1. CSS Variables

Sử dụng CSS variables trong file CSS:

```css
.my-component {
  color: var(--color-primary);
  background-color: var(--color-bg-card);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-card);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  padding: var(--spacing-4);
}
```

### 2. Utility Classes

Sử dụng utility classes trực tiếp trong JSX:

```jsx
<div className="bg-card rounded-xl shadow-card p-4">
  <h2 className="text-2xl font-bold text-primary mb-4">Tiêu đề</h2>
  <p className="text-muted leading-normal">Nội dung mô tả</p>
</div>
```

### 3. JavaScript Usage

Import design tokens trong JavaScript:

```javascript
import { designTokens } from "../styles/common";

// Sử dụng trong styled-components hoặc inline styles
const buttonStyle = {
  backgroundColor: designTokens.colors.primary,
  borderRadius: designTokens.borderRadius.lg,
  padding: designTokens.spacing[4],
};
```

## Color Palette

### Primary Colors

- `--color-primary`: #ff6600 (Orange chính)
- `--color-primary-hover`: #e65c00
- `--color-primary-light`: #ff8533
- `--color-primary-dark`: #cc5200

### Secondary Colors

- `--color-secondary`: #23395d (Blue chính)
- `--color-secondary-hover`: #1a2a45
- `--color-secondary-light`: #394a7c
- `--color-secondary-dark`: #0f1a2e

### Status Colors

- `--color-success`: #10b981 (Green)
- `--color-warning`: #f59e0b (Yellow)
- `--color-error`: #ef4444 (Red)
- `--color-info`: #3b82f6 (Blue)

### Neutral Colors

- `--color-gray-50` đến `--color-gray-900`: Gray scale
- `--color-white`: #ffffff
- `--color-black`: #000000

## Typography

### Font Families

- `--font-family-primary`: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif
- `--font-family-secondary`: Arial, sans-serif
- `--font-family-mono`: "Courier New", monospace

### Font Sizes

- `--font-size-xs`: 0.75rem (12px)
- `--font-size-sm`: 0.875rem (14px)
- `--font-size-base`: 1rem (16px)
- `--font-size-lg`: 1.125rem (18px)
- `--font-size-xl`: 1.25rem (20px)
- `--font-size-2xl`: 1.5rem (24px)
- `--font-size-3xl`: 1.875rem (30px)
- `--font-size-4xl`: 2.25rem (36px)
- `--font-size-5xl`: 3rem (48px)

### Font Weights

- `--font-weight-light`: 300
- `--font-weight-normal`: 400
- `--font-weight-medium`: 500
- `--font-weight-semibold`: 600
- `--font-weight-bold`: 700
- `--font-weight-extrabold`: 800

## Spacing

- `--spacing-0`: 0
- `--spacing-1`: 0.25rem (4px)
- `--spacing-2`: 0.5rem (8px)
- `--spacing-3`: 0.75rem (12px)
- `--spacing-4`: 1rem (16px)
- `--spacing-5`: 1.25rem (20px)
- `--spacing-6`: 1.5rem (24px)
- `--spacing-8`: 2rem (32px)
- `--spacing-10`: 2.5rem (40px)
- `--spacing-12`: 3rem (48px)

## Border Radius

- `--border-radius-none`: 0
- `--border-radius-sm`: 4px
- `--border-radius-md`: 6px
- `--border-radius-lg`: 8px
- `--border-radius-xl`: 12px
- `--border-radius-2xl`: 14px
- `--border-radius-3xl`: 16px
- `--border-radius-full`: 50%

## Shadows

### Standard Shadows

- `--shadow-none`: none
- `--shadow-sm`: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
- `--shadow-md`: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
- `--shadow-lg`: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
- `--shadow-xl`: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
- `--shadow-2xl`: 0 25px 50px -12px rgba(0, 0, 0, 0.25)

### Custom Shadows

- `--shadow-card`: 0 2px 8px rgba(35, 57, 93, 0.07)
- `--shadow-card-hover`: 0 8px 25px rgba(0, 0, 0, 0.15)
- `--shadow-modal`: 0 10px 30px rgba(0, 0, 0, 0.3)
- `--shadow-dropdown`: 0 4px 12px rgba(0, 0, 0, 0.15)
- `--shadow-focus`: 0 0 0 3px rgba(255, 102, 0, 0.1)

## Transitions

- `--transition-fast`: 0.15s ease
- `--transition-normal`: 0.2s ease
- `--transition-slow`: 0.3s ease
- `--transition-slower`: 0.5s ease

## Z-Index

- `--z-index-dropdown`: 1000
- `--z-index-sticky`: 1020
- `--z-index-fixed`: 1030
- `--z-index-modal-backdrop`: 1040
- `--z-index-modal`: 1050
- `--z-index-popover`: 1060
- `--z-index-tooltip`: 1070

## Component Mixins

### Button Mixin

```css
.btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--button-padding-y) var(--button-padding-x);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-normal);
}
```

### Input Mixin

```css
.input-base {
  display: block;
  width: 100%;
  height: var(--input-height);
  padding: var(--input-padding-y) var(--input-padding-x);
  font-family: var(--font-family-primary);
  font-size: var(--font-size-base);
  border: var(--input-border-width) solid var(--color-border-primary);
  border-radius: var(--border-radius-lg);
  transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
}
```

### Card Mixin

```css
.card-base {
  background-color: var(--color-bg-card);
  border: var(--card-border-width) solid var(--color-border-secondary);
  border-radius: var(--border-radius-xl);
  padding: var(--card-padding);
  box-shadow: var(--shadow-card);
  transition: box-shadow var(--transition-normal);
}
```

## Best Practices

1. **Luôn sử dụng CSS variables** thay vì hardcode values
2. **Sử dụng utility classes** cho các trường hợp đơn giản
3. **Import design tokens** trong JavaScript khi cần thiết
4. **Không override** các giá trị đã được định nghĩa
5. **Thêm mới** design tokens khi cần thiết và cập nhật documentation

## Migration Guide

Để migrate từ hardcoded values sang design tokens:

### Trước

```css
.button {
  background-color: #ff6600;
  border-radius: 8px;
  font-family: "Segoe UI", sans-serif;
}
```

### Sau

```css
.button {
  background-color: var(--color-primary);
  border-radius: var(--border-radius-lg);
  font-family: var(--font-family-primary);
}
```

Hoặc sử dụng utility classes:

```jsx
<button className="bg-primary rounded-lg font-primary">Button</button>
```

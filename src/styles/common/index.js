// Import design tokens
import "./design-tokens.css";
import "./placeholder.css";
import "./responsive.css";

// Export for potential JavaScript usage
export const designTokens = {
  colors: {
    primary: "var(--color-primary)",
    secondary: "var(--color-secondary)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    error: "var(--color-error)",
    info: "var(--color-info)",
  },
  typography: {
    fontFamily: {
      primary: "var(--font-family-primary)",
      secondary: "var(--font-family-secondary)",
      mono: "var(--font-family-mono)",
    },
    fontSize: {
      xs: "var(--font-size-xs)",
      sm: "var(--font-size-sm)",
      base: "var(--font-size-base)",
      lg: "var(--font-size-lg)",
      xl: "var(--font-size-xl)",
      "2xl": "var(--font-size-2xl)",
      "3xl": "var(--font-size-3xl)",
      "4xl": "var(--font-size-4xl)",
      "5xl": "var(--font-size-5xl)",
    },
  },
  spacing: {
    0: "var(--spacing-0)",
    1: "var(--spacing-1)",
    2: "var(--spacing-2)",
    3: "var(--spacing-3)",
    4: "var(--spacing-4)",
    5: "var(--spacing-5)",
    6: "var(--spacing-6)",
    8: "var(--spacing-8)",
  },
  borderRadius: {
    none: "var(--border-radius-none)",
    sm: "var(--border-radius-sm)",
    md: "var(--border-radius-md)",
    lg: "var(--border-radius-lg)",
    xl: "var(--border-radius-xl)",
    "2xl": "var(--border-radius-2xl)",
    "3xl": "var(--border-radius-3xl)",
    full: "var(--border-radius-full)",
  },
  shadows: {
    none: "var(--shadow-none)",
    sm: "var(--shadow-sm)",
    md: "var(--shadow-md)",
    lg: "var(--shadow-lg)",
    xl: "var(--shadow-xl)",
    "2xl": "var(--shadow-2xl)",
    card: "var(--shadow-card)",
    "card-hover": "var(--shadow-card-hover)",
    modal: "var(--shadow-modal)",
    dropdown: "var(--shadow-dropdown)",
    focus: "var(--shadow-focus)",
  },
};

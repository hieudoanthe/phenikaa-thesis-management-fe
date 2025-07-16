import React from "react";

const Badge = ({
  children,
  variant = "default",
  size = "medium",
  className = "",
  ...props
}) => {
  // Base classes
  const baseClasses = "inline-flex items-center font-medium rounded-full";

  // Variant classes
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
  };

  // Size classes
  const sizeClasses = {
    small: "px-2 py-0.5 text-xs",
    medium: "px-2.5 py-0.5 text-sm",
    large: "px-3 py-1 text-sm",
  };

  // Combine all classes
  const badgeClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={badgeClasses} {...props}>
      {children}
    </span>
  );
};

export default Badge;

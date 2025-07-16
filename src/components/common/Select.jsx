import React, { forwardRef } from "react";

const Select = forwardRef(
  (
    {
      label,
      value = "",
      onChange,
      onBlur,
      options = [],
      placeholder = "Chọn một tùy chọn",
      error = "",
      disabled = false,
      required = false,
      fullWidth = false,
      size = "medium",
      className = "",
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses =
      "block border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200";

    // Size classes
    const sizeClasses = {
      small: "px-3 py-1.5 text-sm",
      medium: "px-4 py-2 text-sm",
      large: "px-4 py-3 text-base",
    };

    // State classes
    const stateClasses = error
      ? "border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500"
      : "border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500";

    // Disabled classes
    const disabledClasses = disabled
      ? "bg-gray-50 text-gray-500 cursor-not-allowed"
      : "bg-white";

    // Width classes
    const widthClasses = fullWidth ? "w-full" : "";

    // Combine all classes
    const selectClasses = [
      baseClasses,
      sizeClasses[size],
      stateClasses,
      disabledClasses,
      widthClasses,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <select
          ref={ref}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          className={selectClasses}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;

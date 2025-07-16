import React, { forwardRef } from "react";

const Textarea = forwardRef(
  (
    {
      label,
      value = "",
      onChange,
      onBlur,
      placeholder = "",
      error = "",
      disabled = false,
      required = false,
      fullWidth = false,
      size = "medium",
      rows = 4,
      maxLength,
      showCharacterCount = false,
      className = "",
      ...props
    },
    ref
  ) => {
    // Base classes
    const baseClasses =
      "block border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors duration-200 resize-none";

    // Size classes
    const sizeClasses = {
      small: "px-3 py-1.5 text-sm",
      medium: "px-4 py-2 text-sm",
      large: "px-4 py-3 text-base",
    };

    // State classes
    const stateClasses = error
      ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
      : "border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500";

    // Disabled classes
    const disabledClasses = disabled
      ? "bg-gray-50 text-gray-500 cursor-not-allowed"
      : "bg-white";

    // Width classes
    const widthClasses = fullWidth ? "w-full" : "";

    // Combine all classes
    const textareaClasses = [
      baseClasses,
      sizeClasses[size],
      stateClasses,
      disabledClasses,
      widthClasses,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    // Character count
    const characterCount = value.length;
    const isOverLimit = maxLength && characterCount > maxLength;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={rows}
          maxLength={maxLength}
          className={textareaClasses}
          {...props}
        />

        <div className="flex justify-between items-center mt-1">
          {error && <p className="text-sm text-red-600">{error}</p>}

          {showCharacterCount && maxLength && (
            <p
              className={`text-sm ml-auto ${
                isOverLimit ? "text-red-600" : "text-gray-500"
              }`}
            >
              {characterCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;

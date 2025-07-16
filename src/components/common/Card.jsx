import React from "react";

const Card = ({
  children,
  title,
  subtitle,
  header,
  footer,
  padding = "medium",
  shadow = "medium",
  className = "",
  ...props
}) => {
  // Padding classes
  const paddingClasses = {
    none: "",
    small: "p-4",
    medium: "p-6",
    large: "p-8",
  };

  // Shadow classes
  const shadowClasses = {
    none: "",
    small: "shadow-sm",
    medium: "shadow",
    large: "shadow-lg",
    xl: "shadow-xl",
  };

  // Base classes
  const baseClasses = "bg-white rounded-lg border border-gray-200";

  // Combine all classes
  const cardClasses = [baseClasses, shadowClasses[shadow], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses} {...props}>
      {/* Header */}
      {(title || subtitle || header) && (
        <div className="border-b border-gray-200 px-6 py-4">
          {header ? (
            header
          ) : (
            <div>
              {title && (
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Body */}
      <div className={paddingClasses[padding]}>{children}</div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

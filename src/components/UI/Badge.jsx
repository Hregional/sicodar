// src/components/ui/Badge.jsx
import React from 'react';

export function Badge({ children, variant = "default", size = "md" }) {
  const baseClasses = "inline-flex items-center justify-center font-medium";
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base"
  };
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    primary: "bg-blue-100 text-blue-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800"
  };

  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} rounded-full`}>
      {children}
    </span>
  );
}
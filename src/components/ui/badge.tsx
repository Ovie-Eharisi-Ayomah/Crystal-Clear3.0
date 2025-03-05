import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = "default", 
  className = "" 
}) => {
  const variantStyles = {
    default: "bg-sky-100 text-sky-800",
    secondary: "bg-gray-100 text-gray-800",
    outline: "bg-transparent border border-gray-300 text-gray-600",
    destructive: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
        ${variantStyles[variant]} ${className}
      `}
    >
      {children}
    </span>
  );
};
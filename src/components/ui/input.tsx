import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          className={`
            flex h-10 w-full rounded-md border border-gray-300
            bg-white py-2 px-3 text-sm shadow-sm focus:border-sky-500 
            focus:ring-sky-500 ${error ? "border-red-500" : ""} ${className || ""}
          `}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={`
            w-full min-h-[80px] rounded-md border border-gray-300 
            shadow-sm focus:border-sky-500 focus:ring-sky-500 
            px-3 py-2 text-sm ${error ? "border-red-500" : ""} ${className || ""}
          `}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
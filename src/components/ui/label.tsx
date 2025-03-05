import React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <label
        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ""}`}
        ref={ref}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = "Label";
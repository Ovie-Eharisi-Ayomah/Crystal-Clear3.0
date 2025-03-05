import React from "react";

type RadioGroupContextValue = {
  value?: string;
  onValueChange?: (value: string) => void;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

interface RadioGroupProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className = "",
}) => {
  const [internalValue, setInternalValue] = React.useState<string | undefined>(
    defaultValue
  );

  const contextValue = React.useMemo(() => {
    return {
      value: value !== undefined ? value : internalValue,
      onValueChange: (newValue: string) => {
        setInternalValue(newValue);
        onValueChange?.(newValue);
      },
    };
  }, [value, internalValue, onValueChange]);

  return (
    <RadioGroupContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </RadioGroupContext.Provider>
  );
};

interface RadioGroupItemProps {
  value: string;
  id?: string;
  disabled?: boolean;
}

export const RadioGroupItem: React.FC<RadioGroupItemProps> = ({
  value,
  id,
  disabled = false,
}) => {
  const { value: groupValue, onValueChange } = React.useContext(
    RadioGroupContext
  );

  const checked = groupValue === value;

  return (
    <input
      type="radio"
      id={id}
      value={value}
      disabled={disabled}
      checked={checked}
      onChange={() => onValueChange?.(value)}
      className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300"
    />
  );
};
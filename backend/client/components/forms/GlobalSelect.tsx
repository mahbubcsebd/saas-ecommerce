import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { forwardRef, useEffect, useRef, useState } from 'react';

// Assuming translations are handled, if not we can default or keep imports
// import { useTranslation } from '@/utils/t'; // Keep if it exists, else remove/mock.
// For now keeping imports as consistent with previous file unless user deletes them.
// I will verify if `utils/t` exists later or assume it does since previous code had it.
// To be safe I will use a simple fallback for translation if I can't confirm.
// Actually, I'll stick to the user's provided code structure but remove motion.

export interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
  className?: string;
}

interface GlobalSelectProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  options?: Option[];
  labelClassName?: string;
  selectClassName?: string;
  containerClassName?: string;
  disabled?: boolean;
  value?: string | number;
  isReadOnly?: boolean;
  onChange?: (value: string | number) => void;
  name?: string;
  className?: string; // Add className to props
}

const GlobalSelect = forwardRef<HTMLButtonElement, GlobalSelectProps>(
  (
    {
      label,
      placeholder = 'Select',
      required = false,
      error,
      helperText,
      options = [],
      className = '',
      labelClassName = '',
      selectClassName = '',
      containerClassName = '',
      disabled = false,
      value,
      isReadOnly = false,
      onChange,
      name,
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<Option | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    // Find selected option
    useEffect(() => {
      const option = options.find((opt) => opt.value === value);
      setSelectedOption(option || null);
    }, [value, options]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: Option) => {
      if (option.disabled) return;
      setSelectedOption(option);
      setIsOpen(false);
      if (onChange) {
        onChange(option.value);
      }
    };

    return (
      <div className={cn('w-full relative', containerClassName)}>
        {/* Label */}
        {label && (
          <label className={cn('block text-sm font-medium text-gray-700 mb-2', labelClassName)}>
            {label}
            {required && <span className="ml-1 text-primary">*</span>}
          </label>
        )}

        {/* Select Trigger */}
        <div className="relative">
          <button
            ref={ref || triggerRef} // Use passed ref if available for RHF
            // ref={triggerRef} // Original logic might have issues if we override ref. RHF needs ref.
            // Actually RHF ref should be on the input. But for Select it's tricky.
            // Usually with Controller we don't strictly need ref on the button unless for focus.
            // Let's attach ref to button.
            name={name}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && !isReadOnly && setIsOpen(!isOpen)}
            className={cn(
              'w-full h-12 px-4 bg-gray-50 border rounded-lg text-gray-900 transition-all duration-300 outline-none flex items-center justify-between',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : 'border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-orange-100',
              (disabled || isReadOnly) && 'bg-gray-100 cursor-not-allowed opacity-60',
              selectClassName,
              className
            )}
          >
            <span
              className={cn(
                'text-sm truncate overflow-hidden whitespace-nowrap text-ellipsis text-left',
                selectedOption ? 'text-gray-900' : 'text-gray-400',
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            {!isReadOnly && (
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-gray-400 transition-transform duration-200',
                  isOpen && 'transform rotate-180',
                )}
              />
            )}
          </button>

          {/* Dropdown */}
          {isOpen && !disabled && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-2 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg max-h-60"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full px-4 py-3 text-left text-sm transition-colors duration-150',
                    option.className,
                    !option.disabled &&
                      'hover:bg-primary/5 focus:bg-primary/5 focus:outline-none cursor-pointer',
                    selectedOption?.value === option.value &&
                      'bg-primary/5 text-primary font-medium',
                    option.disabled && 'cursor-not-allowed opacity-40 text-gray-500',
                  )}
                >
                  {option.label}
                </button>
              ))}
              {options.length === 0 && (
                <div className="px-4 py-3 text-sm text-center text-gray-400">
                  No options available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Helper Text or Error */}
        {(helperText || error) && (
          <p className={cn('mt-1 text-sm', error ? 'text-red-500' : 'text-gray-500')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  },
);

GlobalSelect.displayName = 'GlobalSelect';

export default GlobalSelect;

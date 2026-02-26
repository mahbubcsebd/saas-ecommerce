import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState } from 'react';

// Simplified translation mock to avoid dependency errors if utils/t is missing
const t = (key: string) => {
    const translations: Record<string, string> = {
        'please_enter': 'Please enter',
    };
    return translations[key] || key;
};

interface GlobalInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  isTextarea?: boolean;
  rows?: number;
  isReadOnly?: boolean;
  rightElement?: React.ReactNode;
}

const GlobalInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, GlobalInputProps>(
  (
    {
      label,
      type = 'text',
      placeholder,
      required = false,
      error,
      helperText,
      className = '',
      labelClassName = '',
      inputClassName = '',
      containerClassName = '',
      isTextarea = false,
      rows = 4,
      disabled = false,
      isReadOnly = false,
      maxLength,
      rightElement = null,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    // Dynamic placeholder logic
    const dynamicPlaceholder =
      placeholder !== undefined ? placeholder : label ? `${t('please_enter')} ${label}` : '';

    return (
      <div className={cn('w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label className={cn('block text-sm font-medium text-gray-700 mb-2', labelClassName)}>
            {label}
            {required && <span className="ml-1 text-primary">*</span>}
          </label>
        )}

        {/* Input/Textarea Container */}
        <div className="relative">
          {isTextarea ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              rows={rows}
              disabled={disabled}
              placeholder={dynamicPlaceholder}
              readOnly={isReadOnly}
              maxLength={maxLength}
              className={cn(
                'text-base w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-300 outline-none resize-none h-[150px]',
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-orange-100',
                (disabled || isReadOnly) && 'bg-gray-100 cursor-not-allowed opacity-60',
                inputClassName,
                className
              )}
              {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type={inputType}
              disabled={disabled}
              maxLength={maxLength}
              placeholder={dynamicPlaceholder}
              readOnly={isReadOnly}
              className={cn(
                'text-base w-full px-4 py-3 bg-gray-50 border rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-300 outline-none',
                error
                  ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-gray-200 hover:border-gray-300 focus:border-primary focus:ring-2 focus:ring-orange-100',
                (isPassword || rightElement) && 'pr-12',
                (disabled || isReadOnly) && 'bg-gray-100 cursor-not-allowed opacity-60',
                inputClassName,
                className
              )}
              {...props as React.InputHTMLAttributes<HTMLInputElement>}
            />
          )}

          {/* Right Element */}
          {rightElement && (
            <div className="absolute flex items-center -translate-y-1/2 right-3 top-1/2">
              {rightElement}
            </div>
          )}

          {/* Password Eye Icon */}
          {isPassword && !disabled && !rightElement && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute text-gray-400 transition-colors -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
            >
              {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
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

GlobalInput.displayName = 'GlobalInput';

export default GlobalInput;

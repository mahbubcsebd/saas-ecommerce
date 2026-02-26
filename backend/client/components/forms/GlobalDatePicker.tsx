'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface GlobalDatePickerProps {
  label?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  error?: string;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  containerClassName?: string;
}

export function GlobalDatePicker({
  label,
  value,
  onChange,
  error,
  helperText,
  placeholder = 'Pick a date',
  disabled = false,
  required = false,
  className,
  containerClassName,
}: GlobalDatePickerProps) {
  return (
    <div className={cn('w-full space-y-2', containerClassName)}>
      {label && (
        <label className={cn('block text-sm font-medium text-gray-700')}>
          {label}
          {required && <span className="ml-1 text-primary">*</span>}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            disabled={disabled}
            className={cn(
              'w-full h-12 justify-start text-left font-normal border-gray-200 bg-gray-50 hover:bg-gray-100 rounded-lg',
              !value && 'text-muted-foreground',
              error && 'border-red-400 focus:ring-red-200',
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'PPP') : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
      {(helperText || error) && (
        <p className={cn('text-sm', error ? 'text-red-500' : 'text-gray-500')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

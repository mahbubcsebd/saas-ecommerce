'use client';

import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface GlobalDatePickerProps {
  label?: string;
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  showTimeSelect?: boolean;
  dateFormat?: string;
  className?: string;
  disabled?: boolean;
}

export function GlobalDatePicker({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  required = false,
  error,
  showTimeSelect = true,
  dateFormat = 'MMMM d, yyyy h:mm aa',
  className,
  disabled = false,
}: GlobalDatePickerProps) {
  return (
    <div className={cn('space-y-1.5 w-full', className)}>
      {label && (
        <Label className="text-xs uppercase font-bold tracking-wider text-gray-400">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative group/picker">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none group-focus-within/picker:text-black transition-colors">
          <CalendarIcon size={16} />
        </div>
        
        <DatePicker
          selected={value}
          onChange={(date) => {
            if (date && !value) {
              date.setHours(0, 0, 0, 0);
            }
            onChange(date);
          }}
          showTimeSelect
          dateFormat={dateFormat}
          placeholderText={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            "w-full text-sm h-11 bg-gray-50/50 border border-gray-100 rounded-xl pl-10 pr-10 outline-none transition-all",
            "focus:bg-white focus:ring-4 focus:ring-black/5 focus:border-black",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-red-500 focus:ring-red-500/10 focus:border-red-500"
          )}
          wrapperClassName="w-full"
          calendarClassName="premium-calendar"
          popperClassName="premium-popper"
          popperPlacement="bottom-start"
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => {
            const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);
            const months = [
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"
            ];
            
            return (
              <div className="flex flex-col gap-2 p-2 bg-white">
                <div className="flex items-center justify-between">
                  <button
                    onClick={decreaseMonth}
                    disabled={prevMonthButtonDisabled}
                    type="button"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
                    <span className="text-sm font-extrabold text-gray-900 uppercase tracking-tighter">
                      {months[date.getMonth()]}
                    </span>
                    <span className="text-sm font-medium text-gray-400">
                      {date.getFullYear()}
                    </span>
                  </div>

                  <button
                    onClick={increaseMonth}
                    disabled={nextMonthButtonDisabled}
                    type="button"
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="flex gap-1 px-1">
                  <select
                    value={date.getFullYear()}
                    onChange={({ target: { value } }) => changeYear(Number(value))}
                    className="flex-1 bg-gray-50 border-none text-[10px] font-bold uppercase py-1 px-2 rounded-md outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    {years.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <select
                    value={months[date.getMonth()]}
                    onChange={({ target: { value } }) => changeMonth(months.indexOf(value))}
                    className="flex-1 bg-gray-50 border-none text-[10px] font-bold uppercase py-1 px-2 rounded-md outline-none cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    {months.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          }}
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      
      {error && (
        <p className="text-[10px] text-red-500 font-medium ml-1">{error}</p>
      )}

      <style jsx global>{`
        .premium-popper {
          z-index: 9999 !important;
        }
        .premium-calendar {
          font-family: 'Inter', system-ui, sans-serif !important;
          border-radius: 24px !important;
          border: 1px solid #f1f5f9 !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
          overflow: hidden !important;
          background: white !important;
          display: flex !important;
        }
        
        .react-datepicker__month-container {
          padding: 12px !important;
          background: white !important;
        }

        .react-datepicker__header {
          background-color: white !important;
          border-bottom: none !important;
          padding: 0 !important;
        }

        .react-datepicker__day-names {
          margin-top: 10px !important;
          margin-bottom: 5px !important;
        }

        .react-datepicker__day-name {
          color: #94a3b8 !important;
          font-weight: 700 !important;
          font-size: 0.65rem !important;
          text-transform: uppercase !important;
          width: 2.2rem !important;
        }

        .react-datepicker__day {
          border-radius: 12px !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          font-size: 0.85rem !important;
          font-weight: 500 !important;
          margin: 0.1rem !important;
          width: 2.2rem !important;
          line-height: 2.2rem !important;
          color: #1e293b !important;
        }

        .react-datepicker__day:hover {
          background-color: #f1f5f9 !important;
          color: black !important;
          transform: scale(1.1) !important;
        }

        .react-datepicker__day--selected {
          background-color: #000000 !important;
          color: white !important;
          font-weight: 800 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2) !important;
          transform: scale(1.05) !important;
        }

        .react-datepicker__day--outside-month {
          color: #cbd5e1 !important;
        }

        .react-datepicker__day--today {
          font-weight: 800 !important;
          color: #000 !important;
          position: relative !important;
        }
        .react-datepicker__day--today::after {
          content: '' !important;
          position: absolute !important;
          bottom: 4px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          width: 4px !important;
          height: 4px !important;
          background: #000 !important;
          border-radius: 50% !important;
        }

        /* Time Section Styling */
        .react-datepicker__time-container {
          border-left: 1px solid #f1f5f9 !important;
          width: 100px !important;
          background: #fafafa !important;
        }

        .react-datepicker__time-header {
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.1em !important;
          font-weight: 900 !important;
          color: #64748b !important;
          padding: 15px 0 !important;
          background: white !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }

        .react-datepicker__time-list {
          padding: 0 !important;
          scrollbar-width: none !important;
        }
        .react-datepicker__time-list::-webkit-scrollbar {
          display: none !important;
        }

        .react-datepicker__time-list-item {
          height: 36px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          color: #64748b !important;
          transition: all 0.2s !important;
          margin: 4px 8px !important;
          border-radius: 8px !important;
        }

        .react-datepicker__time-list-item:hover {
          background-color: #f1f5f9 !important;
          color: black !important;
        }

        .react-datepicker__time-list-item--selected {
          background-color: #000 !important;
          color: white !important;
          font-weight: 800 !important;
        }

        .react-datepicker__navigation {
          display: none !important; /* Using custom header buttons */
        }
      `}</style>
    </div>
  );
}

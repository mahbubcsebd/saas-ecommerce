'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ConfirmationType = 'info' | 'success' | 'warning' | 'danger';

export interface ConfirmationOptions {
  title: string;
  message: string;
  type?: ConfirmationType;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  options: ConfirmationOptions;
  onClose: () => void;
}

export const ConfirmationModal = ({ isOpen, options, onClose }: ConfirmationModalProps) => {
  const [loading, setLoading] = useState(false);
  const {
    title,
    message,
    type = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
  } = options;

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      setLoading(true);
      try {
        await onConfirm();
        onClose();
      } catch (error) {
        console.error('Confirmation error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  const icons = {
    info: <Info className="size-10 text-blue-500" />,
    success: <CheckCircle2 className="size-10 text-emerald-500" />,
    warning: <AlertTriangle className="size-10 text-amber-500" />,
    danger: <XCircle className="size-10 text-rose-500" />,
  };

  const gradients = {
    info: 'from-blue-500/10 to-blue-500/5',
    success: 'from-emerald-500/10 to-emerald-500/5',
    warning: 'from-amber-500/10 to-amber-500/5',
    danger: 'from-rose-500/10 to-rose-500/5',
  };

  const buttonVariants: Record<
    ConfirmationType,
    'default' | 'destructive' | 'secondary' | 'outline'
  > = {
    info: 'default',
    success: 'default',
    warning: 'default',
    danger: 'destructive',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <div
          className={cn(
            'h-2 w-full',
            type === 'info' && 'bg-blue-500',
            type === 'success' && 'bg-emerald-500',
            type === 'warning' && 'bg-amber-500',
            type === 'danger' && 'bg-rose-500'
          )}
        />

        <div className="p-8 pb-6 flex flex-col items-center text-center">
          <div
            className={cn(
              'size-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b relative',
              gradients[type]
            )}
          >
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current pointer-events-none" />
            {icons[type]}
          </div>

          <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 mb-2 border-none">
            {title}
          </DialogTitle>

          <DialogDescription className="text-sm text-slate-500 leading-relaxed px-2 border-none">
            {message}
          </DialogDescription>
        </div>

        <DialogFooter
          className={cn(
            'p-6 pt-2 gap-3 sm:gap-3 sm:justify-center',
            cancelText ? 'grid grid-cols-2' : 'flex justify-center w-full'
          )}
        >
          {cancelText && (
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={loading}
              className="h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all border border-slate-100"
            >
              {cancelText}
            </Button>
          )}
          <Button
            variant={buttonVariants[type]}
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              'h-12 rounded-2xl font-bold shadow-lg transition-all',
              !cancelText && 'px-12', // Wider button for single-action modals
              type === 'success' && 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100',
              type === 'info' && 'bg-blue-600 hover:bg-blue-700 shadow-blue-100',
              type === 'warning' && 'bg-amber-600 hover:bg-amber-700 shadow-amber-100',
              type === 'danger' && 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
            )}
          >
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

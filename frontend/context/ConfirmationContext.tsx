'use client';

import { ConfirmationModal, ConfirmationOptions } from '@/components/modals/ConfirmationModal';
import { createContext, ReactNode, useCallback, useContext, useState } from 'react';

interface ConfirmationContextType {
  confirm: (options: ConfirmationOptions) => Promise<boolean>;
  alert: (options: Omit<ConfirmationOptions, 'onConfirm' | 'onCancel'>) => Promise<void>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<
    ConfirmationOptions & { resolve?: (val: boolean) => void }
  >({
    title: '',
    message: '',
  });

  const confirm = useCallback((confirmOptions: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({
        ...confirmOptions,
        resolve,
      });
      setIsOpen(true);
    });
  }, []);

  const alert = useCallback(
    (alertOptions: Omit<ConfirmationOptions, 'onConfirm' | 'onCancel'>): Promise<void> => {
      return new Promise((resolve) => {
        setOptions({
          ...alertOptions,
          confirmText: alertOptions.confirmText || 'OK',
          cancelText: '', // Hide cancel button
          resolve: () => resolve(),
        });
        setIsOpen(true);
      });
    },
    []
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (options.resolve) {
      options.resolve(false);
    }
  }, [options]);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (options.resolve) {
      options.resolve(true);
    }
  }, [options]);

  return (
    <ConfirmationContext.Provider value={{ confirm, alert }}>
      {children}
      <ConfirmationModal
        isOpen={isOpen}
        options={{
          ...options,
          onConfirm: handleConfirm,
          onCancel: handleClose,
        }}
        onClose={handleClose}
      />
    </ConfirmationContext.Provider>
  );
};

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

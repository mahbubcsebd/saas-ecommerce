import { AlertMessage } from './AlertMessage';

interface SuccessMessageProps {
  message?: string;
  className?: string;
}

export function SuccessMessage({ message, className }: SuccessMessageProps) {
  if (!message) return null;
  return (
    <AlertMessage
      type="success"
      title="Success"
      message={message}
      className={className}
    />
  );
}

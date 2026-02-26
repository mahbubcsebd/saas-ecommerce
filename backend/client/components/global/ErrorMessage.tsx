import { AlertMessage } from './AlertMessage';

interface ErrorMessageProps {
  message?: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  if (!message) return null;
  return (
    <AlertMessage
      type="error"
      title="Error"
      message={message}
      className={className}
    />
  );
}

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface AlertMessageProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message?: string;
  className?: string;
}

export function AlertMessage({ type = 'info', title, message, className }: AlertMessageProps) {
  if (!message && !title) return null;

  const variant = type === 'error' ? 'destructive' : 'default';

  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    error: <XCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4 text-orange-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  };

  const styles = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "", // Default destructive style
    warning: "border-orange-200 bg-orange-50 text-orange-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <Alert variant={variant} className={cn(type !== 'error' && styles[type], className)}>
      {icons[type]}
      <div className="ml-2">
         {title && <AlertTitle>{title}</AlertTitle>}
         {message && <AlertDescription>{message}</AlertDescription>}
      </div>
    </Alert>
  );
}

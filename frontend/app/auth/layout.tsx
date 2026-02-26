export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container min-h-screen flex items-center justify-center py-12 bg-muted/50">
      <div className="w-full max-w-md space-y-8 bg-card p-10 rounded-xl shadow-lg border">
        {children}
      </div>
    </div>
  );
}

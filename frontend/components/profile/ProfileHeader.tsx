import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-6 mb-8">
      <Avatar className="h-24 w-24 border-2 border-muted">
        <AvatarImage src={user.image || undefined} className="object-cover" />
        <AvatarFallback className="text-xl">{user.name?.charAt(0)}</AvatarFallback>
      </Avatar>

      <div className="space-y-1">
        <h3 className="text-xl font-semibold">{user.name}</h3>
        <p className="text-muted-foreground">{user.email}</p>
        <p className="text-sm text-muted-foreground uppercase px-2 py-0.5 bg-secondary rounded-full inline-block">
          {user.role}
        </p>
      </div>
    </div>
  );
}

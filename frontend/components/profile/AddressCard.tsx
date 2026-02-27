import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Home, MapPin, Pencil, Phone, Trash2, User } from "lucide-react";

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  type: string;
  isDefault: boolean;
}

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
}

export default function AddressCard({ address: addr, onEdit, onDelete }: AddressCardProps) {
  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'home': return <Home className="h-5 w-5 text-primary" />;
      case 'office': return <Building className="h-5 w-5 text-primary" />;
      default: return <MapPin className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card className={`group relative overflow-hidden transition-all hover:shadow-md ${addr.isDefault ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''}`}>
      {addr.isDefault && (
        <div className="absolute top-0 right-0 z-10">
          <Badge variant="default" className="rounded-none rounded-bl-lg px-3 py-1 text-xs uppercase font-medium shadow-sm">
            Default
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3 pt-5">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getIcon(addr.type)}
          <span>{addr.type}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="text-sm space-y-4 pb-3">
        <div className="flex items-start gap-3">
          <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground">{addr.name}</span>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="space-y-0.5">
            <p className="font-medium text-foreground">{addr.street}</p>
            <p className="text-muted-foreground">
              {addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.zipCode}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">{addr.phone}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t bg-background/50 flex justify-end gap-2 px-4 py-3">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onEdit(addr)}>
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(addr.id)}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </CardFooter>
    </Card>
  );
}

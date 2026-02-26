"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useConfirm } from "@/hooks/use-confirm";
import { Briefcase, Building, Home, MapPin, Pencil, Phone, Plus, Trash2, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  type: string;
  isDefault: boolean;
}

export default function AddressPage() {
  const { alert, confirm } = useConfirm();
  const { data: session } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Bangladesh",
    phone: "",
    type: "Home",
    isDefault: false
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchAddresses = async () => {
    if (!session?.accessToken) return;
    try {
      const res = await fetch(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAddresses(data.data || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [session]);

  const handleOpenDialog = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        name: address.name || "",
        street: address.street,
        city: address.city,
        state: address.state || "",
        zipCode: address.zipCode,
        country: address.country, // Keep existing country even if hidden
        phone: address.phone,
        type: address.type || "Home",
        isDefault: address.isDefault
      });
    } else {
      setEditingAddress(null);
      setFormData({
          name: session?.user?.name || "",
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "Bangladesh",
          phone: session?.user?.phone || "",
          type: "Home",
          isDefault: false
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.accessToken) return;

    try {
      const url = editingAddress
        ? `${API_URL}/addresses/${editingAddress.id}`
        : `${API_URL}/addresses`;

      const method = editingAddress ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsDialogOpen(false);
        fetchAddresses();
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to save address");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error saving address");
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({
        title: "Delete Address",
        message: "Are you sure you want to delete this address?",
        type: "danger"
    })) return;
    if (!session?.accessToken) return;

    try {
      const res = await fetch(`${API_URL}/addresses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.accessToken}` }
      });

      if (res.ok) {
        fetchAddresses();
      } else {
        toast.error("Failed to delete address");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error deleting address");
    }
  };

  const getIcon = (type: string) => {
      switch (type.toLowerCase()) {
          case 'home': return <Home className="h-5 w-5 text-primary" />;
          case 'office': return <Building className="h-5 w-5 text-primary" />;
          default: return <MapPin className="h-5 w-5 text-primary" />;
      }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading addresses...</div>;

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
         <div>
             <h1 className="text-3xl font-bold tracking-tight">Address Book</h1>
             <p className="text-muted-foreground mt-1">Manage your shipping addresses for faster checkout.</p>
         </div>

         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()} className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Address
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><User className="h-3 w-3" /> Full Name / Recipient</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="e.g. John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Phone className="h-3 w-3" /> Phone Number</Label>
                            <Input
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                required
                                placeholder="e.g. +880 1234 567890"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                         <Label className="flex items-center gap-2"><MapPin className="h-3 w-3" /> Address (House, Road, Area)</Label>
                         <Input
                             value={formData.street}
                             onChange={e => setFormData({...formData, street: e.target.value})}
                             required
                             placeholder="e.g. House 12, Road 5, Block B"
                         />
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Thana / Upazila (City)</Label>
                            <Input
                                value={formData.city}
                                onChange={e => setFormData({...formData, city: e.target.value})}
                                required
                                placeholder="e.g. Dhanmondi"
                            />
                        </div>
                         <div className="space-y-2">
                            <Label>District / Zila (State)</Label>
                            <Input
                                value={formData.state}
                                onChange={e => setFormData({...formData, state: e.target.value})}
                                placeholder="e.g. Dhaka"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label>ZIP / Postal Code</Label>
                            <Input
                                value={formData.zipCode}
                                onChange={e => setFormData({...formData, zipCode: e.target.value})}
                                required
                                placeholder="e.g. 1209"
                            />
                        </div>
                        {/* Country is hidden but submitted as default 'Bangladesh' */}
                    </div>

                    <div className="space-y-3 pt-2">
                        <Label className="flex items-center gap-2"><Briefcase className="h-3 w-3" /> Address Type</Label>
                        <RadioGroup
                            value={formData.type}
                            onValueChange={(val) => setFormData({...formData, type: val})}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent has-[:checked]:bg-accent has-[:checked]:border-primary transition-all">
                                <RadioGroupItem value="Home" id="r-home" />
                                <Label htmlFor="r-home" className="cursor-pointer font-normal flex items-center gap-2">
                                    <Home className="h-4 w-4" /> Home
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent has-[:checked]:bg-accent has-[:checked]:border-primary transition-all">
                                <RadioGroupItem value="Office" id="r-office" />
                                <Label htmlFor="r-office" className="cursor-pointer font-normal flex items-center gap-2">
                                    <Building className="h-4 w-4" /> Office
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent has-[:checked]:bg-accent has-[:checked]:border-primary transition-all">
                                <RadioGroupItem value="Other" id="r-other" />
                                <Label htmlFor="r-other" className="cursor-pointer font-normal flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> Other
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="default"
                            checked={formData.isDefault}
                            onCheckedChange={(checked) => setFormData({...formData, isDefault: checked as boolean})}
                        />
                        <Label htmlFor="default" className="cursor-pointer text-sm font-medium">Set as default shipping address</Label>
                    </div>

                    <div className="flex gap-2 pt-4 border-t mt-4">
                         <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" className="ml-auto w-32">
                            {editingAddress ? "Update" : "Save"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
         </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {addresses.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/10">
                <MapPin className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No addresses yet</h3>
                <p className="text-muted-foreground mb-4 max-w-sm">
                    Add your shipping details to speed up checkout.
                </p>
                <Button onClick={() => handleOpenDialog()}>Add Your First Address</Button>
            </div>
        ) : (
            addresses.map((addr) => (
                <Card key={addr.id} className={`group relative overflow-hidden transition-all hover:shadow-md ${addr.isDefault ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : ''}`}>
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
                                {/* Country hidden in display as requested */}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">{addr.phone}</span>
                        </div>
                    </CardContent>

                    <CardFooter className="pt-3 border-t bg-background/50 flex justify-end gap-2 px-4 py-3">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenDialog(addr)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                        </Button>
                         <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(addr.id)}>
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                    </CardFooter>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}

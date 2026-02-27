"use client";

import { deleteAddressAction } from "@/actions/address";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import AddressCard from "./AddressCard";
import AddressForm from "./AddressForm";

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

interface AddressListProps {
  initialAddresses: Address[];
}

export default function AddressList({ initialAddresses }: AddressListProps) {
  const { confirm } = useConfirm();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({
      title: "Delete Address",
      message: "Are you sure you want to delete this address?",
      type: "danger"
    })) return;

    const result = await deleteAddressAction(id);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Address Book</h1>
          <p className="text-muted-foreground mt-1">Manage your shipping addresses for faster checkout.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingAddress(null);
        }}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add New Address
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl">{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
            </DialogHeader>
            <AddressForm
              address={editingAddress}
              onSuccess={() => setIsDialogOpen(false)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {initialAddresses.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl bg-muted/10">
            <MapPin className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No addresses yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm">
              Add your shipping details to speed up checkout.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>Add Your First Address</Button>
          </div>
        ) : (
          initialAddresses.map((addr) => (
            <AddressCard
                key={addr.id}
                address={addr}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </>
  );
}

"use client";

import { SupplierModal } from "@/components/inventory/SupplierModal";
import { SupplierPaymentModal } from "@/components/inventory/SupplierPaymentModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useConfirm } from "@/hooks/use-confirm";
import { SupplierService } from "@/services/supplier.service";
import { CreditCard, Edit, History, Loader2, Plus, Trash2, Truck } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function SuppliersPage() {
  const { alert, confirm } = useConfirm();
  const { data: session } = useSession();
  const token = (session as any)?.accessToken || ""; // Placeholder token logic

  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await SupplierService.getSuppliers(token);
      if (res.success) {
        setSuppliers(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch suppliers", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchSuppliers();
    }
  }, [session]);

  const handleAdd = () => {
    setEditingSupplier(null);
    setModalOpen(true);
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!await confirm({
        title: "Delete Supplier",
        message: "Are you sure you want to delete this supplier? This action cannot be undone.",
        type: "danger",
        confirmText: "Delete",
        cancelText: "Cancel"
    })) return;
    try {
        const res = await SupplierService.deleteSupplier(token, id);
        if (res.success) {
            toast.success(res.message);
            fetchSuppliers();
        } else {
            toast.error(res.message);
        }
    } catch (e) {
        toast.error("Failed to delete");
    }
  };

  if (loading && suppliers.length === 0) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-8 w-8" />
            Supplier Management
        </h1>
        <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Supplier
        </Button>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Due Balance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.length > 0 ? (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contactPerson || "-"}</TableCell>
                    <TableCell>{supplier.email || "-"}</TableCell>
                    <TableCell>{supplier.phone || "-"}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {supplier.dueBalance?.toLocaleString()} BDT
                    </TableCell>
                    <TableCell>
                        <Badge variant={supplier.isActive ? "default" : "secondary"}>
                            {supplier.isActive ? "Active" : "Inactive"}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedSupplier(supplier); setPaymentModalOpen(true); }}>
                            <CreditCard className="mr-1 h-3 w-3" /> Pay
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/suppliers/ledger/${supplier.id}`}>
                                <History className="mr-1 h-3 w-3" /> Ledger
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(supplier.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No suppliers found. Add one to get started!
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {modalOpen && (
        <SupplierModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            supplier={editingSupplier}
            token={token}
            onSuccess={fetchSuppliers}
        />
      )}

      {paymentModalOpen && (
        <SupplierPaymentModal
            open={paymentModalOpen}
            onOpenChange={setPaymentModalOpen}
            supplier={selectedSupplier}
            token={token}
            onSuccess={fetchSuppliers}
        />
      )}
    </div>
  );
}

"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface StockHistoryModalProps {
  item: {
    id: string;
    name: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  previousQty: number;
  newQty: number;
  reason: string;
  createdAt: string;
  variant?: {
    name: string;
    sku: string;
  };
}

export function StockHistoryModal({ item, isOpen, onClose }: StockHistoryModalProps) {
  const { data: session } = useSession();
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

  useEffect(() => {
    if (isOpen && session?.accessToken) {
      fetchHistory();
    }
  }, [isOpen, session]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/inventory/${item.id}/history`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setHistory(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "SALE": return "bg-blue-100 text-blue-800";
      case "PURCHASE": return "bg-green-100 text-green-800";
      case "RETURN": return "bg-purple-100 text-purple-800";
      case "DAMAGE": return "bg-red-100 text-red-800";
      case "ADJUSTMENT": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Movement History</DialogTitle>
          <DialogDescription>
            Audit log for <strong>{item.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead className="text-right">Change</TableHead>
                <TableHead className="text-right">New Stock</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No stock movements recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(record.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${getBadgeColor(record.type)}`}>
                        {record.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {record.variant ? record.variant.name : "Base Product"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={record.quantity > 0 ? "text-green-600" : "text-red-600"}>
                         {record.quantity > 0 ? `+${record.quantity}` : record.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      {record.newQty}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 truncate max-w-[200px]" title={record.reason}>
                      {record.reason}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

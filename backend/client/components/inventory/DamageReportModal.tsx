"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DamageService } from "@/services/damage.service";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface DamageReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    token: string;
    onSuccess: () => void;
}

const REASONS = [
    { value: "DAMAGED", label: "Damaged" },
    { value: "EXPIRED", label: "Expired" },
    { value: "STOLEN", label: "Stolen" },
    { value: "LOST", label: "Lost" },
    { value: "OTHER", label: "Other" },
];

export function DamageReportModal({ isOpen, onClose, product, token, onSuccess }: DamageReportModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        variantId: "",
        quantity: 1,
        reason: "DAMAGED",
        notes: ""
    });

    const handleSubmit = async () => {
        if (!formData.quantity || formData.quantity <= 0) {
            toast.error("Valid quantity is required");
            return;
        }

        setLoading(true);
        try {
            const res = await DamageService.createDamageReport(token, {
                productId: product.id,
                ...formData
            });

            if (res.success) {
                toast.success("Damage reported successfully");
                onSuccess();
                onClose();
            } else {
                toast.error(res.message || "Failed to report damage");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Report Damage / Loss</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground uppercase">Product</Label>
                        <p className="font-medium">{product?.name}</p>
                    </div>

                    {product?.variants && product.variants.length > 0 && (
                        <div className="space-y-2">
                             <Label>Select Variant</Label>
                             <Select
                                value={formData.variantId}
                                onValueChange={(val) => setFormData({...formData, variantId: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Variant" />
                                </SelectTrigger>
                                <SelectContent>
                                    {product.variants.map((v: any) => (
                                        <SelectItem key={v.id} value={v.id}>{v.name} (Stock: {v.stock})</SelectItem>
                                    ))}
                                </SelectContent>
                             </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Reason</Label>
                            <Select
                                value={formData.reason}
                                onValueChange={(val) => setFormData({...formData, reason: val})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REASONS.map(r => (
                                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea
                            placeholder="Describe how it happened..."
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Report"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

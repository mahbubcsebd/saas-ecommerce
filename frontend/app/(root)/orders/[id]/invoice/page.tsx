"use client";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { useCurrency } from "@/hooks/useCurrency";
import { Download, FileText, Globe, Loader2, Mail, MapPin, Phone, Printer } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function InvoicePage() {
    const { alert } = useConfirm();
    const { data: session } = useSession();
    const params = useParams();
    const id = params?.id as string;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { formatPrice } = useCurrency();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

    // Company Info (Mock for now, could come from API/Config)
    const companyInfo = {
        name: "Mahbub Shop",
        address: "123 eCommerce St, Dhaka, Bangladesh",
        phone: "+880 1234 567890",
        email: "support@mahbubshop.com",
        website: "www.mahbubshop.com",
        vatRegNo: "BIN-123456789", // Dummy BIN/VAT
    };

    useEffect(() => {
        if (!id || id === 'undefined') return;
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const res = await fetch(`${API_URL}/orders/${id}`); // Public/Shared route
            const data = await res.json();
            if (data.success) {
                setOrder(data.data);
            } else {
                setError(data.message || "Failed to load order");
            }
        } catch (err) {
            setError("Failed to load invoice details");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = () => {
        // Use Next.js Proxy Route to handle authentication server-side
        // This bypasses CORS and Cookie issues on the client
        console.log("handleDownloadPDF called with order:", order);
        if (!order?.id || order.id === 'undefined') {
            console.error("Order ID is invalid for download:", order?.id);
            return;
        }
        const url = `/api/proxy/invoices/${order.id}`;
        window.open(url, '_blank');
    };

    const handlePrintA4 = () => {
        window.print();
    };

    const handlePrintPOS = async () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) {
            await alert({
                title: "Popup Blocked",
                message: "Please allow popups for POS printing in your browser settings.",
                type: "warning"
            });
            return;
        }

        // Calculate Dummy Tax/VAT if missing (for demo purposes as requested)
        const subtotal = order.subtotal || 0;
        const discount = order.discountAmount || 0;
        const shipping = order.shippingCost || 0;
        const taxRate = 0.05; // 5% Dummy VAT
        const taxAmount = order.tax > 0 ? order.tax : (subtotal - discount + shipping) * taxRate;
        const total = order.total || (subtotal - discount + shipping + taxAmount);

        // Dummy Payment Details
        const cashTendered = order.tenderedAmount || Math.ceil(total / 100) * 100; // Next 100
        const changeDue = order.changeAmount !== undefined ? order.changeAmount : (cashTendered - total);

        const styles = `
            body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 10px; font-size: 12px; color: #000; }
            .header { text-align: center; margin-bottom: 10px; }
            .ShopName { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0; }
            .ShopMeta { font-size: 10px; margin: 2px 0; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .info-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px; }

            table { width: 100%; font-size: 11px; border-collapse: collapse; margin-bottom: 5px; }
            th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 4px; }
            td { padding: 4px 0; vertical-align: top; }
            .qty { width: 30px; text-align: center; }
            .price { text-align: right; width: 60px; }
            .item-name { padding-right: 5px; }

            .totals { margin-top: 5px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .grand-total { font-size: 14px; font-weight: bold; border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin: 5px 0; }

            .footer { text-align: center; font-size: 10px; margin-top: 15px; }
            .barcode { letter-spacing: 2px; font-family: 'Libre Barcode 39', cursive; font-size: 24px; margin: 10px 0; }
            /* Mock barcode using borders if font fails */
            .mock-barcode { height: 30px; background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px); margin: 10px auto; width: 80%; }
        `;

        const content = `
            <html>
                <head><title>POS Receipt</title><style>${styles}</style></head>
                <body>
                    <div class="header">
                        <p class="ShopName">${companyInfo.name}</p>
                        <p class="ShopMeta">${companyInfo.address}</p>
                        <p class="ShopMeta">Tel: ${companyInfo.phone}</p>
                        <p class="ShopMeta">VAT Reg: ${companyInfo.vatRegNo}</p>
                    </div>

                    <div class="divider"></div>

                    <div class="info-row"><span>Order #:</span> <b>${order.orderNumber}</b></div>
                    <div class="info-row"><span>Date:</span> <span>${new Date(order.createdAt).toLocaleDateString()}</span></div>
                    <div class="info-row"><span>Time:</span> <span>${new Date(order.createdAt).toLocaleTimeString()}</span></div>
                    <div class="info-row"><span>Cashier:</span> <span>${order.soldByUser ? `${order.soldByUser.firstName} ${order.soldByUser.lastName}` : 'System'}</span></div>

                    <div class="divider"></div>

                    <table>
                        <thead>
                            <tr>
                                <th class="qty">Qty</th>
                                <th class="item-name">Item</th>
                                <th class="price">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map((item: any) => `
                                <tr>
                                    <td class="qty">${item.quantity}</td>
                                    <td class="item-name">
                                        ${item.name}
                                        ${item.variant ? `<br/><small>(${item.variant.name})</small>` : ''}
                                    </td>
                                    <td class="price">${formatPrice((item.salePrice || item.price || item.unitPrice) * item.quantity)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="divider"></div>

                    <div class="totals">
                        <div class="totals-row"><span>Subtotal:</span> <span>${formatPrice(subtotal)}</span></div>
                        ${discount > 0 ? `<div class="totals-row"><span>Discount:</span> <span>-${formatPrice(discount)}</span></div>` : ''}
                        ${shipping > 0 ? `<div class="totals-row"><span>Shipping:</span> <span>${formatPrice(shipping)}</span></div>` : ''}
                        <div class="totals-row"><span>VAT (5%):</span> <span>${formatPrice(taxAmount)}</span></div>

                        <div class="totals-row grand-total">
                            <span>TOTAL:</span>
                            <span>${formatPrice(total)}</span>
                        </div>

                        <div class="totals-row"><span>Paid (Cash):</span> <span>${formatPrice(cashTendered)}</span></div>
                        <div class="totals-row"><span>Change:</span> <span>${formatPrice(changeDue)}</span></div>
                    </div>

                    <div class="footer">
                        <p>Total Items: ${order.items.reduce((acc: number, item: any) => acc + item.quantity, 0)}</p>
                        <div class="mock-barcode"></div>
                        <p>THANK YOU FOR SHOPPING!</p>
                        <p>No Return - Exchange within 7 days</p>
                        <p>${companyInfo.website}</p>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    if (loading) return <div className="flex justify-center p-20 min-h-[60vh] items-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    if (error) return <div className="p-10 text-red-500 text-center border m-10 rounded-lg">{error}</div>;
    if (!order) return null;

    return (
        <div className="container py-10 max-w-5xl mx-auto">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 no-print bg-secondary/20 p-4 rounded-lg border">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" /> Invoice #{order.orderNumber}</h1>
                    <p className="text-sm text-muted-foreground">Issued on {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="hover:bg-primary hover:text-primary-foreground">
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrintA4}>
                        <Printer className="w-4 h-4 mr-2" /> Print A4
                    </Button>
                    <Button variant="default" size="sm" onClick={handlePrintPOS}>
                        <Printer className="w-4 h-4 mr-2" /> Print POS
                    </Button>
                </div>
            </div>

            {/* A4 Invoice Preview */}
            <div className="invoice-print-area bg-white text-black p-0 md:p-12 border shadow-lg mx-auto max-w-[210mm] min-h-[297mm] relative" id="invoice-section">

                {/* Header Section */}
                <div className="flex justify-between items-start border-b-2 border-primary/20 pb-8 mb-8">
                    <div className="space-y-4">
                        <div className="h-16 w-48 bg-gray-100 flex items-center justify-center rounded text-2xl font-bold text-primary tracking-tighter">
                            {/* Logo Placeholder */}
                            MAHBUB SHOP
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                            <p className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {companyInfo.address}</p>
                            <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {companyInfo.phone}</p>
                            <p className="flex items-center gap-2"><Mail className="h-3 w-3" /> {companyInfo.email}</p>
                            <p className="flex items-center gap-2"><Globe className="h-3 w-3" /> {companyInfo.website}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-4xl font-extrabold text-primary/10 tracking-widest leading-none">INVOICE</h2>
                        <div className="mt-4 space-y-1">
                            <p className="font-semibold text-lg">#{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-500">Status: <span className="uppercase font-medium text-black bg-gray-100 px-2 py-0.5 rounded text-xs">{order.paymentStatus}</span></p>
                        </div>
                    </div>
                </div>

                {/* Addresses */}
                <div className="grid grid-cols-2 gap-12 mb-12">
                     <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Bill To</h3>
                        <div className="font-medium text-lg mb-1">
                            {order.user
                                ? `${order.user.firstName} ${order.user.lastName}`
                                : (order.walkInName || order.guestInfo?.name || 'Guest')}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                             <p>{order.user?.email || order.guestInfo?.email}</p>
                             <p>{order.user?.phone || order.guestInfo?.phone || order.walkInPhone}</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Ship To</h3>
                        <div className="font-medium text-lg mb-1">
                            {order.shippingAddress?.name || (order.user ? `${order.user.firstName} ${order.user.lastName}` : (order.walkInName || order.guestInfo?.name || 'Guest'))}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>{order.shippingAddress?.street || order.shippingAddress?.addressLine1}</p>
                            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                            <p>{order.shippingAddress?.country || 'Bangladesh'} - {order.shippingAddress?.zipCode}</p>
                            <p>{order.shippingAddress?.phone}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b-2 border-gray-100">
                                <th className="text-left py-4 font-bold text-gray-600 w-[50%]">Item Description</th>
                                <th className="text-center py-4 font-bold text-gray-600">Qty</th>
                                <th className="text-right py-4 font-bold text-gray-600">Unit Price</th>
                                <th className="text-right py-4 font-bold text-gray-600">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                             {order.items.map((item: any, i:number) => {
                                const displayImage = item.variant?.images?.[0] || item.product?.images?.[0];
                                return (
                                <tr key={item.id} className={`border-b border-gray-50 ${i % 2 === 0 ? 'bg-gray-50/50' : ''}`}>
                                    <td className="py-4 pl-4 align-top">
                                        <div className="flex gap-4">
                                            <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded border bg-muted no-print">
                                                {displayImage && (
                                                    <Image
                                                        src={displayImage}
                                                        alt={item.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{item.name}</div>
                                                {item.variant && (
                                                    <div className="text-[10px] text-primary font-medium mt-0.5">
                                                        {item.variant.name}
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-gray-500 mt-1 uppercase">SKU: {item.sku || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-center py-4 align-top">{item.quantity}</td>
                                    <td className="text-right py-4 align-top text-gray-600">
                                        {formatPrice(item.salePrice || item.price || item.unitPrice)}
                                    </td>
                                    <td className="text-right py-4 pr-4 align-top font-medium text-gray-900">
                                        {formatPrice((item.salePrice || item.price || item.unitPrice) * item.quantity)}
                                    </td>
                                </tr>
                                );
                             })}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex justify-end mb-16 px-4">
                    <div className="w-80 space-y-3">
                         <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                             <div className="flex justify-between text-sm text-green-600">
                                <span>Discount</span>
                                <span>-{formatPrice(order.discountAmount)}</span>
                            </div>
                        )}
                         <div className="flex justify-between text-sm text-gray-600">
                              <span>Shipping</span>
                              <span>{formatPrice(order.shippingCost)}</span>
                         </div>
                        {(order.tax > 0 || order.vatAmount > 0) && (
                             <div className="flex justify-between text-sm text-gray-600">
                                 <span>Tax/VAT</span>
                                 <span>{formatPrice(order.tax || order.vatAmount)}</span>
                             </div>
                        )}
                         <div className="border-t-2 border-gray-200 pt-3 mt-3 flex justify-between items-center">
                            <span className="font-bold text-lg">Total</span>
                            <span className="font-bold text-xl text-primary">{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-12 text-center text-sm text-gray-400 space-y-6">
                    <div className="grid grid-cols-2 gap-8 text-left mb-8">
                        <div>
                            <h4 className="font-bold text-xs uppercase mb-2">Terms & Conditions</h4>
                            <p className="text-xs leading-relaxed">Payment is due within 15 days. Please check the goods upon delivery. Returns accepted within 7 days with original receipt.</p>
                        </div>
                        <div className="text-right pt-8">
                           <div className="border-t w-48 ml-auto border-gray-300"></div>
                           <p className="text-xs mt-2 font-medium">Authorized Signatory</p>
                        </div>
                    </div>
                    <div className="border-t pt-6">
                        <p>Thank you for your business!</p>
                        <p className="text-xs mt-1">Computer generated invoice. No signature required.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

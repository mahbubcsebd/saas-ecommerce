import { CreditCard, Headset, ShieldCheck, Truck } from "lucide-react";

export default function TrustSignals() {
  return (
    <section className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-8 border rounded-lg bg-card shadow-sm">
        <div className="flex items-center justify-center gap-3 p-4 border-r last:border-r-0">
          <Truck className="w-8 h-8 text-primary" />
          <div>
            <h3 className="font-semibold">Free Shipping</h3>
            <p className="text-xs text-muted-foreground">On orders over $100</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-4 border-r last:border-r-0">
          <ShieldCheck className="w-8 h-8 text-primary" />
          <div>
            <h3 className="font-semibold">Secure Payment</h3>
            <p className="text-xs text-muted-foreground">100% secure payment</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-4 border-r last:border-r-0">
          <CreditCard className="w-8 h-8 text-primary" />
          <div>
            <h3 className="font-semibold">Buyer Protection</h3>
            <p className="text-xs text-muted-foreground">Money back guarantee</p>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-4">
          <Headset className="w-8 h-8 text-primary" />
          <div>
            <h3 className="font-semibold">24/7 Support</h3>
            <p className="text-xs text-muted-foreground">Dedicated support</p>
          </div>
        </div>
      </div>
    </section>
  );
}

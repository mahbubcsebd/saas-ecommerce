'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCurrency } from '@/hooks/useCurrency';

interface POSPaymentProps {
  total: number;
  paymentMethod: string;
  setPaymentMethod: (m: string) => void;
  tenderedAmount: number;
  setTenderedAmount: (a: number) => void;
  changeAmount: number;
}

export function POSPayment({
  total,
  paymentMethod,
  setPaymentMethod,
  tenderedAmount,
  setTenderedAmount,
  changeAmount,
}: POSPaymentProps) {
  const { formatPrice } = useCurrency();
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <Label className="mb-2 block">Payment Method</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={setPaymentMethod}
            className="grid grid-cols-3 gap-2"
          >
            <div>
              <RadioGroupItem value="CASH" id="cash" className="peer sr-only" />
              <Label
                htmlFor="cash"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center text-xs font-semibold"
              >
                CASH
              </Label>
            </div>
            <div>
              <RadioGroupItem value="CARD" id="card" className="peer sr-only" />
              <Label
                htmlFor="card"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center text-xs font-semibold"
              >
                CARD
              </Label>
            </div>
            <div>
              <RadioGroupItem value="BKASH" id="bkash" className="peer sr-only" />
              <Label
                htmlFor="bkash"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer text-center text-xs font-semibold"
              >
                BKASH
              </Label>
            </div>
          </RadioGroup>
        </div>

        {paymentMethod === 'CASH' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Tendered</Label>
              <Input
                type="number"
                className="bg-muted/10 font-bold text-lg"
                value={tenderedAmount}
                onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label>Change</Label>
              <div
                className={`flex items-center h-10 px-3 rounded-md border ${changeAmount < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'} font-bold`}
              >
                {formatPrice(Math.max(0, changeAmount))}
                {changeAmount < 0 && <span className="ml-2 text-xs">(Due)</span>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

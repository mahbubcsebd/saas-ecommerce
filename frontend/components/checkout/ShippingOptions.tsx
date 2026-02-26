"use client";

import { useTranslations } from "@/context/TranslationContext";
import { useCurrency } from '@/hooks/useCurrency';
import { Loader2, Truck } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface ShippingOption {
  id: string; // This will now typically be the Rate ID
  method: string;
  carrier?: string;
  cost: number;
  estimatedDays?: string;
  isFree: boolean;
  zoneId: string; // Added to track which zone this belongs to
}

interface ShippingZone {
    id: string;
    name: string;
    rates: any[]; // We'll map these to options
}

interface ShippingOptionsProps {
  cartTotal: number;
  cartWeight: number;
  onSelect: (option: ShippingOption) => void;
  selectedId?: string;
}

export function ShippingOptions({
  cartTotal,
  cartWeight,
  onSelect,
  selectedId
}: ShippingOptionsProps) {
  const { formatPrice } = useCurrency();
  const { t } = useTranslations();
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchZones = async () => {
      setLoading(true);
      setError('');

      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
        const response = await fetch(`${API_URL}/shipping/zones`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            setError(data.message || 'Failed to load shipping areas');
            return;
        }

        const validZones = data.data;
        const allOptions: ShippingOption[] = [];

        // Flatten zones and rates into selectable options
        // We will group by Zone Name in the UI potentially, or just list them "Inside Dhaka - Standard"
        validZones.forEach((zone: any) => {
            zone.rates.forEach((rate: any) => {
                // Calculate cost (reusing logic or simplified if passed pre-calculated? No, we need to calculate here or just use flat/base)
                // For now, let's assume flat rate or simple logic.
                // ideally backend calculates, but for "Area Selection" usually it's flat rate per area.
                // Let's implement simple calculation matching backend service logic strictly for display

                let cost = 0;
                if (rate.calculationType === 'FLAT') {
                    cost = rate.flatRate || 0;
                } else if (rate.calculationType === 'WEIGHT_BASED') {
                    cost = (rate.baseRate || 0) + (cartWeight * (rate.perKgRate || 0));
                } else if (rate.calculationType === 'ORDER_VALUE') {
                    if (rate.freeShippingThreshold && cartTotal >= rate.freeShippingThreshold) {
                        cost = 0;
                    } else {
                        cost = rate.flatRate || 0;
                    }
                }

                 allOptions.push({
                    id: rate.id,
                     // Combine Zone Name + Method for clarity: "Inside Dhaka - Standard Delivery"
                    method: `${zone.name}`,
                    carrier: rate.method, // Put specific method here e.g "Standard"
                    cost: cost,
                    estimatedDays: rate.estimatedDays,
                    isFree: cost === 0,
                    zoneId: zone.id
                });
            });
        });

        // setZones(validZones);
        setOptions(allOptions);

        // Auto-select first if none selected
        if (allOptions.length > 0 && !selectedId) {
             onSelect(allOptions[0]);
        }

      } catch (err) {
        setError('Failed to load shipping options');
      } finally {
        setLoading(false);
      }
    };

    fetchZones();
  }, [cartTotal, cartWeight]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-700 text-sm">
        No shipping areas available.
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
          <Truck className="h-5 w-5" /> {t('common', 'shippingArea', { defaultValue: 'Shipping Area' })}
      </h3>
      <div className="grid gap-3">
      {options.map((option) => (
        <label
          key={option.id}
          className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
            selectedId === option.id
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border hover:border-gray-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <input
              type="radio"
              name="shipping"
              checked={selectedId === option.id}
              onChange={() => onSelect(option)}
              className="w-4 h-4 text-primary focus:ring-primary"
            />
            <div>
              <div className="font-medium text-sm">
                {option.method}
              </div>
               <div className="text-xs text-muted-foreground">
                  {option.carrier} {option.estimatedDays && `(${option.estimatedDays} days)`}
               </div>
            </div>
          </div>
          <div className="font-semibold text-sm">
            {option.isFree ? (
              <span className="text-green-600 font-bold uppercase">{t('common', 'free', { defaultValue: 'FREE' })}</span>
            ) : (
              formatPrice(option.cost)
            )}
          </div>
        </label>
      ))}
      </div>
    </div>
  );
}

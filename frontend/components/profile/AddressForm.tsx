'use client';

import { saveAddressAction } from '@/actions/address';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTranslations } from '@/context/TranslationContext';
import { Briefcase, Building, Home, MapPin, Phone, User } from 'lucide-react';
import { useActionState, useEffect } from 'react';
import { toast } from 'sonner';

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

interface AddressFormProps {
  address: Partial<Address> | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddressForm({ address, onSuccess, onCancel }: AddressFormProps) {
  const { t } = useTranslations();
  const [state, formAction, isPending] = useActionState(saveAddressAction, {
    success: false,
    message: '',
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
        onSuccess();
      } else {
        toast.error(state.message);
      }
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-6 pt-4">
      <input type="hidden" name="id" value={address?.id || ''} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="h-3 w-3" />{' '}
            {t('orders', 'recipientName', { defaultValue: 'Full Name / Recipient' })}
          </Label>
          <Input
            name="name"
            defaultValue={address?.name || ''}
            required
            placeholder="e.g. John Doe"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Phone className="h-3 w-3" /> {t('common', 'phone')}
          </Label>
          <Input
            name="phone"
            defaultValue={address?.phone || ''}
            required
            placeholder="e.g. +880 1234 567890"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-3 w-3" />{' '}
          {t('orders', 'fullAddress', { defaultValue: 'Address (House, Road, Area)' })}
        </Label>
        <Input
          name="street"
          defaultValue={address?.street || ''}
          required
          placeholder="e.g. House 12, Road 5, Block B"
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('orders', 'thana', { defaultValue: 'Thana / Upazila (City)' })}</Label>
          <Input
            name="city"
            defaultValue={address?.city || ''}
            required
            placeholder="e.g. Dhanmondi"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('orders', 'district', { defaultValue: 'District / Zila (State)' })}</Label>
          <Input
            name="state"
            defaultValue={address?.state || ''}
            placeholder="e.g. Dhaka"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('orders', 'zip', { defaultValue: 'ZIP / Postal Code' })}</Label>
          <Input
            name="zipCode"
            defaultValue={address?.zipCode || ''}
            required
            placeholder="e.g. 1209"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <Label className="flex items-center gap-2">
          <Briefcase className="h-3 w-3" />{' '}
          {t('profile', 'addressType', { defaultValue: 'Address Type' })}
        </Label>
        <RadioGroup
          name="type"
          defaultValue={address?.type || 'Home'}
          className="flex gap-4"
          disabled={isPending}
        >
          <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent has-[:checked]:bg-accent has-[:checked]:border-primary transition-all">
            <RadioGroupItem value="Home" id="r-home" />
            <Label htmlFor="r-home" className="cursor-pointer font-normal flex items-center gap-2">
              <Home className="h-4 w-4" /> {t('profile', 'home')}
            </Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent has-[:checked]:bg-accent has-[:checked]:border-primary transition-all">
            <RadioGroupItem value="Office" id="r-office" />
            <Label
              htmlFor="r-office"
              className="cursor-pointer font-normal flex items-center gap-2"
            >
              <Building className="h-4 w-4" /> {t('profile', 'office')}
            </Label>
          </div>
          <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent has-[:checked]:bg-accent has-[:checked]:border-primary transition-all">
            <RadioGroupItem value="Other" id="r-other" />
            <Label htmlFor="r-other" className="cursor-pointer font-normal flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {t('profile', 'other')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="isDefault"
          name="isDefault"
          defaultChecked={address?.isDefault}
          disabled={isPending}
        />
        <Label htmlFor="isDefault" className="cursor-pointer text-sm font-medium">
          {t('profile', 'setAsDefault', { defaultValue: 'Set as default shipping address' })}
        </Label>
      </div>

      <div className="flex gap-2 pt-4 border-t mt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          {t('common', 'cancel')}
        </Button>
        <Button type="submit" className="ml-auto w-32" disabled={isPending}>
          {isPending
            ? t('common', 'saving', { defaultValue: 'Saving...' })
            : address?.id
              ? t('common', 'update')
              : t('common', 'save')}
        </Button>
      </div>
    </form>
  );
}

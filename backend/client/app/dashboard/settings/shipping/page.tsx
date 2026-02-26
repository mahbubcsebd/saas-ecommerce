import { Metadata } from 'next';
import ShippingSettingsClient from './client';

export const metadata: Metadata = {
    title: 'Shipping Settings | Dashboard',
    description: 'Manage shipping zones, rates, and packaging configuration.',
};

export default function ShippingSettingsPage() {
    return <ShippingSettingsClient />;
}

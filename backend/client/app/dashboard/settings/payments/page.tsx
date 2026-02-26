import { Metadata } from 'next';
import PaymentSettingsClient from './client';

export const metadata: Metadata = {
    title: 'Payment Gateways | Dashboard',
    description: 'Configure and manage secure payment gateways for your store.',
};

export default function PaymentSettingsPage() {
    return <PaymentSettingsClient />;
}

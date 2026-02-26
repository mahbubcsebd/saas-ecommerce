import { Metadata } from 'next';
import StoreSettingsClient from './client';

export const metadata: Metadata = {
    title: 'Store Settings | Dashboard',
    description: 'Manage business hours, store address, social links, and legal policies.',
};

export default function StoreSettingsPage() {
    return <StoreSettingsClient />;
}

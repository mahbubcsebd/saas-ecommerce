import { Metadata } from 'next';
import TaxSettingsClient from './client';

export const metadata: Metadata = {
    title: 'Tax Settings | Dashboard',
    description: 'Configure tax rates, classes, and general tax rules for your store.',
};

export default function TaxSettingsPage() {
    return <TaxSettingsClient />;
}

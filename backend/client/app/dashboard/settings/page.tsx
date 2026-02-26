import { Metadata } from 'next';
import SettingsClient from './client';

export const metadata: Metadata = {
    title: 'General Settings | Dashboard',
    description: 'Manage store identity, localization, and contact information.',
};

export default function SettingsPage() {
    return <SettingsClient />;
}

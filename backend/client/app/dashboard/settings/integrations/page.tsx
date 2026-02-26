import { Metadata } from 'next';
import IntegrationsClient from './client';

export const metadata: Metadata = {
    title: 'Integrations | Dashboard',
    description: 'Manage external analytics, pixels, and webhooks.',
};

export default function IntegrationsPage() {
    return <IntegrationsClient />;
}

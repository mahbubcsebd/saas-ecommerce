import { Metadata } from 'next';
import ActivityLogsClient from './client';

export const metadata: Metadata = {
    title: 'Activity Logs | Dashboard',
    description: 'System-wide audit trail and activity logging.',
};

export default function ActivityLogsPage() {
    return <ActivityLogsClient />;
}

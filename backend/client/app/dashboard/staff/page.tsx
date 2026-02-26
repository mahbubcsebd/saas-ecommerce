import { Metadata } from 'next';
import StaffClient from './client';

export const metadata: Metadata = {
    title: 'Team Management | Dashboard',
    description: 'Manage staff roles, permissions, and track team activity.',
};

export default function StaffPage() {
    return <StaffClient />;
}

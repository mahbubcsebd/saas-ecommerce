import { Metadata } from 'next';
import RolesClient from './client';

export const metadata: Metadata = {
    title: 'Roles & Permissions | Dashboard',
    description: 'Manage custom roles and granular permission matrices.',
};

export default function RolesPage() {
    return <RolesClient />;
}

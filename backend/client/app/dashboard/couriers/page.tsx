import CouriersClient from './client';

export const metadata = {
    title: 'Couriers | Dashboard',
    description: 'Manage shipping carriers and API integrations.',
};

export default function CouriersPage() {
    return <CouriersClient />;
}

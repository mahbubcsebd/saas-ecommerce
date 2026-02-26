import ShippingZonesClient from './client';

export const metadata = {
    title: 'Shipping Zones | Dashboard',
    description: 'Manage shipping zones and delivery rates.',
};

export default function ShippingZonesPage() {
    return <ShippingZonesClient />;
}

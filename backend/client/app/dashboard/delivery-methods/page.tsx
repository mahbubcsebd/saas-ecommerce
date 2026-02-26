import DeliveryMethodsClient from './client';

export const metadata = {
    title: 'Delivery Methods | Dashboard',
    description: 'Manage shipping methods and delivery rules globally.',
};

export default function DeliveryMethodsPage() {
    return <DeliveryMethodsClient />;
}

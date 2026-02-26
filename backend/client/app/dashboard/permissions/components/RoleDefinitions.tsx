import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hammer, ShieldAlert, ShieldCheck, ShieldEllipsis, User } from 'lucide-react';

const roles = [
  {
    name: 'Super Admin',
    icon: ShieldAlert,
    color: 'text-red-600 bg-red-50 border-red-200',
    description: 'Complete system access and control.',
    capabilities: [
      'Manage all users and staff',
      'Override any system setting',
      'Access highly sensitive logs',
      'Manage Super Admin accounts',
      'All Admin capabilities'
    ]
  },
  {
    name: 'Admin',
    icon: ShieldCheck,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: 'Full store management and administrative control.',
    capabilities: [
      'Manage products, categories, and brands',
      'Manage all orders and returns',
      'View and export customer data',
      'Manage Manager and Staff accounts',
      'View store-wide analytics'
    ]
  },
  {
    name: 'Manager',
    icon: ShieldEllipsis,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description: 'Operations management and staff oversight.',
    capabilities: [
      'Manage inventory and stock levels',
      'Process orders and fulfillment',
      'View staff activity and reports',
      'Handle customer inquiries',
      'Limited content management'
    ]
  },
  {
    name: 'Staff / Staffer',
    icon: Hammer,
    color: 'text-green-600 bg-green-50 border-green-200',
    description: 'Daily operations and point-of-sale activities.',
    capabilities: [
      'Create and manage POS orders',
      'Update order statuses (Delivery)',
      'View product inventory',
      'Create damage and loss reports',
      'Chat with customers'
    ]
  },
  {
    name: 'Customer / User',
    icon: User,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
    description: 'Standard shop users with no dashboard access.',
    capabilities: [
      'Browse and search products',
      'Place orders online',
      'Manage own profile and addresses',
      'Submit product reviews',
      'Wishlist management'
    ]
  }
];

export const RoleDefinitions = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {roles.map((role) => (
        <Card key={role.name} className="overflow-hidden border-2 transition-all hover:shadow-md">
          <CardHeader className={`pb-4 border-b ${role.color}`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <role.icon className="h-5 w-5" />
                {role.name}
              </CardTitle>
              <Badge variant="outline" className="border-current font-semibold">Hierarchy</Badge>
            </div>
            <CardDescription className="opacity-80 mt-1 font-medium italic">
              {role.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              Core Capabilities:
            </h4>
            <ul className="space-y-2">
              {role.capabilities.map((cap) => (
                <li key={cap} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-muted-foreground">{cap}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

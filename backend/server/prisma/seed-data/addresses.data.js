// Address seed data for existing users
module.exports = [
  {
    userEmail: 'user@example.com', // Will be linked to user
    type: 'Home',
    name: 'Mahbub User',
    phone: '+8801900000000',
    street: '123 Digital Road',
    city: 'Dhaka',
    state: 'Dhaka Division',
    zipCode: '1212',
    country: 'Bangladesh',
    isDefault: true
  },
  {
    userEmail: 'user@example.com',
    type: 'Office',
    name: 'Mahbub User',
    phone: '+8801900000001',
    street: '456 Tech Plaza, Floor 5',
    city: 'Dhaka',
    state: 'Dhaka Division',
    zipCode: '1215',
    country: 'Bangladesh',
    isDefault: false
  },
  {
    userEmail: 'admin@example.com',
    type: 'Home',
    name: 'System Admin',
    phone: '+8801700000000',
    street: '789 Admin Avenue',
    city: 'Dhaka',
    state: 'Dhaka Division',
    zipCode: '1210',
    country: 'Bangladesh',
    isDefault: true
  },
];

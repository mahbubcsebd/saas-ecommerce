// Discounts seed data
// Note: categoryIds and productIds will be resolved in main seed
module.exports = [
  {
    name: "Flash Sale Electronics",
    code: "TECH10",
    description: "10% Off all Electronics",
    type: "PERCENTAGE",
    applicableOn: "CATEGORY",
    value: 10,
    categorySlugs: ['electronics'], // Will be resolved to IDs
    startDate: new Date(),
    endDate: new Date('2030-12-31'),
    isActive: true
  },
  {
    name: "Launch Special",
    code: "LAUNCH50",
    description: "Flat $50 off iPhone 15 Pro Max",
    type: "FLAT",
    applicableOn: "PRODUCT",
    value: 50,
    startDate: new Date(),
    isActive: true,
    targetProductSlug: 'iphone-15-pro-max' // Will link product
  },
  {
    name: "New User Bonus",
    code: "NEWUSER",
    description: "Flat $20 Off Cart > $200",
    type: "FLAT",
    applicableOn: "CART",
    value: 20,
    minOrderValue: 200,
    startDate: new Date(),
    isActive: true
  },
  {
    name: "Fashion Week",
    code: "STYLE25",
    description: "25% Off Fashion Category",
    type: "PERCENTAGE",
    applicableOn: "CATEGORY",
    value: 25,
    categorySlugs: ['fashion'],
    startDate: new Date(),
    isActive: true
  }
];

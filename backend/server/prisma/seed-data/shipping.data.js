module.exports = [
  {
    name: "Inside Dhaka",
    countries: ["BD"],
    regions: ["Dhaka"],
    priority: 1,
    rates: [
      {
        method: "Standard Delivery",
        carrier: "Pathao / RedX",
        calculationType: "FLAT",
        flatRate: 60,
        estimatedDays: "1-2 Days",
        minOrderValue: 0
      },
      {
        method: "Express Delivery",
        carrier: "Steadfast",
        calculationType: "FLAT",
        flatRate: 120,
        estimatedDays: "Same Day",
        minOrderValue: 0
      }
    ]
  },
  {
    name: "Outside Dhaka",
    countries: ["BD"],
    regions: [], // Generic fallback for BD
    priority: 0,
    rates: [
      {
        method: "Standard Delivery",
        carrier: "Sundarban Courier",
        calculationType: "FLAT",
        flatRate: 120,
        estimatedDays: "2-4 Days",
        minOrderValue: 0
      }
    ]
  },
  {
    name: "International",
    countries: ["US", "GB", "CA"],
    priority: 0,
    rates: [
      {
        method: "International Shipping",
        carrier: "DHL",
        calculationType: "WEIGHT_BASED",
        baseRate: 2000,
        perKgRate: 1000,
        estimatedDays: "7-14 Days",
        minOrderValue: 0
      }
    ]
  }
];

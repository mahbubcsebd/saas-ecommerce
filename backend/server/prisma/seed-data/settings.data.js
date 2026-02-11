module.exports = {
  general: {
    siteName: "Mahbub's Shop",
    tagline: "Your one-stop furniture shop",
    logoUrl: "", // Add a default logo URL if available
    footerLogoUrl: "",
    maintenanceMode: false,
    defaultLanguage: "en",
    timezone: "Asia/Dhaka"
  },
  currency: {
    code: "BDT",
    symbol: "৳",
    symbolPosition: "LEFT", // Enum: LEFT
    decimalPlaces: 2
  },
  contact: {
    email: "contact@mahbubshop.com",
    phone: "+8801700000000",
    addressLine1: "123 Furniture Street",
    city: "Dhaka",
    country: "Bangladesh",
    facebook: "https://facebook.com",
    instagram: "https://instagram.com"
  },
  seo: {
    metaTitle: "Mahbub's Shop - Premium Furniture",
    metaDescription: "Best furniture in Dhaka",
    allowIndexing: true
  },
  email: {
    fromName: "Mahbub's Shop",
    fromEmail: "no-reply@mahbubshop.com",
    sendOrderConfirmation: true
  },
  appearance: {
    primaryColor: "#3b82f6",
    fontFamily: "Inter",
    showHeroBanner: true,
    showFeaturedProducts: true
  },
  payment: {
    codEnabled: true,
    codExtraCharge: 0,
    codNote: "Pay cash upon delivery."
  },
  order: {
    orderPrefix: "ORD",
    minOrderAmount: 0,
    returnPolicyDays: 7
  }
};

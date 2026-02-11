const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding languages and translations...');

  // 1. Create English Language
  const en = await prisma.language.upsert({
    where: { code: 'en' },
    update: {},
    create: {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      isDefault: true,
      isActive: true,
      isRtl: false
    }
  });
  console.log('Language created:', en);

  // 2. Add some initial translations (Namespace: common)
  const commonTranslations = [
    { key: 'addToCart', value: 'Add to Cart' },
    { key: 'buyNow', value: 'Buy Now' },
    { key: 'outOfStock', value: 'Out of Stock' },
    { key: 'search', value: 'Search products...' },
    { key: 'account', value: 'Account' },
    { key: 'cart', value: 'Cart' },
    { key: 'checkout', value: 'Checkout' },
    { key: 'login', value: 'Login' },
    { key: 'register', value: 'Register' },
    { key: 'currency', value: 'Currency' },
    { key: 'language', value: 'Language' },
    { key: 'shopByCategory', value: 'Shop by Category' },
    { key: 'newArrivals', value: 'New Arrivals' },
    { key: 'featuredProducts', value: 'Featured Products' },
    { key: 'viewAll', value: 'View All' },
    { key: 'home', value: 'Home' },
    { key: 'footerCopyright', value: '© 2026 Mahbub Shop. All rights reserved.' },
    // Footer
    { key: 'quickLinks', value: 'Quick Links' },
    { key: 'customerService', value: 'Customer Service' },
    { key: 'contactInfo', value: 'Contact Info' },
    { key: 'aboutUs', value: 'About Us' },
    { key: 'contactUs', value: 'Contact Us' },
    { key: 'myAccount', value: 'My Account' },
    { key: 'trackOrder', value: 'Track Order' },
    { key: 'privacyPolicy', value: 'Privacy Policy' },
    // Product
    { key: 'sale', value: 'SALE' },
    { key: 'noImage', value: 'No Image' },
    { key: 'variantAvailable', value: 'variant available' },
    { key: 'variantsAvailable', value: 'variants available' },
    // Cart
    { key: 'shoppingCart', value: 'Shopping Cart' },
    { key: 'cartEmpty', value: 'Your Cart is Empty' },
    { key: 'cartEmptyDesc', value: 'Looks like you haven\'t added anything yet.' },
    { key: 'continueShopping', value: 'Continue Shopping' },
    { key: 'subtotal', value: 'Subtotal' },
    { key: 'shipping', value: 'Shipping' },
    { key: 'shippingCalculated', value: 'Calculated at checkout' },
    { key: 'total', value: 'Total' },
    { key: 'proceedToCheckout', value: 'Proceed to Checkout' },
    { key: 'loadingCart', value: 'Loading cart...' },
    // Checkout
    { key: 'shippingDetails', value: 'Shipping Details' },
    { key: 'reviewDetails', value: 'Review your details' },
    { key: 'enterShippingInfo', value: 'Enter your shipping information' },
    { key: 'firstName', value: 'First Name' },
    { key: 'lastName', value: 'Last Name' },
    { key: 'email', value: 'Email' },
    { key: 'phone', value: 'Phone' },
    { key: 'address', value: 'Address' },
    { key: 'city', value: 'City' },
    { key: 'state', value: 'State' },
    { key: 'zipCode', value: 'Zip Code' },
    { key: 'placeOrder', value: 'Place Order' },
    { key: 'processing', value: 'Processing...' },
    { key: 'yourOrder', value: 'Your Order' },
    { key: 'discount', value: 'Discount' },
    { key: 'apply', value: 'Apply' }
  ];

  // 3. Create Bangla Language
  const bn = await prisma.language.upsert({
    where: { code: 'bn' },
    update: {},
    create: {
      code: 'bn',
      name: 'Bangla',
      nativeName: 'বাংলা',
      flag: '🇧🇩',
      isDefault: false,
      isActive: true,
      isRtl: false
    }
  });
  console.log('Language created:', bn);

  // 4. Add Bangla translations (Namespace: common)
  const bnTranslations = [
    { key: 'addToCart', value: 'কার্টে যোগ করুন' },
    { key: 'buyNow', value: 'এখনই কিনুন' },
    { key: 'outOfStock', value: 'স্টক শেষ' },
    { key: 'search', value: 'পণ্য খুঁজুন...' },
    { key: 'account', value: 'অ্যাকাউন্ট' },
    { key: 'cart', value: 'কার্ট' },
    { key: 'checkout', value: 'চেকআউট' },
    { key: 'login', value: 'লগইন' },
    { key: 'register', value: 'রেজিস্টার' },
    { key: 'currency', value: 'মুদ্রা' },
    { key: 'language', value: 'ভাষা' },
    { key: 'shopByCategory', value: 'ক্যাটাগরি অনুযায়ী কেনাকাটা' },
    { key: 'newArrivals', value: 'নতুন আগমন' },
    { key: 'featuredProducts', value: 'নির্বাচিত পণ্য' },
    { key: 'viewAll', value: 'সব দেখুন' },
    { key: 'home', value: 'হোম' },
    { key: 'footerCopyright', value: '© ২০২৬ মাহবুব শপ। সর্বস্বত্ব সংরক্ষিত।' },
    // Footer
    { key: 'quickLinks', value: 'দ্রুত লিঙ্ক' },
    { key: 'customerService', value: 'গ্রাহক সেবা' },
    { key: 'contactInfo', value: 'যোগাযোগ তথ্য' },
    { key: 'aboutUs', value: 'আমাদের সম্পর্কে' },
    { key: 'contactUs', value: 'যোগাযোগ করুন' },
    { key: 'myAccount', value: 'আমার অ্যাকাউন্ট' },
    { key: 'trackOrder', value: 'অর্ডার ট্র্যাক করুন' },
    { key: 'privacyPolicy', value: 'গোপনীয়তা নীতি' },
    // Product
    { key: 'sale', value: 'ছাড়' },
    { key: 'noImage', value: 'ছবি নেই' },
    { key: 'variantAvailable', value: 'ভেরিয়েন্ট উপলব্ধ' },
    { key: 'variantsAvailable', value: 'ভেরিয়েন্ট উপলব্ধ' },
    // Cart
    { key: 'shoppingCart', value: 'শপিং কার্ট' },
    { key: 'cartEmpty', value: 'আপনার কার্ট খালি' },
    { key: 'cartEmptyDesc', value: 'মনে হচ্ছে আপনি এখনও কিছু যোগ করেননি।' },
    { key: 'continueShopping', value: 'কেনাকাটা চালিয়ে যান' },
    { key: 'subtotal', value: 'উপমোট' },
    { key: 'shipping', value: 'শিপিং' },
    { key: 'shippingCalculated', value: 'চেকআউটে হিসাব করা হবে' },
    { key: 'total', value: 'মোট' },
    { key: 'proceedToCheckout', value: 'চেকআউটে যান' },
    { key: 'loadingCart', value: 'কার্ট লোড হচ্ছে...' },
    // Checkout
    { key: 'shippingDetails', value: 'শিপিং বিস্তারিত' },
    { key: 'reviewDetails', value: 'আপনার তথ্য পর্যালোচনা করুন' },
    { key: 'enterShippingInfo', value: 'আপনার শিপিং তথ্য দিন' },
    { key: 'firstName', value: 'নামের প্রথম অংশ' },
    { key: 'lastName', value: 'নামের শেষ অংশ' },
    { key: 'email', value: 'ইমেল' },
    { key: 'phone', value: 'ফোন number' },
    { key: 'address', value: 'ঠিকানা' },
    { key: 'city', value: 'শহর' },
    { key: 'state', value: 'রাজ্য/বিভাগ' },
    { key: 'zipCode', value: 'জিপ কোড' },
    { key: 'placeOrder', value: 'অর্ডার করুন' },
    { key: 'processing', value: 'প্রক্রিয়াকরণ হচ্ছে...' },
    { key: 'yourOrder', value: 'আপনার অর্ডার' },
    { key: 'discount', value: 'ছাড়' },
    { key: 'apply', value: 'প্রয়োগ করুন' }
  ];

  for (const t of bnTranslations) {
    await prisma.uiTranslation.upsert({
      where: {
        langCode_namespace_key: {
            langCode: 'bn',
            namespace: 'common',
            key: t.key
        }
      },
      update: { value: t.value },
      create: {
        langCode: 'bn',
        namespace: 'common',
        key: t.key,
        value: t.value,
        isReviewed: true
      }
    });
  }
  console.log(`Seeded ${bnTranslations.length} translations for 'bn' - common.`);

  for (const t of commonTranslations) {
    await prisma.uiTranslation.upsert({
      where: {
        langCode_namespace_key: {
            langCode: 'en',
            namespace: 'common',
            key: t.key
        }
      },
      update: { value: t.value },
      create: {
        langCode: 'en',
        namespace: 'common',
        key: t.key,
        value: t.value,
        isReviewed: true
      }
    });
  }

  console.log(`Seeded ${commonTranslations.length} translations for 'common' namespace.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

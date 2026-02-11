// Categories seed data with hierarchical structure
module.exports = [
  {
    name: 'Electronics', slug: 'electronics', icon: 'Cpu', isHomeShown: true, order: 1,
    children: [
      { name: 'Smartphones', slug: 'smartphones', icon: 'Smartphone' },
      { name: 'Laptops', slug: 'laptops', icon: 'Laptop' },
      { name: 'Headphones', slug: 'headphones', icon: 'Headphones' },
      { name: 'Cameras', slug: 'cameras', icon: 'Camera' }
    ]
  },
  {
    name: 'Fashion', slug: 'fashion', icon: 'Shirt', isHomeShown: true, order: 2,
    children: [
      { name: 'Men', slug: 'men-fashion', icon: 'User' },
      { name: 'Women', slug: 'women-fashion', icon: 'UserCheck' },
      { name: 'Kids', slug: 'kids-fashion', icon: 'Baby' },
      { name: 'Shoes', slug: 'shoes', icon: 'Footprints' }
    ]
  },
  {
    name: 'Home & Living', slug: 'home-living', icon: 'Home', isHomeShown: true, order: 3,
    children: [
      { name: 'Furniture', slug: 'furniture', icon: 'Armchair' },
      { name: 'Decor', slug: 'home-decor', icon: 'Image' },
      { name: 'Kitchen', slug: 'kitchen', icon: 'Utensils' }
    ]
  },
  {
    name: 'Sports', slug: 'sports', icon: 'Dumbbell', isHomeShown: false, order: 4,
    children: [
      { name: 'Gym Equipment', slug: 'gym-equipment', icon: 'Dumbbell' },
      { name: 'Jerseys', slug: 'jerseys', icon: 'Shirt' }
    ]
  }
];

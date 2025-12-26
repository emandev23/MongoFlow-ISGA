export interface SeedCollection {
  name: string;
  documents: any[];
}

// Helper to generate ObjectId-like strings
function generateObjectId(): string {
  const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
  const objectId = timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
    return Math.floor(Math.random() * 16).toString(16);
  }).toLowerCase();
  return objectId;
}

export function generateSeedData(): SeedCollection[] {
  const now = new Date();
  
  // Users collection
  const users = Array.from({ length: 150 }, (_, i) => ({
    _id: generateObjectId(),
    email: `user${i + 1}@example.com`,
    firstName: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'][i % 8],
    lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][i % 8],
    age: 20 + (i % 50),
    isActive: i % 10 !== 0,
    role: ['customer', 'admin', 'moderator', 'customer', 'customer'][i % 5],
    createdAt: new Date(now.getTime() - (i * 86400000)),
    lastLogin: new Date(now.getTime() - ((i % 30) * 3600000)),
    address: {
      street: `${100 + i} Main St`,
      city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
      state: ['NY', 'CA', 'IL', 'TX', 'AZ'][i % 5],
      zipCode: 10000 + i,
      country: 'USA',
    },
    preferences: {
      theme: ['light', 'dark'][i % 2],
      notifications: i % 3 !== 0,
      language: ['en', 'es', 'fr'][i % 3],
    },
    tags: Array.from({ length: (i % 5) + 1 }, (_, j) => 
      ['premium', 'verified', 'vip', 'beta', 'trial'][j % 5]
    ),
    metadata: {
      source: ['web', 'mobile', 'api'][i % 3],
      version: 1 + (i % 3),
      campaign: i % 10 === 0 ? 'summer2024' : null,
    },
    balance: parseFloat((Math.random() * 10000).toFixed(2)),
    ordersCount: i % 20,
  }));

  // Products collection
  const products = Array.from({ length: 200 }, (_, i) => ({
    _id: generateObjectId(),
    name: [
      'Laptop Pro 15"', 'Wireless Mouse', 'Mechanical Keyboard', 'USB-C Hub',
      'Monitor 27"', 'Webcam HD', 'Headphones Wireless', 'Tablet 10"',
      'Smartphone Case', 'Laptop Stand', 'Desk Mat', 'Cable Organizer',
      'Power Bank', 'USB Drive 256GB', 'SD Card 128GB', 'HDMI Cable',
      'Ethernet Cable', 'USB-C Cable', 'Wireless Charger', 'Phone Stand',
    ][i % 20] + (i > 19 ? ` ${Math.floor(i / 20) + 1}` : ''),
    sku: `SKU-${String(i + 1).padStart(6, '0')}`,
    price: parseFloat((Math.random() * 2000 + 10).toFixed(2)),
    cost: parseFloat((Math.random() * 1000 + 5).toFixed(2)),
    category: ['Electronics', 'Accessories', 'Computers', 'Peripherals', 'Storage'][i % 5],
    subcategory: [
      'Laptops', 'Mice', 'Keyboards', 'Hubs', 'Monitors',
      'Cameras', 'Audio', 'Tablets', 'Cases', 'Stands',
    ][i % 10],
    inStock: i % 10 !== 0,
    quantity: Math.floor(Math.random() * 500),
    reorderLevel: 50,
    brand: ['TechCorp', 'GadgetPro', 'ElectroMax', 'DigitalPlus', 'SmartTech'][i % 5],
    description: `High-quality ${['Laptop Pro 15"', 'Wireless Mouse', 'Mechanical Keyboard'][i % 3]} with advanced features.`,
    specifications: {
      weight: `${(Math.random() * 5 + 0.1).toFixed(2)} kg`,
      dimensions: `${Math.floor(Math.random() * 50 + 10)}x${Math.floor(Math.random() * 30 + 5)}x${Math.floor(Math.random() * 10 + 2)} cm`,
      color: ['Black', 'White', 'Silver', 'Blue', 'Red'][i % 5],
      warranty: `${1 + (i % 3)} years`,
    },
    ratings: {
      average: parseFloat((Math.random() * 2 + 3).toFixed(1)),
      count: Math.floor(Math.random() * 500),
    },
    tags: Array.from({ length: (i % 4) + 1 }, (_, j) => 
      ['bestseller', 'new', 'sale', 'premium', 'featured'][j % 5]
    ),
    createdAt: new Date(now.getTime() - (i * 172800000)),
    updatedAt: new Date(now.getTime() - ((i % 30) * 86400000)),
    supplier: {
      name: `Supplier ${String.fromCharCode(65 + (i % 26))}`,
      contact: `supplier${i + 1}@example.com`,
    },
  }));

  // Orders collection
  const orders = Array.from({ length: 500 }, (_, i) => {
    const userId = users[Math.floor(Math.random() * users.length)]._id;
    const itemCount = Math.floor(Math.random() * 5) + 1;
    const items = Array.from({ length: itemCount }, () => {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      return {
        productId: product._id,
        productName: product.name,
        quantity,
        price: product.price,
        subtotal: parseFloat((product.price * quantity).toFixed(2)),
      };
    });
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = parseFloat((subtotal * 0.08).toFixed(2));
    const shipping = subtotal > 100 ? 0 : 9.99;
    const total = parseFloat((subtotal + tax + shipping).toFixed(2));
    
    return {
      _id: generateObjectId(),
      orderNumber: `ORD-${String(i + 1).padStart(8, '0')}`,
      userId,
      items,
      subtotal,
      tax,
      shipping,
      total,
      status: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'][i % 5],
      paymentMethod: ['credit_card', 'paypal', 'bank_transfer', 'cash'][i % 4],
      paymentStatus: ['pending', 'paid', 'failed', 'refunded'][i % 4],
      shipping: {
        address: {
          street: `${100 + i} Main St`,
          city: ['New York', 'Los Angeles', 'Chicago'][i % 3],
          state: ['NY', 'CA', 'IL'][i % 3],
          zipCode: 10000 + i,
          country: 'USA',
        },
        method: ['standard', 'express', 'overnight'][i % 3],
        cost: shipping,
        trackingNumber: i % 3 === 0 ? `TRACK-${String(i + 1).padStart(10, '0')}` : null,
      },
      createdAt: new Date(now.getTime() - (i * 3600000)),
      updatedAt: new Date(now.getTime() - ((i % 24) * 3600000)),
      notes: i % 10 === 0 ? 'Gift wrapping requested' : null,
    };
  });

  // Events collection (analytics)
  const events = Array.from({ length: 1000 }, (_, i) => ({
    _id: new ObjectId(),
    eventType: ['page_view', 'click', 'purchase', 'signup', 'login', 'logout', 'search', 'add_to_cart'][i % 8],
    userId: users[Math.floor(Math.random() * users.length)]._id,
    sessionId: `sess_${String(Math.floor(i / 10) + 1).padStart(8, '0')}`,
    timestamp: new Date(now.getTime() - (i * 60000)),
    properties: {
      page: ['/home', '/products', '/cart', '/checkout', '/profile', '/settings'][i % 6],
      referrer: i % 3 === 0 ? 'https://google.com' : 'direct',
      userAgent: ['Chrome', 'Firefox', 'Safari', 'Edge'][i % 4],
      device: ['desktop', 'mobile', 'tablet'][i % 3],
      browser: ['Chrome', 'Firefox', 'Safari'][i % 3],
      os: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'][i % 5],
    },
    metadata: {
      campaign: i % 20 === 0 ? 'summer2024' : null,
      source: ['organic', 'paid', 'social', 'email'][i % 4],
      medium: ['search', 'cpc', 'social', 'email', 'direct'][i % 5],
    },
    value: i % 10 === 0 ? parseFloat((Math.random() * 1000).toFixed(2)) : null,
  }));

  // Sessions collection
  const sessions = Array.from({ length: 300 }, (_, i) => {
    const userId = users[Math.floor(Math.random() * users.length)]._id;
    const duration = Math.floor(Math.random() * 7200) + 60;
    const eventCount = Math.floor(Math.random() * 20) + 1;
    
    return {
      _id: generateObjectId(),
      sessionId: `sess_${String(i + 1).padStart(8, '0')}`,
      userId,
      startTime: new Date(now.getTime() - (i * 1800000)),
      endTime: new Date(now.getTime() - (i * 1800000) + (duration * 1000)),
      duration,
      eventCount,
      pageViews: eventCount,
      device: ['desktop', 'mobile', 'tablet'][i % 3],
      browser: ['Chrome', 'Firefox', 'Safari', 'Edge'][i % 4],
      os: ['Windows', 'macOS', 'Linux', 'iOS', 'Android'][i % 5],
      location: {
        country: ['USA', 'Canada', 'UK', 'Germany', 'France'][i % 5],
        city: ['New York', 'Toronto', 'London', 'Berlin', 'Paris'][i % 5],
        timezone: ['America/New_York', 'America/Toronto', 'Europe/London', 'Europe/Berlin', 'Europe/Paris'][i % 5],
      },
      referrer: i % 3 === 0 ? 'https://google.com' : 'direct',
      isActive: i % 10 === 0,
      conversion: i % 20 === 0,
      revenue: i % 20 === 0 ? parseFloat((Math.random() * 500).toFixed(2)) : 0,
    };
  });

  // Reviews collection
  const reviews = Array.from({ length: 400 }, (_, i) => {
    const product = products[Math.floor(Math.random() * products.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    
    return {
      _id: generateObjectId(),
      productId: product._id,
      userId: user._id,
      rating: Math.floor(Math.random() * 5) + 1,
      title: [
        'Great product!', 'Highly recommend', 'Good value', 'Not bad', 'Could be better',
        'Excellent quality', 'Fast shipping', 'As described', 'Disappointed', 'Love it!',
      ][i % 10],
      comment: `This is a ${['great', 'good', 'average', 'poor'][i % 4]} product. ${i % 2 === 0 ? 'I would definitely recommend it to others.' : 'It meets my expectations.'}`,
      verified: i % 3 !== 0,
      helpful: Math.floor(Math.random() * 50),
      createdAt: new Date(now.getTime() - (i * 86400000)),
      images: i % 5 === 0 ? [`image_${i + 1}.jpg`] : [],
    };
  });

  // Categories collection
  const categories = [
    { _id: generateObjectId(), name: 'Electronics', slug: 'electronics', parent: null, description: 'Electronic devices and gadgets' },
    { _id: generateObjectId(), name: 'Computers', slug: 'computers', parent: 'Electronics', description: 'Computers and laptops' },
    { _id: generateObjectId(), name: 'Accessories', slug: 'accessories', parent: null, description: 'Computer and phone accessories' },
    { _id: generateObjectId(), name: 'Peripherals', slug: 'peripherals', parent: 'Electronics', description: 'Computer peripherals' },
    { _id: generateObjectId(), name: 'Storage', slug: 'storage', parent: 'Electronics', description: 'Storage devices' },
  ];

  return [
    { name: 'users', documents: users },
    { name: 'products', documents: products },
    { name: 'orders', documents: orders },
    { name: 'events', documents: events },
    { name: 'sessions', documents: sessions },
    { name: 'reviews', documents: reviews },
    { name: 'categories', documents: categories },
  ];
}


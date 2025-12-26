import { Database, Document } from '@/types/pipeline';

export function mockDatabases(): Database[] {
  return [
    {
      name: 'ecommerce',
      collections: [
        { name: 'users', documentCount: 1250 },
        { name: 'products', documentCount: 3420 },
        { name: 'orders', documentCount: 8900 },
      ],
    },
    {
      name: 'analytics',
      collections: [
        { name: 'events', documentCount: 50000 },
        { name: 'sessions', documentCount: 12000 },
      ],
    },
    {
      name: 'test',
      collections: [
        { name: 'sample', documentCount: 5 },
      ],
    },
  ];
}

export function mockDocuments(collectionName: string): Document[] {
  const mockData: Record<string, Document[]> = {
    users: [
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'John Doe',
        email: 'john.doe@example.com',
        age: 32,
        isActive: true,
        createdAt: new Date('2024-01-15').toISOString(),
        address: {
          street: '123 Main St',
          city: 'New York',
          zipCode: 10001,
          country: 'USA',
        },
        tags: ['premium', 'verified'],
        metadata: {
          source: 'web',
          version: 1,
        },
      },
      {
        _id: '507f1f77bcf86cd799439012',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        age: 28,
        isActive: true,
        createdAt: new Date('2024-02-20').toISOString(),
        address: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          zipCode: 90001,
          country: 'USA',
        },
        tags: ['standard'],
        metadata: {
          source: 'mobile',
          version: 2,
        },
      },
    ],
    products: [
      {
        _id: '507f1f77bcf86cd799439013',
        name: 'Laptop Pro',
        price: 1299.99,
        category: 'Electronics',
        inStock: true,
        quantity: 45,
        createdAt: new Date('2024-01-10').toISOString(),
        specifications: {
          cpu: 'Intel i7',
          ram: '16GB',
          storage: '512GB SSD',
        },
      },
      {
        _id: '507f1f77bcf86cd799439014',
        name: 'Wireless Mouse',
        price: 29.99,
        category: 'Accessories',
        inStock: true,
        quantity: 200,
        createdAt: new Date('2024-01-12').toISOString(),
        specifications: {
          connectivity: 'Bluetooth',
          battery: 'Rechargeable',
        },
      },
    ],
    orders: [
      {
        _id: '507f1f77bcf86cd799439015',
        userId: '507f1f77bcf86cd799439011',
        items: [
          { productId: '507f1f77bcf86cd799439013', quantity: 1, price: 1299.99 },
        ],
        total: 1299.99,
        status: 'completed',
        createdAt: new Date('2024-03-01').toISOString(),
        shipping: {
          address: '123 Main St',
          method: 'express',
          cost: 15.99,
        },
      },
    ],
    sample: [
      {
        _id: '507f1f77bcf86cd799439016',
        title: 'Sample Document',
        description: 'This is a sample document',
        value: 42,
        active: true,
      },
    ],
    events: [
      {
        _id: '507f1f77bcf86cd799439017',
        type: 'click',
        timestamp: new Date().toISOString(),
        userId: '507f1f77bcf86cd799439011',
        properties: {
          page: '/home',
          element: 'button',
        },
      },
    ],
    sessions: [
      {
        _id: '507f1f77bcf86cd799439018',
        sessionId: 'sess_123',
        userId: '507f1f77bcf86cd799439011',
        startTime: new Date().toISOString(),
        duration: 3600,
        events: ['page_view', 'click', 'purchase'],
      },
    ],
  };

  return mockData[collectionName] || [];
}


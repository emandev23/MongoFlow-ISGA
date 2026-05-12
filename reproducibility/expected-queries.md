# Expected MongoDB Queries

This file provides the reference query used to reproduce the advanced e-commerce aggregation example.

## Objective

Identify the top five product categories by total inventory value.

The aggregation should:

1. Keep products with valid price, quantity, and category values.
2. Group products by category.
3. Compute:
    - number of products;
    - total units in stock;
    - average price;
    - highest price;
    - total inventory value.
4. Keep only categories with at least two products and total inventory value greater than or equal to 1000.
5. Project a readable result.
6. Sort by total inventory value.
7. Return the top five categories.

## Reference MongoDB Shell Query

```javascript
db.products.aggregate([
  {
    $match: {
      price: { $gte: 20 },
      quantity: { $gt: 0 },
      category: { $exists: true, $ne: null }
    }
  },
  {
    $group: {
      _id: "$category",
      numberOfProducts: { $sum: 1 },
      totalUnitsInStock: { $sum: "$quantity" },
      averagePrice: { $avg: "$price" },
      highestPrice: { $max: "$price" },
      totalInventoryValue: {
        $sum: {
          $multiply: ["$price", "$quantity"]
        }
      }
    }
  },
  {
    $match: {
      numberOfProducts: { $gte: 2 },
      totalInventoryValue: { $gte: 1000 }
    }
  },
  {
    $project: {
      _id: 0,
      category: "$_id",
      numberOfProducts: 1,
      totalUnitsInStock: 1,
      averagePrice: 1,
      highestPrice: 1,
      totalInventoryValue: 1
    }
  },
  {
    $sort: {
      totalInventoryValue: -1,
      averagePrice: -1
    }
  },
  {
    $limit: 5
  }
]);
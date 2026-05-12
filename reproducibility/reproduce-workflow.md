# Reproducing the MongoFlow Demonstration Workflow

This document describes the steps required to reproduce the advanced e-commerce aggregation example used in the revised paper.

## 1. Start MongoDB

From the `reproducibility` folder, run:

```bash
docker compose up -d
```

This starts a local MongoDB instance on: `mongodb://127.0.0.1:27017`

## 2. Import the sample dataset
Run the following command from the `reproducibility` folder:
```bash
docker exec -i mongoflow-repro-mongodb mongoimport \
  --db ecommerce \
  --collection products \
  --drop \
  --jsonArray < sample-data/products.json
```

The dataset will be imported into:
```
Database: ecommerce
Collection: products
```

## 3. Start MongoFlow
Return to the project root:
```bash
cd ..
npm install
npm run dev
```

Open MongoFlow: `http://localhost:3000`

## 4. Connect MongoFlow to MongoDB
Use the following connection string: `mongodb://127.0.0.1:27017`

After connection, select:
```
Database: ecommerce
Collection: products
```

## 5. Inspect the documents
Open the document browsing view.

Confirm that the collection contains product documents with fields such as:
```
name
category
brand
price
quantity
rating
```

## 6. Inspect the schema
Open the schema view.

The schema should show fields similar to:
```
name: String
category: String
brand: String
price: Number
quantity: Number
rating: Number
```

## 7. Build the aggregation pipeline
Create the following pipeline using the visual aggregation builder.

The objective is to identify the top five product categories by total inventory value.

Inventory value is computed inside the $group stage using: `price × quantity`
The pipeline stages are:
```
$match
$group
$match
$project
$sort
$limit
```

## 8. Execute the query
Run the generated aggregation query.

The result should show the top five product categories ranked by `totalInventoryValue`.

## 9. Compare with expected output
Compare the result with the output provided in: `expected-results.md`
Minor differences in numeric formatting may occur depending on the MongoDB client.

## 10. Optional AI-assisted reproduction

If a Gemini API key is configured, open the AI assistant and use the following prompt:
```
Generate a MongoDB aggregation pipeline for the products collection. I want to identify the top five product categories by total inventory value. Use price and quantity to compute inventory value inside the aggregation. Filter products with price greater than or equal to 20, quantity greater than 0, and a valid category. Group by category and return the number of products, total units in stock, average price, highest price, and total inventory value. Keep only categories with at least two products and total inventory value greater than or equal to 1000. Sort by total inventory value in descending order and limit the result to five categories.
```

Review the generated query before execution.
# Here is a JSON representation example of the query:

```json
[
  {
    "stage": "$match",
    "field": "category",
    "operator": "$eq",
    "value": "Electronics"
  },
  {
    "stage": "$sort",
    "field": "price",
    "direction": -1
  }
]
```
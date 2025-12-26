export type QueryOperator = 
  | '$eq' 
  | '$ne' 
  | '$gt' 
  | '$gte' 
  | '$lt' 
  | '$lte' 
  | '$in' 
  | '$nin' 
  | '$exists' 
  | '$regex' 
  | '$and' 
  | '$or' 
  | '$nor' 
  | '$not' 
  | '$size' 
  | '$all' 
  | '$elemMatch';

export interface QueryCondition {
  id: string;
  field: string;
  operator: QueryOperator;
  value: any;
  valueType?: string;
  logicalOperator?: 'AND' | 'OR';
}

export interface QueryGroup {
  id: string;
  conditions: QueryCondition[];
  logicalOperator: 'AND' | 'OR';
  groups?: QueryGroup[];
}

export interface VisualQuery {
  id: string;
  name: string;
  query: QueryGroup;
  projection?: Record<string, number>;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
}


import { VisualQuery, QueryGroup, QueryCondition } from '@/types/query';

export function generateQueryJSON(query: VisualQuery): Record<string, any> {
  return buildQueryFromGroup(query.query);
}

function buildQueryFromGroup(group: QueryGroup): Record<string, any> {
  const conditions = group.conditions.map(buildCondition);
  const nestedGroups = group.groups?.map(buildQueryFromGroup) || [];
  
  if (conditions.length === 0 && nestedGroups.length === 0) {
    return {};
  }
  
  if (nestedGroups.length > 0) {
    if (group.logicalOperator === 'AND') {
      return { $and: [...conditions, ...nestedGroups] };
    } else {
      return { $or: [...conditions, ...nestedGroups] };
    }
  }
  
  if (conditions.length === 1) {
    return conditions[0];
  }
  
  // Merge conditions
  const merged: Record<string, any> = {};
  conditions.forEach((cond) => {
    Object.assign(merged, cond);
  });
  
  return merged;
}

function buildCondition(condition: QueryCondition): Record<string, any> {
  const { field, operator, value } = condition;
  
  if (operator === '$eq') {
    return { [field]: parseValue(value, condition.valueType) };
  }
  
  if (operator === '$exists') {
    return { [field]: { $exists: value === true || value === 'true' } };
  }
  
  if (operator === '$regex') {
    return { [field]: { $regex: value, $options: 'i' } };
  }
  
  if (operator === '$in' || operator === '$nin') {
    const values = Array.isArray(value) ? value : value.split(',').map((v: string) => v.trim());
    return { [field]: { [operator]: values.map((v: any) => parseValue(v, condition.valueType)) } };
  }
  
  return { [field]: { [operator]: parseValue(value, condition.valueType) } };
}

function parseValue(value: any, type?: string): any {
  if (type === 'Number') {
    return parseFloat(value) || 0;
  }
  if (type === 'Boolean') {
    return value === 'true' || value === true;
  }
  if (type === 'Date') {
    return new Date(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => parseValue(v, type));
  }
  return value;
}

export function generateNodeJSQuery(query: VisualQuery, collectionName: string = 'collection'): string {
  const queryObj = generateQueryJSON(query);
  const queryStr = JSON.stringify(queryObj, null, 2);
  
  let code = `await db.${collectionName}.find(${queryStr})`;
  
  if (query.sort) {
    code += `.sort(${JSON.stringify(query.sort)})`;
  }
  if (query.skip) {
    code += `.skip(${query.skip})`;
  }
  if (query.limit) {
    code += `.limit(${query.limit})`;
  }
  
  code += `.toArray();`;
  
  return code;
}

export function generatePythonQuery(query: VisualQuery, collectionName: string = 'collection'): string {
  const queryObj = generateQueryJSON(query);
  const queryStr = JSON.stringify(queryObj, null, 2).replace(/"/g, "'");
  
  let code = `${collectionName}.find(${queryStr})`;
  
  if (query.sort) {
    code += `.sort(${JSON.stringify(query.sort).replace(/"/g, "'")})`;
  }
  if (query.skip) {
    code += `.skip(${query.skip})`;
  }
  if (query.limit) {
    code += `.limit(${query.limit})`;
  }
  
  code = `list(${code})`;
  
  return code;
}

export function generateShellQuery(query: VisualQuery, collectionName: string = 'collection'): string {
  const queryObj = generateQueryJSON(query);
  const queryStr = JSON.stringify(queryObj, null, 2);
  
  let code = `db.${collectionName}.find(${queryStr})`;
  
  if (query.sort) {
    code += `.sort(${JSON.stringify(query.sort)})`;
  }
  if (query.skip) {
    code += `.skip(${query.skip})`;
  }
  if (query.limit) {
    code += `.limit(${query.limit})`;
  }
  
  return code;
}


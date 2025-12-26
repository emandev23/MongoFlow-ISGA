import { PipelineStage } from '@/types/pipeline';

export function generateNodeJSCode(stages: PipelineStage[], collectionName: string = 'collection'): string {
  if (stages.length === 0) {
    return `// No stages defined\nawait db.${collectionName}.find({}).toArray();`;
  }

  const stageCode = stages.map(stage => generateStageCode(stage, 'nodejs')).join(',\n    ');
  return `await db.${collectionName}.aggregate([\n    ${stageCode}\n]).toArray();`;
}

export function generatePythonCode(stages: PipelineStage[], collectionName: string = 'collection'): string {
  if (stages.length === 0) {
    return `# No stages defined\nlist(${collectionName}.find({}))`;
  }

  const stageCode = stages.map(stage => generateStageCode(stage, 'python')).join(',\n    ');
  return `list(${collectionName}.aggregate([\n    ${stageCode}\n]))`;
}

export function generateShellCode(stages: PipelineStage[], collectionName: string = 'collection'): string {
  if (stages.length === 0) {
    return `db.${collectionName}.find({})`;
  }

  const stageCode = stages.map(stage => generateStageCode(stage, 'shell')).join(',\n  ');
  return `db.${collectionName}.aggregate([\n  ${stageCode}\n])`;
}

function generateStageCode(stage: PipelineStage, language: 'nodejs' | 'python' | 'shell'): string {
  const { type, config } = stage;
  
  switch (type) {
    case '$match':
      return generateMatchStage(config, language);
    case '$group':
      return generateGroupStage(config, language);
    case '$sort':
      return generateSortStage(config, language);
    case '$limit':
      return generateLimitStage(config, language);
    case '$skip':
      return generateSkipStage(config, language);
    case '$project':
      return generateProjectStage(config, language);
    case '$unwind':
      return generateUnwindStage(config, language);
    case '$lookup':
      return generateLookupStage(config, language);
    case '$addFields':
      return generateAddFieldsStage(config, language);
    case '$count':
      return generateCountStage(config, language);
    default:
      return `{ ${type}: {} }`;
  }
}

function generateMatchStage(config: any, language: string): string {
  const conditions = config.conditions || [];
  if (conditions.length === 0) return '{ $match: {} }';
  
  const matchObj: Record<string, any> = {};
  conditions.forEach((cond: any) => {
    if (!matchObj[cond.field]) {
      matchObj[cond.field] = {};
    }
    matchObj[cond.field][cond.operator] = parseValue(cond.value, cond.valueType);
  });
  
  return `{ $match: ${JSON.stringify(matchObj, null, 2).replace(/\n/g, '\n    ')} }`;
}

function generateGroupStage(config: any, language: string): string {
  const groupObj: Record<string, any> = {
    _id: config._id || null,
    ...config.fields,
  };
  return `{ $group: ${JSON.stringify(groupObj, null, 2).replace(/\n/g, '\n    ')} }`;
}

function generateSortStage(config: any, language: string): string {
  const sortObj: Record<string, number> = {};
  (config.fields || []).forEach((field: any) => {
    sortObj[field.name] = field.direction === 'asc' ? 1 : -1;
  });
  if (Object.keys(sortObj).length === 0) return '{ $sort: {} }';
  return `{ $sort: ${JSON.stringify(sortObj)} }`;
}

function generateLimitStage(config: any, language: string): string {
  return `{ $limit: ${config.limit || 10} }`;
}

function generateSkipStage(config: any, language: string): string {
  return `{ $skip: ${config.skip || 0} }`;
}

function generateProjectStage(config: any, language: string): string {
  return `{ $project: ${JSON.stringify(config.fields || {}, null, 2).replace(/\n/g, '\n    ')} }`;
}

function generateUnwindStage(config: any, language: string): string {
  return `{ $unwind: "${config.path || ''}" }`;
}

function generateLookupStage(config: any, language: string): string {
  return `{ $lookup: { from: "${config.from || ''}", localField: "${config.localField || ''}", foreignField: "${config.foreignField || ''}", as: "${config.as || ''}" } }`;
}

function generateAddFieldsStage(config: any, language: string): string {
  return `{ $addFields: ${JSON.stringify(config.fields || {}, null, 2).replace(/\n/g, '\n    ')} }`;
}

function generateCountStage(config: any, language: string): string {
  return `{ $count: "${config.field || 'count'}" }`;
}

function parseValue(value: string, type: string): any {
  if (type === 'Number') {
    return parseFloat(value) || 0;
  }
  if (type === 'Boolean') {
    return value === 'true';
  }
  if (type === 'Date') {
    return new Date(value);
  }
  return value;
}



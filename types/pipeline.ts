export type FieldType = 'String' | 'Number' | 'Date' | 'Boolean' | 'Object' | 'Array' | 'ObjectId' | 'Mixed';

export interface SchemaField {
  name: string;
  type: FieldType;
  path: string;
  children?: SchemaField[];
}

export type StageType = '$match' | '$group' | '$sort' | '$limit' | '$skip' | '$project' | '$unwind' | '$lookup' | '$addFields' | '$count';

export interface PipelineStage {
  id: string;
  type: StageType;
  config: Record<string, any>;
}

export interface QueryHistory {
  id: string;
  timestamp: Date;
  pipeline: PipelineStage[];
  code: {
    nodejs: string;
    python: string;
    shell: string;
  };
}

export interface ExecutionStats {
  executionTime: number;
  documentsScanned: number;
  indexUsed: boolean;
  documentsReturned: number;
}

export interface Database {
  name: string;
  collections: Collection[];
}

export interface Collection {
  name: string;
  documentCount: number;
}

export interface Document {
  _id: string;
  [key: string]: any;
}



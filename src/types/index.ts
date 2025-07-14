export interface Column {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  unique: boolean;
  isList?: boolean;
}

export interface TableSchema {
  id: string;
  name: string;
  columns: Column[];
  position?: { x: number; y: number };
}

export interface TableRow {
  id: string;
  [key: string]: any;
}

export interface TableData {
  schema: TableSchema;
  rows: TableRow[];
}

export interface Relationship {
  id: string;
  fromTableId: string;
  fromColumnId: string;
  toTableId: string;
  toColumnId: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface DatabaseSchema {
  tables: TableSchema[];
  relationships: Relationship[];
}

export interface TableManagementContextType {
  tableData: TableData[];
  schema: DatabaseSchema;
  createTable: (schema: TableSchema) => void;
  updateTable: (tableId: string, updates: Partial<TableSchema>) => void;
  deleteTable: (tableId: string) => void;
  addRow: (tableId: string, row: any) => void;
  updateRow: (tableId: string, rowId: string, updates: any) => void;
  deleteRow: (tableId: string, rowId: string) => void;
  addRelationship: (relationship: Relationship) => void;
  deleteRelationship: (relationshipId: string) => void;
  getTableById: (tableId: string) => TableData | undefined;
  setTableData: React.Dispatch<React.SetStateAction<TableData[]>>;
  setSchema: React.Dispatch<React.SetStateAction<DatabaseSchema>>;
}
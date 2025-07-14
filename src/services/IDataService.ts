import { TableData, DatabaseSchema, TableSchema, Relationship } from '../types';

export interface IDataService {
  // Load initial data
  loadData(): Promise<{ tableData: TableData[]; schema: DatabaseSchema }>;
  
  // Table operations
  saveTable(tableData: TableData): Promise<void>;
  updateTable(tableId: string, updates: Partial<TableSchema>): Promise<void>;
  deleteTable(tableId: string): Promise<void>;
  
  // Row operations
  addRow(tableId: string, row: any): Promise<void>;
  updateRow(tableId: string, rowId: string, updates: any): Promise<void>;
  deleteRow(tableId: string, rowId: string): Promise<void>;
  
  // Relationship operations
  addRelationship(relationship: Relationship): Promise<void>;
  deleteRelationship(relationshipId: string): Promise<void>;
  
  // Bulk operations
  saveAllData(tableData: TableData[], schema: DatabaseSchema): Promise<void>;
}
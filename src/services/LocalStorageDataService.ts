import { IDataService } from './IDataService';
import { TableData, DatabaseSchema, TableSchema, Relationship } from '../types';

export class LocalStorageDataService implements IDataService {
  private readonly STORAGE_KEY = 'table-management-data';

  async loadData(): Promise<{ tableData: TableData[]; schema: DatabaseSchema }> {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    
    if (!saved) {
      return {
        tableData: [],
        schema: { tables: [], relationships: [] }
      };
    }

    try {
      const data = JSON.parse(saved);
      console.log('Loading saved data from localStorage:', data);
      
      // Handle both old and new data formats
      if (data.tableData && Array.isArray(data.tableData)) {
        const tableData = data.tableData;
        
        // If schema exists, use it; otherwise create from tableData
        let schema: DatabaseSchema;
        if (data.schema && data.schema.tables) {
          schema = data.schema;
        } else {
          // Create schema from tableData for backward compatibility
          schema = {
            tables: tableData.map((td: TableData) => td.schema),
            relationships: data.schema?.relationships || []
          };
        }
        
        return { tableData, schema };
      } else if (Array.isArray(data)) {
        // Handle legacy format where data was just an array of TableData
        const tableData = data;
        const schema: DatabaseSchema = {
          tables: data.map((td: TableData) => td.schema),
          relationships: []
        };
        return { tableData, schema };
      }
      
      // If data format is unrecognized, return empty state
      return {
        tableData: [],
        schema: { tables: [], relationships: [] }
      };
    } catch (error) {
      console.error('Error loading saved data from localStorage:', error);
      // Reset to empty state if data is corrupted
      return {
        tableData: [],
        schema: { tables: [], relationships: [] }
      };
    }
  }

  async saveTable(tableData: TableData): Promise<void> {
    // This method is called when a new table is created
    // We need to load existing data, add the new table, and save everything back
    const existingData = await this.loadData();
    const updatedTableData = [...existingData.tableData, tableData];
    const updatedSchema: DatabaseSchema = {
      ...existingData.schema,
      tables: [...existingData.schema.tables, tableData.schema]
    };
    
    await this.saveAllData(updatedTableData, updatedSchema);
  }

  async updateTable(tableId: string, updates: Partial<TableSchema>): Promise<void> {
    const existingData = await this.loadData();
    
    const updatedTableData = existingData.tableData.map(table => 
      table.schema.id === tableId 
        ? { ...table, schema: { ...table.schema, ...updates } }
        : table
    );
    
    const updatedSchema: DatabaseSchema = {
      ...existingData.schema,
      tables: existingData.schema.tables.map(table => 
        table.id === tableId ? { ...table, ...updates } : table
      )
    };
    
    await this.saveAllData(updatedTableData, updatedSchema);
  }

  async deleteTable(tableId: string): Promise<void> {
    const existingData = await this.loadData();
    
    const updatedTableData = existingData.tableData.filter(table => table.schema.id !== tableId);
    const updatedSchema: DatabaseSchema = {
      tables: existingData.schema.tables.filter(table => table.id !== tableId),
      relationships: existingData.schema.relationships.filter(
        rel => rel.fromTableId !== tableId && rel.toTableId !== tableId
      )
    };
    
    await this.saveAllData(updatedTableData, updatedSchema);
  }

  async addRow(tableId: string, row: any): Promise<void> {
    const existingData = await this.loadData();
    
    const updatedTableData = existingData.tableData.map(table => 
      table.schema.id === tableId 
        ? { ...table, rows: [...table.rows, { id: Date.now().toString(), ...row }] }
        : table
    );
    
    await this.saveAllData(updatedTableData, existingData.schema);
  }

  async updateRow(tableId: string, rowId: string, updates: any): Promise<void> {
    const existingData = await this.loadData();
    
    const updatedTableData = existingData.tableData.map(table => 
      table.schema.id === tableId 
        ? {
            ...table,
            rows: table.rows.map(row => 
              row.id === rowId ? { ...row, ...updates } : row
            )
          }
        : table
    );
    
    await this.saveAllData(updatedTableData, existingData.schema);
  }

  async deleteRow(tableId: string, rowId: string): Promise<void> {
    const existingData = await this.loadData();
    
    const updatedTableData = existingData.tableData.map(table => 
      table.schema.id === tableId 
        ? { ...table, rows: table.rows.filter(row => row.id !== rowId) }
        : table
    );
    
    await this.saveAllData(updatedTableData, existingData.schema);
  }

  async addRelationship(relationship: Relationship): Promise<void> {
    const existingData = await this.loadData();
    
    const updatedSchema: DatabaseSchema = {
      ...existingData.schema,
      relationships: [...existingData.schema.relationships, relationship]
    };
    
    await this.saveAllData(existingData.tableData, updatedSchema);
  }

  async deleteRelationship(relationshipId: string): Promise<void> {
    const existingData = await this.loadData();
    
    const updatedSchema: DatabaseSchema = {
      ...existingData.schema,
      relationships: existingData.schema.relationships.filter(rel => rel.id !== relationshipId)
    };
    
    await this.saveAllData(existingData.tableData, updatedSchema);
  }

  async saveAllData(tableData: TableData[], schema: DatabaseSchema): Promise<void> {
    const dataToSave = {
      tableData,
      schema,
      lastModified: new Date().toISOString()
    };
    
    console.log('Saving data to localStorage:', dataToSave);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToSave));
  }
}
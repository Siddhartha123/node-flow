import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TableData, DatabaseSchema, TableSchema, Relationship, TableManagementContextType } from '../types';
import { IDataService } from '../services/IDataService';
import { LocalStorageDataService } from '../services/LocalStorageDataService';

const TableManagementContext = createContext<TableManagementContextType | undefined>(undefined);

// Create a single instance outside the component to prevent re-instantiation
const defaultDataService = new LocalStorageDataService();

interface TableManagementProviderProps {
  children: ReactNode;
  dataService?: IDataService;
}

export const TableManagementProvider: React.FC<TableManagementProviderProps> = ({ 
  children, 
  dataService = defaultDataService 
}) => {
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [schema, setSchema] = useState<DatabaseSchema>({
    tables: [],
    relationships: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from the data service
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const data = await dataService.loadData();
        console.log('Loaded data from service:', data);
        
        setTableData(data.tableData);
        setSchema(data.schema);
      } catch (error) {
        console.error('Error loading initial data:', error);
        // Reset to empty state if loading fails
        setTableData([]);
        setSchema({ tables: [], relationships: [] });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [dataService]);

  // Sync schema tables with tableData whenever tableData changes
  useEffect(() => {
    if (tableData.length > 0) {
      setSchema(prev => ({
        ...prev,
        tables: tableData.map(td => td.schema)
      }));
    }
  }, [tableData]);

  // Table management functions
  const createTable = async (tableSchema: TableSchema) => {
    try {
      // Add random position for schema designer
      const tableWithPosition = {
        ...tableSchema,
        position: { 
          x: 100 + (tableData.length % 3) * 300, 
          y: 100 + Math.floor(tableData.length / 3) * 250 
        }
      };

      const newTableData: TableData = {
        schema: tableWithPosition,
        rows: []
      };

      // Save to data service
      await dataService.saveTable(newTableData);

      // Update local state
      setTableData(prev => {
        const updated = [...prev, newTableData];
        console.log('Creating table, new tableData:', updated);
        return updated;
      });
      
      setSchema(prev => {
        const updated = {
          ...prev,
          tables: [...prev.tables, tableWithPosition]
        };
        console.log('Creating table, new schema:', updated);
        return updated;
      });
    } catch (error) {
      console.error('Error creating table:', error);
      throw error;
    }
  };

  const updateTable = async (tableId: string, updates: Partial<TableSchema>) => {
    try {
      // Update in data service
      await dataService.updateTable(tableId, updates);

      // Update local state
      setTableData(prev => prev.map(table => 
        table.schema.id === tableId 
          ? { ...table, schema: { ...table.schema, ...updates } }
          : table
      ));
      setSchema(prev => ({
        ...prev,
        tables: prev.tables.map(table => 
          table.id === tableId ? { ...table, ...updates } : table
        )
      }));
    } catch (error) {
      console.error('Error updating table:', error);
      throw error;
    }
  };

  const deleteTable = async (tableId: string) => {
    try {
      // Delete from data service
      await dataService.deleteTable(tableId);

      // Update local state
      setTableData(prev => prev.filter(table => table.schema.id !== tableId));
      setSchema(prev => ({
        tables: prev.tables.filter(table => table.id !== tableId),
        relationships: prev.relationships.filter(
          rel => rel.fromTableId !== tableId && rel.toTableId !== tableId
        )
      }));
    } catch (error) {
      console.error('Error deleting table:', error);
      throw error;
    }
  };

  const addRow = async (tableId: string, row: any) => {
    try {
      // Add to data service
      await dataService.addRow(tableId, row);

      // Update local state
      setTableData(prev => prev.map(table => 
        table.schema.id === tableId 
          ? { ...table, rows: [...table.rows, { id: Date.now().toString(), ...row }] }
          : table
      ));
    } catch (error) {
      console.error('Error adding row:', error);
      throw error;
    }
  };

  const updateRow = async (tableId: string, rowId: string, updates: any) => {
    try {
      // Update in data service
      await dataService.updateRow(tableId, rowId, updates);

      // Update local state
      setTableData(prev => prev.map(table => 
        table.schema.id === tableId 
          ? {
              ...table,
              rows: table.rows.map(row => 
                row.id === rowId ? { ...row, ...updates } : row
              )
            }
          : table
      ));
    } catch (error) {
      console.error('Error updating row:', error);
      throw error;
    }
  };

  const deleteRow = async (tableId: string, rowId: string) => {
    try {
      // Delete from data service
      await dataService.deleteRow(tableId, rowId);

      // Update local state
      setTableData(prev => prev.map(table => 
        table.schema.id === tableId 
          ? { ...table, rows: table.rows.filter(row => row.id !== rowId) }
          : table
      ));
    } catch (error) {
      console.error('Error deleting row:', error);
      throw error;
    }
  };

  const addRelationship = async (relationship: Relationship) => {
    try {
      // Add to data service
      await dataService.addRelationship(relationship);

      // Update local state
      setSchema(prev => ({
        ...prev,
        relationships: [...prev.relationships, relationship]
      }));
    } catch (error) {
      console.error('Error adding relationship:', error);
      throw error;
    }
  };

  const deleteRelationship = async (relationshipId: string) => {
    try {
      // Delete from data service
      await dataService.deleteRelationship(relationshipId);

      // Update local state
      setSchema(prev => ({
        ...prev,
        relationships: prev.relationships.filter(rel => rel.id !== relationshipId)
      }));
    } catch (error) {
      console.error('Error deleting relationship:', error);
      throw error;
    }
  };

  const getTableById = (tableId: string) => {
    return tableData.find(table => table.schema.id === tableId);
  };

  const contextValue: TableManagementContextType = {
    tableData,
    schema,
    createTable,
    updateTable,
    deleteTable,
    addRow,
    updateRow,
    deleteRow,
    addRelationship,
    deleteRelationship,
    getTableById,
    setTableData,
    setSchema
  };

  // Show loading state while data is being loaded
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading table data...</p>
        </div>
      </div>
    );
  }

  return (
    <TableManagementContext.Provider value={contextValue}>
      {children}
    </TableManagementContext.Provider>
  );
};

export const useTableManagement = (): TableManagementContextType => {
  const context = useContext(TableManagementContext);
  if (context === undefined) {
    throw new Error('useTableManagement must be used within a TableManagementProvider');
  }
  return context;
};
import Papa from 'papaparse';
import { TableData, Column, DatabaseSchema } from '../types';
import { FlowTab } from '../types/flow';

export const exportToJSON = (
  data: TableData[], 
  schema: DatabaseSchema, 
  flowTabs?: FlowTab[], 
  activeTabId?: string
) => {
  const exportData = {
    tables: data.map(table => ({
      schema: table.schema,
      data: table.rows
    })),
    relationships: schema.relationships,
    flowTabs: flowTabs || [],
    activeTabId: activeTabId || null,
    exportDate: new Date().toISOString(),
    version: '2.0' // Version to handle backward compatibility
  };
  
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `pipeline-data-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const exportToCSV = (tableData: TableData) => {
  const { schema, rows } = tableData;
  
  if (rows.length === 0) {
    alert('No data to export');
    return;
  }
  
  const headers = schema.columns.map(col => col.name);
  const csvData = rows.map(row => 
    schema.columns.map(col => {
      const value = row[col.id];
      // Handle list columns by joining array values with semicolons
      if (Array.isArray(value)) {
        return value.join(';');
      }
      return value || '';
    })
  );
  
  const csv = Papa.unparse({
    fields: headers,
    data: csvData
  });
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${schema.name}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importFromJSON = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Handle both new format (v2.0+) and legacy format
        if (json.version && json.version === '2.0') {
          // New format with pipeline data
          resolve({
            tables: json.tables || [],
            relationships: json.relationships || [],
            flowTabs: json.flowTabs || [],
            activeTabId: json.activeTabId || null,
            version: json.version
          });
        } else if (json.tables && Array.isArray(json.tables)) {
          // Legacy format - only table data and relationships
          resolve({
            tables: json.tables,
            relationships: json.relationships || [],
            flowTabs: [],
            activeTabId: null,
            version: '1.0'
          });
        } else {
          // Very old format - just array of tables
          resolve({
            tables: Array.isArray(json) ? json : [],
            relationships: [],
            flowTabs: [],
            activeTabId: null,
            version: '1.0'
          });
        }
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const importFromCSV = (file: File, columns: Column[]): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('CSV parsing error: ' + results.errors[0].message));
          return;
        }
        
        const processedData = results.data.map((row: any, index: number) => {
          const processedRow: any = { id: `imported-${Date.now()}-${index}` };
          
          columns.forEach(col => {
            const value = row[col.name];
            if (value !== undefined && value !== '') {
              if (col.isList) {
                // Handle list columns - split by semicolon
                const listValue = value.toString().split(';').map((item: string) => item.trim()).filter((item: string) => item !== '');
                switch (col.type) {
                  case 'number':
                    processedRow[col.id] = listValue.map((item: string) => parseFloat(item) || 0);
                    break;
                  case 'boolean':
                    processedRow[col.id] = listValue.map((item: string) => item.toLowerCase() === 'true');
                    break;
                  case 'date':
                    processedRow[col.id] = listValue.map((item: string) => new Date(item).toISOString().split('T')[0]);
                    break;
                  default:
                    processedRow[col.id] = listValue;
                }
              } else {
                // Handle single values
                switch (col.type) {
                  case 'number':
                    processedRow[col.id] = parseFloat(value) || 0;
                    break;
                  case 'boolean':
                    processedRow[col.id] = value.toLowerCase() === 'true';
                    break;
                  case 'date':
                    processedRow[col.id] = new Date(value).toISOString().split('T')[0];
                    break;
                  default:
                    processedRow[col.id] = value.toString();
                }
              }
            } else if (col.isList) {
              processedRow[col.id] = [];
            }
          });
          
          return processedRow;
        });
        
        resolve(processedData.filter(row => Object.keys(row).length > 1));
      },
      error: (error) => reject(error)
    });
  });
};

export const validateRowData = (data: any, columns: Column[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  columns.forEach(col => {
    const value = data[col.id];
    
    if (col.required) {
      if (col.isList) {
        if (!Array.isArray(value) || value.length === 0) {
          errors.push(`${col.name} is required and must have at least one value`);
        }
      } else {
        if (value === undefined || value === '' || value === null) {
          errors.push(`${col.name} is required`);
        }
      }
    }
    
    if (value !== undefined && value !== null && value !== '') {
      if (col.isList) {
        if (!Array.isArray(value)) {
          errors.push(`${col.name} must be a list of values`);
        } else {
          // Validate each item in the list
          value.forEach((item, index) => {
            if (item !== undefined && item !== null && item !== '') {
              switch (col.type) {
                case 'number':
                  if (isNaN(Number(item))) {
                    errors.push(`${col.name}[${index}] must be a number`);
                  }
                  break;
                case 'boolean':
                  if (typeof item !== 'boolean' && item !== 'true' && item !== 'false') {
                    errors.push(`${col.name}[${index}] must be true or false`);
                  }
                  break;
                case 'date':
                  if (isNaN(Date.parse(item))) {
                    errors.push(`${col.name}[${index}] must be a valid date`);
                  }
                  break;
              }
            }
          });
        }
      } else {
        // Validate single values
        switch (col.type) {
          case 'number':
            if (isNaN(Number(value))) {
              errors.push(`${col.name} must be a number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
              errors.push(`${col.name} must be true or false`);
            }
            break;
          case 'date':
            if (isNaN(Date.parse(value))) {
              errors.push(`${col.name} must be a valid date`);
            }
            break;
        }
      }
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
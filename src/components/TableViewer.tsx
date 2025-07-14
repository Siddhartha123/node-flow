import React, { useState, useMemo, useRef, useCallback } from 'react';
import { FlowNode, TableColumn } from '../types/flow';
import { Card, Table, Badge, Button, Select, TextInput, Modal, Label, Textarea } from 'flowbite-react';
import { Database, Search, Download, RefreshCw, Plus, Edit, Trash2, Upload, Save, FileText, Layers, Settings } from 'lucide-react';

interface TableViewerProps {
  allNodes: FlowNode[];
  onTableUpdate?: (tableName: string, columns: TableColumn[]) => void;
}

interface AggregatedTable {
  tableName: string;
  columns: TableColumn[];
  sourceNodes: FlowNode[];
  description?: string;
  color?: string;
  isCustom?: boolean;
}

interface TableRow {
  id: string;
  [key: string]: any;
}

interface CustomTable {
  tableName: string;
  columns: TableColumn[];
  description?: string;
  color: string;
  createdAt: string;
}

const TableViewer: React.FC<TableViewerProps> = ({ allNodes, onTableUpdate }) => {
  const [selectedTableName, setSelectedTableName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableData, setTableData] = useState<Record<string, TableRow[]>>({});
  const [customTables, setCustomTables] = useState<CustomTable[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnName: string } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New table form state
  const [newTableName, setNewTableName] = useState('');
  const [newTableDescription, setNewTableDescription] = useState('');
  const [newTableColor, setNewTableColor] = useState('#10B981');

  // New column form state
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'string' | 'number' | 'boolean' | 'date'>('string');
  const [newColumnDescription, setNewColumnDescription] = useState('');

  // Track if we've already auto-selected a table to prevent infinite loops
  const hasAutoSelectedRef = useRef(false);

  // Get all data nodes (tables) and aggregate by table name, plus custom tables
  const aggregatedTables = useMemo(() => {
    const dataNodes = allNodes.filter(node => 
      node.data.category === 'Storage' && 
      node.data.tableColumns && 
      node.data.tableColumns.length > 0
    );

    // Group nodes by table name
    const tableGroups = dataNodes.reduce((groups, node) => {
      const tableName = node.data.tableName || 'unnamed_table';
      if (!groups[tableName]) {
        groups[tableName] = [];
      }
      groups[tableName].push(node);
      return groups;
    }, {} as Record<string, FlowNode[]>);

    // Create aggregated tables from data nodes
    const nodeBasedTables = Object.entries(tableGroups).map(([tableName, nodes]) => {
      // Aggregate all columns from nodes with the same table name
      const allColumns: TableColumn[] = [];
      const columnIds = new Set<string>();

      nodes.forEach(node => {
        node.data.tableColumns?.forEach(column => {
          // Avoid duplicate columns by checking both ID and name
          const uniqueKey = `${column.name}_${column.dataType}`;
          if (!columnIds.has(uniqueKey)) {
            columnIds.add(uniqueKey);
            allColumns.push({
              ...column,
              // Add source node info to description if multiple nodes contribute
              description: nodes.length > 1 
                ? `${column.description || ''} (from ${node.data.label})`.trim()
                : column.description
            });
          }
        });
      });

      // Use the most recent node's metadata for the aggregated table
      const primaryNode = nodes.sort((a, b) => 
        new Date(b.data.updatedAt).getTime() - new Date(a.data.updatedAt).getTime()
      )[0];

      return {
        tableName,
        columns: allColumns,
        sourceNodes: nodes,
        description: nodes.length > 1 
          ? `Aggregated from ${nodes.length} data nodes: ${nodes.map(n => n.data.label).join(', ')}`
          : primaryNode.data.description,
        color: primaryNode.data.color,
        isCustom: false
      } as AggregatedTable;
    });

    // Add custom tables
    const customTableEntries = customTables.map(customTable => ({
      tableName: customTable.tableName,
      columns: customTable.columns,
      sourceNodes: [],
      description: customTable.description || 'Custom table created in Table Viewer',
      color: customTable.color,
      isCustom: true
    } as AggregatedTable));

    return [...customTableEntries, ...nodeBasedTables];
  }, [allNodes, customTables]);

  // Get selected table
  const selectedTable = useMemo(() => {
    return aggregatedTables.find(table => table.tableName === selectedTableName) || null;
  }, [aggregatedTables, selectedTableName]);

  // Get current table data
  const currentTableData = useMemo(() => {
    if (!selectedTableName) return [];
    return tableData[selectedTableName] || [];
  }, [tableData, selectedTableName]);

  // Auto-select first table if none selected and tables exist (only once)
  React.useEffect(() => {
    if (!hasAutoSelectedRef.current && !selectedTableName && aggregatedTables.length > 0) {
      setSelectedTableName(aggregatedTables[0].tableName);
      hasAutoSelectedRef.current = true;
    }
  }, [aggregatedTables.length]); // Only depend on the length, not the full array

  // Reset auto-selection flag when tables are cleared
  React.useEffect(() => {
    if (aggregatedTables.length === 0) {
      hasAutoSelectedRef.current = false;
      setSelectedTableName(null);
    }
  }, [aggregatedTables.length]);

  // Initialize table data when table is selected
  React.useEffect(() => {
    if (selectedTable && !tableData[selectedTable.tableName]) {
      // Generate initial sample data
      const initialData: TableRow[] = Array.from({ length: 3 }, (_, index) => {
        const row: TableRow = { id: `row-${Date.now()}-${index}` };
        selectedTable.columns.forEach(column => {
          switch (column.dataType) {
            case 'string':
              row[column.name] = `Sample ${column.name} ${index + 1}`;
              break;
            case 'number':
              row[column.name] = Math.floor(Math.random() * 1000) + 1;
              break;
            case 'boolean':
              row[column.name] = Math.random() > 0.5;
              break;
            case 'date':
              const date = new Date();
              date.setDate(date.getDate() - Math.floor(Math.random() * 365));
              row[column.name] = date.toISOString().split('T')[0];
              break;
            default:
              row[column.name] = `Value ${index + 1}`;
          }
        });
        return row;
      });

      setTableData(prev => ({
        ...prev,
        [selectedTable.tableName]: initialData
      }));
    }
  }, [selectedTable?.tableName, selectedTable?.columns.length]); // More specific dependencies

  // Notify parent component when tables are updated (memoized to prevent unnecessary calls)
  const notifyTableUpdate = useCallback(() => {
    if (onTableUpdate && selectedTable) {
      onTableUpdate(selectedTable.tableName, selectedTable.columns);
    }
  }, [onTableUpdate, selectedTable?.tableName, selectedTable?.columns]);

  React.useEffect(() => {
    notifyTableUpdate();
  }, [notifyTableUpdate]);

  const handleCreateTable = useCallback(() => {
    if (!newTableName.trim()) return;

    const newTable: CustomTable = {
      tableName: newTableName.trim(),
      columns: [
        {
          id: `col-${Date.now()}`,
          name: 'id',
          dataType: 'number',
          description: 'Primary key'
        }
      ],
      description: newTableDescription.trim() || undefined,
      color: newTableColor,
      createdAt: new Date().toISOString()
    };

    setCustomTables(prev => [...prev, newTable]);
    setSelectedTableName(newTable.tableName);
    
    // Reset form
    setNewTableName('');
    setNewTableDescription('');
    setNewTableColor('#10B981');
    setShowCreateTableModal(false);
  }, [newTableName, newTableDescription, newTableColor]);

  const handleAddColumn = useCallback(() => {
    if (!selectedTable || !newColumnName.trim()) return;

    const newColumn: TableColumn = {
      id: `col-${Date.now()}`,
      name: newColumnName.trim(),
      dataType: newColumnType,
      description: newColumnDescription.trim() || undefined
    };

    if (selectedTable.isCustom) {
      // Update custom table
      setCustomTables(prev => prev.map(table => 
        table.tableName === selectedTable.tableName
          ? { ...table, columns: [...table.columns, newColumn] }
          : table
      ));
    }

    // Add column to existing table data rows
    if (tableData[selectedTable.tableName]) {
      const defaultValue = newColumnType === 'string' ? '' : 
                          newColumnType === 'number' ? 0 : 
                          newColumnType === 'boolean' ? false : 
                          new Date().toISOString().split('T')[0];

      setTableData(prev => ({
        ...prev,
        [selectedTable.tableName]: prev[selectedTable.tableName].map(row => ({
          ...row,
          [newColumn.name]: defaultValue
        }))
      }));
    }

    // Reset form
    setNewColumnName('');
    setNewColumnType('string');
    setNewColumnDescription('');
    setShowAddColumnModal(false);
  }, [selectedTable, newColumnName, newColumnType, newColumnDescription, tableData]);

  const handleDeleteColumn = useCallback((columnId: string) => {
    if (!selectedTable || !selectedTable.isCustom) return;

    const columnToDelete = selectedTable.columns.find(col => col.id === columnId);
    if (!columnToDelete) return;

    if (window.confirm(`Delete column "${columnToDelete.name}"? This will remove all data in this column.`)) {
      // Update custom table
      setCustomTables(prev => prev.map(table => 
        table.tableName === selectedTable.tableName
          ? { ...table, columns: table.columns.filter(col => col.id !== columnId) }
          : table
      ));

      // Remove column from table data
      if (tableData[selectedTable.tableName]) {
        setTableData(prev => ({
          ...prev,
          [selectedTable.tableName]: prev[selectedTable.tableName].map(row => {
            const { [columnToDelete.name]: deleted, ...rest } = row;
            return rest;
          })
        }));
      }
    }
  }, [selectedTable, tableData]);

  const handleDeleteTable = useCallback((tableName: string) => {
    const table = aggregatedTables.find(t => t.tableName === tableName);
    if (!table || !table.isCustom) return;

    if (window.confirm(`Delete table "${tableName}"? This will permanently remove all data.`)) {
      setCustomTables(prev => prev.filter(t => t.tableName !== tableName));
      setTableData(prev => {
        const { [tableName]: deleted, ...rest } = prev;
        return rest;
      });
      
      if (selectedTableName === tableName) {
        const remainingTables = aggregatedTables.filter(t => t.tableName !== tableName);
        setSelectedTableName(remainingTables.length > 0 ? remainingTables[0].tableName : null);
      }
    }
  }, [aggregatedTables, selectedTableName]);

  const handleAddRow = useCallback(() => {
    if (!selectedTable) return;

    const newRow: TableRow = { id: `row-${Date.now()}` };
    selectedTable.columns.forEach(column => {
      switch (column.dataType) {
        case 'string':
          newRow[column.name] = '';
          break;
        case 'number':
          newRow[column.name] = 0;
          break;
        case 'boolean':
          newRow[column.name] = false;
          break;
        case 'date':
          newRow[column.name] = new Date().toISOString().split('T')[0];
          break;
        default:
          newRow[column.name] = '';
      }
    });

    setTableData(prev => ({
      ...prev,
      [selectedTable.tableName]: [...(prev[selectedTable.tableName] || []), newRow]
    }));
  }, [selectedTable]);

  const handleDeleteRow = useCallback((rowId: string) => {
    if (!selectedTable) return;

    setTableData(prev => ({
      ...prev,
      [selectedTable.tableName]: (prev[selectedTable.tableName] || []).filter(row => row.id !== rowId)
    }));
  }, [selectedTable]);

  const handleCellEdit = useCallback((rowId: string, columnName: string, value: any) => {
    if (!selectedTable) return;

    const column = selectedTable.columns.find(col => col.name === columnName);
    if (!column) return;

    // Type conversion based on column data type
    let convertedValue = value;
    switch (column.dataType) {
      case 'number':
        convertedValue = parseFloat(value) || 0;
        break;
      case 'boolean':
        convertedValue = value === 'true' || value === true;
        break;
      case 'date':
        convertedValue = value;
        break;
      default:
        convertedValue = String(value);
    }

    setTableData(prev => ({
      ...prev,
      [selectedTable.tableName]: (prev[selectedTable.tableName] || []).map(row =>
        row.id === rowId ? { ...row, [columnName]: convertedValue } : row
      )
    }));
  }, [selectedTable]);

  const handleExportCSV = useCallback(() => {
    if (!selectedTable || !currentTableData.length) return;

    const headers = selectedTable.columns.map(col => col.name);
    const csvContent = [
      headers.join(','),
      ...currentTableData.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable.tableName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [selectedTable, currentTableData]);

  const handleImportCSV = useCallback(() => {
    if (!selectedTable || !csvContent.trim()) return;

    try {
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      const importedData: TableRow[] = lines.slice(1).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: TableRow = { id: `imported-row-${Date.now()}-${index}` };
        
        headers.forEach((header, headerIndex) => {
          const column = selectedTable.columns.find(col => col.name === header);
          const value = values[headerIndex] || '';
          
          if (column) {
            switch (column.dataType) {
              case 'number':
                row[header] = parseFloat(value) || 0;
                break;
              case 'boolean':
                row[header] = value.toLowerCase() === 'true';
                break;
              case 'date':
                row[header] = value;
                break;
              default:
                row[header] = value;
            }
          } else {
            row[header] = value;
          }
        });
        
        return row;
      });

      setTableData(prev => ({
        ...prev,
        [selectedTable.tableName]: importedData
      }));

      setShowImportModal(false);
      setCsvContent('');
    } catch (error) {
      alert('Error parsing CSV. Please check the format and try again.');
    }
  }, [selectedTable, csvContent]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  }, []);

  const getDataTypeColor = (dataType: string) => {
    switch (dataType) {
      case 'string': return 'blue';
      case 'number': return 'green';
      case 'boolean': return 'purple';
      case 'date': return 'yellow';
      default: return 'gray';
    }
  };

  const renderCellEditor = (row: TableRow, column: TableColumn) => {
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnName === column.name;
    const value = row[column.name];

    if (!isEditing) {
      return (
        <div
          onClick={() => setEditingCell({ rowId: row.id, columnName: column.name })}
          className="cursor-pointer hover:bg-gray-50 p-2 rounded min-h-8 flex items-center"
        >
          <span className={`px-2 py-1 rounded text-sm ${
            column.dataType === 'string' ? 'bg-blue-50 text-blue-700' :
            column.dataType === 'number' ? 'bg-green-50 text-green-700' :
            column.dataType === 'boolean' ? 'bg-purple-50 text-purple-700' :
            column.dataType === 'date' ? 'bg-yellow-50 text-yellow-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {column.dataType === 'boolean' ? (value ? 'True' : 'False') : String(value)}
          </span>
        </div>
      );
    }

    if (column.dataType === 'boolean') {
      return (
        <Select
          value={value ? 'true' : 'false'}
          onChange={(e) => {
            handleCellEdit(row.id, column.name, e.target.value === 'true');
            setEditingCell(null);
          }}
          onBlur={() => setEditingCell(null)}
          size="sm"
          autoFocus
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </Select>
      );
    }

    return (
      <TextInput
        type={column.dataType === 'number' ? 'number' : column.dataType === 'date' ? 'date' : 'text'}
        value={value}
        onChange={(e) => handleCellEdit(row.id, column.name, e.target.value)}
        onBlur={() => setEditingCell(null)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setEditingCell(null);
          }
        }}
        size="sm"
        autoFocus
      />
    );
  };

  if (aggregatedTables.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Database className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Table Manager</h2>
                <p className="text-sm text-gray-600">Create, edit and manage table schemas and data</p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateTableModal(true)}
              color="blue"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Table
            </Button>
          </div>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Database className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Tables Available</h3>
            <p className="text-gray-500 max-w-sm mb-4">
              Create custom tables here or add Data nodes in your pipeline to see their table structures
            </p>
            <Button
              onClick={() => setShowCreateTableModal(true)}
              color="blue"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Table
            </Button>
            <div className="mt-4 text-sm text-gray-400">
              💡 Tables created here can be referenced when adding Data nodes in your pipeline
            </div>
          </div>
        </div>

        {/* Create Table Modal */}
        <Modal show={showCreateTableModal} onClose={() => setShowCreateTableModal(false)} size="lg">
          <Modal.Header>Create New Table</Modal.Header>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <Label htmlFor="table-name" className="mb-2 block">Table Name</Label>
                <TextInput
                  id="table-name"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Enter table name (e.g., users, products, orders)"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="table-description" className="mb-2 block">Description (Optional)</Label>
                <Textarea
                  id="table-description"
                  value={newTableDescription}
                  onChange={(e) => setNewTableDescription(e.target.value)}
                  placeholder="Describe what this table will store..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="table-color" className="mb-2 block">Color Theme</Label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    id="table-color"
                    value={newTableColor}
                    onChange={(e) => setNewTableColor(e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300"
                  />
                  <span className="text-sm text-gray-600">Choose a color to identify this table</span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> After creating the table, you can add custom columns and then reference this table when creating Data nodes in your pipeline.
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={handleCreateTable} disabled={!newTableName.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Table
            </Button>
            <Button color="gray" onClick={() => setShowCreateTableModal(false)}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Database className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Table Manager</h2>
              <p className="text-sm text-gray-600">Create, edit and manage table schemas and data</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowCreateTableModal(true)}
              color="blue"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Table
            </Button>
            <Badge color="success" size="lg">
              {aggregatedTables.length} {aggregatedTables.length === 1 ? 'Table' : 'Tables'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Sidebar - Table List */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Available Tables</h3>
            <div className="space-y-2">
              {aggregatedTables.map((table) => (
                <div key={table.tableName} className="relative group">
                  <button
                    onClick={() => setSelectedTableName(table.tableName)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTableName === table.tableName
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4" style={{ color: table.color }} />
                        <div>
                          <div className="font-medium text-sm flex items-center space-x-2">
                            <span>{table.tableName}</span>
                            {table.isCustom && (
                              <Badge color="blue" size="xs">Custom</Badge>
                            )}
                          </div>
                          {table.sourceNodes.length > 1 && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Layers className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-600">
                                {table.sourceNodes.length} nodes
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge color="gray" size="sm">
                          {table.columns.length} cols
                        </Badge>
                        <Badge color="info" size="sm">
                          {tableData[table.tableName]?.length || 0} rows
                        </Badge>
                      </div>
                    </div>
                    {table.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {table.description}
                      </div>
                    )}
                  </button>
                  
                  {table.isCustom && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table.tableName);
                      }}
                      color="failure"
                      size="xs"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Table Editor */}
        <div className="flex-1 flex flex-col">
          {selectedTable ? (
            <>
              {/* Table Header */}
              <div className="p-6 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Database className="w-6 h-6" style={{ color: selectedTable.color }} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-bold text-gray-800">
                          {selectedTable.tableName}
                        </h3>
                        {selectedTable.isCustom && (
                          <Badge color="blue" size="sm">Custom Table</Badge>
                        )}
                        {selectedTable.sourceNodes.length > 1 && (
                          <Badge color="info" size="sm">
                            <Layers className="w-3 h-3 mr-1" />
                            Aggregated
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {selectedTable.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedTable.isCustom && (
                      <Button
                        onClick={() => setShowAddColumnModal(true)}
                        color="purple"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Column
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowImportModal(true)}
                      color="blue"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV
                    </Button>
                    <Button
                      onClick={handleExportCSV}
                      color="green"
                      size="sm"
                      disabled={currentTableData.length === 0}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      onClick={handleAddRow}
                      color="gray"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Row
                    </Button>
                  </div>
                </div>

                {/* Source Nodes Info */}
                {selectedTable.sourceNodes.length > 1 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Aggregated from {selectedTable.sourceNodes.length} data nodes:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTable.sourceNodes.map((node) => (
                        <div key={node.id} className="flex items-center space-x-1 bg-white px-2 py-1 rounded border">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: node.data.color }} />
                          <span className="text-xs text-gray-700">{node.data.label}</span>
                          <Badge color="gray" size="xs">
                            {node.data.tableColumns?.length || 0} cols
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Table Stats */}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{selectedTable.columns.length} columns</span>
                  <span>•</span>
                  <span>{currentTableData.length} rows</span>
                  <span>•</span>
                  <span>Click cells to edit</span>
                  {selectedTable.isCustom && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600">Editable schema</span>
                    </>
                  )}
                </div>
              </div>

              {/* Table Content */}
              <div className="flex-1 p-6 overflow-auto">
                <Card className="shadow-sm">
                  <div className="overflow-x-auto">
                    <Table hoverable>
                      <Table.Head>
                        <Table.HeadCell className="w-16">Actions</Table.HeadCell>
                        {selectedTable.columns.map((column) => (
                          <Table.HeadCell key={`${column.id}-${column.name}-head`} className="whitespace-nowrap min-w-32">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{column.name}</span>
                                <Badge color={getDataTypeColor(column.dataType)} size="xs">
                                  {column.dataType}
                                </Badge>
                                {selectedTable.isCustom && (
                                  <Button
                                    onClick={() => handleDeleteColumn(column.id)}
                                    color="failure"
                                    size="xs"
                                    className="p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </Button>
                                )}
                              </div>
                              {column.description && (
                                <div className="text-xs text-gray-500 font-normal">
                                  {column.description}
                                </div>
                              )}
                            </div>
                          </Table.HeadCell>
                        ))}
                      </Table.Head>
                      <Table.Body className="divide-y">
                        {currentTableData.map((row, index) => (
                          <Table.Row key={row.id} className="bg-white hover:bg-gray-50">
                            <Table.Cell>
                              <Button
                                onClick={() => handleDeleteRow(row.id)}
                                color="failure"
                                size="xs"
                                className="p-1"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </Table.Cell>
                            {selectedTable.columns.map((column) => (
                              <Table.Cell key={`${column.id}-${column.name}-${index}`} className="p-0">
                                {renderCellEditor(row, column)}
                              </Table.Cell>
                            ))}
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table>
                  </div>
                  
                  {currentTableData.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No data available. Add rows or import CSV data.</p>
                    </div>
                  )}
                </Card>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Select a Table</h3>
                <p className="text-gray-500">Choose a table from the sidebar to edit its data</p>
                <Button
                  onClick={() => setShowCreateTableModal(true)}
                  color="blue"
                  size="sm"
                  className="mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Table
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Table Modal */}
      <Modal show={showCreateTableModal} onClose={() => setShowCreateTableModal(false)} size="lg">
        <Modal.Header>Create New Table</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="table-name" className="mb-2 block">Table Name</Label>
              <TextInput
                id="table-name"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Enter table name (e.g., users, products, orders)"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="table-description" className="mb-2 block">Description (Optional)</Label>
              <Textarea
                id="table-description"
                value={newTableDescription}
                onChange={(e) => setNewTableDescription(e.target.value)}
                placeholder="Describe what this table will store..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="table-color" className="mb-2 block">Color Theme</Label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  id="table-color"
                  value={newTableColor}
                  onChange={(e) => setNewTableColor(e.target.value)}
                  className="w-12 h-10 rounded border border-gray-300"
                />
                <span className="text-sm text-gray-600">Choose a color to identify this table</span>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> After creating the table, you can add custom columns and then reference this table when creating Data nodes in your pipeline.
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleCreateTable} disabled={!newTableName.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Create Table
          </Button>
          <Button color="gray" onClick={() => setShowCreateTableModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Column Modal */}
      <Modal show={showAddColumnModal} onClose={() => setShowAddColumnModal(false)} size="lg">
        <Modal.Header>Add Column to {selectedTable?.tableName}</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="column-name" className="mb-2 block">Column Name</Label>
              <TextInput
                id="column-name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="Enter column name (e.g., email, age, created_at)"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="column-type" className="mb-2 block">Data Type</Label>
              <Select
                id="column-type"
                value={newColumnType}
                onChange={(e) => setNewColumnType(e.target.value as any)}
              >
                <option value="string">String (Text)</option>
                <option value="number">Number (Integer/Decimal)</option>
                <option value="boolean">Boolean (True/False)</option>
                <option value="date">Date</option>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="column-description" className="mb-2 block">Description (Optional)</Label>
              <Textarea
                id="column-description"
                value={newColumnDescription}
                onChange={(e) => setNewColumnDescription(e.target.value)}
                placeholder="Describe what this column stores..."
                rows={2}
              />
            </div>
            
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm text-green-800">
                ✨ <strong>Note:</strong> Adding this column will automatically add it to all existing rows with a default value.
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleAddColumn} disabled={!newColumnName.trim()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Column
          </Button>
          <Button color="gray" onClick={() => setShowAddColumnModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Import CSV Modal */}
      <Modal show={showImportModal} onClose={() => setShowImportModal(false)} size="2xl">
        <Modal.Header>Import CSV Data</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            <div className="text-center text-gray-500">or</div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste CSV Content
              </label>
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                rows={10}
                className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="Paste your CSV content here..."
              />
            </div>
            
            {selectedTable && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-1">Expected Columns:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedTable.columns.map((col) => (
                    <Badge key={col.id} color={getDataTypeColor(col.dataType)} size="sm">
                      {col.name} ({col.dataType})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleImportCSV} disabled={!csvContent.trim()}>
            <Upload className="w-4 h-4 mr-2" />
            Import Data
          </Button>
          <Button color="gray" onClick={() => setShowImportModal(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TableViewer;
import React, { useState } from 'react';
import { Edit, Trash2, Save, X, Database, Search } from 'lucide-react';
import { Column } from '../types';
import { validateRowData } from '../utils/dataUtils';
import { useTableManagement } from '../context/TableManagementContext';
import ColumnInputField from './ColumnInputField';

const TableEditor: React.FC = () => {
  const { tableData, schema, addRow, updateRow, deleteRow } = useTableManagement();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [newRow, setNewRow] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');

  const selectedTable = tableData.find(table => table.schema.id === selectedTableId);

  const handleAddRow = () => {
    if (!selectedTable) return;
    
    const validation = validateRowData(newRow, selectedTable.schema.columns);
    if (!validation.isValid) {
      alert('Validation errors:\n' + validation.errors.join('\n'));
      return;
    }
    
    addRow(selectedTableId!, newRow);
    setNewRow({});
  };

  const handleStartEdit = (row: any) => {
    setEditingRow(row.id);
    setNewRow({ ...row });
  };

  const handleUpdateRow = (rowId: string) => {
    if (!selectedTable) return;
    
    const validation = validateRowData(newRow, selectedTable.schema.columns);
    if (!validation.isValid) {
      alert('Validation errors:\n' + validation.errors.join('\n'));
      return;
    }
    
    updateRow(selectedTableId!, rowId, newRow);
    setEditingRow(null);
    setNewRow({});
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setNewRow({});
  };

  const filteredRows = selectedTable?.rows.filter(row =>
    Object.values(row).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const renderCellValue = (column: Column, value: any) => {
    if (column.isList && Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs"
            >
              {item}
            </span>
          ))}
        </div>
      );
    }
    
    if (column.type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return value?.toString() || '-';
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Tables
            </h2>
          </div>
          
          {tableData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No tables created yet</p>
              <p className="text-sm text-gray-400">
                Go to Schema Designer to create tables
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {tableData.map((table) => (
                  <button
                    key={table.schema.id}
                    onClick={() => setSelectedTableId(table.schema.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedTableId === table.schema.id
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{table.schema.name}</div>
                    <div className="text-sm text-gray-500">
                      {table.schema.columns.length} columns • {table.rows.length} rows
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedTable ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-2xl font-bold text-gray-900">{selectedTable.schema.name}</h1>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search rows..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Column Legend */}
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>Foreign Key</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span>List Column</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 font-bold">*</span>
                  <span>Required</span>
                </div>
              </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 p-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                <div className="flex-1 overflow-y-auto overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                        {selectedTable.schema.columns.map((column) => {
                          // Check if this column has relationships
                          const isForeignKey = schema.relationships.some(
                            rel => rel.fromTableId === selectedTableId && rel.fromColumnId === column.id
                          );
                          
                          return (
                            <th
                              key={column.id}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center gap-2">
                                {isForeignKey && (
                                  <div className="w-3 h-3 bg-blue-400 rounded-full" title="Foreign Key" />
                                )}
                                {column.isList && (
                                  <div className="w-3 h-3 bg-yellow-400 rounded-full" title="List Column" />
                                )}
                                <span>{column.name}</span>
                                {column.required && <span className="text-red-500 ml-1">*</span>}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Add New Row */}
                      <tr className="bg-blue-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={handleAddRow}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                          >
                            Add
                          </button>
                        </td>
                        {selectedTable.schema.columns.map((column) => (
                          <td key={column.id} className="px-6 py-4 whitespace-nowrap">
                            <ColumnInputField
                              column={column}
                              value={newRow[column.id]}
                              onChange={(value) => setNewRow(prev => ({ ...prev, [column.id]: value }))}
                              selectedTableId={selectedTableId!}
                            />
                          </td>
                        ))}
                      </tr>

                      {/* Existing Rows */}
                      {filteredRows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {editingRow === row.id ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateRow(row.id)}
                                    className="text-green-600 hover:bg-green-50 p-1 rounded transition-colors"
                                    title="Save changes"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-gray-600 hover:bg-gray-50 p-1 rounded transition-colors"
                                    title="Cancel editing"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(row)}
                                    className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors"
                                    title="Edit row"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteRow(selectedTableId!, row.id)}
                                    className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                    title="Delete row"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                          {selectedTable.schema.columns.map((column) => (
                            <td key={column.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {editingRow === row.id ? (
                                <ColumnInputField
                                  column={column}
                                  value={newRow[column.id]}
                                  onChange={(value) => setNewRow(prev => ({ ...prev, [column.id]: value }))}
                                  selectedTableId={selectedTableId!}
                                />
                              ) : (
                                renderCellValue(column, row[column.id])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Table Selected</h3>
              <p className="text-gray-500 mb-4">Select a table from the sidebar to view and edit its data</p>
              <p className="text-sm text-gray-400">
                Create tables in the Schema Designer tab first
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableEditor;
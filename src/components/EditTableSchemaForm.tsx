import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Column, TableSchema } from '../types';
import ColumnEditorRow from './ColumnEditorRow';

interface EditTableSchemaFormProps {
  tableSchema: TableSchema;
  onUpdate: (tableId: string, updates: Partial<TableSchema>) => void;
  onDelete: (tableId: string) => void;
  onClose: () => void;
}

const EditTableSchemaForm: React.FC<EditTableSchemaFormProps> = ({
  tableSchema,
  onUpdate,
  onDelete,
  onClose
}) => {
  const [tableName, setTableName] = useState(tableSchema.name);
  const [columns, setColumns] = useState<Column[]>(tableSchema.columns);

  useEffect(() => {
    setTableName(tableSchema.name);
    setColumns(tableSchema.columns);
  }, [tableSchema]);

  const addColumn = () => {
    const newColumn: Column = {
      id: Date.now().toString(),
      name: '',
      type: 'string',
      required: false,
      unique: false,
      isList: false
    };
    setColumns([...columns, newColumn]);
  };

  const updateColumn = (id: string, updates: Partial<Column>) => {
    setColumns(columns.map(col => col.id === id ? { ...col, ...updates } : col));
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter(col => col.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) {
      alert('Please enter a table name');
      return;
    }
    if (columns.some(col => !col.name.trim())) {
      alert('Please fill in all column names');
      return;
    }

    onUpdate(tableSchema.id, {
      name: tableName.trim(),
      columns: columns.map(col => ({ ...col, name: col.name.trim() }))
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the table "${tableSchema.name}"? This action cannot be undone.`)) {
      onDelete(tableSchema.id);
      onClose();
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Edit Table Schema</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
            title="Delete Table"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:bg-gray-50 p-2 rounded transition-colors"
          >
            ×
          </button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Table Name
          </label>
          <input
            type="text"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter table name"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Columns
            </label>
            <button
              type="button"
              onClick={addColumn}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Add Column
            </button>
          </div>

          <div className="space-y-3">
            {columns.map((column, index) => (
              <ColumnEditorRow
                key={column.id}
                column={column}
                index={index}
                onUpdate={updateColumn}
                onRemove={removeColumn}
                canRemove={columns.length > 1}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Update Table
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditTableSchemaForm;
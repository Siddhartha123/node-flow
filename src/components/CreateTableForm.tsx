import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Column, TableSchema } from '../types';
import ColumnEditorRow from './ColumnEditorRow';

interface CreateTableFormProps {
  onCreate: (schema: TableSchema) => void;
}

const CreateTableForm: React.FC<CreateTableFormProps> = ({ onCreate }) => {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<Column[]>([
    { id: '1', name: 'id', type: 'string', required: true, unique: true, isList: false }
  ]);

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

    const schema: TableSchema = {
      id: Date.now().toString(),
      name: tableName,
      columns: columns.map(col => ({ ...col, name: col.name.trim() }))
    };

    onCreate(schema);
    
    // Reset form
    setTableName('');
    setColumns([
      { id: Date.now().toString(), name: 'id', type: 'string', required: true, unique: true, isList: false }
    ]);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Table</h3>
      
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
                canRemove={index > 0}
              />
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create Table
        </button>
      </form>
    </div>
  );
};

export default CreateTableForm;
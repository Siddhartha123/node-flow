import React from 'react';
import { X } from 'lucide-react';
import { Column } from '../types';
import { useTableManagement } from '../context/TableManagementContext';

interface ColumnInputFieldProps {
  column: Column;
  value: any;
  onChange: (value: any) => void;
  selectedTableId: string;
}

const ColumnInputField: React.FC<ColumnInputFieldProps> = ({
  column,
  value,
  onChange,
  selectedTableId
}) => {
  const { tableData, schema } = useTableManagement();

  // Find if this column has a foreign key relationship (as source)
  const foreignKeyRelation = schema.relationships.find(
    rel => rel.fromTableId === selectedTableId && rel.fromColumnId === column.id
  );

  // Get the target table and column if there's a foreign key relationship
  const targetTable = foreignKeyRelation 
    ? tableData.find(t => t.schema.id === foreignKeyRelation.toTableId)
    : null;
  
  const targetColumn = targetTable && foreignKeyRelation
    ? targetTable.schema.columns.find(c => c.id === foreignKeyRelation.toColumnId)
    : null;

  // Get available options from the target column
  const availableOptions = targetTable && targetColumn
    ? [...new Set(targetTable.rows.map(row => row[targetColumn.id]).filter(val => val !== undefined && val !== ''))]
    : [];

  const isForeignKey = !!foreignKeyRelation;
  const isList = column.isList;

  const handleRemoveFromList = (itemToRemove: any) => {
    const currentList = Array.isArray(value) ? value : [];
    onChange(currentList.filter(item => item !== itemToRemove));
  };

  const handleListInputChange = (inputValue: string) => {
    const items = inputValue.split(',').map(item => item.trim()).filter(item => item);
    onChange(items);
  };

  // List + Foreign Key - Direct dropdown selection
  if (isList && isForeignKey) {
    const currentList = Array.isArray(value) ? value : [];
    
    return (
      <div className="space-y-2">
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              const currentList = Array.isArray(value) ? value : [];
              if (!currentList.includes(e.target.value)) {
                onChange([...currentList, e.target.value]);
              }
            }
          }}
          className="w-full px-2 py-1 border border-blue-300 rounded text-sm bg-blue-50 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select value to add...</option>
          {availableOptions.map((option, idx) => (
            <option key={idx} value={option}>{option}</option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1">
          {currentList.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemoveFromList(item)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Single Foreign Key
  if (isForeignKey && !isList) {
    return (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 border border-blue-300 rounded text-sm bg-blue-50 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select value...</option>
        {availableOptions.map((option, idx) => (
          <option key={idx} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  // List only (no foreign key)
  if (isList && !isForeignKey) {
    const listValue = Array.isArray(value) ? value.join(', ') : '';
    return (
      <input
        type="text"
        value={listValue}
        onChange={(e) => handleListInputChange(e.target.value)}
        placeholder="Enter comma-separated values"
        className="w-full px-2 py-1 border border-yellow-300 rounded text-sm bg-yellow-50 focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
      />
    );
  }

  // Regular input
  const inputType = column.type === 'number' ? 'number' : 
                   column.type === 'date' ? 'date' : 
                   column.type === 'boolean' ? 'select' : 'text';

  if (column.type === 'boolean') {
    return (
      <select
        value={value === undefined ? '' : value.toString()}
        onChange={(e) => {
          const val = e.target.value;
          onChange(val === '' ? undefined : val === 'true');
        }}
        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select...</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  return (
    <input
      type={inputType}
      value={value || ''}
      onChange={(e) => {
        const val = e.target.value;
        if (column.type === 'number') {
          onChange(val === '' ? '' : parseFloat(val) || '');
        } else {
          onChange(val);
        }
      }}
      placeholder={`Enter ${column.name.toLowerCase()}`}
      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
    />
  );
};

export default ColumnInputField;
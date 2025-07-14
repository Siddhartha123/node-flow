import React from 'react';
import { Trash2 } from 'lucide-react';
import { Column } from '../types';

interface ColumnEditorRowProps {
  column: Column;
  index: number;
  onUpdate: (id: string, updates: Partial<Column>) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const ColumnEditorRow: React.FC<ColumnEditorRowProps> = ({
  column,
  index,
  onUpdate,
  onRemove,
  canRemove
}) => {
  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg">
      {/* Column name and remove button */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={column.name}
          onChange={(e) => onUpdate(column.id, { name: e.target.value })}
          placeholder="Column name"
          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
        />
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(column.id)}
            className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Column type and checkboxes */}
      <div className="flex items-center gap-2">
        <select
          value={column.type}
          onChange={(e) => onUpdate(column.id, { type: e.target.value as Column['type'] })}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="string">Text</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="date">Date</option>
        </select>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={column.required}
            onChange={(e) => onUpdate(column.id, { required: e.target.checked })}
            className="mr-1"
          />
          Required
        </label>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={column.unique}
            onChange={(e) => onUpdate(column.id, { unique: e.target.checked })}
            className="mr-1"
          />
          Unique
        </label>
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            checked={column.isList || false}
            onChange={(e) => onUpdate(column.id, { isList: e.target.checked })}
            className="mr-1"
          />
          List
        </label>
      </div>
    </div>
  );
};

export default ColumnEditorRow;
import React from 'react';
import { Database, Edit } from 'lucide-react';
import { Handle, Position } from '@xyflow/react';

interface SchemaTableNodeProps {
  data: {
    table: any;
    tableData: any;
    onEditClick: (tableId: string) => void;
  };
}

const SchemaTableNode: React.FC<SchemaTableNodeProps> = ({ data }) => {
  const { table, tableData, onEditClick } = data;
  const headerHeight = 60;
  const rowHeight = 48;
  
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg min-w-[280px] relative">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-t-lg relative"
        style={{ height: `${headerHeight}px` }}
      >
        <div className="font-semibold flex items-center gap-2">
          <Database className="w-4 h-4" />
          {table.name}
        </div>
        <div className="text-blue-100 text-xs mt-1">
          {tableData?.rows.length || 0} rows • {table.columns.length} columns
        </div>
        <button
          onClick={() => onEditClick(table.id)}
          className="absolute top-2 right-2 text-white hover:bg-blue-800 p-1 rounded transition-colors"
          title="Edit Table Schema"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
      
      {/* Columns */}
      <div className="p-0">
        {table.columns.map((column: any, index: number) => {
          const rowCenterY = (rowHeight / 2);
          
          return (
            <div key={column.id} className="relative border-b border-gray-100 last:border-b-0" style={{ height: `${rowHeight}px` }}>
              {/* Source handle (right side) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${column.id}-source`}
                style={{ 
                  top: `${rowCenterY}px`,
                  right: '-8px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#3B82F6',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transform: 'translateY(-50%)'
                }}
                className="hover:scale-125 transition-transform"
              />
              
              {/* Target handle (left side) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${column.id}-target`}
                style={{ 
                  top: `${rowCenterY}px`,
                  left: '-8px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transform: 'translateY(-50%)'
                }}
                className="hover:scale-125 transition-transform"
              />
              
              <div className="flex items-center justify-between h-full px-4 text-sm hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    column.type === 'string' ? 'bg-blue-400' :
                    column.type === 'number' ? 'bg-green-400' :
                    column.type === 'boolean' ? 'bg-purple-400' :
                    'bg-orange-400'
                  }`} />
                  <span className={`${column.required ? 'font-semibold' : 'font-medium'} text-gray-800`}>
                    {column.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs uppercase font-medium bg-gray-100 px-2 py-1 rounded">
                    {column.type}
                  </span>
                  <div className="flex items-center gap-1">
                    {column.required && (
                      <span className="text-red-500 text-xs font-bold bg-red-50 px-1 rounded" title="Required">*</span>
                    )}
                    {column.unique && (
                      <span className="text-blue-500 text-xs font-bold bg-blue-50 px-1 rounded" title="Unique">U</span>
                    )}
                    {column.isList && (
                      <span className="text-yellow-600 text-xs font-bold bg-yellow-50 px-1 rounded" title="List">L</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SchemaTableNode;
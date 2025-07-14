import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FlowNode } from '../types/flow';
import { Database, Zap } from 'lucide-react';

interface CustomNodeProps extends NodeProps {
  data: FlowNode['data'];
}

const CustomNode: React.FC<CustomNodeProps> = memo(({ data, selected }) => {
  const getIcon = () => {
    switch (data.category) {
      case 'Storage':
        return <Database className="w-8 h-4" />;
      case 'Transform':
        return <Zap className="w-8 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const isDataNode = data.category === 'Storage';
  const isProcessNode = data.category === 'Transform';

  return (
    <div 
      className={`rounded-lg bg-white shadow-md transition-all duration-200 relative ${
        selected 
          ? 'ring-2 ring-blue-500 ring-offset-2 shadow-lg' 
          : 'hover:shadow-lg'
      }`}
      //style={{ minWidth: '200px', maxWidth: '350px' }}
    >
      {/* Top Handle - Input */}
      {/* Data nodes have input handles to receive processed data from Process nodes */}
      {/* Process nodes have input handles to receive data from Data nodes */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="input"
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white hover:!bg-blue-500 transition-colors !-top-1.5" 
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}
      />
      
      <div className="p-3">
        {/* Header */}
        <div className="flex items-center space-x-2 mb-2">
          <div style={{ color: data.color }}>
            {getIcon()}
          </div>
          <div className="font-semibold text-gray-800 text-sm">
            {data.label}
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {data.category}
          </div>
        </div>

        {/* Data Node Content */}
        {isDataNode && data.tableColumns && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600 mb-1">
              Table: {data.tableName || 'unnamed'}
            </div>
            <div className="space-y-1">
              {data.tableColumns.map((column) => (
                <div key={column.id} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                  <span className="font-medium text-gray-700 truncate">{column.name}</span>
                  <span className="text-gray-500 text-xs ml-2 flex-shrink-0">{column.dataType}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process Node Content */}
        {isProcessNode && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600">
              {data.processLogic || 'Transform input data'}
            </div>
            {data.outputColumns && data.outputColumns.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Output:</div>
                <div className="space-y-1">
                  {data.outputColumns.map((column) => (
                    <div key={column.id} className="flex items-center justify-between text-xs bg-blue-50 px-2 py-1 rounded">
                      <span className="font-medium text-blue-700 truncate">{column.name}</span>
                      <span className="text-blue-500 text-xs ml-2 flex-shrink-0">{column.dataType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Bottom Handle - Output */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="output"
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white hover:!bg-blue-500 transition-colors !-bottom-1.5" 
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
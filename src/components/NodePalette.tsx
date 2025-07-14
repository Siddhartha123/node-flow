import React, { useState } from 'react';
import { nodeTypes } from '../utils/flowUtils';
import { NodeType, TableColumn } from '../types/flow';
import { Button, Card, Modal, Label, Select } from 'flowbite-react';
import { Database, Zap, Plus } from 'lucide-react';

interface NodePaletteProps {
  onAddNode: (nodeType: NodeType, tableName?: string, tableColumns?: TableColumn[]) => void;
  availableTables: Record<string, TableColumn[]>;
}

const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode, availableTables }) => {
  const [showTableSelector, setShowTableSelector] = useState(false);
  const [selectedTableName, setSelectedTableName] = useState('');

  const handleDataNodeClick = () => {
    const tableNames = Object.keys(availableTables);
    if (tableNames.length > 0) {
      setShowTableSelector(true);
    } else {
      // Create a basic data node if no tables are available
      const dataNodeType = nodeTypes.find(type => type.id === 'data');
      if (dataNodeType) {
        onAddNode(dataNodeType);
      }
    }
  };

  const handleTableSelection = () => {
    if (!selectedTableName) return;

    const columns = availableTables[selectedTableName];
    if (!columns) return;

    // Create a custom node type with the selected table data
    const customDataNodeType: NodeType = {
      id: 'data',
      label: `Data (${selectedTableName})`,
      color: '#10B981',
      icon: 'Database',
      category: 'Storage'
    };

    // Pass the table name and columns to the onAddNode callback
    onAddNode(customDataNodeType, selectedTableName, columns);
    setShowTableSelector(false);
    setSelectedTableName('');
  };

  const handleProcessNodeClick = () => {
    const processNodeType = nodeTypes.find(type => type.id === 'process');
    if (processNodeType) {
      onAddNode(processNodeType);
    }
  };

  const tableNames = Object.keys(availableTables);

  return (
    <div className="p-4 h-full">
      <Card className="shadow-sm h-full">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Node Palette</h3>
          <p className="text-sm text-gray-600 mb-6">Add nodes to build your data pipeline</p>
          
          <div className="space-y-3">
            {/* Data Node */}
            <Button
              onClick={handleDataNodeClick}
              color="gray"
              size="sm"
              className="w-full justify-start transition-all hover:scale-105 hover:shadow-md"
              style={{ 
                borderLeft: `4px solid #10B981`,
                borderRadius: '0.5rem'
              }}
            >
              <div className="flex items-center space-x-3 w-full">
                <div style={{ color: '#10B981' }}>
                  <Database className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-800">
                    Data Node
                  </div>
                  <div className="text-xs text-gray-500">
                    Storage • {tableNames.length > 0 ? `${tableNames.length} tables available` : 'Create table schema'}
                  </div>
                </div>
              </div>
            </Button>

            {/* Process Node */}
            <Button
              onClick={handleProcessNodeClick}
              color="gray"
              size="sm"
              className="w-full justify-start transition-all hover:scale-105 hover:shadow-md"
              style={{ 
                borderLeft: `4px solid #3B82F6`,
                borderRadius: '0.5rem'
              }}
            >
              <div className="flex items-center space-x-3 w-full">
                <div style={{ color: '#3B82F6' }}>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-800">
                    Process Node
                  </div>
                  <div className="text-xs text-gray-500">
                    Transform • Data processing logic
                  </div>
                </div>
              </div>
            </Button>
          </div>

          {/* Available Tables Info */}
          {tableNames.length > 0 && (
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-2">Available Tables:</div>
              <div className="space-y-1">
                {tableNames.slice(0, 3).map(tableName => (
                  <div key={tableName} className="text-xs text-blue-700 flex items-center justify-between">
                    <span>{tableName}</span>
                    <span className="text-blue-500">{availableTables[tableName].length} cols</span>
                  </div>
                ))}
                {tableNames.length > 3 && (
                  <div className="text-xs text-blue-600">
                    +{tableNames.length - 3} more tables...
                  </div>
                )}
              </div>
              <div className="text-xs text-blue-600 mt-2">
                💡 Click "Data Node" to select a table
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600">
              <div className="font-medium mb-1">Quick Start:</div>
              <div className="space-y-1">
                <div>1. Go to Schema Designer to create tables</div>
                <div>2. Add Data nodes referencing those tables</div>
                <div>3. Add Process nodes to transform data</div>
                <div>4. Connect: Data → Process → Data</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Table Selection Modal */}
      <Modal show={showTableSelector} onClose={() => setShowTableSelector(false)} size="lg">
        <Modal.Header>Select Table for Data Node</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="table-select" className="mb-2 block">
                Choose a table from Schema Designer:
              </Label>
              <Select
                id="table-select"
                value={selectedTableName}
                onChange={(e) => setSelectedTableName(e.target.value)}
                required
              >
                <option value="">Select a table...</option>
                {tableNames.map(tableName => (
                  <option key={tableName} value={tableName}>
                    {tableName} ({availableTables[tableName].length} columns)
                  </option>
                ))}
              </Select>
            </div>

            {selectedTableName && availableTables[selectedTableName] && (
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-green-800 mb-2">
                  Table: {selectedTableName}
                </div>
                <div className="text-xs text-green-700">
                  <div className="font-medium mb-1">Columns ({availableTables[selectedTableName].length}):</div>
                  <div className="grid grid-cols-2 gap-1">
                    {availableTables[selectedTableName].map(col => (
                      <div key={col.id} className="flex items-center justify-between bg-white px-2 py-1 rounded">
                        <span>{col.name}</span>
                        <span className="text-green-600 text-xs">{col.dataType}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> The Data node will be created with the selected table's schema. You can modify it later in the node properties panel.
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            onClick={handleTableSelection} 
            disabled={!selectedTableName}
            color="blue"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Data Node
          </Button>
          <Button color="gray" onClick={() => setShowTableSelector(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NodePalette;
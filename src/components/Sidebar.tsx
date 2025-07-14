import React, { useState } from 'react';
import { FlowNode, TableColumn } from '../types/flow';
import { Button, Card, Label, TextInput, Textarea, Select } from 'flowbite-react';
import { Calendar, Tag, FileText, X, Trash2, Plus, Database, Code, Play } from 'lucide-react';
import { generatePythonCode } from '../utils/flowUtils';

interface SidebarProps {
  selectedNode: FlowNode | null;
  onNodeUpdate: (nodeId: string, updates: Partial<FlowNode['data']>) => void;
  onNodeDelete: (nodeId: string) => void;
  onClose: () => void;
  allNodes: FlowNode[];
  edges: any[];
  availableTables: Record<string, TableColumn[]>;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  selectedNode, 
  onNodeUpdate, 
  onNodeDelete,
  onClose,
  allNodes,
  edges,
  availableTables
}) => {
  const [showPythonCode, setShowPythonCode] = useState(false);

  const handleLabelChange = (newLabel: string) => {
    if (selectedNode) {
      onNodeUpdate(selectedNode.id, { 
        label: newLabel,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleDescriptionChange = (newDescription: string) => {
    if (selectedNode) {
      onNodeUpdate(selectedNode.id, { 
        description: newDescription,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleTableSelection = (tableName: string) => {
    if (!selectedNode || selectedNode.data.category !== 'Storage') return;

    const tableColumns = availableTables[tableName];
    if (!tableColumns) return;

    onNodeUpdate(selectedNode.id, {
      tableName,
      tableColumns: [...tableColumns], // Create a copy
      updatedAt: new Date().toISOString()
    });
  };

  const handleProcessLogicChange = (newLogic: string) => {
    if (selectedNode) {
      onNodeUpdate(selectedNode.id, { 
        processLogic: newLogic,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleAddColumn = (isOutput = false) => {
    if (!selectedNode) return;

    const newColumn: TableColumn = {
      id: `col-${Date.now()}`,
      name: `new_column_${Date.now()}`,
      dataType: 'string',
      description: 'New column'
    };

    if (selectedNode.data.category === 'Storage') {
      const currentColumns = selectedNode.data.tableColumns || [];
      onNodeUpdate(selectedNode.id, {
        tableColumns: [...currentColumns, newColumn],
        updatedAt: new Date().toISOString()
      });
    } else if (selectedNode.data.category === 'Transform' && isOutput) {
      const currentColumns = selectedNode.data.outputColumns || [];
      onNodeUpdate(selectedNode.id, {
        outputColumns: [...currentColumns, newColumn],
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleColumnUpdate = (columnId: string, updates: Partial<TableColumn>, isOutput = false) => {
    if (!selectedNode) return;

    if (selectedNode.data.category === 'Storage') {
      const updatedColumns = (selectedNode.data.tableColumns || []).map(col =>
        col.id === columnId ? { ...col, ...updates } : col
      );
      onNodeUpdate(selectedNode.id, {
        tableColumns: updatedColumns,
        updatedAt: new Date().toISOString()
      });
    } else if (selectedNode.data.category === 'Transform' && isOutput) {
      const updatedColumns = (selectedNode.data.outputColumns || []).map(col =>
        col.id === columnId ? { ...col, ...updates } : col
      );
      onNodeUpdate(selectedNode.id, {
        outputColumns: updatedColumns,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleColumnDelete = (columnId: string, isOutput = false) => {
    if (!selectedNode) return;

    if (selectedNode.data.category === 'Storage') {
      const updatedColumns = (selectedNode.data.tableColumns || []).filter(col => col.id !== columnId);
      onNodeUpdate(selectedNode.id, {
        tableColumns: updatedColumns,
        updatedAt: new Date().toISOString()
      });
    } else if (selectedNode.data.category === 'Transform' && isOutput) {
      const updatedColumns = (selectedNode.data.outputColumns || []).filter(col => col.id !== columnId);
      onNodeUpdate(selectedNode.id, {
        outputColumns: updatedColumns,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const generateCode = () => {
    if (!selectedNode || selectedNode.data.category !== 'Transform') return;

    // Find connected input data nodes (nodes that connect TO this process node)
    const connectedInputDataNodes = edges
      .filter(edge => edge.target === selectedNode.id)
      .map(edge => allNodes.find(node => node.id === edge.source))
      .filter(node => node && node.data.category === 'Storage') as FlowNode[];

    // Find connected output data nodes (nodes that this process node connects TO)
    const connectedOutputDataNodes = edges
      .filter(edge => edge.source === selectedNode.id)
      .map(edge => allNodes.find(node => node.id === edge.target))
      .filter(node => node && node.data.category === 'Storage') as FlowNode[];

    const pythonCode = generatePythonCode(selectedNode, connectedInputDataNodes, connectedOutputDataNodes);
    
    onNodeUpdate(selectedNode.id, {
      pythonCode,
      updatedAt: new Date().toISOString()
    });

    setShowPythonCode(true);
  };

  const handleDelete = () => {
    if (selectedNode && window.confirm('Are you sure you want to delete this node?')) {
      onNodeDelete(selectedNode.id);
      onClose();
    }
  };

  if (!selectedNode) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 flex flex-col items-center justify-center text-gray-500">
        <FileText className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-center text-gray-600 mb-4">
          Select a node to view and edit its properties
        </p>
        <div className="text-sm text-gray-500 text-center">
          <div className="mb-2 font-medium">Connection Flow:</div>
          <div className="space-y-1 text-xs">
            <div>📊 Data → 🔄 Process</div>
            <div>🔄 Process → 📊 Data</div>
            <div className="text-red-500">❌ Process → Process</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> Create tables in Table Manager first, then reference them when creating Data nodes for a streamlined workflow.
          </div>
        </div>
      </div>
    );
  }

  const isDataNode = selectedNode.data.category === 'Storage';
  const isProcessNode = selectedNode.data.category === 'Transform';

  // Get available table names
  const availableTableNames = Object.keys(availableTables);

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
      <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Node Properties</h3>
        <Button
          onClick={onClose}
          color="gray"
          size="xs"
          className="p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <Card className="shadow-sm">
          <div className="space-y-4">
            <div>
              <Label htmlFor="node-label" className="flex items-center mb-2">
                <Tag className="w-4 h-4 mr-2" />
                Label
              </Label>
              <TextInput
                id="node-label"
                value={selectedNode.data.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Enter node label"
              />
            </div>

            <div>
              <Label htmlFor="node-description" className="flex items-center mb-2">
                <FileText className="w-4 h-4 mr-2" />
                Description
              </Label>
              <Textarea
                id="node-description"
                value={selectedNode.data.description || ''}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                rows={3}
                placeholder="Add a description..."
              />
            </div>
          </div>
        </Card>

        {/* Data Node Specific Properties */}
        {isDataNode && (
          <Card className="shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-700 flex items-center">
                  <Database className="w-4 h-4 mr-2" />
                  Table Configuration
                </h4>
              </div>

              {/* Table Selection from Available Tables */}
              {availableTableNames.length > 0 && (
                <div>
                  <Label htmlFor="table-select" className="mb-2 block">Select from Available Tables</Label>
                  <Select
                    id="table-select"
                    value={selectedNode.data.tableName || ''}
                    onChange={(e) => handleTableSelection(e.target.value)}
                  >
                    <option value="">Choose a table...</option>
                    {availableTableNames.map(tableName => (
                      <option key={tableName} value={tableName}>
                        {tableName} ({availableTables[tableName].length} columns)
                      </option>
                    ))}
                  </Select>
                  <div className="text-xs text-blue-600 mt-1">
                    💡 Select a table created in Table Manager
                  </div>
                </div>
              )}

              {/* Read-only Table Name Display */}
              <div>
                <Label className="mb-2 block">Table Name</Label>
                <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {selectedNode.data.tableName || 'No table selected'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  💡 Table properties can only be changed in the Table Editor tab
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="block">Columns</Label>
                  <Button
                    onClick={() => handleAddColumn()}
                    color="blue"
                    size="xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(selectedNode.data.tableColumns || []).map((column) => (
                    <div key={column.id} className="bg-gray-50 p-2 rounded border">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              {column.name}
                            </span>
                            <Button
                              onClick={() => handleColumnDelete(column.id)}
                              color="failure"
                              size="xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Type: {column.dataType}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Process Node Specific Properties */}
        {isProcessNode && (
          <>
            <Card className="shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <Code className="w-4 h-4 mr-2" />
                    Process Configuration
                  </h4>
                  <Button
                    onClick={generateCode}
                    color="blue"
                    size="xs"
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Generate
                  </Button>
                </div>

                <div>
                  <Label htmlFor="process-logic" className="mb-2 block">Process Logic</Label>
                  <Textarea
                    id="process-logic"
                    value={selectedNode.data.processLogic || ''}
                    onChange={(e) => handleProcessLogicChange(e.target.value)}
                    rows={2}
                    placeholder="Describe the transformation logic..."
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="block">Output Columns</Label>
                    <Button
                      onClick={() => handleAddColumn(true)}
                      color="blue"
                      size="xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {(selectedNode.data.outputColumns || []).map((column) => (
                      <div key={column.id} className="bg-blue-50 p-2 rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <TextInput
                            value={column.name}
                            onChange={(e) => handleColumnUpdate(column.id, { name: e.target.value }, true)}
                            size="sm"
                            className="flex-1 mr-2"
                          />
                          <Button
                            onClick={() => handleColumnDelete(column.id, true)}
                            color="failure"
                            size="xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <Select
                          value={column.dataType}
                          onChange={(e) => handleColumnUpdate(column.id, { dataType: e.target.value as any }, true)}
                          size="sm"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                          <option value="date">Date</option>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Python Code Display */}
            {showPythonCode && selectedNode.data.pythonCode && (
              <Card className="shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <Code className="w-4 h-4 mr-2" />
                      Generated Python Code
                    </h4>
                    <Button
                      onClick={() => setShowPythonCode(false)}
                      color="gray"
                      size="xs"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto max-h-60 overflow-y-auto">
                    <code>{selectedNode.data.pythonCode}</code>
                  </pre>
                </div>
              </Card>
            )}
          </>
        )}

        <Card className="shadow-sm">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Timestamps
            </h4>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span className="font-medium">Created:</span>
                <span>{new Date(selectedNode.data.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Updated:</span>
                <span>{new Date(selectedNode.data.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>

        <Button
          onClick={handleDelete}
          color="failure"
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Node
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
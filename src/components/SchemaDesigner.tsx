import React, { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Database } from 'lucide-react';
import { Relationship } from '../types';
import { useTableManagement } from '../context/TableManagementContext';
import { getRelationshipColor } from '../utils/colorUtils';
import CreateTableForm from './CreateTableForm';
import EditTableSchemaForm from './EditTableSchemaForm';
import SchemaTableNode from './SchemaTableNode';

const SchemaDesigner: React.FC = () => {
  const {
    schema,
    tableData,
    createTable,
    updateTable,
    deleteTable,
    addRelationship
  } = useTableManagement();
  
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  // Convert tables to nodes
  const createNodes = (): Node[] => {
    return schema.tables.map((table, index) => ({
      id: table.id,
      type: 'schemaTableNode',
      position: table.position || { 
        x: 100 + (index % 3) * 350, 
        y: 100 + Math.floor(index / 3) * 300 
      },
      data: {
        table,
        tableData: tableData.find(td => td.schema.id === table.id),
        onEditClick: (tableId: string) => setEditingTableId(tableId)
      },
    }));
  };

  // Convert relationships to edges
  const createEdges = (): Edge[] => {
    return schema.relationships.map((rel) => {
      const edgeColor = getRelationshipColor(rel.fromTableId, rel.toTableId);
      
      return {
        id: rel.id,
        source: rel.fromTableId,
        target: rel.toTableId,
        sourceHandle: `${rel.fromColumnId}-source`,
        targetHandle: `${rel.toColumnId}-target`,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: edgeColor,
        },
        label: 'FOREIGN KEY',
        style: { 
          stroke: edgeColor, 
          strokeWidth: 3,
          filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))'
        },
        labelStyle: { 
          fill: edgeColor, 
          fontWeight: 700, 
          fontSize: 11,
          background: 'white',
          padding: '4px 8px',
          borderRadius: '6px',
          border: `2px solid ${edgeColor}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 0.9,
        },
      };
    });
  };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Update nodes and edges when schema changes
  useEffect(() => {
    const newNodes = createNodes();
    const newEdges = createEdges();
    setNodes(newNodes);
    setEdges(newEdges);
  }, [schema, tableData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target && params.sourceHandle && params.targetHandle) {
        if (params.sourceHandle.includes('-source') && params.targetHandle.includes('-target')) {
          const fromColumnId = params.sourceHandle.replace('-source', '');
          const toColumnId = params.targetHandle.replace('-target', '');

          if (fromColumnId && toColumnId) {
            const newRelationship: Relationship = {
              id: Date.now().toString(),
              fromTableId: params.source,
              fromColumnId,
              toTableId: params.target,
              toColumnId,
              type: 'one-to-many'
            };

            addRelationship(newRelationship);
          }
        }
      }
    },
    [addRelationship]
  );

  const onNodeDragStop = useCallback(
    (event: any, node: Node) => {
      updateTable(node.id, { position: node.position });
    },
    [updateTable]
  );

  const nodeTypes = {
    schemaTableNode: SchemaTableNode,
  };

  const editingTable = editingTableId ? schema.tables.find(t => t.id === editingTableId) : null;

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Table Management</h2>
            
            {editingTable ? (
              <EditTableSchemaForm
                tableSchema={editingTable}
                onUpdate={updateTable}
                onDelete={deleteTable}
                onClose={() => setEditingTableId(null)}
              />
            ) : (
              <CreateTableForm onCreate={createTable} />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Database Schema Designer</h1>
              <p className="text-gray-600">
                Visualize and manage relationships between your tables. Drag tables to reposition them and connect column handles to create relationships.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                {schema.tables.length} tables • {schema.relationships.length} relationships
              </div>
            </div>
          </div>
          
          {/* Connection Instructions */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Source (Blue)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="font-medium">Target (Green)</span>
              </div>
              <div className="text-sm text-blue-700 ml-4">
                Drag from a blue handle to a green handle to create foreign key relationships between columns. Each table pair gets a unique color.
              </div>
            </div>
          </div>
        </div>

        {/* Schema Visualization */}
        <div className="flex-1 bg-gray-50">
          {schema.tables.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-lg">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No Tables Found</h3>
                <p className="text-gray-500 mb-6">
                  Create tables using the form in the sidebar to visualize your database schema and create relationships between them.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-3">Getting Started:</h4>
                  <ol className="text-sm text-blue-800 text-left space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                      Use the form in the sidebar to create your first table
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                      Add columns with appropriate types and constraints
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                      Create more tables to see the visual schema
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                      Connect columns by dragging from blue to green handles
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              connectionLineStyle={{ 
                stroke: '#3B82F6', 
                strokeWidth: 3,
                strokeDasharray: '5,5'
              }}
              defaultEdgeOptions={{
                style: { stroke: '#3B82F6', strokeWidth: 3 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#3B82F6' },
              }}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.3}
              maxZoom={1.5}
              snapToGrid={true}
              snapGrid={[20, 20]}
            >
              <Controls 
                className="bg-white border border-gray-200 rounded-lg shadow-lg"
                showInteractive={false}
              />
              <MiniMap 
                nodeColor={(node) => '#3B82F6'}
                maskColor="rgba(0, 0, 0, 0.1)"
                className="bg-white border border-gray-200 rounded-lg shadow-lg"
              />
              <Background 
                variant="dots" 
                gap={20} 
                size={1} 
                color="#E5E7EB" 
              />
            </ReactFlow>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaDesigner;
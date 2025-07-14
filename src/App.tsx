import React, { useState, useCallback } from 'react';
import TabBar from './components/TabBar';
import FlowCanvas from './components/FlowCanvas';
import Sidebar from './components/Sidebar';
import NodePalette from './components/NodePalette';
import TableEditor from './components/TableEditor';
import SchemaDesigner from './components/SchemaDesigner';
import DataImportExport from './components/DataImportExport';
import { FlowTab, FlowNode, FlowEdge, NodeType, TableColumn } from './types/flow';
import { createNewNode, getRandomPosition } from './utils/flowUtils';
import { Workflow, Table, FileText, GitBranch } from 'lucide-react';
import { Card, Badge } from 'flowbite-react';
import { TableManagementProvider, useTableManagement } from './context/TableManagementContext';

// Main App Content Component
function AppContent() {
  const { tableData, schema } = useTableManagement();
  
  const [tabs, setTabs] = useState<FlowTab[]>([
    {
      id: 'tab-1',
      name: 'Data Pipeline 1',
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString()
    }
  ]);

  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);

  // Check if current tab is a special tab
  const isTableEditorActive = activeTabId === 'table-editor';
  const isSchemaDesignerActive = activeTabId === 'schema-designer';
  const isDataImportExportActive = activeTabId === 'data-import-export';
  const isSpecialTab = isTableEditorActive || isSchemaDesignerActive || isDataImportExportActive;
  
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  // Convert table data to available tables format for NodePalette
  const availableTables = tableData.reduce((acc, table) => {
    acc[table.schema.name] = table.schema.columns.map(col => ({
      id: col.id,
      name: col.name,
      dataType: col.type as 'string' | 'number' | 'boolean' | 'date',
      description: col.name
    }));
    return acc;
  }, {} as Record<string, TableColumn[]>);

  const handleTabCreate = useCallback(() => {
    const newTab: FlowTab = {
      id: `tab-${Date.now()}`,
      name: `Data Pipeline ${tabs.length + 1}`,
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString()
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setSelectedNode(null);
  }, [tabs.length]);

  const handleTabDelete = useCallback((tabId: string) => {
    // Prevent deletion of special tabs and ensure at least one regular tab remains
    if (['table-editor', 'schema-designer', 'data-import-export'].includes(tabId)) return;
    if (tabs.length <= 1) return;
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      setActiveTabId(remainingTabs[0].id);
    }
    setSelectedNode(null);
  }, [tabs, activeTabId]);

  const handleTabRename = useCallback((tabId: string, newName: string) => {
    // Prevent renaming special tabs
    if (['table-editor', 'schema-designer', 'data-import-export'].includes(tabId)) return;
    
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, name: newName } : tab
    ));
  }, []);

  const handleTabSelect = useCallback((tabId: string) => {
    if (tabId !== activeTabId) {
      setActiveTabId(tabId);
      setSelectedNode(null);
    }
  }, [activeTabId]);

  const handleAddNode = useCallback((nodeType: NodeType, tableName?: string, tableColumns?: TableColumn[]) => {
    if (!activeTab || isSpecialTab) return;

    const newNode = createNewNode(nodeType, getRandomPosition(), tableName, tableColumns);
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, nodes: [...tab.nodes, newNode] }
        : tab
    ));
  }, [activeTab, activeTabId, isSpecialTab]);

  // Optimized handlers with better performance
  const handleNodesChange = useCallback((nodes: FlowNode[]) => {
    if (isSpecialTab) return;
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, nodes }
        : tab
    ));
  }, [activeTabId, isSpecialTab]);

  const handleEdgesChange = useCallback((edges: FlowEdge[]) => {
    if (isSpecialTab) return;
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, edges }
        : tab
    ));
  }, [activeTabId, isSpecialTab]);

  const handleNodeSelect = useCallback((node: FlowNode | null) => {
    if (!isSpecialTab) {
      setSelectedNode(node);
    }
  }, [isSpecialTab]);

  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<FlowNode['data']>) => {
    if (isSpecialTab) return;
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            nodes: tab.nodes.map(node => 
              node.id === nodeId 
                ? { ...node, data: { ...node.data, ...updates } }
                : node
            )
          }
        : tab
    ));

    // Update selected node if it's the one being updated
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prev => prev ? {
        ...prev,
        data: { ...prev.data, ...updates }
      } : null);
    }
  }, [activeTabId, selectedNode, isSpecialTab]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    if (isSpecialTab) return;
    
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? {
            ...tab,
            nodes: tab.nodes.filter(node => node.id !== nodeId),
            edges: tab.edges.filter(edge => 
              edge.source !== nodeId && edge.target !== nodeId
            )
          }
        : tab
    ));
    setSelectedNode(null);
  }, [activeTabId, isSpecialTab]);

  const getNodeStats = () => {
    if (!activeTab) return { dataNodes: 0, processNodes: 0 };
    const dataNodes = activeTab.nodes.filter(n => n.data.category === 'Storage').length;
    const processNodes = activeTab.nodes.filter(n => n.data.category === 'Transform').length;
    return { dataNodes, processNodes };
  };

  const { dataNodes, processNodes } = getNodeStats();

  // Create extended tabs list with special tabs
  const extendedTabs = [
    ...tabs,
    {
      id: 'table-editor',
      name: 'Table Editor',
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      isFixed: true,
      icon: 'Table'
    },
    {
      id: 'schema-designer',
      name: 'Schema Designer',
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      isFixed: true,
      icon: 'GitBranch'
    },
    {
      id: 'data-import-export',
      name: 'Import/Export',
      nodes: [],
      edges: [],
      createdAt: new Date().toISOString(),
      isFixed: true,
      icon: 'FileText'
    }
  ];

  const getTabIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Table': return <Table className="w-4 h-4" />;
      case 'GitBranch': return <GitBranch className="w-4 h-4" />;
      case 'FileText': return <FileText className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 shadow-sm">
        <div className="px-4 py-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Workflow className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Data Pipeline Builder</h1>
                <p className="text-sm text-gray-600">Design and generate pandas data processing pipelines</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {isTableEditorActive ? (
                <div className="flex items-center space-x-2">
                  <Table className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-700">Table Editor</span>
                  <Badge color="success" size="sm">
                    {tableData.length} Tables
                  </Badge>
                </div>
              ) : isSchemaDesignerActive ? (
                <div className="flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-gray-700">Schema Designer</span>
                  <Badge color="purple" size="sm">
                    {schema.relationships.length} Relationships
                  </Badge>
                </div>
              ) : isDataImportExportActive ? (
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-gray-700">Import/Export</span>
                  <Badge color="warning" size="sm">
                    Data Management
                  </Badge>
                </div>
              ) : activeTab ? (
                <>
                  <span className="font-medium text-gray-700">{activeTab.name}</span>
                  <div className="flex items-center space-x-4 mt-1">
                    {dataNodes > 0 && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        {dataNodes} Data
                      </span>
                    )}
                    {processNodes > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {processNodes} Process
                      </span>
                    )}
                    {activeTab.edges.length > 0 && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {activeTab.edges.length} connections
                      </span>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {/* Tab Bar */}
      <TabBar
        tabs={extendedTabs}
        activeTabId={activeTabId}
        onTabSelect={handleTabSelect}
        onTabCreate={handleTabCreate}
        onTabDelete={handleTabDelete}
        onTabRename={handleTabRename}
        getTabIcon={getTabIcon}
      />

      {/* Main Content */}
      <div className="flex-1 flex">
        {isTableEditorActive ? (
          <TableEditor />
        ) : isSchemaDesignerActive ? (
          <SchemaDesigner />
        ) : isDataImportExportActive ? (
          <DataImportExport 
            flowTabs={tabs}
            activeTabId={activeTabId}
            setTabs={setTabs}
            setActiveTabId={setActiveTabId}
          />
        ) : (
          <>
            {/* Left Sidebar - Node Palette */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
              <NodePalette 
                onAddNode={handleAddNode}
                availableTables={availableTables}
              />
            </div>

            {/* Center - Flow Canvas */}
            {activeTab && (
              <FlowCanvas
                nodes={activeTab.nodes}
                edges={activeTab.edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onNodeSelect={handleNodeSelect}
                selectedNodeId={selectedNode?.id || null}
              />
            )}
            
            {/* Right Sidebar - Node Properties */}
            <Sidebar
              selectedNode={selectedNode}
              onNodeUpdate={handleNodeUpdate}
              onNodeDelete={handleNodeDelete}
              onClose={() => setSelectedNode(null)}
              allNodes={activeTab?.nodes || []}
              edges={activeTab?.edges || []}
              availableTables={availableTables}
            />
          </>
        )}
      </div>
    </div>
  );
}

// Main App Component with Provider
function App() {
  return (
    <TableManagementProvider>
      <AppContent />
    </TableManagementProvider>
  );
}

export default App;
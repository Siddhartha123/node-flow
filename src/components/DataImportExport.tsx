import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, Database, AlertCircle, CheckCircle, Workflow } from 'lucide-react';
import { exportToJSON, exportToCSV, importFromJSON, importFromCSV } from '../utils/dataUtils';
import { useTableManagement } from '../context/TableManagementContext';
import { FlowTab } from '../types/flow';

interface DataImportExportProps {
  flowTabs?: FlowTab[];
  activeTabId?: string;
  setTabs?: (tabs: FlowTab[]) => void;
  setActiveTabId?: (tabId: string) => void;
}

const DataImportExport: React.FC<DataImportExportProps> = ({
  flowTabs = [],
  activeTabId,
  setTabs,
  setActiveTabId
}) => {
  const { tableData, schema, setTableData, setSchema } = useTableManagement();
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportAll = () => {
    if (tableData.length === 0 && flowTabs.length === 0) {
      setImportStatus({ type: 'error', message: 'No data or pipeline to export' });
      return;
    }
    
    exportToJSON(tableData, schema, flowTabs, activeTabId);
    
    const pipelineCount = flowTabs.length;
    const nodeCount = flowTabs.reduce((total, tab) => total + tab.nodes.length, 0);
    const edgeCount = flowTabs.reduce((total, tab) => total + tab.edges.length, 0);
    
    setImportStatus({ 
      type: 'success', 
      message: `Complete pipeline exported successfully! (${tableData.length} tables, ${schema.relationships.length} relationships, ${pipelineCount} pipeline tabs, ${nodeCount} nodes, ${edgeCount} connections)` 
    });
  };

  const handleExportTable = (tableId: string) => {
    const table = tableData.find(t => t.schema.id === tableId);
    if (!table) return;
    
    exportToCSV(table);
    setImportStatus({ type: 'success', message: `${table.schema.name} exported successfully!` });
  };

  const handleImportJSON = async (file: File) => {
    try {
      const data = await importFromJSON(file);
      
      if (data.tables && Array.isArray(data.tables)) {
        const newTableData = data.tables.map((table: any) => ({
          schema: {
            ...table.schema,
            id: table.schema.id || Date.now().toString()
          },
          rows: table.data || []
        }));
        
        const newSchema = {
          tables: newTableData.map((td: any) => td.schema),
          relationships: data.relationships || []
        };
        
        setTableData(newTableData);
        setSchema(newSchema);
        
        // Import pipeline data if available and handlers are provided
        if (data.flowTabs && Array.isArray(data.flowTabs) && setTabs) {
          const importedTabs = data.flowTabs.filter((tab: FlowTab) => 
            !['table-editor', 'schema-designer', 'data-import-export'].includes(tab.id)
          );
          
          if (importedTabs.length > 0) {
            setTabs(importedTabs);
            
            // Set active tab if provided and valid
            if (data.activeTabId && setActiveTabId) {
              const validTabId = importedTabs.find((tab: FlowTab) => tab.id === data.activeTabId);
              if (validTabId) {
                setActiveTabId(data.activeTabId);
              } else if (importedTabs.length > 0) {
                setActiveTabId(importedTabs[0].id);
              }
            }
          }
        }
        
        const relationshipCount = data.relationships ? data.relationships.length : 0;
        const pipelineCount = data.flowTabs ? data.flowTabs.length : 0;
        const nodeCount = data.flowTabs ? data.flowTabs.reduce((total: number, tab: FlowTab) => total + tab.nodes.length, 0) : 0;
        const edgeCount = data.flowTabs ? data.flowTabs.reduce((total: number, tab: FlowTab) => total + tab.edges.length, 0) : 0;
        
        let message = `Data imported successfully! (${newTableData.length} tables, ${relationshipCount} relationships`;
        if (pipelineCount > 0) {
          message += `, ${pipelineCount} pipeline tabs, ${nodeCount} nodes, ${edgeCount} connections`;
        }
        message += ')';
        
        setImportStatus({ 
          type: 'success', 
          message 
        });
      } else {
        throw new Error('Invalid JSON format');
      }
    } catch (error) {
      setImportStatus({ 
        type: 'error', 
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const handleImportCSV = async (file: File, tableId: string) => {
    try {
      const table = tableData.find(t => t.schema.id === tableId);
      if (!table) throw new Error('Table not found');
      
      const rows = await importFromCSV(file, table.schema.columns);
      
      setTableData(prev => prev.map(t => 
        t.schema.id === tableId 
          ? { ...t, rows: [...t.rows, ...rows] }
          : t
      ));
      
      setImportStatus({ 
        type: 'success', 
        message: `${rows.length} rows imported successfully!` 
      });
    } catch (error) {
      setImportStatus({ 
        type: 'error', 
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'json') {
      handleImportJSON(file);
    } else {
      setImportStatus({ type: 'error', message: 'Please select a JSON file for full data import' });
    }
    
    // Reset file input
    event.target.value = '';
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>, tableId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      handleImportCSV(file, tableId);
    } else {
      setImportStatus({ type: 'error', message: 'Please select a CSV file' });
    }
    
    // Reset file input
    event.target.value = '';
  };

  const totalNodes = flowTabs.reduce((total, tab) => total + tab.nodes.length, 0);
  const totalEdges = flowTabs.reduce((total, tab) => total + tab.edges.length, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Import & Export Data</h1>
            <p className="text-gray-600">
              Manage your complete data pipeline including table data, schema, relationships, nodes, and connections
            </p>
          </div>

          {/* Status Messages */}
          {importStatus.type && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              importStatus.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {importStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{importStatus.message}</span>
              <button
                onClick={() => setImportStatus({ type: null, message: '' })}
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          )}

          {/* Pipeline Overview */}
          {flowTabs.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Workflow className="w-5 h-5 text-blue-600" />
                <h3 className="font-medium text-blue-900">Current Pipeline Overview</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{flowTabs.length}</div>
                  <div className="text-blue-600">Pipeline Tabs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{totalNodes}</div>
                  <div className="text-blue-600">Total Nodes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{totalEdges}</div>
                  <div className="text-blue-600">Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-700">{tableData.length}</div>
                  <div className="text-blue-600">Tables</div>
                </div>
              </div>
            </div>
          )}

          {/* Import Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Data & Pipeline
              </h2>
              <p className="text-gray-600 mt-1">
                Import complete pipeline including table data, schema, relationships, nodes, and connections
              </p>
            </div>
            
            <div className="p-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Full Pipeline Import */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Workflow className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Complete Pipeline</h3>
                      <p className="text-sm text-gray-500">Import everything: schema, data, nodes, and connections</p>
                    </div>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Choose JSON File
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Supports JSON files exported from this application with complete pipeline data
                  </p>
                </div>

                {/* CSV Import Info */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">CSV Import</h3>
                      <p className="text-sm text-gray-500">Add data to existing tables</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Use the CSV import buttons in the Export section below to add data to specific tables.
                    Note: CSV import only adds table data, not pipeline structure.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Export Data & Pipeline
                  </h2>
                  <p className="text-gray-600 mt-1">
                    Export your complete pipeline and data to various formats
                  </p>
                </div>
                
                <button
                  onClick={handleExportAll}
                  disabled={tableData.length === 0 && flowTabs.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Complete Pipeline
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {tableData.length === 0 && flowTabs.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Data or Pipeline Available</h3>
                  <p className="text-gray-500">Create some tables or build a pipeline first to export data</p>
                </div>
              ) : (
                <>
                  {/* Individual Table Export */}
                  {tableData.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium text-gray-900 mb-3">Individual Table Export</h3>
                      <div className="grid gap-4">
                        {tableData.map((table) => (
                          <div
                            key={table.schema.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Database className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{table.schema.name}</h4>
                                  <p className="text-sm text-gray-500">
                                    {table.schema.columns.length} columns • {table.rows.length} rows
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleExportTable(table.schema.id)}
                                  disabled={table.rows.length === 0}
                                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                                >
                                  <Download className="w-3 h-3" />
                                  Export CSV
                                </button>
                                
                                <div className="relative">
                                  <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => handleCSVUpload(e, table.schema.id)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  />
                                  <button className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm">
                                    <Upload className="w-3 h-3" />
                                    Import CSV
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Data Format Information */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">Supported Formats</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">JSON Export/Import</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Complete pipeline with all nodes and connections</li>
                  <li>• Database schema and table data</li>
                  <li>• Table relationships and foreign keys</li>
                  <li>• Node properties and configurations</li>
                  <li>• Best for complete backups and migrations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">CSV Export/Import</h4>
                <ul className="text-gray-600 space-y-1">
                  <li>• Individual table data only</li>
                  <li>• Compatible with Excel and other tools</li>
                  <li>• Header row contains column names</li>
                  <li>• No pipeline structure or relationships</li>
                  <li>• Best for data exchange with external systems</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImportExport;
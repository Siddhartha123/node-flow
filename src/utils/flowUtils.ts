import { NodeType, FlowNode, TableColumn } from '../types/flow';

export const nodeTypes: NodeType[] = [
  {
    id: 'data',
    label: 'Data',
    color: '#10B981',
    icon: 'Database',
    category: 'Storage'
  },
  {
    id: 'process',
    label: 'Process',
    color: '#3B82F6',
    icon: 'Zap',
    category: 'Transform'
  }
];

export const createNewNode = (
  type: NodeType, 
  position: { x: number; y: number },
  tableName?: string,
  tableColumns?: TableColumn[]
): FlowNode => {
  const now = new Date().toISOString();
  const baseNode = {
    id: `${type.id}-${Date.now()}`,
    type: 'default',
    position,
    data: {
      label: type.label,
      description: `A new ${type.label.toLowerCase()} node`,
      color: type.color,
      category: type.category,
      createdAt: now,
      updatedAt: now
    }
  };

  // Add specific properties based on node type
  if (type.id === 'data') {
    return {
      ...baseNode,
      data: {
        ...baseNode.data,
        label: tableName ? `Data (${tableName})` : type.label,
        tableName: tableName || 'new_table',
        tableColumns: tableColumns || [
          {
            id: `col-${Date.now()}`,
            name: 'column_1',
            dataType: 'string',
            description: 'Sample column'
          }
        ]
      }
    };
  }

  if (type.id === 'process') {
    return {
      ...baseNode,
      data: {
        ...baseNode.data,
        inputColumns: [],
        outputColumns: [
          {
            id: `col-${Date.now()}`,
            name: 'processed_column',
            dataType: 'string',
            description: 'Processed output column'
          }
        ],
        processLogic: 'Transform input data',
        pythonCode: ''
      }
    };
  }

  return baseNode;
};

export const getRandomPosition = () => ({
  x: Math.random() * 400 + 100,
  y: Math.random() * 300 + 100
});

export const generatePythonCode = (processNode: FlowNode, connectedDataNodes: FlowNode[], outputDataNodes: FlowNode[] = []): string => {
  if (processNode.data.category !== 'Transform') return '';

  const inputTables = connectedDataNodes.map(node => node.data.tableName || 'df').join(', ');
  const outputTableName = outputDataNodes.length > 0 
    ? outputDataNodes[0].data.tableName || `${processNode.data.label.toLowerCase().replace(/\s+/g, '_')}_output`
    : `${processNode.data.label.toLowerCase().replace(/\s+/g, '_')}_output`;
  
  let code = `# Generated Python code for ${processNode.data.label}\n`;
  code += `import pandas as pd\n\n`;
  
  // Read input data
  if (connectedDataNodes.length > 0) {
    connectedDataNodes.forEach(dataNode => {
      const tableName = dataNode.data.tableName || 'df';
      code += `# Load ${dataNode.data.label} data\n`;
      code += `${tableName} = pd.read_csv('${tableName}.csv')\n`;
    });
    code += `\n`;
  }

  // Process logic
  code += `# Process logic: ${processNode.data.processLogic || 'Transform data'}\n`;
  
  if (connectedDataNodes.length === 1) {
    const inputTable = connectedDataNodes[0].data.tableName || 'df';
    code += `${outputTableName} = ${inputTable}.copy()\n`;
    
    // Add transformations for each output column
    processNode.data.outputColumns?.forEach(col => {
      switch (col.dataType) {
        case 'string':
          code += `${outputTableName}['${col.name}'] = ${inputTable}['${processNode.data.inputColumns?.[0] || 'column_1'}'].astype(str)\n`;
          break;
        case 'number':
          code += `${outputTableName}['${col.name}'] = pd.to_numeric(${inputTable}['${processNode.data.inputColumns?.[0] || 'column_1'}'], errors='coerce')\n`;
          break;
        case 'date':
          code += `${outputTableName}['${col.name}'] = pd.to_datetime(${inputTable}['${processNode.data.inputColumns?.[0] || 'column_1'}'], errors='coerce')\n`;
          break;
        case 'boolean':
          code += `${outputTableName}['${col.name}'] = ${inputTable}['${processNode.data.inputColumns?.[0] || 'column_1'}'].astype(bool)\n`;
          break;
      }
    });
  } else if (connectedDataNodes.length > 1) {
    // Merge multiple input tables
    const tables = connectedDataNodes.map(node => node.data.tableName || 'df');
    code += `${outputTableName} = pd.concat([${tables.join(', ')}], axis=1)\n`;
  } else {
    // No input connections
    code += `${outputTableName} = pd.DataFrame()\n`;
    processNode.data.outputColumns?.forEach(col => {
      code += `${outputTableName}['${col.name}'] = []\n`;
    });
  }

  // Add output column transformations if specified
  if (processNode.data.outputColumns && processNode.data.outputColumns.length > 0) {
    code += `\n# Apply output column transformations\n`;
    processNode.data.outputColumns.forEach(col => {
      if (col.description && col.description !== 'Processed output column') {
        code += `# ${col.name}: ${col.description}\n`;
      }
    });
  }

  code += `\n# Save output to target data node\n`;
  code += `${outputTableName}.to_csv('${outputTableName}.csv', index=False)\n`;
  code += `print(f"Processed data saved to ${outputTableName}.csv")\n`;
  code += `print(f"Output shape: {${outputTableName}.shape}")\n`;
  code += `print(f"Output columns: {list(${outputTableName}.columns)}")`;

  return code;
}
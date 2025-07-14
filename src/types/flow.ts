export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    description?: string;
    color?: string;
    category?: string;
    createdAt: string;
    updatedAt: string;
    // Data node specific properties
    tableColumns?: TableColumn[];
    tableName?: string;
    // Process node specific properties
    inputColumns?: string[]; // Column IDs from connected data nodes
    outputColumns?: TableColumn[];
    processLogic?: string;
    pythonCode?: string;
  };
}

export interface TableColumn {
  id: string;
  name: string;
  dataType: 'string' | 'number' | 'boolean' | 'date';
  description?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface FlowTab {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: string;
}

export interface NodeType {
  id: string;
  label: string;
  color: string;
  icon: string;
  category: string;
}
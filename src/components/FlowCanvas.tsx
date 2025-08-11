import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  ConnectionMode,
  NodeChange,
  EdgeChange
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import UndoRedoControls from './UndoRedoControls';
import { FlowNode, FlowEdge } from '../types/flow';
import { useUndoRedo } from '../hooks/useUndoRedo';

interface FlowCanvasProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: (nodes: FlowNode[]) => void;
  onEdgesChange: (edges: FlowEdge[]) => void;
  onNodeSelect: (node: FlowNode | null) => void;
  selectedNodeId: string | null;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  selectedNodeId
}) => {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes as Node[]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges as Edge[]);
  
  // Undo/Redo functionality
  const undoRedo = useUndoRedo(initialNodes, initialEdges) as any;
  const { canUndo, canRedo, undo, redo, saveState, clearHistory, getCurrentState } = undoRedo;
  
  // Use refs to track if we're in the middle of an update to prevent loops
  const isUpdatingFromProps = useRef(false);
  const isUpdatingFromInternal = useRef(false);
  const isUndoRedoOperation = useRef(false);
  const lastSavedState = useRef<string>('');

  // Update internal state when props change (tab switching)
  useEffect(() => {
    if (!isUpdatingFromInternal.current && !isUndoRedoOperation.current) {
      isUpdatingFromProps.current = true;
      setNodes(initialNodes as Node[]);
      setEdges(initialEdges as Edge[]);
      clearHistory();
      isUpdatingFromProps.current = false;
    }
  }, [initialNodes, initialEdges, setNodes, setEdges, clearHistory]);

  // Handle undo/redo state restoration
  const handleUndo = useCallback(() => {
    isUndoRedoOperation.current = true;
    undo();
    const currentState = getCurrentState();
    setNodes(currentState.nodes as Node[]);
    setEdges(currentState.edges as Edge[]);
    onNodesChange(currentState.nodes);
    onEdgesChange(currentState.edges);
    setTimeout(() => {
      isUndoRedoOperation.current = false;
    }, 100);
  }, [undo, getCurrentState, setNodes, setEdges, onNodesChange, onEdgesChange]);

  const handleRedo = useCallback(() => {
    isUndoRedoOperation.current = true;
    redo();
    const currentState = getCurrentState();
    setNodes(currentState.nodes as Node[]);
    setEdges(currentState.edges as Edge[]);
    onNodesChange(currentState.nodes);
    onEdgesChange(currentState.edges);
    setTimeout(() => {
      isUndoRedoOperation.current = false;
    }, 100);
  }, [redo, getCurrentState, setNodes, setEdges, onNodesChange, onEdgesChange]);

  // Save state for undo/redo when nodes or edges change
  const saveCurrentState = useCallback(() => {
    if (!isUpdatingFromProps.current && !isUndoRedoOperation.current) {
      const currentStateString = JSON.stringify({ nodes, edges });
      if (currentStateString !== lastSavedState.current) {
        saveState(nodes as FlowNode[], edges as FlowEdge[]);
        lastSavedState.current = currentStateString;
      }
    }
  }, [nodes, edges, saveState]);

  // Debounced sync to parent - only sync when not updating from props
  useEffect(() => {
    if (!isUpdatingFromProps.current && !isUndoRedoOperation.current) {
      const timeoutId = setTimeout(() => {
        isUpdatingFromInternal.current = true;
        onNodesChange(nodes as FlowNode[]);
        saveCurrentState();
        isUpdatingFromInternal.current = false;
      }, 300); // Increased debounce for better undo/redo grouping

      return () => clearTimeout(timeoutId);
    }
  }, [nodes, onNodesChange, saveCurrentState]);

  useEffect(() => {
    if (!isUpdatingFromProps.current && !isUndoRedoOperation.current) {
      const timeoutId = setTimeout(() => {
        isUpdatingFromInternal.current = true;
        onEdgesChange(edges as FlowEdge[]);
        saveCurrentState();
        isUpdatingFromInternal.current = false;
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [edges, onEdgesChange, saveCurrentState]);

  // Handle node changes with better performance
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChangeInternal(changes);
  }, [onNodesChangeInternal]);

  // Handle edge changes with better performance
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    onEdgesChangeInternal(changes);
  }, [onEdgesChangeInternal]);

  // Improved connection handler with proper handle targeting
  const onConnect = useCallback(
    (params: Connection) => {
      // Ensure we have proper source and target handles
      const sourceHandle = params.sourceHandle || 'output';
      const targetHandle = params.targetHandle || 'input';
      
      const newEdge = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        sourceHandle,
        targetHandle,
        animated: true,
        style: { 
          stroke: '#6b7280', 
          strokeWidth: 2,
          strokeDasharray: '0'
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#6b7280',
          width: 20,
          height: 20
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Updated connection validation to support the new flow patterns
  const isValidConnection = useCallback((connection: Connection) => {
    // Prevent self-connections
    if (connection.source === connection.target) {
      return false;
    }

    // Find source and target nodes
    const sourceNode = nodes.find(n => n.id === connection.source) as FlowNode;
    const targetNode = nodes.find(n => n.id === connection.target) as FlowNode;

    if (!sourceNode || !targetNode) return false;

    // Valid connection patterns:
    // 1. Data → Process (Data provides input to processing)
    // 2. Process → Data (Process outputs to data storage)
    // Invalid: Process → Process (direct process chaining not allowed)
    const isValidSourceToTarget = 
      ((sourceNode.data.category === 'Storage' || sourceNode.data.category === 'Miscellaneous') && targetNode.data.category === 'Transform') ||
      (sourceNode.data.category === 'Transform' && (targetNode.data.category === 'Storage' || targetNode.data.category === 'Miscellaneous'));

    // Ensure we're connecting from output to input handles
    const sourceHandle = connection.sourceHandle || 'output';
    const targetHandle = connection.targetHandle || 'input';

    return isValidSourceToTarget && (sourceHandle === 'output' || sourceHandle === 'output-right') && (targetHandle === 'input' || targetHandle === 'input-left');
  }, [nodes]);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      onNodeSelect(node as FlowNode);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  const nodeTypes = useMemo(() => ({
    default: CustomNode
  }), []);

  // Memoize nodes with selection state to prevent unnecessary re-renders
  const nodesWithSelection = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      selected: node.id === selectedNodeId
    }));
  }, [nodes, selectedNodeId]);

  // Empty state component
  const EmptyState = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">Empty Canvas</h3>
        <p className="text-gray-500 max-w-sm">
          Start building your data processing pipeline by adding Data and Process nodes from the palette
        </p>
        <div className="mt-4 text-sm text-gray-400">
          <div className="mb-2">📊 Data → 🔄 Process → 📊 Data</div>
          <div className="text-xs">Connect Data nodes to Process nodes, then Process nodes back to Data nodes</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-gray-50 relative">
      {/* Undo/Redo Controls */}
      <div className="absolute top-4 right-4 z-10">
        <UndoRedoControls
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClearHistory={clearHistory}
        />
      </div>

      <ReactFlow
        nodes={nodesWithSelection}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={isValidConnection}
        fitView
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnDrag={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        deleteKeyCode="Delete"
        snapToGrid={true}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#6b7280', strokeWidth: 2 }
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="#e5e7eb"
        />
        <Controls 
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
          showInteractive={false}
        />
        <MiniMap 
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
          nodeColor={(node) => (node as FlowNode).data.color || '#6b7280'}
          maskColor="rgba(255, 255, 255, 0.8)"
          pannable
          zoomable
        />
      </ReactFlow>
      
      {/* Show empty state when no nodes */}
      {nodes.length === 0 && <EmptyState />}
    </div>
  );
};

export default FlowCanvas;
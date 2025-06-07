import React, { useCallback } from 'react';
import {
    ReactFlow,
    addEdge,
    Connection,
    Edge,
    applyEdgeChanges,
    EdgeChange,
    useNodesState,
    useEdgesState,
    useReactFlow,
    Background
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';
import { useDeleteSelection } from './hooks/useDeleteSelection.ts'; // adjust path

export default function FlowCanvas() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { project } = useReactFlow();

    useDeleteSelection(); // defaults to ['Delete']

    const addFlowNode = useCallback(() => {
        const id = 'flow_' + `${+new Date().getSeconds()}`;
        const position = { x: Math.random() * 400, y: Math.random() * 400 };

        const newNode = {
            id,
            type: 'default',
            position,
            data: { label: `Node ${id}` },
            style: {
                backgroundColor: '#D6D5E6',
                color: '#333',
                border: '1px solid #222138',
                width: 200,
                zIndex: 10
            },
        };

        setNodes((nds) => [...nds, newNode]);
    }, [project, setNodes]);

    const addResourceNode = useCallback(() => {
        const id = 'res_' + `${+new Date().getSeconds()}`;
        const position = { x: Math.random() * 400, y: Math.random() * 400 };

        const newNode = {
            id,
            type: 'default',
            position,
            data: { label: `Node ${id}` },
            style: {
                backgroundColor: '#e5e6d5',
                color: '#333',
                border: '1px solid #222138',
                width: 200,
                zIndex: 10
            },
        };

        setNodes((nds) => [...nds, newNode]);
    }, [project, setNodes]);



    // This gets called when a new connection (edge) is created
    const onConnect = useCallback(
        (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
        []
    );


    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <button
                onClick={addFlowNode}
                style={{ position: 'absolute', zIndex: 10, top: "60%", left: 10 }}
            >
                ➕ Add Flow Node
            </button>

            <button
                onClick={addResourceNode}
                style={{ position: 'absolute', zIndex: 10, top: "40%", left: 10 }}
            >
                ➕ Add Resource Node
            </button>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            >
                <Background
                    color="#aaa"       // Color of the background grid/dots
                    gap={12}           // Gap between lines
                    size={1}           // Thickness of the lines
                    variant="dots"     // "dots" or "lines"
                />
            </ReactFlow>
        </div>
    );
}

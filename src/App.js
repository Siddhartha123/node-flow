import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import FlowCanvas from './FlowCanvas';

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowCanvas />
    </ReactFlowProvider>
  );
}

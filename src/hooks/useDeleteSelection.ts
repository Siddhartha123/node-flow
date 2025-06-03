// hooks/useDeleteSelection.ts
import { useEffect } from 'react';
import { useReactFlow, useStore, } from '@xyflow/react';

export function useDeleteSelection({
  enabledKeys = ['Delete'],
}: {
  enabledKeys?: string[];
} = {}) {
  const { getEdges, setEdges, getNodes, setNodes } = useReactFlow();
  const selectedEdges = useStore((s) => s.edges.filter((e) => e.selected));
  const selectedNodes = useStore((s) => s.nodes.filter((n) => n.selected));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enabledKeys.includes(event.key)) return;

      const remainingEdges = getEdges().filter(
        (edge) => !selectedEdges.some((se) => se.id === edge.id)
      );
      const remainingNodes = getNodes().filter(
        (node) => !selectedNodes.some((sn) => sn.id === node.id)
      );

      setEdges(remainingEdges);
      setNodes(remainingNodes);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabledKeys, getEdges, setEdges, getNodes, setNodes, selectedEdges, selectedNodes]);
}

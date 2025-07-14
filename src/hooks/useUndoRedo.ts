import { useState, useCallback, useRef } from 'react';
import { FlowNode, FlowEdge } from '../types/flow';

interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface UseUndoRedoReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  saveState: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_SIZE = 50;

export const useUndoRedo = (
  initialNodes: FlowNode[] = [],
  initialEdges: FlowEdge[] = []
): UseUndoRedoReturn => {
  const [history, setHistory] = useState<FlowState[]>([
    { nodes: initialNodes, edges: initialEdges }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  const saveState = useCallback((nodes: FlowNode[], edges: FlowEdge[]) => {
    // Don't save state if we're in the middle of an undo/redo operation
    if (isUndoRedoAction.current) {
      return;
    }

    setHistory(prev => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      
      // Add new state
      const updatedHistory = [...newHistory, { nodes: [...nodes], edges: [...edges] }];
      
      // Limit history size
      if (updatedHistory.length > MAX_HISTORY_SIZE) {
        return updatedHistory.slice(-MAX_HISTORY_SIZE);
      }
      
      return updatedHistory;
    });

    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, MAX_HISTORY_SIZE - 1);
      return newIndex;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoAction.current = true;
      setCurrentIndex(prev => prev - 1);
      
      // Reset the flag after a short delay to allow state updates
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 100);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      setCurrentIndex(prev => prev + 1);
      
      // Reset the flag after a short delay to allow state updates
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 100);
    }
  }, [currentIndex, history.length]);

  const clearHistory = useCallback(() => {
    setHistory([{ nodes: [], edges: [] }]);
    setCurrentIndex(0);
  }, []);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    saveState,
    clearHistory,
    getCurrentState: () => history[currentIndex] || { nodes: [], edges: [] }
  } as UseUndoRedoReturn & { getCurrentState: () => FlowState };
};
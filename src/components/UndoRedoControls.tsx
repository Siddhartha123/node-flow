import React from 'react';
import { Button } from 'flowbite-react';
import { Undo2, Redo2, RotateCcw } from 'lucide-react';

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClearHistory: () => void;
}

const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClearHistory
}) => {
  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key === 'z') {
        event.preventDefault();
        if (canUndo) {
          onUndo();
        }
      } else if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo) {
          onRedo();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  return (
    <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg shadow-sm p-2">
      <Button
        onClick={onUndo}
        disabled={!canUndo}
        color="gray"
        size="sm"
        className="p-2"
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </Button>
      
      <Button
        onClick={onRedo}
        disabled={!canRedo}
        color="gray"
        size="sm"
        className="p-2"
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="w-4 h-4" />
      </Button>
      
      <div className="w-px h-6 bg-gray-300" />
      
      <Button
        onClick={onClearHistory}
        color="gray"
        size="sm"
        className="p-2"
        title="Clear History"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default UndoRedoControls;
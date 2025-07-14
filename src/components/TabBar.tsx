import React, { useState } from 'react';
import { FlowTab } from '../types/flow';
import { Button } from 'flowbite-react';
import { Plus, X, Edit2 } from 'lucide-react';

interface ExtendedFlowTab extends FlowTab {
  isFixed?: boolean;
  icon?: string;
}

interface TabBarProps {
  tabs: ExtendedFlowTab[];
  activeTabId: string;
  onTabSelect: (tabId: string) => void;
  onTabCreate: () => void;
  onTabDelete: (tabId: string) => void;
  onTabRename: (tabId: string, newName: string) => void;
  getTabIcon?: (iconName?: string) => React.ReactNode;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabCreate,
  onTabDelete,
  onTabRename,
  getTabIcon
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleTabRename = (tabId: string, currentName: string) => {
    if (tabs.find(t => t.id === tabId)?.isFixed) return; // Prevent renaming fixed tabs
    setEditingTabId(tabId);
    setEditingName(currentName);
  };

  const handleRenameSubmit = (tabId: string) => {
    if (editingName.trim() && editingName.trim() !== tabs.find(t => t.id === tabId)?.name) {
      onTabRename(tabId, editingName.trim());
    }
    setEditingTabId(null);
    setEditingName('');
  };

  const handleRenameCancel = () => {
    setEditingTabId(null);
    setEditingName('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === 'Enter') {
      handleRenameSubmit(tabId);
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  // Separate regular tabs from fixed tabs
  const regularTabs = tabs.filter(tab => !tab.isFixed);
  const fixedTabs = tabs.filter(tab => tab.isFixed);

  const getTabColor = (tab: ExtendedFlowTab, isActive: boolean) => {
    if (tab.isFixed) {
      switch (tab.id) {
        case 'table-editor':
          return isActive ? 'border-green-500 bg-green-50 text-green-700' : 'border-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-800';
        case 'schema-designer':
          return isActive ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-800';
        case 'data-import-export':
          return isActive ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-800';
        default:
          return isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-800';
      }
    }
    return isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-transparent hover:bg-gray-50 text-gray-600 hover:text-gray-800';
  };

  const getIndicatorColor = (tab: ExtendedFlowTab, isActive: boolean) => {
    if (tab.isFixed) {
      switch (tab.id) {
        case 'table-editor':
          return isActive ? 'bg-green-500' : 'bg-gray-300';
        case 'schema-designer':
          return isActive ? 'bg-purple-500' : 'bg-gray-300';
        case 'data-import-export':
          return isActive ? 'bg-orange-500' : 'bg-gray-300';
        default:
          return isActive ? 'bg-blue-500' : 'bg-gray-300';
      }
    }
    return isActive ? 'bg-blue-500' : 'bg-gray-300';
  };

  return (
    <div className="flex items-center bg-white border-b border-gray-200 px-4 shadow-sm">
      <div className="flex items-center space-x-1 flex-1 overflow-x-auto">
        {/* Regular Pipeline Tabs */}
        {regularTabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          const isEditing = editingTabId === tab.id;
          
          return (
            <div
              key={tab.id}
              className={`group flex items-center space-x-2 px-4 py-3 cursor-pointer transition-all duration-200 border-b-2 min-w-0 ${getTabColor(tab, isActive)}`}
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameSubmit(tab.id)}
                    onKeyDown={(e) => handleKeyPress(e, tab.id)}
                    className="bg-white border border-gray-300 rounded px-2 py-1 text-sm font-medium min-w-0 flex-1"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <span
                      onClick={() => onTabSelect(tab.id)}
                      className="font-medium text-sm whitespace-nowrap truncate flex-1 min-w-0"
                      title={tab.name}
                    >
                      {tab.name}
                    </span>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTabRename(tab.id, tab.name);
                        }}
                        className="p-1 rounded hover:bg-gray-200 transition-colors"
                        title="Rename tab"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      {regularTabs.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete tab "${tab.name}"? This will permanently remove all nodes and connections in this tab.`)) {
                              onTabDelete(tab.id);
                            }
                          }}
                          className="p-1 rounded hover:bg-red-100 hover:text-red-600 transition-colors"
                          title="Delete tab"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Tab indicator */}
              <div className="flex flex-col items-center space-y-1">
                <div className={`w-2 h-2 rounded-full transition-colors ${getIndicatorColor(tab, isActive)}`} />
                <div className="text-xs text-gray-400">
                  {tab.nodes.length}
                </div>
              </div>
            </div>
          );
        })}

        {/* Separator */}
        {fixedTabs.length > 0 && regularTabs.length > 0 && (
          <div className="w-px h-8 bg-gray-300 mx-2" />
        )}

        {/* Fixed Tabs (Special Tabs) */}
        {fixedTabs.map((tab) => {
          const isActive = activeTabId === tab.id;
          
          return (
            <div
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 cursor-pointer transition-all duration-200 border-b-2 min-w-0 ${getTabColor(tab, isActive)}`}
            >
              {getTabIcon && getTabIcon(tab.icon)}
              <span className="font-medium text-sm whitespace-nowrap">
                {tab.name}
              </span>
              <div className={`w-2 h-2 rounded-full transition-colors ${getIndicatorColor(tab, isActive)}`} />
            </div>
          );
        })}
      </div>
      
      <Button
        onClick={onTabCreate}
        color="gray"
        size="sm"
        className="flex items-center space-x-2 ml-4"
      >
        <Plus className="w-4 h-4" />
        <span>New Tab</span>
      </Button>
    </div>
  );
};

export default TabBar;
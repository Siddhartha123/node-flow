# Data Pipeline Builder

This application is a powerful tool for designing and managing data processing pipelines. It allows you to visualize data flows, define table schemas, manage table data, and generate Python code for data transformations.

## Features

*   **Interactive Pipeline Canvas**: Drag-and-drop interface to build data pipelines using Data and Process nodes.
*   **Schema Designer**: Visually design database schemas, define tables, columns, and relationships.
*   **Table Editor**: Directly view and edit data within your defined tables.
*   **Data Import/Export**: Import and export complete pipeline configurations (nodes, edges, tabs) as well as individual table data (JSON/CSV).
*   **Modular Data Storage**: Easily switch between different data storage solutions (e.g., local storage, SQL database) without modifying core application logic.
*   **Python Code Generation**: Generate Python code snippets for data transformation logic defined in Process nodes.

## Setup and Installation

To get this project up and running on your local machine, follow these steps:

### Prerequisites

This project requires Node.js and npm (Node Package Manager) to be installed.

**How to Install Node.js and npm:**

If you don't have Node.js and npm installed, you can download the official installer from the [Node.js website](https://nodejs.org/en/download/).

1.  **Download the Installer**: Visit the [Node.js Downloads page](https://nodejs.org/en/download/) and download the LTS (Long Term Support) version installer for your operating system (Windows, macOS, or Linux). The installer includes npm.
2.  **Run the Installer**:
    *   **Windows**: Double-click the `.msi` file and follow the prompts. Accept the license agreement, choose the installation location (default is usually fine), and ensure "Node.js runtime" and "npm package manager" components are selected.
    *   **macOS**: Double-click the `.pkg` file and follow the installation wizard.
    *   **Linux**: Follow the specific installation instructions for your distribution on the Node.js website.
3.  **Verify Installation**: Open a new terminal or command prompt and run the following commands to verify that Node.js and npm are installed correctly:
    ```bash
    node -v
    npm -v
    ```
    You should see the installed versions printed in the console.

### Project Setup

1.  **Clone the Repository**:
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```
    (Replace `<repository_url>` and `<repository_directory>` with your actual repository details.)

2.  **Install Dependencies**:
    Navigate to the project directory in your terminal and install the required Node.js packages:
    ```bash
    npm install
    ```

3.  **Run the Development Server**:
    Once the dependencies are installed, you can start the development server:
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:5173` (or another available port).

## Source Files Overview

The application is organized into a modular structure with clear separation of concerns. Here's an overview of the key source files and their purposes:

### Core Application Files

#### `src/App.tsx`
The main application component that orchestrates the entire application. It manages:
- Tab state and navigation between different views (Pipeline, Table Editor, Schema Designer, Import/Export)
- Node and edge management for the pipeline canvas
- Integration between different components and data flow
- Header with application branding and status information

#### `src/main.tsx`
The application entry point that renders the React app and sets up the root component.

### Components (`src/components/`)

#### Pipeline & Flow Components
- **`FlowCanvas.tsx`**: The main pipeline canvas using React Flow. Handles node positioning, connections, undo/redo functionality, and visual pipeline representation.
- **`CustomNode.tsx`**: Defines the visual appearance and behavior of individual nodes (Data and Process nodes) in the pipeline.
- **`NodePalette.tsx`**: Sidebar component for adding new nodes to the pipeline. Provides node templates and table selection.
- **`Sidebar.tsx`**: Properties panel for selected nodes. Allows editing node properties, table configurations, and process logic.
- **`UndoRedoControls.tsx`**: Toolbar component providing undo/redo functionality with keyboard shortcuts.

#### Schema & Table Management
- **`SchemaDesigner.tsx`**: Visual database schema designer. Allows creating tables, defining relationships, and managing the overall database structure.
- **`SchemaTableNode.tsx`**: Visual representation of tables in the schema designer with connection handles for relationships.
- **`TableEditor.tsx`**: Interface for viewing and editing actual table data. Provides CRUD operations on table rows.
- **`CreateTableForm.tsx`**: Form component for creating new tables with column definitions.
- **`EditTableSchemaForm.tsx`**: Form for modifying existing table schemas and structures.

#### Data Management
- **`ColumnEditorRow.tsx`**: Individual row component for editing column properties (name, type, constraints).
- **`ColumnInputField.tsx`**: Smart input field that adapts based on column type and foreign key relationships.
- **`DataImportExport.tsx`**: Comprehensive import/export interface supporting both individual table data and complete pipeline configurations.

#### Navigation & Layout
- **`TabBar.tsx`**: Tab navigation component supporting both regular pipeline tabs and special function tabs (Table Editor, Schema Designer, Import/Export).

### Context & State Management (`src/context/`)

#### `TableManagementContext.tsx`
Central state management for all table-related operations. Provides:
- Table schema and data state
- CRUD operations for tables, rows, and relationships
- Integration with the data service layer
- Shared state across all components

### Services (`src/services/`)

#### `IDataService.ts`
Interface defining the contract for data persistence operations. Enables easy switching between different storage backends.

#### `LocalStorageDataService.ts`
Default implementation using browser localStorage. Handles:
- Data serialization/deserialization
- Backward compatibility with different data formats
- Error handling and data validation

### Types (`src/types/`)

#### `index.ts`
Core type definitions for:
- Table schemas and column definitions
- Database relationships
- Table data structures
- Context interfaces

#### `flow.ts`
Type definitions specific to the pipeline flow:
- Node and edge structures
- Tab management
- Pipeline-specific data types

### Utilities (`src/utils/`)

#### `flowUtils.ts`
Utility functions for pipeline operations:
- Node creation and positioning
- Python code generation from process nodes
- Node type definitions and templates

#### `dataUtils.ts`
Data processing utilities:
- CSV import/export functionality
- JSON serialization with version handling
- Data validation and type conversion
- Backward compatibility handling

#### `colorUtils.ts`
Color management for visual elements:
- Consistent color assignment for relationships
- Hash-based color generation for table pairs

### Hooks (`src/hooks/`)

#### `useUndoRedo.ts`
Custom hook providing undo/redo functionality:
- State history management
- Keyboard shortcut handling
- Optimized state saving and restoration

### Configuration Files

#### `tailwind.config.js`
Tailwind CSS configuration including Flowbite integration for consistent UI components.

#### `vite.config.ts`
Vite build tool configuration with React plugin and optimization settings.

#### `tsconfig.json` & related
TypeScript configuration files ensuring type safety and proper compilation.

### Key Architectural Patterns

1. **Separation of Concerns**: Each component has a single, well-defined responsibility
2. **Data Service Abstraction**: Storage layer is completely abstracted through interfaces
3. **Context-Based State Management**: Centralized state management without external dependencies
4. **Type Safety**: Comprehensive TypeScript types ensure data integrity
5. **Modular Design**: Components can be easily modified or replaced without affecting others

This architecture enables easy maintenance, testing, and extension of the application while maintaining clean separation between UI, business logic, and data persistence layers.

## Switching Data Storage

The application is designed with a modular data storage layer, allowing you to easily switch between different data persistence mechanisms without altering the main application logic. This is achieved through the `IDataService` interface.

### Understanding the Abstraction

*   **`src/services/IDataService.ts`**: This file defines the `IDataService` interface, which outlines all the necessary methods for interacting with your data (e.g., `createTable`, `addRow`, `addRelationship`, `loadData`).
*   **`src/services/LocalStorageDataService.ts`**: This is the default implementation that uses the browser's `localStorage` for data persistence.
*   **`src/context/TableManagementContext.tsx`**: The `TableManagementProvider` component in this file accepts a `dataService` prop. All data operations within the application (via the `useTableManagement` hook) call methods on this `dataService` instance.

### Example: Switching to a SQL Database Service (Conceptual)

Let's say you want to switch from `localStorage` to a SQL database (e.g., via a REST API).

1.  **Create a New Data Service Implementation**:
    You would create a new file, for example, `src/services/SqlDataService.ts`, that implements the `IDataService` interface. This class would contain the logic to make API calls to your backend, which in turn interacts with the SQL database.

    ```typescript
    // src/services/SqlDataService.ts (Conceptual Example)
    import { IDataService } from './IDataService';
    import { TableData, DatabaseSchema, TableSchema, Relationship } from '../types';

    export class SqlDataService implements IDataService {
      private API_BASE_URL = 'http://localhost:3000/api'; // Replace with your backend API URL

      async loadData(): Promise<{ tableData: TableData[]; schema: DatabaseSchema }> {
        const response = await fetch(`${this.API_BASE_URL}/data`);
        if (!response.ok) throw new Error('Failed to load data from API');
        return response.json();
      }

      async saveTable(tableData: TableData): Promise<void> {
        const response = await fetch(`${this.API_BASE_URL}/tables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tableData),
        });
        if (!response.ok) throw new Error('Failed to save table via API');
      }

      async updateTable(tableId: string, updates: Partial<TableSchema>): Promise<void> {
        const response = await fetch(`${this.API_BASE_URL}/tables/${tableId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update table via API');
      }

      async deleteTable(tableId: string): Promise<void> {
        const response = await fetch(`${this.API_BASE_URL}/tables/${tableId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete table via API');
      }

      async addRow(tableId: string, row: any): Promise<void> {
        const response = await fetch(`${this.API_BASE_URL}/tables/${tableId}/rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(row),
        });
        if (!response.ok) throw new Error('Failed to add row via API');
      }

      async updateRow(tableId: string, rowId: string, updates: any): Promise<void> {
        const response = await fetch(`${this.API_BASE_URL}/tables/${tableId}/rows/${rowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update row via API');
      }

      async deleteRow(tableId: string, rowId: string): Promise<void> {
        const response = await fetch(`${this.API_BASE_URL}/tables/${tableId}/rows/${rowId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete row via API');
      }

      async addRelationship(relationship: Relationship): Promise<void> {
        const response = await fetch(`${this.API_BASE_URL}/relationships`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(relationship),
        });
        if (!response.ok) throw new Error('Failed to add relationship via API');
      }

      async deleteRelationship(relationshipId: string): Promise<void> {
        const response = await fetch(`${this.API_BASE_URL}/relationships/${relationshipId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete relationship via API');
      }

      async saveAllData(tableData: TableData[], schema: DatabaseSchema): Promise<void> {
        const response = await fetch(`${this.API_BASE_URL}/save-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableData, schema }),
        });
        if (!response.ok) throw new Error('Failed to save all data via API');
      }
    }
    ```

2.  **Inject the New Service into `TableManagementProvider`**:
    In your `src/App.tsx` file, you would import your new `SqlDataService` and pass an instance of it to the `TableManagementProvider`.

    ```typescript
    // src/App.tsx
    import React, { useState, useCallback } from 'react';
    // ... other imports ...
    import { TableManagementProvider } from './context/TableManagementContext';
    import { SqlDataService } from './services/SqlDataService'; // Import your new service

    // Instantiate your new data service
    const sqlDataService = new SqlDataService();

    // Main App Content Component (remains unchanged)
    function AppContent() {
      // ... existing AppContent logic ...
    }

    // Main App Component with Provider
    function App() {
      return (
        // Pass your new data service instance here
        <TableManagementProvider dataService={sqlDataService}>
          <AppContent />
        </TableManagementProvider>
      );
    }

    export default App;
    ```

By making these changes, your application will now use the `SqlDataService` for all data operations, demonstrating the power of the abstracted data layer. No other components (like `TableEditor`, `SchemaDesigner`, etc.) need to be modified, as they interact with the data layer through the `useTableManagement` hook, which remains consistent.

## Technologies Used

*   **React**: A JavaScript library for building user interfaces.
*   **TypeScript**: A typed superset of JavaScript that compiles to plain JavaScript.
*   **Tailwind CSS**: A utility-first CSS framework for rapidly building custom designs.
*   **React Flow**: A library for building node-based editors and interactive diagrams.
*   **Flowbite React**: React components built with Tailwind CSS from Flowbite.
*   **Lucide React**: A collection of beautiful and customizable open-source icons.
*   **PapaParse**: A powerful CSV (and delimited text) parser for JavaScript.
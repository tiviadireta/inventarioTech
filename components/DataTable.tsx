import React, { useState, useEffect, useMemo } from 'react';
import { GripVertical } from 'lucide-react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
}

interface DataTableProps<T> {
  title: string;
  tableId?: string;
  icon?: React.ReactNode;
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  loading?: boolean;
  headerActions?: React.ReactNode;
  onRowReorder?: (dragIndex: number, dropIndex: number) => void;
}

export function DataTable<T>({ title, tableId, icon, data, columns, searchPlaceholder = 'Buscar...', searchKeys, loading, headerActions, onRowReorder }: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [columnOrder, setColumnOrder] = useState<string[]>([]);

  useEffect(() => {
    if (tableId) {
      const savedOrder = localStorage.getItem(`table-order-${tableId}`);
      if (savedOrder) {
        try {
          setColumnOrder(JSON.parse(savedOrder));
        } catch (e) {}
      }
    }
  }, [tableId]);

  const orderedColumns = useMemo(() => {
    if (!columnOrder.length) return columns;
    const newCols = [];
    for (const header of columnOrder) {
      const col = columns.find(c => c.header === header);
      if (col) newCols.push(col);
    }
    for (const col of columns) {
      if (!newCols.find(c => c.header === col.header)) {
        newCols.push(col);
      }
    }
    return newCols;
  }, [columns, columnOrder]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('colIndex', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('colIndex'), 10);
    if (dragIndex === dropIndex || isNaN(dragIndex)) return;

    const newCols = [...orderedColumns];
    const [draggedCol] = newCols.splice(dragIndex, 1);
    newCols.splice(dropIndex, 0, draggedCol);
    
    const newOrder = newCols.map(c => c.header);
    setColumnOrder(newOrder);
    if (tableId) {
      localStorage.setItem(`table-order-${tableId}`, JSON.stringify(newOrder));
    }
  };

  const isRowReorderable = !!onRowReorder && !searchTerm;

  const handleRowDragStart = (e: React.DragEvent, index: number) => {
    if (!isRowReorderable) return;
    e.dataTransfer.setData('rowIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDrop = (e: React.DragEvent, dropIndex: number) => {
    if (!isRowReorderable) return;
    e.preventDefault();
    const dragIndexStr = e.dataTransfer.getData('rowIndex');
    if (!dragIndexStr) return;
    
    const dragIndex = parseInt(dragIndexStr, 10);
    if (dragIndex === dropIndex || isNaN(dragIndex)) return;
    
    if (onRowReorder) {
      const globalDragIndex = (currentPage - 1) * itemsPerPage + dragIndex;
      const globalDropIndex = (currentPage - 1) * itemsPerPage + dropIndex;
      onRowReorder(globalDragIndex, globalDropIndex);
    }
  };

  const filteredData = data.filter((item) => {
    if (!searchTerm) return true;
    if (!searchKeys) return true;
    
    return searchKeys.some((key) => {
      const value = item[key];
      if (value == null) return false;
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="w-full bg-[#18181b] rounded-xl border border-zinc-800 overflow-hidden">
      {/* Table Header & Search */}
      <div className="p-6 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          {icon && <div className="text-[#F26824]">{icon}</div>}
          <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              className="block w-full px-4 py-2.5 bg-[#121212] border border-zinc-800 rounded-lg text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-[#F26824] focus:ring-1 focus:ring-[#F26824] transition-colors"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          {headerActions}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-[#18181b]">
            <tr>
              {orderedColumns.map((col, idx) => (
                <th
                  key={idx}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider whitespace-nowrap cursor-move hover:bg-zinc-800/50 transition-colors"
                  title="Arraste para reordenar coluna"
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-zinc-600" />
                    {col.header}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-[#18181b]">
            {loading ? (
              <tr>
                <td colSpan={orderedColumns.length} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex justify-center items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-[#F26824] border-t-transparent rounded-full animate-spin"></div>
                    <span>Carregando dados...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={orderedColumns.length} className="px-6 py-12 text-center text-zinc-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  draggable={isRowReorderable}
                  onDragStart={(e) => handleRowDragStart(e, rowIndex)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleRowDrop(e, rowIndex)}
                  className={`hover:bg-zinc-800/50 transition-colors ${isRowReorderable ? 'cursor-move' : ''}`}
                  title={isRowReorderable ? "Arraste para reordenar linha" : undefined}
                >
                  {orderedColumns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                      {colIndex === 0 && isRowReorderable ? (
                        <div className="flex items-center gap-3">
                          <GripVertical className="w-4 h-4 text-zinc-600 cursor-move" />
                          {typeof col.accessor === 'function'
                            ? col.accessor(item)
                            : (item[col.accessor] as React.ReactNode) || '-'}
                        </div>
                      ) : (
                        typeof col.accessor === 'function'
                          ? col.accessor(item)
                          : (item[col.accessor] as React.ReactNode) || '-'
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
        <div className="text-sm text-zinc-500">
          Página {currentPage} de {Math.max(1, totalPages)}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-zinc-400 bg-transparent border border-zinc-800 rounded-md hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-4 py-2 text-sm font-medium text-zinc-400 bg-transparent border border-zinc-800 rounded-md hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  );
}

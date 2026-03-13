import { useState, useCallback, useRef } from "react";

export interface UseEventSelectionReturn {
  selectedIds: Set<string>;
  isSelected: (id: string) => boolean;
  select: (id: string) => void;
  toggle: (id: string) => void;
  rangeSelect: (id: string, sortedIds: string[]) => void;
  clearSelection: () => void;
  selectAll: (ids: string[]) => void;
  lastSelectedId: string | null;
}

export function useEventSelection(): UseEventSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastSelectedIdRef = useRef<string | null>(null);

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds],
  );

  const select = useCallback((id: string) => {
    setSelectedIds(new Set([id]));
    lastSelectedIdRef.current = id;
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    lastSelectedIdRef.current = id;
  }, []);

  const rangeSelect = useCallback(
    (id: string, sortedIds: string[]) => {
      const lastId = lastSelectedIdRef.current;
      if (!lastId) {
        // No previous selection — just select the one item
        setSelectedIds(new Set([id]));
        lastSelectedIdRef.current = id;
        return;
      }

      const lastIdx = sortedIds.indexOf(lastId);
      const currentIdx = sortedIds.indexOf(id);

      if (lastIdx === -1 || currentIdx === -1) {
        // One of the IDs isn't in the sorted list — fall back to single select
        setSelectedIds(new Set([id]));
        lastSelectedIdRef.current = id;
        return;
      }

      const start = Math.min(lastIdx, currentIdx);
      const end = Math.max(lastIdx, currentIdx);
      const rangeIds = sortedIds.slice(start, end + 1);

      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const rid of rangeIds) {
          next.add(rid);
        }
        return next;
      });
      // Don't update lastSelectedIdRef — keep anchor stable for subsequent shifts
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastSelectedIdRef.current = null;
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
    if (ids.length > 0) {
      lastSelectedIdRef.current = ids[ids.length - 1];
    }
  }, []);

  return {
    selectedIds,
    isSelected,
    select,
    toggle,
    rangeSelect,
    clearSelection,
    selectAll,
    lastSelectedId: lastSelectedIdRef.current,
  };
}

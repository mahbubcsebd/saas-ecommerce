"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical, Pencil, Trash2 } from 'lucide-react';

interface SortableItemProps {
  id: string;
  name: string;
  depth: number;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  childCount?: number;
}

export function SortableCategoryItem({
  id,
  name,
  depth,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  childCount = 0
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: `${depth * 20}px` // Visual indentation (though DnD usually flattens, we can fake it or use tree logic)
    // Actually for simple list reorder with parent reassignment, usually we use a specialized library or
    // handle "drag over" to determine nesting.
    // For this implementation, let's stick to a flat list that visualizes nesting based on `depth` prop
    // passed from the parent state.
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 border rounded-md mb-2 bg-background",
        isDragging && "opacity-50 z-50 bg-muted"
      )}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab hover:text-primary">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Expand/Collapse (only if has children capability, though here we might not know strict children upfront without tree data) */}
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggle}>
         {/* Placeholder logic for icon, real tree needs to know if children exist */}
         {childCount > 0 ? (
             isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
         ) : <div className="w-3" />}
      </Button>

      <span className="font-medium flex-1">{name}</span>

      {/* Actions */}
      <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
              <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
          </Button>
      </div>
    </div>
  );
}

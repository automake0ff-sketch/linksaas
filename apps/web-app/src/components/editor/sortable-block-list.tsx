'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2 } from 'lucide-react';
import type { Block } from '@linkforge/contracts';
import { useEditorStore } from '@/store/editor-store';
import { EditorBlockPreview } from './editor-block-preview';

export function SortableBlockList() {
  const blocks = useEditorStore((s) => s.blocks);
  const selectedBlockId = useEditorStore((s) => s.selectedBlockId);
  const selectBlock = useEditorStore((s) => s.selectBlock);
  const reorderBlocks = useEditorStore((s) => s.reorderBlocks);
  const duplicateBlock = useEditorStore((s) => s.duplicateBlock);
  const removeBlock = useEditorStore((s) => s.removeBlock);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = blocks.map((b) => b.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    const reordered = [...ids];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, String(active.id));
    reorderBlocks(reordered);
  }

  if (blocks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm text-text-secondary">
          Añade tu primer bloque desde la biblioteca de la izquierda.
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3 p-4">
          {blocks.map((block) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              selected={block.id === selectedBlockId}
              onSelect={() => selectBlock(block.id)}
              onDuplicate={() => duplicateBlock(block.id)}
              onRemove={() => removeBlock(block.id)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableBlockItem({
  block,
  selected,
  onSelect,
  onDuplicate,
  onRemove,
}: {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="group flex items-center gap-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-text-secondary opacity-0 group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Reordenar bloque"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className={isDragging ? 'flex-1 opacity-50' : 'flex-1'}>
        <EditorBlockPreview block={block} selected={selected} onSelect={onSelect} />
      </div>

      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
        <button
          onClick={onDuplicate}
          aria-label="Duplicar bloque"
          className="rounded p-1 text-text-secondary hover:bg-surface-2 hover:text-text-primary"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          onClick={onRemove}
          aria-label="Eliminar bloque"
          className="rounded p-1 text-text-secondary hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

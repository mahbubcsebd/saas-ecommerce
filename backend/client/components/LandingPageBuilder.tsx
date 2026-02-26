
"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Code,
    GripVertical,
    Image as ImageIcon,
    Layout,
    MousePointer2,
    Plus,
    Settings2,
    Star,
    Trash2,
    Type
} from 'lucide-react';

// --- Types ---
export type BlockType = 'HERO' | 'FEATURES' | 'TESTIMONIALS' | 'PRICING' | 'CTA' | 'IMAGE' | 'HTML';

export interface PageBlock {
  id: string;
  type: BlockType;
  data: any;
  settings?: {
    textAlign?: 'left' | 'center' | 'right';
    bgColor?: string;
    textColor?: string;
    padding?: string;
  };
}

interface BuilderProps {
  blocks: PageBlock[];
  onChange: (blocks: PageBlock[]) => void;
  onEditBlock: (block: PageBlock) => void;
}

// --- Sortable Item Component ---
function SortableBlock({
  block,
  onDelete,
  onEdit
}: {
  block: PageBlock;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0
  };

  const getIcon = () => {
    switch(block.type) {
      case 'HERO': return <Layout className="h-4 w-4" />;
      case 'FEATURES': return <Zap className="h-4 w-4" />;
      case 'TESTIMONIALS': return <Star className="h-4 w-4" />;
      case 'CTA': return <MousePointer2 className="h-4 w-4" />;
      case 'IMAGE': return <ImageIcon className="h-4 w-4" />;
      case 'HTML': return <Code className="h-4 w-4" />;
      default: return <Type className="h-4 w-4" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-white border-2 border-dashed rounded-xl p-4 transition-all mb-4",
        isDragging ? "border-blue-500 shadow-2xl opacity-50 scale-105" : "border-slate-100 hover:border-blue-200"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 group-hover:text-blue-500 transition-colors"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              {getIcon()}
            </div>
            <div>
              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{block.type}</p>
              <p className="text-[10px] text-slate-400 font-medium">Click settings to customize</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Block Preview Mockup */}
      <div className="mt-4 pt-4 border-t border-slate-50">
        <div className="bg-slate-50/50 rounded-lg p-3 min-h-[60px] flex items-center justify-center border border-slate-100">
           <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{block.data?.title || block.data?.headline || "Empty Content"}</span>
        </div>
      </div>
    </div>
  );
}

// --- Main Builder Component ---
export default function LandingPageBuilder({ blocks, onChange, onEditBlock }: BuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      onChange(arrayMove(blocks, oldIndex, newIndex));
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock: PageBlock = {
      id: `${type}-${Date.now()}`,
      type,
      data: {},
      settings: { textAlign: 'center', bgColor: '#ffffff', textColor: '#000000', padding: '4rem' }
    };

    // Default data templates
    if (type === 'HERO') {
        newBlock.data = { headline: "Enter Your Main Headline", subheadline: "Compelling value proposition here.", ctaText: "Get Started Now" };
    } else if (type === 'CTA') {
        newBlock.data = { text: "Limited Time Offer! Don't Miss Out.", buttonText: "Claim Your Discount" };
    }

    onChange([...blocks, newBlock]);
    onEditBlock(newBlock);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50/50 p-6 rounded-2xl border-2 border-dashed border-slate-200 min-h-[400px]">
        {blocks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-inner">
               <Plus className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Your Canvas is Empty</h3>
            <p className="text-slate-400 text-sm max-w-[280px] mt-1">Start by adding sections from the menu below to build your page.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  onDelete={() => onChange(blocks.filter(b => b.id !== block.id))}
                  onEdit={() => onEditBlock(block)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Block Quick Add Menu */}
      <div className="bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-x-auto">
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 px-2">Click to add section</p>
        <div className="flex gap-2 pb-1">
          {[
            { type: 'HERO', icon: <Layout />, label: 'Hero' },
            { type: 'FEATURES', icon: <Zap />, label: 'Features' },
            { type: 'TESTIMONIALS', icon: <Star />, label: 'Social' },
            { type: 'PRICING', icon: <TrendingUp />, label: 'Pricing' },
            { type: 'CTA', icon: <MousePointer2 />, label: 'CTA' },
            { type: 'IMAGE', icon: <ImageIcon />, label: 'Image' },
            { type: 'HTML', icon: <Code />, label: 'Custom' }
          ].map((item) => (
            <Button
              key={item.type}
              type="button"
              variant="outline"
              onClick={() => addBlock(item.type as BlockType)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 h-auto py-3 px-4 rounded-xl border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all min-w-[80px]"
            >
              <div className="text-slate-400 group-hover:text-blue-600">{item.icon}</div>
              <span className="text-[10px] font-bold uppercase tracking-tight text-slate-600">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Dummy Zap icon for convenience
function Zap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

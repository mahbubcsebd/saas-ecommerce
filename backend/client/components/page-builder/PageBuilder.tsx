'use client';

import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/use-confirm';
import { cn } from '@/lib/utils';
import grapesjs from 'grapesjs';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import 'grapesjs/dist/css/grapes.min.css';
import {
    Loader2,
    Monitor,
    Redo2,
    Save,
    Smartphone,
    Tablet,
    Trash2,
    Undo2
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { TemplateLibrary } from './TemplateLibrary';

interface PageBuilderProps {
  pageId?: string;
  initialData?: {
    html?: string;
    css?: string;
    json?: string;
  };
  onSave?: (data: { html: string; css: string; json: string }) => Promise<void>;
}

export function PageBuilder({ pageId, initialData, onSave }: PageBuilderProps) {
  const { confirm } = useConfirm();
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDevice, setActiveDevice] = useState('desktop');

  useEffect(() => {
    if (!editorRef.current) return;

    const gjsEditor = grapesjs.init({
      container: editorRef.current,
      height: 'calc(100vh - 200px)',
      width: 'auto',
      storageManager: false,
      plugins: [gjsPresetWebpage, gjsBlocksBasic],
      pluginsOpts: {
        'gjs-preset-webpage': {
          modalImportTitle: 'Import Template',
        },
      },
      canvas: {
        styles: [
          'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
        ],
      },
      deviceManager: {
        devices: [
          { id: 'desktop', name: 'Desktop', width: '' },
          { id: 'tablet', name: 'Tablet', width: '768px', widthMedia: '992px' },
          { id: 'mobile', name: 'Mobile', width: '320px', widthMedia: '480px' },
        ],
      },
    });

    // Load initial data
    if (initialData?.json) {
      try {
        gjsEditor.loadProjectData(JSON.parse(initialData.json));
      } catch (e) {
        console.error("Failed to load GJS JSON", e);
      }
    } else if (initialData?.html) {
      gjsEditor.setComponents(initialData.html);
      if (initialData.css) gjsEditor.setStyle(initialData.css);
    }

    setEditor(gjsEditor);

    return () => {
      gjsEditor.destroy();
    };
  }, []);

  const handleSave = async () => {
    if (!editor) return;
    setIsSaving(true);
    try {
      const html = editor.getHtml();
      const css = editor.getCss();
      const json = JSON.stringify(editor.getProjectData());

      if (onSave) {
        await onSave({ html, css, json });
        toast.success("Design synced to form!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to extract page data");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateSelect = (template: any) => {
    if (!editor) return;
    // No recursive confirmation if we're feeling confident, but templates usually replace everything
    editor.loadProjectData(template.json);
    toast.success(`${template.name} template loaded!`);
  };

  const setDevice = (device: string) => {
    if (!editor) return;
    editor.setDevice(device);
    setActiveDevice(device);
  };

  const runCommand = (cmd: string) => editor?.runCommand(cmd);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border shadow-inner">
      {/* Builder Toolbar */}
      <div className="bg-slate-900 text-white p-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => runCommand('core:undo')}
            className="h-9 w-9 p-0 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => runCommand('core:redo')}
            className="h-9 w-9 p-0 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-white/10 mx-2" />

          <div className="flex bg-white/5 rounded-xl p-1 gap-1">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setDevice('desktop')}
              className={cn(
                "h-8 px-3 rounded-lg hover:bg-white/10 transition-all",
                activeDevice === 'desktop' ? "bg-orange-600 text-white shadow-lg" : "text-slate-400"
              )}
            >
              <Monitor className="h-4 w-4 mr-2" /> Desktop
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setDevice('tablet')}
              className={cn(
                "h-8 px-3 rounded-lg hover:bg-white/10 transition-all",
                activeDevice === 'tablet' ? "bg-orange-600 text-white shadow-lg" : "text-slate-400"
              )}
            >
              <Tablet className="h-4 w-4 mr-2" /> Tablet
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setDevice('mobile')}
              className={cn(
                "h-8 px-3 rounded-lg hover:bg-white/10 transition-all",
                activeDevice === 'mobile' ? "bg-orange-600 text-white shadow-lg" : "text-slate-400"
              )}
            >
              <Smartphone className="h-4 w-4 mr-2" /> Mobile
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TemplateLibrary onSelect={handleTemplateSelect} />
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={async () => {
               if(await confirm({
                   title: "Clear Canvas",
                   message: "Are you sure you want to clear the entire canvas? This will remove all components and layout.",
                   type: "danger",
                   confirmText: "Clear All"
               })) runCommand('canvas-clear');
            }}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-bold h-9 px-4 rounded-xl"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Clear
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            type="button"
            className="bg-orange-600 hover:bg-orange-700 text-white font-black px-6 h-10 rounded-xl shadow-lg shadow-orange-950/20 transition-all active:scale-95"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSaving ? 'Syncing...' : 'Sync Work'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative bg-slate-50">
        <div ref={editorRef} className="absolute inset-0" />
      </div>

      <style jsx global>{`
        /* Adjust GrapesJS panel positions for our layout */
        .gjs-cv-canvas {
          width: 100% !important;
          height: 100% !important;
          top: 0 !important;
        }
        .gjs-pn-panels {
          z-index: 10;
        }
        .gjs-one-bg {
          background-color: #0f172a !important; /* slate-900 */
        }
        .gjs-two-color {
          color: #94a3b8 !important; /* slate-400 */
        }
        .gjs-three-color {
          color: #f97316 !important; /* orange-500 */
        }
        .gjs-four-color {
          color: #ffffff !important;
        }
        .gjs-block {
          width: 100% !important;
          min-height: auto !important;
          padding: 16px !important;
          border-radius: 12px !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
          color: #64748b !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          letter-spacing: 0.1em !important;
          margin-bottom: 12px !important;
          transition: all 0.2s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .gjs-block:hover {
          border-color: #f97316 !important;
          color: #f97316 !important;
          box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.1);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}

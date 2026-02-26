"use client";

import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import grapesjs from "grapesjs";
import gjsBlocksBasic from "grapesjs-blocks-basic";
import gjsPresetWebpage from "grapesjs-preset-webpage";
import "grapesjs/dist/css/grapes.min.css";
import {
    Eye,
    Info,
    Loader2,
    Monitor,
    Redo2,
    Save,
    Smartphone,
    Undo2,
    Variable
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface EmailBuilderProps {
  initialData?: {
    html?: string;
    design?: string;
  };
  onSave: (data: { html: string; design: string }) => Promise<void>;
  variables?: { key: string; label: string }[];
}

export default function EmailBuilder({ initialData, onSave, variables = [] }: EmailBuilderProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDevice, setActiveDevice] = useState("desktop");

  useEffect(() => {
    if (!editorRef.current) return;

    const gjsEditor = grapesjs.init({
      container: editorRef.current,
      height: "calc(100vh - 250px)",
      width: "auto",
      storageManager: false,
      plugins: [gjsPresetWebpage, gjsBlocksBasic],
      pluginsOpts: {
        'gjs-preset-webpage': {
          modalImportTitle: 'Import Template',
        },
      },
      canvas: {
        styles: [
          "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css",
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap"
        ],
      },
      deviceManager: {
        devices: [
          { id: "desktop", name: "Desktop", width: "" },
          { id: "mobile", name: "Mobile", width: "320px", widthMedia: "480px" },
        ],
      },
    });

    // Load initial data
    if (initialData?.design) {
      try {
        gjsEditor.loadProjectData(JSON.parse(initialData.design));
      } catch (e) {
        if (initialData.html) gjsEditor.setComponents(initialData.html);
      }
    } else if (initialData?.html) {
      gjsEditor.setComponents(initialData.html);
    }

    // Add some custom Email blocks
    const bm = gjsEditor.BlockManager;

    bm.add('text-section', {
      label: 'Text Box',
      category: 'Tailwind Design',
      content: {
        type: 'text',
        content: `
          <div class="p-6 bg-white border border-gray-100 rounded-xl shadow-sm my-4">
            <h2 class="text-xl font-bold text-gray-900 mb-2">Editable Title</h2>
            <p class="text-gray-600 leading-relaxed">Double click here to start typing your message with Tailwind styles.</p>
          </div>
        `
      },
      attributes: { class: 'gjs-fonts gjs-f-text' }
    });

    bm.add('hero-banner', {
      label: 'Gradient Hero',
      category: 'Tailwind Design',
      content: `
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 p-12 text-center text-white rounded-2xl shadow-xl my-6">
          <h1 class="text-4xl font-extrabold mb-4 tracking-tight">Summer Launch 2024</h1>
          <p class="text-blue-100 text-lg mb-8 max-w-md mx-auto">Get ready for our biggest release yet. Premium quality, sustainable materials.</p>
          <a href="#" class="inline-block bg-white text-blue-600 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-50 transition-colors">Shop the Collection</a>
        </div>
      `,
      attributes: { class: 'gjs-fonts gjs-f-hero' }
    });

    bm.add('product-card', {
      label: 'Product Item',
      category: 'Tailwind Design',
      content: `
        <div class="max-w-sm bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm my-4">
          <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600" class="w-full h-48 object-cover" />
          <div class="p-5">
            <h5 class="text-lg font-bold text-gray-900 mb-1 leading-tight">Premium Watch v2</h5>
            <p class="text-2xl font-black text-blue-600 mb-3">$149.00</p>
            <p class="text-sm text-gray-500 mb-4">Limited edition titanium build with sapphire glass.</p>
            <button class="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold">Add to Cart</button>
          </div>
        </div>
      `,
      attributes: { class: 'gjs-fonts gjs-f-image' }
    });

    bm.add('social-links', {
      label: 'Social Row',
      category: 'Tailwind Design',
      content: `
        <div class="flex items-center justify-center gap-6 py-8 border-t border-gray-50 mt-8">
          <a href="#" class="text-gray-400 hover:text-blue-600 font-bold text-sm">Facebook</a>
          <a href="#" class="text-gray-400 hover:text-pink-600 font-bold text-sm">Instagram</a>
          <a href="#" class="text-gray-400 hover:text-blue-400 font-bold text-sm">Twitter</a>
        </div>
      `,
      attributes: { class: 'gjs-fonts gjs-f-social' }
    });

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
      const design = JSON.stringify(editor.getProjectData());

      // Inline CSS for Email compatibility (simplified)
      const fullHtml = `
        <html>
          <head>
            <style>${css}</style>
          </head>
          <body>${html}</body>
        </html>
      `;

      await onSave({ html: fullHtml, design });
      toast.success("Template saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const copyVariable = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    toast.success(`Copied {{${key}}} to clipboard`);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border rounded-2xl overflow-hidden shadow-2xl">
      {/* Builder Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex bg-white/5 rounded-xl p-1 gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.setDevice("desktop")}
              className={cn(
                "h-8 px-3 rounded-lg hover:bg-white/10",
                activeDevice === "desktop" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400"
              )}
            >
              <Monitor size={16} className="mr-2" /> Desktop
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor?.setDevice("mobile")}
              className={cn(
                "h-8 px-3 rounded-lg hover:bg-white/10",
                activeDevice === "mobile" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400"
              )}
            >
              <Smartphone size={16} className="mr-2" /> Mobile
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400" onClick={() => editor?.UndoManager.undo()}>
              <Undo2 size={16} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400" onClick={() => editor?.UndoManager.redo()}>
              <Redo2 size={16} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 border border-white/10">
                  <Eye size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview Mode</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-10 rounded-xl shadow-lg shadow-blue-900/40 font-bold active:scale-95 transition-all"
          >
            {isSaving ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Save className="mr-2" size={16} />}
            {isSaving ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Canvas Area */}
        <div className="flex-1 relative bg-white">
          <div ref={editorRef} className="absolute inset-0" />
        </div>

        {/* Dynamic Variables Sidebar */}
        {variables.length > 0 && (
          <div className="w-64 bg-white border-l p-4 overflow-y-auto shrink-0 space-y-4">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b">
              <Variable size={16} className="text-blue-500" />
              <h3 className="font-bold text-sm tracking-tight">Available Variables</h3>
            </div>

            <p className="text-[10px] text-gray-500 bg-blue-50 p-2 rounded-lg border border-blue-100 flex gap-2">
              <Info size={12} className="shrink-0 mt-0.5 text-blue-600" />
              Click a variable to copy its tag. Paste it into your text blocks.
            </p>

            <div className="space-y-1.5">
              {variables.map((v) => (
                <button
                  key={v.key}
                  onClick={() => copyVariable(v.key)}
                  className="w-full text-left p-2.5 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="text-[11px] font-bold text-gray-700 group-hover:text-blue-700">{v.label}</div>
                  <div className="text-[9px] text-gray-400 font-mono mt-0.5">{"{{" + v.key + "}}"}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .gjs-cv-canvas { width: 100% !important; height: 100% !important; top: 0 !important; }
        .gjs-one-bg { background-color: #0f172a !important; }
        .gjs-two-color { color: #94a3b8 !important; }
        .gjs-three-color { color: #3b82f6 !important; }
        .gjs-four-color { color: #ffffff !important; }
        .gjs-block {
          width: 46% !important;
          float: left !important;
          margin: 2% !important;
          padding: 12px !important;
          border-radius: 8px !important;
          border: 1px solid #f1f5f9 !important;
          background: #ffffff !important;
          color: #475569 !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 8px !important;
          text-align: center !important;
          transition: all 0.2s ease;
        }
        .gjs-block:hover { border-color: #3b82f6 !important; color: #3b82f6 !important; transform: scale(1.02); }
      `}</style>
    </div>
  );
}

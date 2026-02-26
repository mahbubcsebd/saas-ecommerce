import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import { useEffect, useState } from "react";

interface Language {
  code: string;
  name: string;
  flag: string;
  isDefault: boolean;
}

interface LocalizedInputProps {
  label: string;
  languages: Language[];
  translations: Record<string, any>;
  field: string;
  onChange: (lang: string, value: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
}

export function LocalizedInput({
  label,
  languages,
  translations,
  field,
  onChange,
  required,
  error,
  placeholder
}: LocalizedInputProps) {
  const defaultLang = languages.find(l => l.isDefault) || languages[0];
  const otherLangs = languages.filter(l => l.code !== defaultLang?.code);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Default Language Field (Always Visible) */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-xl">{defaultLang?.flag}</span>
        </div>
        <input
          type="text"
          value={translations[defaultLang?.code]?.[field] || ""}
          onChange={(e) => onChange(defaultLang?.code, e.target.value)}
          className={cn(
            "block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm",
            error ? "border-red-500" : ""
          )}
          placeholder={placeholder}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Basic Accordion for Other Languages */}
      {otherLangs.length > 0 && (
         <Accordion type="single" collapsible className="w-full border rounded-md bg-gray-50">
            <AccordionItem value="translations" className="border-b-0">
               <AccordionTrigger className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">
                  Translate to {otherLangs.length} other languages
               </AccordionTrigger>
               <AccordionContent className="px-4 py-4 space-y-4 border-t bg-white">
                  {otherLangs.map(lang => (
                     <div key={lang.code} className="relative">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                           {lang.name} ({lang.code.toUpperCase()})
                        </label>
                        <div className="relative">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-lg">{lang.flag}</span>
                           </div>
                           <input
                              type="text"
                              value={translations[lang.code]?.[field] || ""}
                              onChange={(e) => onChange(lang.code, e.target.value)}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                           />
                        </div>
                     </div>
                  ))}
               </AccordionContent>
            </AccordionItem>
         </Accordion>
      )}
    </div>
  );
}

interface LocalizedTextEditorProps {
    label: string;
    languages: Language[];
    translations: Record<string, any>;
    field: string;
    onChange: (lang: string, value: string) => void;
    required?: boolean;
}

export function LocalizedTextEditor({
    label,
    languages,
    translations,
    field,
    onChange,
    required
}: LocalizedTextEditorProps) {
    const [activeTab, setActiveTab] = useState(languages.find(l => l.isDefault)?.code || "en");

    // We need separate editor instances or carefully manage state.
    // BlockNote is heavy, creating N instances might be okay for < 20 langs but heavy.
    // Better: Single editor, save on tab switch.

    // Actually, for simplicity and ensuring state doesn't get lost, let's try single editor.
    // BUT user wants tabs.
    // Let's implement a wrapper that switches content.

    const editor = useCreateBlockNote();

    useEffect(() => {
        if (!editor) return;

        const loadContent = async () => {
            const html = translations[activeTab]?.[field] || "";
            const blocks = await editor.tryParseHTMLToBlocks(html);
            editor.replaceBlocks(editor.topLevelBlocks, blocks);
        };
        loadContent();

    }, [activeTab, editor]); // translations dependency omitted to avoid loops, we handle save manually

    const handleTabChange = async (newTab: string) => {
        if (newTab === activeTab) return;

        // Save current
        if (editor) {
            const html = await editor.blocksToHTMLLossy(editor.topLevelBlocks);
            onChange(activeTab, html);
        }

        setActiveTab(newTab);
    };

    // Auto-save on blur or periodic?
    // Better: listen to editor changes.
    // BlockNote `onEditorContentChange`?

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="flex items-center justify-between mb-2">
                    <TabsList className="flex flex-wrap h-auto min-h-10">
                        {languages.map(lang => (
                            <TabsTrigger key={lang.code} value={lang.code} className="px-3 py-1">
                                <span className="mr-2">{lang.flag}</span>
                                {lang.code.toUpperCase()}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                {/* We render ONE editor context that updates based on activeTab */}
                <div className="border rounded-md min-h-[200px] overflow-hidden bg-white relative">
                     <BlockNoteView
                        editor={editor}
                        onChange={async () => {
                             // This triggers on every keystroke, might be too frequent for updating parent state if it causes re-renders.
                             // But we need to keep parent state in sync.
                             const html = await editor.blocksToHTMLLossy(editor.topLevelBlocks);
                             onChange(activeTab, html);
                        }}
                        theme="light"
                      />
                </div>
            </Tabs>
        </div>
    );
}

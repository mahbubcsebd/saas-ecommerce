'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LayoutTemplate } from 'lucide-react';

const templates = [
  {
    id: 'premium-sales',
    name: 'High-Convert Sales',
    category: 'Sales',
    description: 'Optimized for direct product sales with premium hero and trust badges.',
    preview: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400&h=300',
    json: {},
  },
  {
    id: 'product-showcase',
    name: 'Product Showcase',
    category: 'Marketing',
    description: 'Perfect for launching new products with interactive feature sections.',
    preview: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400&h=300',
    json: {},
  },
  {
    id: 'simple-capture',
    name: 'Lead Capture',
    category: 'Landing',
    description: 'Clean, minimal landing page focused purely on lead generation.',
    preview: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80&w=400&h=300',
    json: {},
  },
];

interface TemplateLibraryProps {
  onSelect: (template: any) => void;
}

export function TemplateLibrary({ onSelect }: TemplateLibraryProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl h-9 px-4 font-bold transition-all">
          <LayoutTemplate className="h-4 w-4 mr-2 text-orange-500" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none rounded-3xl shadow-2xl bg-white">
        <DialogHeader className="p-8 border-b bg-slate-50/50">
           <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-orange-200">
                <LayoutTemplate className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Template Library</DialogTitle>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Choose a baseline to accelerated your funnel design</p>
              </div>
           </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-8 bg-white">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {templates.map((template) => (
               <Card key={template.id} className="group overflow-hidden border-slate-100 hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 rounded-2xl">
                 <div className="relative aspect-video overflow-hidden">
                   <img
                     src={template.preview}
                     alt={template.name}
                     className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                   />
                   <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        {template.category}
                      </span>
                   </div>
                   <div className="absolute inset-0 bg-orange-600/0 group-hover:bg-orange-600/10 transition-colors" />
                 </div>
                 <CardContent className="p-5">
                   <CardTitle className="text-lg font-black text-slate-900 tracking-tight">{template.name}</CardTitle>
                   <p className="text-xs text-slate-500 leading-relaxed mt-2 line-clamp-2">
                     {template.description}
                   </p>
                 </CardContent>
                 <CardFooter className="p-5 pt-0">
                   <Button
                     onClick={() => onSelect(template)}
                     className="w-full bg-slate-900 hover:bg-orange-600 text-white font-bold h-10 rounded-xl transition-all"
                     size="sm"
                   >
                     Apply Template
                   </Button>
                 </CardFooter>
               </Card>
             ))}
           </div>
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-center">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">More templates coming soon to the ecosystem</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

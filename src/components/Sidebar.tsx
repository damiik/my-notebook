'use client';

import React, { useState } from 'react';
import { useArticle } from '@/context/ArticleContext';
import { Tag, Plus } from 'lucide-react';

import { Archive, X, ArrowRight, CornerDownRight, Link as LinkIcon, FileText } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const { 
    currentArticle, 
    articles, 
    storedArticles, 
    viewMode, 
    selectArticle, 
    removeFromStored, 
    addToStored,
    updateArticle,
    topics,

    addTagToArticle,
    removeTagFromArticle,
  } = useArticle();

    if (!currentArticle) return null;

  const [activeTab, setActiveTab] = useState<'related' | 'stored'>('related');

  // ⭐ KLUCZOWA ZMIANA: Znajdź "dzieci" (artykuły które mają currentArticle w swoich tags)
  // zamiast pobierać z currentArticle.childs
  const relatedArticles = articles.filter(art => 
    art.tags?.includes(currentArticle._id.toString()) && art._id !== currentArticle._id
  ).map(art => ({
    id: art._id,
    title: art.title,
    type: 'LINK' as const // W nowym modelu typ zawsze będzie LINK (PARTy obsługiwane inaczej)
  }));

  const stored = storedArticles.map(id => {
    const art = articles.find(a => a._id === id);
    return { _id: id, title: art?.title || 'Unknown' };
  });

  // ⭐ ZMIANA: Usuwanie "dziecka" = usunięcie tagu z artykułu-dziecka
  const handleRemoveRelated = async (childId: string) => {
      if(!currentArticle) return;
    
    const childArticle = articles.find(a => a._id === childId);
    if(!childArticle) return;

    // Usuń ID rodzica z tags dziecka
    const updatedChild = {
      ...childArticle,
      tags: childArticle.tags.filter(t => t !== currentArticle._id.toString())
    };
    
    await updateArticle(updatedChild);
  };

  // ⭐ ZMIANA: Dodanie z Stored = dodanie tagu do artykułu ze Store
  const handleAddFromStored = async (storedId: string) => {
      if(!currentArticle) return;
    
    const storedArticle = articles.find(a => a._id === storedId);
    if(!storedArticle) return;
    
    // Sprawdź czy już nie ma tego tagu
    if(storedArticle.tags?.includes(currentArticle._id.toString())) return;

    const updatedStored = {
      ...storedArticle,
      tags: [...(storedArticle.tags || []), currentArticle._id.toString()]
    };
    
    await updateArticle(updatedStored);
  }

  return (
    <aside className="w-80 bg-[#21222c] border-r border-neon-purple flex flex-col h-full text-sm">
      
      {/* Zakładki bez zmian */}
      <div className="flex border-b border-comment">
        <button
          onClick={() => setActiveTab('related')}
          className={clsx(
            "flex-1 p-2 font-bold transition-colors",
            activeTab === 'related' ? "bg-current-line text-cyan" : "hover:bg-current-line text-comment"
          )}
        >
          Related ({relatedArticles.length})
        </button>
        <button
          onClick={() => setActiveTab('stored')}
          className={clsx(
            "flex-1 p-2 font-bold transition-colors",
            activeTab === 'stored' ? "bg-current-line text-orange" : "hover:bg-current-line text-comment"
          )}
        >
          Store ({stored.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {activeTab === 'related' && (
          <>
            {relatedArticles.length === 0 && <div className="text-comment italic p-2">No related articles.</div>}
            {relatedArticles.map((item) => (
              <div key={item.id} className="group relative bg-[#282a36] p-2 rounded border border-[#D57E31] hover:border-cyan transition-all">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-comment uppercase tracking-wider font-bold">
                        <LinkIcon size={12} className="inline mr-1" />
                        LINK
                    </span>
                    {!viewMode && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => addToStored(item.id)} title="Add to Store"><Archive size={14} className="text-orange" /></button>
                             <button onClick={() => handleRemoveRelated(item.id)} title="Unlink from current">
                               <X size={14} className="text-red" />
                             </button>
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => selectArticle(item.id)} 
                    className="text-[#ABA864] hover:text-[#CABE4B] w-full text-left font-mono truncate transition-colors"
                >
                  {item.title}
                </button>
              </div>
            ))}
          </>
        )}

        {activeTab === 'stored' && (
          <>
            {stored.length === 0 && <div className="text-comment italic p-2">Store is empty.</div>}
            {stored.map((item) => (
              <div key={item._id} className="group relative bg-[#282a36] p-2 rounded border border-comment hover:border-orange transition-all">
                 <div className="flex justify-between items-center">
                    <button 
                        onClick={() => selectArticle(item._id)} 
                        className="text-foreground hover:text-orange truncate w-full text-left font-mono"
                    >
                    {item.title}
                    </button>
                    <div className="flex gap-1">
                        {!viewMode && (
                            <button onClick={() => handleAddFromStored(item._id)} title="Link to current">
                              <CornerDownRight size={14} className="text-green" />
                            </button>
                        )}
                        <button onClick={() => removeFromStored(item._id)}><X size={14} className="text-red" /></button>
                    </div>
                 </div>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

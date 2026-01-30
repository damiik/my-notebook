'use client';

import React, { useState, useEffect } from 'react';
import { useArticle } from '@/context/ArticleContext';
import { Archive, X, CornerDownRight, Link as LinkIcon, FileText, Puzzle, Unlink } from 'lucide-react';
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

  // ⭐ NOWA ZAKŁADKA: 'parts'
  const [activeTab, setActiveTab] = useState<'related' | 'parts' | 'stored'>('related');

  // Related (artykuły które mają currentArticle w swoich tags)
  const relatedArticles = articles.filter(art => 
    art.tags?.includes(currentArticle._id.toString()) && art._id !== currentArticle._id
  ).map(art => ({
    id: art._id,
    title: art.title,
  }));

  // ⭐ NOWE: Parts (artykuły wkomponowane w currentArticle)
  const partArticles = (currentArticle.parts || [])
    .map(partId => {
      const art = articles.find(a => a._id === partId);
      return { id: partId, title: art?.title || 'Unknown' };
    });

  const stored = storedArticles.map(id => {
    const art = articles.find(a => a._id === id);
    return { _id: id, title: art?.title || 'Unknown' };
  });

  // Usuwanie z Related (tagów)
  const handleRemoveRelated = async (childId: string) => {
    if(!currentArticle) return;
    const childArticle = articles.find(a => a._id === childId);
    if(!childArticle) return;
    
    const updatedChild = {
      ...childArticle,
      tags: childArticle.tags.filter(t => t !== currentArticle._id.toString())
    };
    await updateArticle(updatedChild);
  };

  // Dodawanie ze Stored do Related (tagi)
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

  // ⭐ NOWE: Usuwanie z Parts (odłączanie części)
  const handleRemovePart = async (partId: string) => {
    if(!currentArticle) return;
    
    const newParts = currentArticle.parts?.filter(p => p !== partId) || [];
    const updatedArticle = {
      ...currentArticle,
      parts: newParts
    };
    await updateArticle(updatedArticle);
  };

  // ⭐ NOWE: Dodawanie ze Stored jako Part (dołączanie jako część)
  const handleAddPartFromStored = async (storedId: string) => {
    if(!currentArticle) return;
    
    // Sprawdź czy już nie jest częścią
    if(currentArticle.parts?.includes(storedId)) {
      console.log('Already a part of this article');
      return;
    }

    const updatedArticle = {
      ...currentArticle,
      parts: [...(currentArticle.parts || []), storedId]
    };
    await updateArticle(updatedArticle);
    console.log(`Attached ${storedId} as part`);
  }

  useEffect(() => {
    if (viewMode && activeTab === 'parts') {
      setActiveTab('related');
    }
  }, [viewMode, activeTab]);

  return (
    <aside className="w-80 bg-[#21222c] border-r border-neon-purple flex flex-col h-full text-sm">
      
      {/* ⭐ TRZY ZAKŁADKI: Related | Parts | Store */}
      <div className="flex border-b border-comment">
        <button
          onClick={() => setActiveTab('related')}
          className={clsx(
            "flex-1 p-2 font-bold transition-colors text-xs truncate",
            activeTab === 'related' ? "bg-current-line text-cyan" : "hover:bg-current-line text-comment"
          )}
        >
          Related ({relatedArticles.length})
        </button>
        
        {/* ⭐ ZMIANA: Zakładka Parts widoczna tylko w trybie edycji */}
        {!viewMode && (
        <button
          onClick={() => setActiveTab('parts')}
          className={clsx(
            "flex-1 p-2 font-bold transition-colors text-xs truncate flex items-center justify-center gap-1",
            activeTab === 'parts' ? "bg-current-line text-purple" : "hover:bg-current-line text-comment"
          )}
        >
          <Puzzle size={12} /> Parts ({partArticles.length})
        </button>
        )}
        
        <button
          onClick={() => setActiveTab('stored')}
          className={clsx(
            "flex-1 p-2 font-bold transition-colors text-xs truncate",
            activeTab === 'stored' ? "bg-current-line text-orange" : "hover:bg-current-line text-comment"
          )}
        >
          Store ({stored.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        
        {/* Zakładka Related (bez zmian) */}
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
                               <Unlink size={14} className="text-red" />
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

        {/* ⭐ NOWA ZAKŁADKA: Parts */}
        {activeTab === 'parts' && (
          <>
            {partArticles.length === 0 && (
              <div className="text-comment italic p-2 text-xs">
                No parts attached.<br/>
                <span className="text-[10px] opacity-70">Use Store &rarr; Attach as Part</span>
              </div>
            )}
            {partArticles.map((item) => (
              <div key={item.id} className="group relative bg-[#282a36] p-2 rounded border border-purple hover:border-pink transition-all">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-comment uppercase tracking-wider font-bold">
                        <FileText size={12} className="inline mr-1" />
                        PART
                    </span>
                    {/* ⭐ Przycisk odłączania (tylko w trybie edycji) */}
                    {!viewMode && (
                        <button 
                          onClick={() => handleRemovePart(item.id)} 
                          title="Detach from article"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red hover:text-white"
                        >
                          <X size={14} />
                        </button>
                    )}
                </div>
                <button 
                    onClick={() => selectArticle(item.id)} 
                    className="text-[#C792EA] hover:text-[#FF80BF] w-full text-left font-mono truncate transition-colors"
                >
                  {item.title}
                </button>
              </div>
            ))}
          </>
        )}

        {/* Zakładka Store (rozszerzona) */}
        {activeTab === 'stored' && (
          <>
            {stored.length === 0 && <div className="text-comment italic p-2">Store is empty.</div>}
            {stored.map((item) => (
              <div key={item._id} className="group relative bg-[#282a36] p-2 rounded border border-comment hover:border-orange transition-all">
                 <div className="flex justify-between items-center">
                    <button 
                        onClick={() => selectArticle(item._id)} 
                        className="text-foreground hover:text-orange truncate w-full text-left font-mono text-xs"
                    >
                    {item.title}
                    </button>
                    <div className="flex gap-1">
                        {!viewMode && (
                            <>
                              {/* ⭐ NOWY PRZYCISK: Dołącz jako część */}
                              <button 
                                onClick={() => handleAddPartFromStored(item._id)} 
                                title="Attach as Part (embed in content)"
                                className="text-purple hover:text-pink"
                              >
                                <Puzzle size={14} />
                              </button>
                              {/* Istniejący przycisk Link */}
                              <button 
                                onClick={() => handleAddFromStored(item._id)} 
                                title="Link to current (add tag)"
                                className="text-green"
                              >
                                <CornerDownRight size={14} />
                            </button>
                            </>
                        )}
                        <button onClick={() => removeFromStored(item._id)} className="text-red"><X size={14} /></button>
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

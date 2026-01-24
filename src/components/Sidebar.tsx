'use client';

import React, { useState } from 'react';
import { useArticle } from '@/context/ArticleContext';
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
    updateArticle
  } = useArticle();
  
  const [activeTab, setActiveTab] = useState<'childs' | 'stored'>('childs');

  const childs = currentArticle?.childs.map(child => {
    const art = articles.find(a => a._id === child.id);
    return { ...child, title: art?.title || 'Unknown', _id: child.id };
  }) || [];

  const stored = storedArticles.map(id => {
    const art = articles.find(a => a._id === id);
    return { _id: id, title: art?.title || 'Unknown' };
  });

  const handleRemoveChild = (id: string) => {
      if(!currentArticle) return;
      const newChilds = currentArticle.childs.filter(c => c.id !== id);
      updateArticle({ ...currentArticle, childs: newChilds });
  };

  const handleAddChildFromStored = (id: string) => {
      if(!currentArticle) return;
      if(currentArticle.childs.find(c => c.id === id)) return; // Already exists
      const newChilds = [...currentArticle.childs, { id, type: 'LINK' as const }];
      updateArticle({ ...currentArticle, childs: newChilds });
  }

  return (
    <aside className="w-80 bg-[#21222c] border-r border-neon-purple flex flex-col h-full text-sm">
      <div className="flex border-b border-comment">
        <button
          onClick={() => setActiveTab('childs')}
          className={clsx(
            "flex-1 p-2 font-bold transition-colors",
            activeTab === 'childs' ? "bg-current-line text-cyan" : "hover:bg-current-line text-comment"
          )}
        >
          Related
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
        {activeTab === 'childs' && (
          <>
            {childs.length === 0 && <div className="text-comment italic p-2">No child articles.</div>}
            {childs.map((item) => (
              <div key={item.id} className="group relative bg-[#282a36] p-2 rounded border border-comment hover:border-cyan transition-all">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-comment uppercase tracking-wider font-bold">
                        {item.type === 'PART' ? <FileText size={12} className="inline mr-1" /> : <LinkIcon size={12} className="inline mr-1" />}
                        {item.type}
                    </span>
                    {!viewMode && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => addToStored(item.id)} title="Add to Store"><Archive size={14} className="text-orange" /></button>
                             <button onClick={() => handleRemoveChild(item.id)} title="Remove connection"><X size={14} className="text-red" /></button>
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => selectArticle(item.id)} 
                    className="text-foreground hover:text-green w-full text-left font-mono truncate"
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
                            <button onClick={() => handleAddChildFromStored(item._id)} title="Link to current"><CornerDownRight size={14} className="text-green" /></button>
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

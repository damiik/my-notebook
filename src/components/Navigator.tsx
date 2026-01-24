'use client';

import React from 'react';
import { useArticle } from '@/context/ArticleContext';
import { ArrowRight } from 'lucide-react';

const Navigator = () => {
  const { currentArticle, articles, selectArticle } = useArticle();

  if (!currentArticle) return null;

  // Find parents: articles that have currentArticle in their childs list
  const parents = articles.filter(art => 
    art.childs.some(c => c.id === currentArticle._id)
  );

  return (
    <div className="bg-[#282a36] border-b border-comment px-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap h-[37px]">
      {parents.length === 0 && <span className="text-comment text-xs italic">root</span>}
      
      {parents.map(p => (
        <button 
            key={p._id}
            onClick={() => selectArticle(p._id)}
            className="px-2 py-0.5 rounded text-sm font-mono border border-[#3465A4] text-[#1D8D85] hover:text-[#CABE4B] transition-colors"
        >
            {p.title}
        </button>
      ))}
      
      <ArrowRight size={14} className="text-[#4AC74D] mx-2" />
      
      <span className="font-bold text-[#1D8D85] font-mono text-sm px-2 border border-[#3465A4] rounded">
        {currentArticle.title}
      </span>
    </div>
  );
};

export default Navigator;

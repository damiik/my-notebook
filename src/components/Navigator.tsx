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
    <div className="bg-[#282a36] border-b border-comment p-2 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <span className="text-comment font-mono text-xs mr-2">PARENTS:</span>
      {parents.length === 0 && <span className="text-comment text-xs italic">root</span>}
      
      {parents.map(p => (
        <button 
            key={p._id}
            onClick={() => selectArticle(p._id)}
            className="px-2 py-1 bg-current-line rounded text-xs font-mono hover:bg-purple hover:text-black transition-colors"
        >
            {p.title}
        </button>
      ))}
      
      <ArrowRight size={14} className="text-yellow mx-2" />
      
      <span className="font-bold text-green font-mono text-sm px-2 border border-green rounded">
        {currentArticle.title}
      </span>
    </div>
  );
};

export default Navigator;

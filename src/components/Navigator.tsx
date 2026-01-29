'use client';

import React from 'react';
import { useArticle } from '@/context/ArticleContext';
import { ArrowRight } from 'lucide-react';

const Navigator = () => {
  // ZMIANA: Dodajemy articles z contextu
  const { currentArticle, articles, selectArticle } = useArticle();

  if (!currentArticle) return null;

  // const parentArticles = articles.filter(a => { 
  //     const articleIdStr = a._id.toString();
  //     const hasTag = currentArticle.tags?.includes(a._id);
  //     console.log('Checking article:', articleIdStr, 'Has tag?', hasTag);
  //     return hasTag;  // ✅ Musi być return
  // });

  const parentArticles = articles.filter(art => { 

      const articleIdStr = art._id.toString();  
      //console.log('Checking article:', articleIdStr, 'Current Article Tags:', currentArticle.tags); 
      return currentArticle.tags.some(c => c === articleIdStr);
    }
  );

  return (
    <div className="bg-[#282a36] border-b border-comment px-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap h-[37px]">
      {parentArticles.length === 0 && (
        <span className="text-comment text-xs italic">root</span>
      )}
      
      {parentArticles.map(parent => (
        <button 
            key={parent._id}
            onClick={() => selectArticle(parent._id)} // Kliknięcie przechodzi do artykułu-rodzica
            className="px-2 py-0.5 rounded text-sm font-mono border border-[#3465A4] text-[#1D8D85] hover:text-[#CABE4B] hover:border-[#CABE4B] transition-colors"
        >
            {parent.title}
        </button>
      ))}
      
      {parentArticles.length > 0 && <ArrowRight size={14} className="text-[#4AC74D] mx-2" />}
      
      <span className="font-bold text-[#1D8D85] font-mono text-sm px-2 border border-[#3465A4] rounded">
        {currentArticle.title}
      </span>
    </div>
  );
};

export default Navigator;
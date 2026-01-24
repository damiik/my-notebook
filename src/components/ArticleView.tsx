'use client';

import React from 'react';
import { useArticle } from '@/context/ArticleContext';
import DOMPurify from 'dompurify';

const ArticleView = () => {
  const { currentArticle, articles } = useArticle();

  if (!currentArticle) return <div className="p-10 text-comment">Select an article...</div>;

  // Function to render child "PART"s recursively
  const renderChildParts = () => {
      return currentArticle.childs.map((child, index) => {
          if (child.type !== 'PART') return null;
          const childArt = articles.find(a => a._id === child.id);
          if(!childArt) return null;

          return (
              <div key={child.id} className="mt-8 border-t border-dashed border-comment pt-4">
                  <div className="text-xs text-comment mb-2 font-mono">:: PART INCLUDE: {childArt.title} ::</div>
                  <div 
                    className="prose prose-invert max-w-none prose-headings:font-mono prose-code:text-pink"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(childArt.description) }} 
                  />
              </div>
          )
      })
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-cyan mb-4 font-mono border-b-2 border-green pb-2">
        {currentArticle.title}
      </h1>
      
      {/* Main Description */}
      <div 
        className="prose prose-invert max-w-none prose-headings:text-purple prose-a:text-cyan prose-code:bg-current-line prose-code:text-pink prose-code:p-1 prose-code:rounded prose-pre:bg-[#1e1e1e] font-sans"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentArticle.description) }} 
      />

      {/* Render composed parts */}
      {renderChildParts()}
    </div>
  );
};

export default ArticleView;

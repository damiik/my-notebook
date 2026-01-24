'use client';

import React, { useEffect, useRef } from 'react';
import { useArticle } from '@/context/ArticleContext';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

const ArticleView = () => {
  const { currentArticle, articles } = useArticle();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      const codeBlocks = contentRef.current.querySelectorAll('pre code');
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [currentArticle]);

  if (!currentArticle) return <div className="p-10 text-comment">Select an article...</div>;

  // Function to render child "PART"s recursively
  const renderChildParts = () => {
      return currentArticle.childs.map((child) => {
          if (child.type !== 'PART') return null;
          const childArt = articles.find(a => a._id === child.id);
          if(!childArt) return null;

          return (
              <div key={child.id} className="mt-12 border-t border-dashed border-comment pt-6">
                  <div className="text-xs text-comment mb-4 font-mono uppercase tracking-widest bg-current-line w-fit px-2 rounded">
                    Included Part: {childArt.title}
                  </div>
                  <div 
                    className="prose prose-invert max-w-none prose-code:text-pink"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(childArt.description, { ADD_TAGS: ["iframe"], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] }) }} 
                  />
              </div>
          )
      })
  }

  return (
    <div className="max-w-5xl mx-auto w-full p-4 pb-20" ref={contentRef}>
      <h1 className="text-4xl font-bold text-cyan mb-6 border-b-2 border-purple pb-2 shadow-sm">
        {currentArticle.title}
      </h1>
      
      {/* Main Description */}
      <div 
        className="prose prose-invert max-w-none prose-headings:text-purple prose-a:text-cyan prose-code:text-pink prose-pre:bg-[#1e1e1e] prose-pre:border prose-pre:border-comment"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentArticle.description, { ADD_TAGS: ["iframe"], ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] }) }} 
      />

      {/* Render composed parts */}
      <div className="mt-8">
        {renderChildParts()}
      </div>
    </div>
  );
};

export default ArticleView;
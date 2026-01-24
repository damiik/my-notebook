'use client';

import React, { useState, useEffect } from 'react';
import { useArticle } from '@/context/ArticleContext';

const ArticleEditor = () => {
  const { currentArticle, updateArticle } = useArticle();
  const [formData, setFormData] = useState({ title: '', description: '', summary: '' });

  useEffect(() => {
    if (currentArticle) {
      setFormData({
        title: currentArticle.title,
        description: currentArticle.description,
        summary: currentArticle.summary
      });
    }
  }, [currentArticle]);

  if (!currentArticle) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newData = { ...prev, [name]: value };
        // Debounce update in real app, simplistic here
        return newData;
    });
  };

  const handleBlur = () => {
      updateArticle({ ...currentArticle, ...formData });
  }

  return (
    <div className="flex flex-col h-full gap-4 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-comment uppercase font-bold">Title</label>
        <input 
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            className="bg-[#1e1e1e] border border-comment p-2 rounded text-cyan font-mono text-xl focus:border-green outline-none"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-comment uppercase font-bold">Summary / Tags</label>
        <input 
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            onBlur={handleBlur}
            className="bg-[#1e1e1e] border border-comment p-2 rounded text-orange font-mono focus:border-green outline-none"
        />
      </div>

      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs text-comment uppercase font-bold">Content (HTML)</label>
        <textarea 
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            className="flex-1 bg-[#1e1e1e] border border-comment p-4 rounded text-foreground font-mono leading-relaxed focus:border-green outline-none resize-none text-sm"
        />
      </div>
    </div>
  );
};

export default ArticleEditor;

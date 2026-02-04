'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useArticle } from '@/context/ArticleContext';
import { Editor } from '@tinymce/tinymce-react';

const ArticleEditor = () => {
  const { currentArticle, articles, updateArticle } = useArticle();
  const [formData, setFormData] = useState({ title: '', description: '', summary: '' });
  const editorRef = useRef<any>(null);

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

  // ⭐ ZMIANA: Używamy parts zamiast childs
  const partArticles = (currentArticle.parts || [])
    .map(partId => articles.find(a => a._id === partId))
    .filter(Boolean);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = () => {
      updateArticle({ ...currentArticle, ...formData });
  }

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }));
  };

  const handleEditorBlur = () => {
    updateArticle({ ...currentArticle, ...formData });
  };

  return (
    <div className="flex flex-col h-full gap-4 max-w-5xl mx-auto w-full p-4 overflow-auto">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-comment uppercase font-bold">Title</label>
        <input 
            name="title"
            value={formData.title}
            onChange={handleChange}
            onBlur={handleBlur}
            className="bg-[#1e1e1e] border border-comment p-2 rounded text-cyan text-xl focus:border-green outline-none"
            style={{ fontFamily: 'var(--font-crete-round), serif' }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-comment uppercase font-bold">Summary / Tags</label>
        <input 
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            onBlur={handleBlur}
            className="bg-[#1e1e1e] border border-comment p-2 rounded text-orange focus:border-green outline-none"
            style={{ fontFamily: 'var(--font-crete-round), serif' }}
        />
      </div>

      <div className="flex flex-col gap-1 min-h-[1500px]">
        <label className="text-xs text-comment uppercase font-bold">Content</label>
        <Editor
          apiKey="gtuoq2ngfkffuxefdortijvau5unahsvr1lojb51qin1kl3c"
          onInit={(evt, editor) => editorRef.current = editor}
          value={formData.description}
          onEditorChange={handleEditorChange}
          onBlur={handleEditorBlur}
          init={{
            height: 1500,
            menubar: "file edit insert view tools format",
            plugins: [
              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
              'searchreplace', 'visualblocks', 'code', 'fullscreen',
              'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount', 'codesample', 'emoticons'
            ],
            toolbar: 'undo redo | blocks | ' +
              'bold italic forecolor | alignleft aligncenter ' +
              'alignright alignjustify | bullist numlist outdent indent | ' +
              'removeformat | codesample emoticons | help',
            content_style: "@import url('https://fonts.googleapis.com/css2?family=Crete+Round&display=swap'); body { font-family: 'Crete Round', serif; font-size: 22px; background-color: #fff; color: #333; }",
            skin: 'oxide-dark',
            content_css: 'dark',
            codesample_languages: [
                { text: 'HTML/XML', value: 'markup' },
                { text: 'JavaScript', value: 'javascript' },
                { text: 'TypeScript', value: 'typescript' },
                { text: 'CSS', value: 'css' },
                { text: 'PHP', value: 'php' },
                { text: 'Ruby', value: 'ruby' },
                { text: 'Python', value: 'python' },
                { text: 'Java', value: 'java' },
                { text: 'C', value: 'c' },
                { text: 'C#', value: 'csharp' },
                { text: 'C++', value: 'cpp' },
                { text: 'Haskell', value: 'haskell' }
            ]
          }}
        />
      </div>

      {/* Render PART children inline just like legacy application */}
      <div className="flex flex-col gap-6 mt-8 pb-20">
        {partArticles.map(childArt => (
          <div key={childArt!._id} className="p-6 bg-[#1e1e1e] border border-comment rounded-lg relative opacity-80">
              <div className="absolute -top-3 left-4 bg-[#1e1e1e] px-2 text-xs text-comment font-bold border border-comment rounded uppercase">
              Sub-Article (Part): {childArt!.title}
              </div>
              <div 
                className="prose prose-invert max-w-none prose-sm"
              dangerouslySetInnerHTML={{ __html: childArt!.description }} 
              />
            </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleEditor;
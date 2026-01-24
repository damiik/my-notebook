'use client';

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Navigator from "@/components/Navigator";
import ArticleView from "@/components/ArticleView";
import ArticleEditor from "@/components/ArticleEditor";
import { useArticle } from "@/context/ArticleContext";

export default function Home() {
  const { viewMode, loading, error } = useArticle();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background font-mono text-green animate-pulse">
        $ LOAD_GRAPH --INITIALIZING...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background font-mono text-red">
        ERROR: {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Navigation */}
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          {/* Breadcrumb Navigator */}
          <Navigator />

          {/* Article View/Editor Container */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 article-content">
            {viewMode ? (
              <ArticleView />
            ) : (
              <ArticleEditor />
            )}
          </div>
        </main>
      </div>

      {/* Terminal Status Bar */}
      <footer className="bg-current-line border-t border-comment p-1 px-4 flex justify-between items-center text-[10px] font-mono text-comment">
        <div>STATUS: READY</div>
        <div>MY-NOTEBOOK-V3 // {new Date().toLocaleDateString()}</div>
      </footer>
    </div>
  );
}
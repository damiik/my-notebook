'use client';

import Navbar from "@/components/Navbar";
import GraphView from "@/components/GraphView";

export default function GraphPage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <Navbar />
      <main className="flex-1 overflow-hidden">
        <GraphView />
      </main>
    </div>
  );
}
'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useArticle } from '@/context/ArticleContext';

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  isMain: boolean;
  isUnassigned: boolean;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: string | NodeDatum;
  target: string | NodeDatum;
  type: 'parent' | 'part';
}

const GraphView = () => {
  const { articles, selectArticle, setViewMode } = useArticle();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Oblicz wymiary kontenera
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Generowanie danych dla D3
  const generateGraphData = () => {
    const nodes: NodeDatum[] = articles.map(art => ({
      id: art._id,
      title: art.title,
      isMain: art.summary === '#main',
      isUnassigned: art.summary === '#unassigned',
    }));

    const links: LinkDatum[] = [];
    
    // Relacje parent-child (z tags)
    articles.forEach(art => {
      art.tags?.forEach(parentId => {
        links.push({
          source: art._id,
          target: parentId,
          type: 'parent',
        });
      });
    });

    // Relacje parts (embedded)
    articles.forEach(art => {
      art.parts?.forEach(partId => {
        links.push({
          source: art._id,
          target: partId,
          type: 'part',
        });
      });
    });

    return { nodes, links };
  };

  useEffect(() => {
    if (!svgRef.current || articles.length === 0) return;

    const { width, height } = dimensions;
    const { nodes, links } = generateGraphData();

    // Wyczyść poprzednią zawartość
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    // Dodaj zoom
    const g = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Symulacja
    const simulation = d3.forceSimulation<NodeDatum>(nodes)
      .force("link", d3.forceLink<NodeDatum, LinkDatum>(links)
        .id(d => d.id)
        .distance(d => d.type === 'part' ? 50 : 100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(60));

    // Renderowanie linków
    const link = g.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => d.type === 'part' ? 2 : 1.5)
      .attr("stroke", d => d.type === 'part' ? "#C792EA" : "#6272a4")
      .attr("stroke-dasharray", d => d.type === 'part' ? "5,5" : null);

    // Renderowanie węzłów
    const node = g.append("g")
      .selectAll<SVGGElement, NodeDatum>("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, NodeDatum>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Okręgi węzłów
    node.append("circle")
      .attr("r", d => d.isMain ? 25 : d.isUnassigned ? 20 : 15)
      .attr("fill", d => {
        if (d.isMain) return "#ff5555";
        if (d.isUnassigned) return "#ffb86c";
        if (d.id === selectedNode) return "#8be9fd";
        return "#50fa7b";
      })
      .attr("stroke", d => d.id === selectedNode ? "#fff" : "#282a36")
      .attr("stroke-width", d => d.id === selectedNode ? 3 : 2)
      .style("cursor", "pointer");

    // Etykiety węzłów
    node.append("text")
      .text(d => d.title)
      .attr("x", 0)
      .attr("y", d => d.isMain ? 35 : d.isUnassigned ? 30 : 25)
      .attr("text-anchor", "middle")
      .attr("fill", "#f8f8f2")
      .attr("font-size", "12px")
      .attr("font-family", "var(--font-mononoki), monospace")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)");

    // Kliknięcie w węzeł
    node.on("click", (event, d) => {
      event.stopPropagation();
      setSelectedNode(d.id);
    });

    // Podwójne kliknięcie = przejście do artykułu
    node.on("dblclick", (event, d) => {
      event.stopPropagation();
      selectArticle(d.id);
      setViewMode(true);
    });

    // Aktualizacja pozycji
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as NodeDatum).x!)
        .attr("y1", d => (d.source as NodeDatum).y!)
        .attr("x2", d => (d.target as NodeDatum).x!)
        .attr("y2", d => (d.target as NodeDatum).y!);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Funkcje drag
    function dragstarted(event: d3.D3DragEvent<SVGGElement, NodeDatum, unknown>, d: NodeDatum) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, NodeDatum, unknown>, d: NodeDatum) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, NodeDatum, unknown>, d: NodeDatum) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [articles, dimensions, selectedNode, selectArticle, setViewMode]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-[#1e1e1e]">
      <svg ref={svgRef} className="w-full h-full" />
      
      {/* Legenda */}
      <div className="absolute top-4 left-4 bg-[#282a36] border border-comment p-4 rounded shadow-lg">
        <h3 className="text-cyan font-bold mb-2 text-sm">Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5555]"></div>
            <span>#main article</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ffb86c]"></div>
            <span>#unassigned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#50fa7b]"></div>
            <span>Regular article</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#8be9fd]"></div>
            <span>Selected</span>
          </div>
        </div>
        <div className="mt-4 pt-2 border-t border-comment space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-[#6272a4]"></div>
            <span>Parent link</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-[#C792EA] border-b border-dashed"></div>
            <span>Part link</span>
          </div>
        </div>
      </div>

      {/* Info o zaznaczonym węźle */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-[#282a36] border border-cyan p-4 rounded shadow-lg max-w-xs">
          <h4 className="text-cyan font-bold mb-1">Selected</h4>
          <p className="text-sm text-foreground mb-2">
            {articles.find(a => a._id === selectedNode)?.title}
          </p>
          <button
            onClick={() => {
              selectArticle(selectedNode);
              setViewMode(true);
            }}
            className="bg-purple hover:bg-pink text-background px-3 py-1 rounded text-xs font-bold transition-colors"
          >
            Open Article
          </button>
        </div>
      )}

      {/* Instrukcje */}
      <div className="absolute bottom-4 right-4 text-comment text-xs text-right">
        <p>Drag to move • Scroll to zoom</p>
        <p>Click to select • Double-click to open</p>
      </div>
    </div>
  );
};

export default GraphView;
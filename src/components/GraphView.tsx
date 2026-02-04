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
          source: parentId, // Parent as source
          target: art._id,  // Child as target
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

    // Renderowanie linków (grupy zawierające ścieżkę i strzałkę)
    const linkGroup = g.append("g")
      .selectAll("g")
      .data(links)
      .join("g")
      .attr("stroke-opacity", 0.6);

    const linkPath = linkGroup.append("path")
      .attr("fill", "none")
      .attr("stroke-width", d => d.type === 'part' ? 2 : 1.5)
      .attr("stroke", d => d.type === 'part' ? "#C792EA" : "#6272a4")
      .attr("stroke-dasharray", d => d.type === 'part' ? "5,5" : null);

    const linkArrow = linkGroup.append("path")
      .attr("fill", d => d.type === 'part' ? "#C792EA" : "#6272a4")
      .attr("stroke", "none")
      .attr("d", "M-10,-5 L0,0 L-10,5 Z");

    // Renderowanie węzłów
    const node = g.append("g")
      .selectAll<SVGGElement, NodeDatum>("g")
      .data(nodes)
      .join("g")
      .call(d3.drag<SVGGElement, NodeDatum>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Okręgi węzłów (zmniejszone rozmiary)
    node.append("circle")
      .attr("r", d => d.isMain ? 10 : d.isUnassigned ? 8 : 6)
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
      .attr("y", d => d.isMain ? 20 : d.isUnassigned ? 18 : 16)
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
      linkGroup.each(function(d) {
        const source = d.source as NodeDatum;
        const target = d.target as NodeDatum;
        const x0 = source.x!, y0 = source.y!, x1 = target.x!, y1 = target.y!;
        const dx = x1 - x0;
        const dy = y1 - y0;

        const r = target.isMain ? 10 : target.isUnassigned ? 8 : 6;
        const arrowLen = 10;

        // Formula for epsilon to reach distance D from t=1 (approx)
        const getEpsilon = (D: number) => {
          if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return 0.1;
          const a = 9 * dy * dy;
          const b = 2.25 * dx * dx;
          if (a < 1e-6) return D / Math.sqrt(b);
          const u = (-b + Math.sqrt(b * b + 4 * a * D * D)) / (2 * a);
          return Math.sqrt(u);
        };

        const eEnd = Math.min(getEpsilon(r), 0.5);
        const eBack = Math.min(getEpsilon(r + arrowLen), 0.6);

        const tEnd = 1 - eEnd;
        const tBack = 1 - eBack;

        const p0x = x0, p0y = y0;
        const p1x = (x0 + x1) / 2, p1y = y0;
        const p2x = (x0 + x1) / 2, p2y = y1;
        const p3x = x1, p3y = y1;

        const evalBezier = (t: number) => {
          const mt = 1 - t;
          return {
            x: mt*mt*mt*p0x + 3*mt*mt*t*p1x + 3*mt*t*t*p2x + t*t*t*p3x,
            y: mt*mt*mt*p0y + 3*mt*mt*t*p1y + 3*mt*t*t*p2y + t*t*t*p3y
          };
        };

        const pEnd = evalBezier(tEnd);
        const pBack = evalBezier(tBack);

        const angle = Math.atan2(pEnd.y - pBack.y, pEnd.x - pBack.x) * 180 / Math.PI;

        // De Casteljau for shortened path (0 to tEnd)
        const q0x = (1-tEnd)*p0x + tEnd*p1x, q0y = (1-tEnd)*p0y + tEnd*p1y;
        const q1x = (1-tEnd)*p1x + tEnd*p2x, q1y = (1-tEnd)*p1y + tEnd*p2y;
        const r0x = (1-tEnd)*q0x + tEnd*q1x, r0y = (1-tEnd)*q0y + tEnd*q1y;

        const dPath = `M${p0x},${p0y} C${q0x},${q0y} ${r0x},${r0y} ${pEnd.x},${pEnd.y}`;
        const arrowTransform = `translate(${pEnd.x},${pEnd.y}) rotate(${angle})`;

        const gEl = d3.select(this);
        gEl.select("path:nth-child(1)").attr("d", dPath);
        gEl.select("path:nth-child(2)").attr("transform", arrowTransform);
      });

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
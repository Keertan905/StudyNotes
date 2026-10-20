import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Network, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  Download, 
  Bookmark, 
  Trash2, 
  FolderOpen, 
  Search, 
  ChevronRight, 
  Bot, 
  X, 
  Layers, 
  Lightbulb, 
  GraduationCap, 
  RotateCcw,
  Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { mindMapService } from '../../services/mindmap.service';
import type { MindMapNode, GraphPayload, MindMapResponse } from '../../services/mindmap.service';
import { subjectService } from '../../services/subject.service';
import type { SubjectItem } from '../../services/subject.service';

interface RenderNode {
  id: string;
  data: MindMapNode;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  level: number;
  isExpanded: boolean;
  hasChildren: boolean;
  childrenCount: number;
}

interface RenderEdge {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  color: string;
  isCrossLink?: boolean;
  relationship?: string;
}

const TEMPLATES = [
  { topic: "Process Synchronization & Semaphores", subject: "Operating Systems" },
  { topic: "Database Normalization (1NF to BCNF)", subject: "Database Systems" },
  { topic: "TCP/IP vs OSI Reference Models", subject: "Computer Networks" },
  { topic: "Binary Search Trees & AVL Rotations", subject: "Data Structures" },
  { topic: "Gradient Descent & Backpropagation", subject: "Machine Learning" }
];

export default function MindMapPage() {
  const navigate = useNavigate();

  // Generation state
  const [topic, setTopic] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>();
  const [depth, setDepth] = useState<'concise' | 'balanced' | 'comprehensive'>('balanced');
  const layoutStyle = 'radial';
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Available subjects for dropdown
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Current graph
  const [graphPayload, setGraphPayload] = useState<GraphPayload | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Canvas Viewport transform (Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Saved Library Drawer
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [savedMaps, setSavedMaps] = useState<MindMapResponse[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  useEffect(() => {
    loadSubjects();
    loadSavedMaps();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      // Ignore background error
    }
  };

  const loadSavedMaps = async () => {
    try {
      setIsLoadingLibrary(true);
      const data = await mindMapService.getAll();
      setSavedMaps(data);
    } catch {
      // Ignore
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleGenerate = async (customTopic?: string, customSub?: string) => {
    const targetTopic = (customTopic || topic).trim();
    if (!targetTopic) {
      toast.error('Please enter a concept, topic, or subject to generate a mind map.');
      return;
    }

    try {
      setIsGenerating(true);
      const payload = await mindMapService.generate({
        topic: targetTopic,
        subjectName: customSub || selectedSubject || undefined,
        subjectId: selectedSubjectId,
        depth,
        layoutStyle
      });

      setGraphPayload(payload);
      setCollapsedNodes(new Set());
      setSelectedNode(payload.rootNode);
      // Reset view to center
      setZoom(0.9);
      setPan({ x: 0, y: 0 });
      toast.success(`Generated visual mind map with ${payload.totalNodes} concept nodes!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate mind map. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!graphPayload) return;
    try {
      setIsSaving(true);
      const saved = await mindMapService.save({
        title: graphPayload.rootNode.label,
        description: graphPayload.rootNode.description,
        subjectId: selectedSubjectId,
        graphData: JSON.stringify(graphPayload),
        layoutStyle,
        nodeCount: graphPayload.totalNodes
      });
      setSavedMaps(prev => [saved, ...prev]);
      toast.success('Mind map saved to your library!');
    } catch {
      toast.error('Failed to save mind map.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSaved = (saved: MindMapResponse) => {
    try {
      const payload: GraphPayload = JSON.parse(saved.graphData);
      setGraphPayload(payload);
      setTopic(saved.title);
      if (saved.subjectName) setSelectedSubject(saved.subjectName);
      if (saved.subjectId) setSelectedSubjectId(saved.subjectId);
      setCollapsedNodes(new Set());
      setSelectedNode(payload.rootNode);
      setZoom(0.9);
      setPan({ x: 0, y: 0 });
      setLibraryOpen(false);
      toast.success(`Loaded saved mind map: ${saved.title}`);
    } catch {
      toast.error('Failed to parse saved mind map data.');
    }
  };

  const handleDeleteSaved = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await mindMapService.delete(id);
      setSavedMaps(prev => prev.filter(m => m.id !== id));
      toast.success('Mind map deleted from library.');
    } catch {
      toast.error('Failed to delete mind map.');
    }
  };

  const toggleNodeCollapse = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedNodes(new Set());
  
  const collapseAllToDepth1 = () => {
    if (!graphPayload) return;
    const toCollapse = new Set<string>();
    if (graphPayload.rootNode.children) {
      graphPayload.rootNode.children.forEach(child => {
        toCollapse.add(child.id);
      });
    }
    setCollapsedNodes(toCollapse);
  };

  // Pan & Zoom controls
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const newZoom = e.deltaY < 0 ? zoom * scaleFactor : zoom / scaleFactor;
    setZoom(Math.min(Math.max(newZoom, 0.3), 3.0));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only main left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Export as PNG
  const handleExportPNG = () => {
    if (!svgRef.current) return;
    try {
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);

      if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a'; // dark canvas background
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.download = `${(graphPayload?.rootNode.label || 'mindmap').replace(/\s+/g, '_')}.png`;
          a.href = pngUrl;
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Mind map downloaded as high-res PNG image!');
        }
      };
      img.src = url;
    } catch {
      toast.error('Could not export PNG image.');
    }
  };

  // Export as JSON schema
  const handleExportJSON = () => {
    if (!graphPayload) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(graphPayload, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${graphPayload.rootNode.label.replace(/\s+/g, '_')}_mindmap.json`;
    a.click();
    toast.success('Mind map JSON exported!');
  };

  // Calculate layout coordinates
  const { nodes, edges } = useMemo(() => {
    if (!graphPayload || !graphPayload.rootNode) {
      return { nodes: [] as RenderNode[], edges: [] as RenderEdge[] };
    }

    const calculatedNodes: RenderNode[] = [];
    const calculatedEdges: RenderEdge[] = [];
    const root = graphPayload.rootNode;

    const rootWidth = 240;
    const rootHeight = 84;
    calculatedNodes.push({
      id: root.id,
      data: root,
      x: -rootWidth / 2,
      y: -rootHeight / 2,
      width: rootWidth,
      height: rootHeight,
      color: root.color || '#6366f1',
      level: 0,
      isExpanded: true,
      hasChildren: !!(root.children && root.children.length > 0),
      childrenCount: root.children ? root.children.length : 0
    });

    if (root.children && root.children.length > 0 && !collapsedNodes.has(root.id)) {
      const branchCount = root.children.length;
      const radiusLevel1 = 340;

      root.children.forEach((branch, bIdx) => {
        // Calculate angle for radial distribution
        const angle = (2 * Math.PI * bIdx) / branchCount - Math.PI / 2;
        const branchX = radiusLevel1 * Math.cos(angle);
        const branchY = radiusLevel1 * Math.sin(angle);
        const branchWidth = 210;
        const branchHeight = 72;

        const branchColor = branch.color || ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'][bIdx % 6];
        const isBranchExpanded = !collapsedNodes.has(branch.id);
        const hasChildren = !!(branch.children && branch.children.length > 0);

        calculatedNodes.push({
          id: branch.id,
          data: branch,
          x: branchX - branchWidth / 2,
          y: branchY - branchHeight / 2,
          width: branchWidth,
          height: branchHeight,
          color: branchColor,
          level: 1,
          isExpanded: isBranchExpanded,
          hasChildren,
          childrenCount: branch.children ? branch.children.length : 0
        });

        // Edge from Root to Branch
        calculatedEdges.push({
          id: `edge-${root.id}-${branch.id}`,
          sourceX: 0,
          sourceY: 0,
          targetX: branchX,
          targetY: branchY,
          color: branchColor
        });

        // Level 2 Sub-concepts
        if (hasChildren && isBranchExpanded && branch.children) {
          const subCount = branch.children.length;
          const spreadAngle = Math.PI / 3; // 60 degree fan
          const startAngle = angle - spreadAngle / 2;
          const radiusLevel2 = 250;

          branch.children.forEach((sub, sIdx) => {
            const subAngle = subCount === 1 ? angle : startAngle + (spreadAngle * sIdx) / (subCount - 1);
            const subX = branchX + radiusLevel2 * Math.cos(subAngle);
            const subY = branchY + radiusLevel2 * Math.sin(subAngle);
            const subWidth = 190;
            const subHeight = 64;

            const isSubExpanded = !collapsedNodes.has(sub.id);
            const subHasChildren = !!(sub.children && sub.children.length > 0);

            calculatedNodes.push({
              id: sub.id,
              data: sub,
              x: subX - subWidth / 2,
              y: subY - subHeight / 2,
              width: subWidth,
              height: subHeight,
              color: branchColor,
              level: 2,
              isExpanded: isSubExpanded,
              hasChildren: subHasChildren,
              childrenCount: sub.children ? sub.children.length : 0
            });

            // Edge from Branch to Sub-concept
            calculatedEdges.push({
              id: `edge-${branch.id}-${sub.id}`,
              sourceX: branchX,
              sourceY: branchY,
              targetX: subX,
              targetY: subY,
              color: branchColor
            });

            // Level 3 Leaf details (if comprehensive depth)
            if (subHasChildren && isSubExpanded && sub.children) {
              const leafCount = sub.children.length;
              const leafSpread = Math.PI / 4;
              const leafStartAngle = subAngle - leafSpread / 2;
              const radiusLevel3 = 190;

              sub.children.forEach((leaf, lIdx) => {
                const leafAngle = leafCount === 1 ? subAngle : leafStartAngle + (leafSpread * lIdx) / (leafCount - 1);
                const leafX = subX + radiusLevel3 * Math.cos(leafAngle);
                const leafY = subY + radiusLevel3 * Math.sin(leafAngle);
                const leafWidth = 170;
                const leafHeight = 56;

                calculatedNodes.push({
                  id: leaf.id,
                  data: leaf,
                  x: leafX - leafWidth / 2,
                  y: leafY - leafHeight / 2,
                  width: leafWidth,
                  height: leafHeight,
                  color: branchColor,
                  level: 3,
                  isExpanded: true,
                  hasChildren: false,
                  childrenCount: 0
                });

                calculatedEdges.push({
                  id: `edge-${sub.id}-${leaf.id}`,
                  sourceX: subX,
                  sourceY: subY,
                  targetX: leafX,
                  targetY: leafY,
                  color: branchColor
                });
              });
            }
          });
        }
      });
    }

    // Add cross-link edges if both nodes are visible
    if (graphPayload.crossLinks && graphPayload.crossLinks.length > 0) {
      const nodePosMap = new Map<string, { x: number; y: number }>();
      calculatedNodes.forEach(n => {
        nodePosMap.set(n.id, { x: n.x + n.width / 2, y: n.y + n.height / 2 });
      });

      graphPayload.crossLinks.forEach((link, idx) => {
        const src = nodePosMap.get(link.sourceId);
        const tgt = nodePosMap.get(link.targetId);
        if (src && tgt) {
          calculatedEdges.push({
            id: `cross-${idx}`,
            sourceX: src.x,
            sourceY: src.y,
            targetX: tgt.x,
            targetY: tgt.y,
            color: '#f59e0b',
            isCrossLink: true,
            relationship: link.relationship
          });
        }
      });
    }

    return { nodes: calculatedNodes, edges: calculatedEdges };
  }, [graphPayload, collapsedNodes]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Top Interactive Control Bar */}
      <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3 z-20 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">AI Concept Mind Map</h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                Interactive Graph
              </span>
            </div>
            <p className="text-xs text-slate-400">Generate, expand, and explore conceptual relationships</p>
          </div>
        </div>

        {/* Input Bar & Controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-3xl">
          {/* Subject Dropdown */}
          <select
            value={selectedSubjectId || ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              setSelectedSubjectId(val);
              const found = subjects.find(s => s.id === val);
              setSelectedSubject(found ? found.name : '');
            }}
            className="px-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">Any / General Subject</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Topic Input */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Process Scheduling Algorithms, Dynamic Programming..."
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {topic && (
              <button 
                onClick={() => setTopic('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Depth Selector */}
          <select
            value={depth}
            onChange={(e: any) => setDepth(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-800/80 border border-slate-700/80 rounded-lg text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="concise">Concise (2 Levels)</option>
            <option value="balanced">Balanced (Standard)</option>
            <option value="comprehensive">Comprehensive (Deep)</option>
          </select>

          {/* Generate Button */}
          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !topic.trim()}
            className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Mapping Concepts...' : 'Generate Map'}
          </button>
        </div>

        {/* Action Buttons: Library, Save, Export */}
        <div className="flex items-center gap-1.5">
          {graphPayload && (
            <>
              <button
                onClick={handleSaveToLibrary}
                disabled={isSaving}
                title="Save Mind Map to Library"
                className="p-2 text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs flex items-center gap-1 transition-colors"
              >
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Save</span>
              </button>

              <button
                onClick={handleExportPNG}
                title="Export High-Res PNG"
                className="p-2 text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs flex items-center gap-1 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">PNG</span>
              </button>

              <button
                onClick={handleExportJSON}
                title="Export JSON schema"
                className="p-2 text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-xs flex items-center gap-1 transition-colors"
              >
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">JSON</span>
              </button>
            </>
          )}

          <button
            onClick={() => setLibraryOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Saved Maps ({savedMaps.length})</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Background Grid Pattern */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            transform: `translate(${pan.x % 28}px, ${pan.y % 28}px)`
          }}
        />

        {/* Floating Canvas View Controls */}
        <div className="absolute bottom-5 left-5 z-10 flex items-center bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-1 shadow-xl gap-1">
          <button
            onClick={() => setZoom(z => Math.min(z * 1.15, 3.0))}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z / 1.15, 0.3))}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-slate-700/60 mx-0.5" />
          <button
            onClick={resetView}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset to Center"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-slate-700/60 mx-0.5" />
          <button
            onClick={expandAll}
            className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Expand All Nodes"
          >
            Expand All
          </button>
          <button
            onClick={collapseAllToDepth1}
            className="px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Collapse Sub-branches"
          >
            Level 1 Only
          </button>
          <span className="text-[11px] font-mono text-slate-400 px-2">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Quick Search Highlight Overlay */}
        {graphPayload && (
          <div className="absolute top-4 left-4 z-10 flex items-center bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg px-2.5 py-1.5 shadow-lg w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter nodes in graph..."
              className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-200">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Empty Canvas Welcome / Quick Templates */}
        {!graphPayload && !isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
            <div className="max-w-xl w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
                <Network className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Visual Knowledge Cartographer</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Transform any subject, chapter, or complex exam topic into an interconnected hierarchical mind map. 
                Identify core principles, mathematical bounds, algorithmic workflows, and practical exam tips.
              </p>

              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 text-left">
                ⚡ Try an instant concept template:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {TEMPLATES.map((tmpl, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTopic(tmpl.topic);
                      setSelectedSubject(tmpl.subject);
                      handleGenerate(tmpl.topic, tmpl.subject);
                    }}
                    className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 rounded-xl transition-all group"
                  >
                    <div className="font-medium text-xs text-slate-200 group-hover:text-indigo-400 transition-colors">
                      {tmpl.topic}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{tmpl.subject}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner Screen */}
        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm z-30">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-600/20 border-t-indigo-500 animate-spin" />
              <Network className="w-6 h-6 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <h3 className="text-base font-semibold text-white mt-4">Generating Concept Graph...</h3>
            <p className="text-xs text-slate-400 mt-1">Analyzing syllabus taxonomy, building branches, and calculating cross-links</p>
          </div>
        )}

        {/* SVG Graph Renderer */}
        {graphPayload && (
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
          >
            <g transform={`translate(${pan.x + (svgRef.current?.clientWidth || 800) / 2}, ${pan.y + (svgRef.current?.clientHeight || 600) / 2}) scale(${zoom})`}>
              
              {/* Edges & Bezier Connectors */}
              {edges.map((edge) => {
                if (edge.isCrossLink) {
                  // Dashed curved cross-link line
                  const midX = (edge.sourceX + edge.targetX) / 2;
                  const midY = (edge.sourceY + edge.targetY) / 2 - 50;
                  const path = `M ${edge.sourceX} ${edge.sourceY} Q ${midX} ${midY} ${edge.targetX} ${edge.targetY}`;
                  return (
                    <g key={edge.id} className="transition-opacity duration-300">
                      <path
                        d={path}
                        fill="none"
                        stroke={edge.color}
                        strokeWidth={2}
                        strokeDasharray="5,5"
                        opacity={0.7}
                      />
                      {edge.relationship && (
                        <text
                          x={midX}
                          y={midY}
                          fill="#f59e0b"
                          fontSize={10}
                          textAnchor="middle"
                          className="bg-slate-900 px-1 py-0.5 rounded font-mono"
                        >
                          {edge.relationship}
                        </text>
                      )}
                    </g>
                  );
                }

                // Smooth cubic Bezier for standard hierarchical tree
                const dx = edge.targetX - edge.sourceX;
                const cx1 = edge.sourceX + dx * 0.5;
                const cy1 = edge.sourceY;
                const cx2 = edge.sourceX + dx * 0.5;
                const cy2 = edge.targetY;
                const path = `M ${edge.sourceX} ${edge.sourceY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${edge.targetX} ${edge.targetY}`;

                return (
                  <path
                    key={edge.id}
                    d={path}
                    fill="none"
                    stroke={edge.color}
                    strokeWidth={edge.id.includes('root') ? 3 : 2}
                    opacity={0.5}
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* Concept Nodes */}
              {nodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const matchesSearch = searchQuery.trim() !== '' && 
                  (node.data.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                   (node.data.description && node.data.description.toLowerCase().includes(searchQuery.toLowerCase())));

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node.data);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Node Container Card */}
                    <rect
                      width={node.width}
                      height={node.height}
                      rx={node.level === 0 ? 16 : 12}
                      fill={node.level === 0 ? '#1e1b4b' : '#0f172a'}
                      stroke={matchesSearch ? '#fbbf24' : isSelected ? '#a855f7' : node.color}
                      strokeWidth={matchesSearch ? 3 : isSelected ? 3 : node.level === 0 ? 2.5 : 1.5}
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
                      className="transition-all duration-200 group-hover:brightness-125"
                    />

                    {/* Node Header Pill Accent */}
                    <rect
                      x={6}
                      y={6}
                      width={4}
                      height={node.height - 12}
                      rx={2}
                      fill={node.color}
                    />

                    {/* Node Label Text */}
                    <text
                      x={16}
                      y={node.level === 0 ? 32 : 24}
                      fill="#ffffff"
                      fontSize={node.level === 0 ? 15 : 12}
                      fontWeight={node.level === 0 ? 700 : 600}
                      className="select-none"
                    >
                      {node.data.label.length > (node.level === 0 ? 24 : 22) 
                        ? node.data.label.slice(0, node.level === 0 ? 22 : 20) + '...' 
                        : node.data.label}
                    </text>

                    {/* Short Description */}
                    {node.data.description && (
                      <text
                        x={16}
                        y={node.level === 0 ? 52 : 42}
                        fill="#94a3b8"
                        fontSize={10}
                        className="select-none"
                      >
                        {node.data.description.length > 28 
                          ? node.data.description.slice(0, 26) + '...' 
                          : node.data.description}
                      </text>
                    )}

                    {/* Category Tag Badge */}
                    {node.data.category && node.data.category !== 'root' && (
                      <text
                        x={16}
                        y={node.height - 8}
                        fill={node.color}
                        fontSize={8.5}
                        fontWeight={600}
                        className="uppercase tracking-wider select-none"
                      >
                        {node.data.category}
                      </text>
                    )}

                    {/* Expand / Collapse Indicator Button */}
                    {node.hasChildren && (
                      <g 
                        transform={`translate(${node.width - 16}, ${node.height / 2})`}
                        onClick={(e) => toggleNodeCollapse(e, node.id)}
                        className="hover:scale-110 transition-transform"
                      >
                        <circle
                          r={10}
                          fill="#1e293b"
                          stroke={node.color}
                          strokeWidth={1.5}
                        />
                        <text
                          y={3}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={11}
                          fontWeight={700}
                          className="select-none"
                        >
                          {node.isExpanded ? '−' : `+${node.childrenCount}`}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      {/* Right Concept Detail Inspector Drawer */}
      {selectedNode && (
        <div className="absolute top-16 right-5 bottom-5 w-84 sm:w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-5 flex flex-col z-20 overflow-y-auto animate-in slide-in-from-right duration-200">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full shrink-0" 
                style={{ backgroundColor: selectedNode.color || '#6366f1' }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {selectedNode.category || 'Concept Node'}
              </span>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-base font-bold text-white mt-3">
            {selectedNode.label}
          </h3>

          {/* Full Academic Explanation */}
          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              Core Academic Explanation
            </div>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-800/50 p-3 rounded-xl border border-slate-800">
              {selectedNode.description || 'No direct summary provided for this sub-concept.'}
            </p>
          </div>

          {/* Exam Mastery & Recall Tips */}
          {selectedNode.examTip && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-rose-400" />
                Exam Scoring Tip / Key Rule
              </div>
              <div className="text-xs text-rose-200 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl leading-relaxed">
                {selectedNode.examTip}
              </div>
            </div>
          )}

          {/* Children / Sub-nodes summary */}
          {selectedNode.children && selectedNode.children.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Sub-Concepts ({selectedNode.children.length})
              </div>
              <div className="space-y-1.5">
                {selectedNode.children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedNode(child)}
                    className="w-full text-left p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs text-slate-300 hover:text-white transition-colors"
                  >
                    <span>{child.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action: Ask AI Tutor about this node */}
          <div className="mt-auto pt-5 border-t border-slate-800">
            <button
              onClick={() => {
                navigate(`/tutor?prompt=Explain%20the%20concept%20of%20${encodeURIComponent(selectedNode.label)}%20in%20depth%20with%20examples`);
              }}
              className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
            >
              <Bot className="w-4 h-4" />
              Ask AI Tutor About This Concept
            </button>
          </div>
        </div>
      )}

      {/* Saved Mind Maps Modal / Library Drawer */}
      {libraryOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md bg-slate-900 h-full border-l border-slate-800 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-bold text-white">Saved Mind Maps</h2>
              </div>
              <button
                onClick={() => setLibraryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 space-y-3">
              {isLoadingLibrary ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading library...</div>
              ) : savedMaps.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Network className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  No saved mind maps found yet.<br />
                  Generate a mind map and click "Save" to build your visual library.
                </div>
              ) : (
                savedMaps.map((map) => (
                  <div
                    key={map.id}
                    onClick={() => handleLoadSaved(map)}
                    className="p-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-all group flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                        {map.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {map.description || 'Visual concept map'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
                        {map.subjectName && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                            {map.subjectName}
                          </span>
                        )}
                        <span>{map.nodeCount || 10} nodes</span>
                        <span>•</span>
                        <span>{new Date(map.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSaved(e, map.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                      title="Delete map"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

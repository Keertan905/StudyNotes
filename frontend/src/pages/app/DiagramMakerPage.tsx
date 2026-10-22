import { useState, useEffect, useRef } from 'react';
import type { MouseEvent, WheelEvent } from 'react';
import { 
  Network, 
  Workflow, 
  Layers, 
  FileText, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Bookmark, 
  Trash2, 
  FolderOpen, 
  X, 
  Info, 
  CheckCircle, 
  Zap, 
  Code
} from 'lucide-react';
import toast from 'react-hot-toast';
import { 
  diagramService, 
  type DiagramPayload, 
  type DiagramNode, 
  type DiagramResponse 
} from '../../services/diagram.service';
import { subjectService, type SubjectItem } from '../../services/subject.service';

const DIAGRAM_TYPES = [
  { id: 'FLOWCHART', label: 'Flowchart', icon: Workflow, desc: 'Step-by-step logic, loops & decisions' },
  { id: 'CONCEPT_MAP', label: 'Concept Map', icon: Network, desc: 'Interconnected relationships & hierarchy' },
  { id: 'SYSTEM_ARCHITECTURE', label: 'System Process', icon: Layers, desc: 'Multi-layer system components & pipelines' },
  { id: 'REVISION_INFOGRAPHIC', label: 'Revision Infographic', icon: FileText, desc: 'Visual cards, formulas, pitfalls & takeaways' },
];

const PRESETS = [
  { topic: 'Binary Search Algorithm', type: 'FLOWCHART', subject: 'Data Structures & Algorithms' },
  { topic: 'TCP 3-Way Handshake & Connection Teardown', type: 'SYSTEM_ARCHITECTURE', subject: 'Computer Networks' },
  { topic: 'Operating System Process Lifecycle', type: 'CONCEPT_MAP', subject: 'Operating Systems' },
  { topic: 'Ohm’s Law & Electrical Circuit Principles', type: 'REVISION_INFOGRAPHIC', subject: 'Physics & Electronics' },
];

export default function DiagramMakerPage() {
  const [topic, setTopic] = useState('');
  const [diagramType, setDiagramType] = useState('FLOWCHART');
  const [complexity, setComplexity] = useState<'concise' | 'detailed' | 'comprehensive'>('detailed');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Diagram state
  const [payload, setPayload] = useState<DiagramPayload | null>(null);
  const [selectedNode, setSelectedNode] = useState<DiagramNode | null>(null);

  // Viewport Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Library Drawer
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [savedDiagrams, setSavedDiagrams] = useState<DiagramResponse[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  useEffect(() => {
    loadSubjects();
    loadSavedDiagrams();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await subjectService.getSubjects();
      setSubjects(data);
    } catch {
      // background silent
    }
  };

  const loadSavedDiagrams = async () => {
    try {
      setIsLoadingLibrary(true);
      const data = await diagramService.getAll();
      setSavedDiagrams(data);
    } catch {
      // background silent
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleGenerate = async (customTopic?: string, customType?: string, customSub?: string) => {
    const targetTopic = (customTopic || topic).trim();
    if (!targetTopic) {
      toast.error('Please enter a topic or concept to diagram');
      return;
    }

    const targetType = customType || diagramType;
    const targetSub = customSub || selectedSubject;

    setIsGenerating(true);
    setSelectedNode(null);

    try {
      const data = await diagramService.generate({
        topic: targetTopic,
        diagramType: targetType,
        complexity,
        subjectName: targetSub || undefined,
      });

      setPayload(data);
      resetView();
      toast.success(`Generated ${data.title}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate diagram. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag pan handlers
  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return; // only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.max(0.3, Math.min(2.5, prev * factor)));
  };

  const handleSave = async () => {
    if (!payload) return;
    setIsSaving(true);
    try {
      const saved = await diagramService.save({
        title: payload.title,
        description: payload.summary,
        diagramType: payload.diagramType,
        graphData: JSON.stringify(payload),
        layoutStyle: payload.layoutDirection || 'TB',
        nodeCount: payload.nodes.length,
      });
      toast.success('Diagram saved to your library!');
      setSavedDiagrams((prev) => [saved, ...prev]);
    } catch {
      toast.error('Failed to save diagram');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSaved = (saved: DiagramResponse) => {
    try {
      const parsed: DiagramPayload = JSON.parse(saved.graphData);
      setPayload(parsed);
      setTopic(saved.title);
      setDiagramType(saved.diagramType);
      setLibraryOpen(false);
      resetView();
      toast.success(`Loaded "${saved.title}"`);
    } catch {
      toast.error('Could not load diagram data');
    }
  };

  const handleDeleteSaved = async (id: number, e: MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved diagram?')) return;
    try {
      await diagramService.delete(id);
      setSavedDiagrams((prev) => prev.filter((d) => d.id !== id));
      toast.success('Diagram deleted');
    } catch {
      toast.error('Failed to delete diagram');
    }
  };

  const exportAsSvg = () => {
    if (!svgRef.current || !payload) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as SVG');
  };

  const exportAsJson = () => {
    if (!payload) return;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported diagram JSON');
  };

  const exportAsPng = () => {
    if (!svgRef.current || !payload) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1600;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${payload.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
        link.click();
        toast.success('Exported as high-res PNG');
      }
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  // Node coordinate lookup
  const nodeMap = new Map<string, DiagramNode>();
  if (payload) {
    payload.nodes.forEach((n) => nodeMap.set(n.id, n));
  }

  // Calculate canvas bounding box
  let minX = 0, minY = 0, maxX = 800, maxY = 650;
  if (payload && payload.nodes.length > 0) {
    const xs = payload.nodes.map((n) => n.x || 300);
    const ys = payload.nodes.map((n) => n.y || 100);
    minX = Math.min(...xs) - 150;
    minY = Math.min(...ys) - 100;
    maxX = Math.max(...xs) + 250;
    maxY = Math.max(...ys) + 200;
  }
  const viewBoxWidth = Math.max(900, maxX - minX);
  const viewBoxHeight = Math.max(700, maxY - minY);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600/10 text-indigo-600 rounded-lg">
              <Workflow className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Diagram & Infographic Maker</h1>
              <p className="text-sm text-slate-500">
                Generate educational flowcharts, concept maps, architectures, and revision infographics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLibraryOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
          >
            <FolderOpen className="w-4 h-4 text-indigo-600" />
            <span>Saved Diagrams ({savedDiagrams.length})</span>
          </button>

          {payload && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
            >
              <Bookmark className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save to Library'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Input & Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        {/* Diagram Type Pills */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Select Diagram Type
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {DIAGRAM_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = diagramType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setDiagramType(type.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-sm">{type.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">{type.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g. Quick Sort Algorithm, TCP Handshake, Database ACID Transactions, Ohm's Law..."
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-50/50"
            />
          </div>

          <div className="w-full md:w-56">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="">General Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-36">
            <select
              value={complexity}
              onChange={(e) => setComplexity(e.target.value as any)}
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              <option value="concise">Concise</option>
              <option value="detailed">Detailed</option>
              <option value="comprehensive">Comprehensive</option>
            </select>
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating || !topic.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Diagram</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Presets */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Try Examples:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setTopic(p.topic);
                setDiagramType(p.type);
                setSelectedSubject(p.subject);
                handleGenerate(p.topic, p.type, p.subject);
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition"
            >
              {p.topic}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div 
            ref={containerRef}
            className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl h-[620px] select-none flex flex-col justify-between"
          >
            {/* Top Toolbar */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg text-white">
                <span className="text-xs font-medium text-slate-400">Diagram:</span>
                <span className="text-xs font-semibold text-indigo-400">
                  {payload ? payload.title : 'Ready to render'}
                </span>
                {payload && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {payload.diagramType}
                  </span>
                )}
              </div>

              {/* Zoom & Export Controls */}
              <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-lg text-white">
                <button
                  onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                  title="Zoom In"
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
                  title="Zoom Out"
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={resetView}
                  title="Reset View"
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-slate-800 mx-1" />
                <button
                  onClick={exportAsSvg}
                  disabled={!payload}
                  title="Export SVG"
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>SVG</span>
                </button>
                <button
                  onClick={exportAsPng}
                  disabled={!payload}
                  title="Export PNG"
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG</span>
                </button>
                <button
                  onClick={exportAsJson}
                  disabled={!payload}
                  title="Export JSON"
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition disabled:opacity-40"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Interactive SVG Canvas */}
            <div
              className={`w-full h-full cursor-${isDragging ? 'grabbing' : 'grab'}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
            >
              {payload ? (
                <svg
                  ref={svgRef}
                  className="w-full h-full"
                  viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
                >
                  <defs>
                    {/* Arrow head marker */}
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="10"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
                    </marker>
                    <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    {/* Connecting Edges */}
                    {payload.edges.map((edge) => {
                      const source = nodeMap.get(edge.sourceId);
                      const target = nodeMap.get(edge.targetId);
                      if (!source || !target) return null;

                      const sx = source.x || 300;
                      const sy = (source.y || 100) + 30;
                      const tx = target.x || 300;
                      const ty = (target.y || 200) - 25;

                      // Midpoint for curve and label
                      const mx = (sx + tx) / 2;
                      const my = (sy + ty) / 2;
                      const isDashed = edge.style === 'dashed';

                      return (
                        <g key={edge.id} className="transition-all duration-300">
                          <path
                            d={`M ${sx} ${sy} C ${sx} ${my}, ${tx} ${my}, ${tx} ${ty}`}
                            fill="none"
                            stroke="#475569"
                            strokeWidth="2.5"
                            strokeDasharray={isDashed ? '6,6' : undefined}
                            markerEnd="url(#arrow)"
                            className="hover:stroke-indigo-400 hover:stroke-[3.5] transition-all cursor-pointer"
                          />
                          {edge.label && (
                            <g transform={`translate(${mx}, ${my})`}>
                              <rect
                                x="-45"
                                y="-12"
                                width="90"
                                height="20"
                                rx="10"
                                fill="#0f172a"
                                stroke="#334155"
                                strokeWidth="1"
                              />
                              <text
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#94a3b8"
                                fontSize="11"
                                fontWeight="500"
                              >
                                {edge.label}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Nodes */}
                    {payload.nodes.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const x = node.x || 300;
                      const y = node.y || 100;
                      const color = node.color || '#6366f1';

                      return (
                        <g
                          key={node.id}
                          transform={`translate(${x}, ${y})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(node);
                          }}
                          className="cursor-pointer group"
                        >
                          {/* Node Shape */}
                          {node.shape === 'diamond' ? (
                            <polygon
                              points="0,-40 85,0 0,40 -85,0"
                              fill="#1e293b"
                              stroke={isSelected ? '#38bdf8' : color}
                              strokeWidth={isSelected ? '3' : '2'}
                              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
                              className="group-hover:stroke-white transition-all"
                            />
                          ) : node.shape === 'pill' ? (
                            <rect
                              x="-90"
                              y="-26"
                              width="180"
                              height="52"
                              rx="26"
                              fill="#1e293b"
                              stroke={isSelected ? '#38bdf8' : color}
                              strokeWidth={isSelected ? '3' : '2'}
                              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
                              className="group-hover:stroke-white transition-all"
                            />
                          ) : (
                            <rect
                              x="-95"
                              y="-30"
                              width="190"
                              height="60"
                              rx="12"
                              fill="#1e293b"
                              stroke={isSelected ? '#38bdf8' : color}
                              strokeWidth={isSelected ? '3' : '2'}
                              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
                              className="group-hover:stroke-white transition-all"
                            />
                          )}

                          {/* Category Dot */}
                          <circle cx="-75" cy="0" r="5" fill={color} />

                          {/* Node Text Label */}
                          <text
                            x="5"
                            y="-6"
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize="13"
                            fontWeight="600"
                            className="pointer-events-none select-none"
                          >
                            {node.label.length > 20 ? node.label.substring(0, 18) + '...' : node.label}
                          </text>

                          {/* Node Subtitle / Category */}
                          <text
                            x="5"
                            y="14"
                            textAnchor="middle"
                            fill="#94a3b8"
                            fontSize="10"
                            fontWeight="500"
                            className="pointer-events-none select-none uppercase tracking-wider"
                          >
                            {node.category}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <Workflow className="w-16 h-16 mb-4 text-slate-700 animate-pulse" />
                  <h3 className="text-lg font-semibold text-slate-300 mb-1">Interactive Diagram Workspace</h3>
                  <p className="text-sm max-w-md text-slate-500 mb-4">
                    Enter any academic topic above to generate flowcharts, concept maps, or revision infographics with structured vector layout.
                  </p>
                  <button
                    onClick={() => handleGenerate(PRESETS[0].topic, PRESETS[0].type, PRESETS[0].subject)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                  >
                    Load Sample: Binary Search Algorithm
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Status bar */}
            {payload && (
              <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span>{payload.nodes.length} Concepts / Nodes</span>
                  <span>{payload.edges.length} Relational Links</span>
                  {payload.formulaHighlight && (
                    <span className="text-pink-400 font-mono font-medium">
                      ⚡ {payload.formulaHighlight}
                    </span>
                  )}
                </div>
                <div>Zoom: {Math.round(zoom * 100)}% | Click node to inspect details</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Inspector & Concept Details Drawer */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-600" />
                <span>Concept Inspector</span>
              </h3>
              {selectedNode && (
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white mb-2"
                    style={{ backgroundColor: selectedNode.color || '#6366f1' }}
                  >
                    {selectedNode.category}
                  </span>
                  <h4 className="text-lg font-bold text-slate-900">{selectedNode.label}</h4>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Definition</span>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                    {selectedNode.description || 'Core algorithmic or conceptual stage in the process.'}
                  </p>
                </div>

                {selectedNode.examTip && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> High-Yield Exam Tip
                    </span>
                    <p className="text-xs text-amber-900 bg-amber-50/80 border border-amber-200 p-3 rounded-lg leading-relaxed">
                      {selectedNode.examTip}
                    </p>
                  </div>
                )}
              </div>
            ) : payload ? (
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">
                    Overview Summary
                  </h4>
                  <p className="text-xs text-indigo-800 leading-relaxed">{payload.summary}</p>
                </div>

                {payload.keyTakeaways && payload.keyTakeaways.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Key Takeaways
                    </h4>
                    <ul className="space-y-2">
                      {payload.keyTakeaways.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Select any node on the diagram canvas to view its academic definition, parameters, and exam tips.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revision Infographic Educational Breakdown Section */}
      {payload && payload.sections && payload.sections.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Revision Infographic Knowledge Cards</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {payload.sections.map((section) => (
              <div
                key={section.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-white hover:border-indigo-200 transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{section.title}</h3>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: section.color || '#6366f1' }}
                  />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{section.summary}</p>

                {section.bulletPoints && section.bulletPoints.length > 0 && (
                  <ul className="space-y-1 pt-1">
                    {section.bulletPoints.map((pt, idx) => (
                      <li key={idx} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.formula && (
                  <div className="pt-2">
                    <span className="inline-block text-[11px] font-mono px-2 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold">
                      {section.formula}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slide-out Saved Library Drawer */}
      {libraryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-base">Saved Diagrams</h3>
                </div>
                <button
                  onClick={() => setLibraryOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isLoadingLibrary ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  Loading your saved diagrams...
                </div>
              ) : savedDiagrams.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm space-y-2">
                  <Workflow className="w-12 h-12 mx-auto text-slate-300" />
                  <p>You have not saved any diagrams yet.</p>
                  <p className="text-xs text-slate-400">Generate a diagram and click 'Save to Library'.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedDiagrams.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => handleLoadSaved(d)}
                      className="p-3.5 border border-slate-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/30 transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {d.diagramType}
                        </span>
                        <h4 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition">
                          {d.title}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {new Date(d.createdAt).toLocaleDateString()} • {d.nodeCount || 0} nodes
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSaved(d.id, e)}
                        title="Delete diagram"
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setLibraryOpen(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-lg transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

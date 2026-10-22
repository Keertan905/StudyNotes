import api from './api';

export interface DiagramNode {
  id: string;
  label: string;
  description?: string;
  category: 'start' | 'process' | 'decision' | 'end' | 'component' | 'concept' | 'formula' | string;
  shape?: 'rect' | 'diamond' | 'circle' | 'pill' | 'rounded' | 'hexagon' | string;
  color?: string;
  icon?: string;
  examTip?: string;
  x?: number;
  y?: number;
}

export interface DiagramEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  style?: 'solid' | 'dashed' | 'bidirectional' | string;
}

export interface DiagramSection {
  id: string;
  title: string;
  icon?: string;
  color?: string;
  summary: string;
  bulletPoints: string[];
  formula?: string;
}

export interface DiagramPayload {
  title: string;
  diagramType: 'FLOWCHART' | 'CONCEPT_MAP' | 'SYSTEM_ARCHITECTURE' | 'REVISION_INFOGRAPHIC' | string;
  summary: string;
  layoutDirection?: 'TB' | 'LR' | string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  sections?: DiagramSection[];
  keyTakeaways: string[];
  formulaHighlight?: string;
}

export interface GenerateDiagramRequest {
  topic: string;
  subjectName?: string;
  subjectId?: number;
  diagramType?: 'FLOWCHART' | 'CONCEPT_MAP' | 'SYSTEM_ARCHITECTURE' | 'REVISION_INFOGRAPHIC' | string;
  complexity?: 'concise' | 'detailed' | 'comprehensive';
  customContext?: string;
}

export interface SaveDiagramRequest {
  title: string;
  description?: string;
  subjectId?: number;
  diagramType: string;
  graphData: string;
  layoutStyle?: string;
  nodeCount?: number;
}

export interface DiagramResponse {
  id: number;
  title: string;
  description?: string;
  subjectId?: number;
  subjectName?: string;
  diagramType: string;
  graphData: string;
  layoutStyle?: string;
  nodeCount?: number;
  createdAt: string;
}

export const diagramService = {
  async generate(data: GenerateDiagramRequest): Promise<DiagramPayload> {
    const res = await api.post<DiagramPayload>('/api/diagrams/generate', data);
    return res.data;
  },

  async save(data: SaveDiagramRequest): Promise<DiagramResponse> {
    const res = await api.post<DiagramResponse>('/api/diagrams', data);
    return res.data;
  },

  async getAll(subjectId?: number): Promise<DiagramResponse[]> {
    const res = await api.get<DiagramResponse[]>('/api/diagrams', {
      params: subjectId ? { subjectId } : undefined
    });
    return res.data;
  },

  async getById(id: number): Promise<DiagramResponse> {
    const res = await api.get<DiagramResponse>(`/api/diagrams/${id}`);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/diagrams/${id}`);
  }
};

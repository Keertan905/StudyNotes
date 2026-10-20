import api from './api';

export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  category?: 'root' | 'concept' | 'subconcept' | 'example' | 'formula' | 'application';
  color?: string;
  examTip?: string;
  children?: MindMapNode[];
  relatedNodeIds?: string[];
}

export interface CrossLink {
  sourceId: string;
  targetId: string;
  relationship: string;
}

export interface GraphPayload {
  rootId: string;
  rootNode: MindMapNode;
  totalNodes: number;
  maxDepth: number;
  crossLinks?: CrossLink[];
}

export interface GenerateMindMapRequest {
  topic: string;
  subjectName?: string;
  subjectId?: number;
  unitId?: number;
  topicId?: number;
  depth?: 'concise' | 'balanced' | 'comprehensive';
  layoutStyle?: 'radial' | 'tree' | 'flow';
  customContext?: string;
}

export interface SaveMindMapRequest {
  subjectId?: number;
  unitId?: number;
  topicId?: number;
  title: string;
  description?: string;
  graphData: string;
  layoutStyle?: string;
  nodeCount?: number;
}

export interface MindMapResponse {
  id: number;
  subjectId?: number;
  subjectName?: string;
  unitId?: number;
  unitTitle?: string;
  topicId?: number;
  topicName?: string;
  title: string;
  description?: string;
  graphData: string;
  layoutStyle?: string;
  nodeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const mindMapService = {
  async generate(data: GenerateMindMapRequest): Promise<GraphPayload> {
    const res = await api.post<GraphPayload>('/api/mindmaps/generate', data);
    return res.data;
  },

  async save(data: SaveMindMapRequest): Promise<MindMapResponse> {
    const res = await api.post<MindMapResponse>('/api/mindmaps', data);
    return res.data;
  },

  async getAll(subjectId?: number): Promise<MindMapResponse[]> {
    const res = await api.get<MindMapResponse[]>('/api/mindmaps', {
      params: subjectId ? { subjectId } : undefined
    });
    return res.data;
  },

  async getById(id: number): Promise<MindMapResponse> {
    const res = await api.get<MindMapResponse>(`/api/mindmaps/${id}`);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/mindmaps/${id}`);
  }
};

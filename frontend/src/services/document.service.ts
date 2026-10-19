import api from './api';

export interface StudyDocument {
  id: number;
  subjectId?: number;
  subjectName?: string;
  subjectCode?: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  pageCount: number;
  chunkCount: number;
  status: string;
  summary?: string;
  createdAt: string;
}

export interface DocumentChunk {
  id: number;
  chunkIndex: number;
  pageNumber: number;
  sectionHeading?: string;
  chunkContent: string;
}

export interface DocumentDetails {
  document: StudyDocument;
  chunks: DocumentChunk[];
}

export interface UploadTextRequest {
  subjectId?: number;
  title: string;
  fileName?: string;
  content: string;
}

export const documentService = {
  getDocuments: async (subjectId?: number): Promise<StudyDocument[]> => {
    const params = subjectId ? { subjectId } : {};
    const response = await api.get<StudyDocument[]>('/documents', { params });
    return response.data;
  },

  getDocumentDetails: async (id: number): Promise<DocumentDetails> => {
    const response = await api.get<DocumentDetails>(`/documents/${id}`);
    return response.data;
  },

  uploadFile: async (file: File, subjectId?: number, title?: string): Promise<StudyDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    if (subjectId) formData.append('subjectId', subjectId.toString());
    if (title) formData.append('title', title);

    const response = await api.post<StudyDocument>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadText: async (data: UploadTextRequest): Promise<StudyDocument> => {
    const response = await api.post<StudyDocument>('/documents/text', data);
    return response.data;
  },

  deleteDocument: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },
};

import api from "./api";
import {
  saveOfflineNotes,
  saveOfflineNote,
  saveOfflineFlashcards,
  saveOfflineDocument,
  getPendingSyncQueue,
  removeSyncQueueItems,
  getOfflineStorageDetails,
  clearAllOfflineData,
  deleteOfflineNote,
  deleteOfflineFlashcard,
  deleteOfflineDocument,
  getOfflineNotes,
  getOfflineFlashcards,
  getOfflineDocuments,
  queueOfflineAction,
  updateOfflineFlashcardReview,
  type OfflineNote,
  type OfflineFlashcard,
  type OfflineDocument,
  type PendingSyncItem,
} from "../utils/offlineDb";

export interface OfflineManifest {
  totalNotes: number;
  totalFlashcards: number;
  totalDocuments: number;
  generatedAt: string;
}

export interface SyncResponse {
  syncedSessionsCount: number;
  syncedReviewsCount: number;
  totalXpEarned: number;
  newAchievements: any[];
  message: string;
}

export const offlineService = {
  // Download single note
  async downloadNote(noteId: number): Promise<OfflineNote> {
    const res = await api.get(`/notes/${noteId}`);
    const noteData = res.data;
    const offlineNote: OfflineNote = {
      id: noteData.id,
      subjectId: noteData.subjectId,
      subjectName: noteData.subjectName,
      unitId: noteData.unitId,
      topicId: noteData.topicId,
      title: noteData.title,
      content: noteData.content,
      academicLevel: noteData.academicLevel,
      explanationStyle: noteData.explanationStyle,
      detailLevel: noteData.detailLevel,
      createdAt: noteData.createdAt,
      updatedAt: noteData.updatedAt,
      downloadedAt: new Date().toISOString(),
    };
    await saveOfflineNote(offlineNote);
    return offlineNote;
  },

  // Download all notes
  async downloadAllNotes(): Promise<number> {
    const res = await api.get("/notes");
    const notes: any[] = res.data || [];
    const offlineNotes: OfflineNote[] = notes.map((n) => ({
      id: n.id,
      subjectId: n.subjectId,
      subjectName: n.subjectName,
      unitId: n.unitId,
      topicId: n.topicId,
      title: n.title,
      content: n.content,
      academicLevel: n.academicLevel,
      explanationStyle: n.explanationStyle,
      detailLevel: n.detailLevel,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      downloadedAt: new Date().toISOString(),
    }));
    await saveOfflineNotes(offlineNotes);
    return offlineNotes.length;
  },

  // Download all flashcards
  async downloadAllFlashcards(): Promise<number> {
    const res = await api.get("/flashcards");
    const cards: any[] = res.data || [];
    const offlineCards: OfflineFlashcard[] = cards.map((c) => ({
      id: c.id,
      subjectId: c.subjectId,
      subjectName: c.subjectName,
      unitId: c.unitId,
      topicId: c.topicId,
      front: c.front,
      back: c.back,
      hint: c.hint,
      difficulty: c.difficulty,
      intervalDays: c.intervalDays,
      easeFactor: c.easeFactor,
      repetitions: c.repetitions,
      nextReviewDate: c.nextReviewDate,
      lastReviewedAt: c.lastReviewedAt,
      downloadedAt: new Date().toISOString(),
    }));
    await saveOfflineFlashcards(offlineCards);
    return offlineCards.length;
  },

  // Download single study document with chunks
  async downloadDocument(docId: number): Promise<OfflineDocument> {
    const res = await api.get(`/documents/${docId}`);
    const data = res.data;
    const doc = data.document || data;
    const chunks = data.chunks || [];

    const offlineDoc: OfflineDocument = {
      id: doc.id,
      subjectId: doc.subjectId,
      subjectName: doc.subjectName,
      title: doc.title,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      pageCount: doc.pageCount,
      summary: doc.summary,
      chunks: chunks.map((c: any) => ({
        id: c.id,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        sectionHeading: c.sectionHeading,
        chunkContent: c.chunkContent,
      })),
      downloadedAt: new Date().toISOString(),
    };
    await saveOfflineDocument(offlineDoc);
    return offlineDoc;
  },

  // Download all study documents
  async downloadAllDocuments(): Promise<number> {
    const listRes = await api.get("/documents");
    const list: any[] = listRes.data || [];
    let downloaded = 0;
    for (const doc of list) {
      try {
        await this.downloadDocument(doc.id);
        downloaded++;
      } catch (e) {
        console.warn(`Failed to download document ${doc.id}:`, e);
      }
    }
    return downloaded;
  },

  // Fetch online manifest comparison
  async getManifest(): Promise<OfflineManifest> {
    const res = await api.get("/offline/manifest");
    return res.data;
  },

  // Synchronize local pending queue with backend
  async syncPendingData(): Promise<SyncResponse> {
    const queue = await getPendingSyncQueue();
    if (queue.length === 0) {
      return {
        syncedSessionsCount: 0,
        syncedReviewsCount: 0,
        totalXpEarned: 0,
        newAchievements: [],
        message: "No pending offline items to sync.",
      };
    }

    const studySessions: any[] = [];
    const flashcardReviews: any[] = [];
    const processedQueueIds: number[] = [];

    for (const item of queue) {
      if (item.actionType === "LOG_STUDY_SESSION") {
        studySessions.push(item.payload);
        if (item.id) processedQueueIds.push(item.id);
      } else if (item.actionType === "REVIEW_FLASHCARD") {
        flashcardReviews.push(item.payload);
        if (item.id) processedQueueIds.push(item.id);
      }
    }

    const payload = { studySessions, flashcardReviews };
    const res = await api.post("/offline/sync", payload);

    // Remove processed queue items upon success
    if (processedQueueIds.length > 0) {
      await removeSyncQueueItems(processedQueueIds);
    }

    return res.data;
  },

  // Offline study actions
  async recordOfflineStudySession(session: {
    title: string;
    actualDurationMinutes: number;
    sessionType?: string;
    notes?: string;
    subjectId?: number;
    topicId?: number;
  }): Promise<PendingSyncItem> {
    return queueOfflineAction("LOG_STUDY_SESSION", {
      ...session,
      completed: true,
      startTime: new Date(Date.now() - session.actualDurationMinutes * 60000).toISOString(),
      endTime: new Date().toISOString(),
    });
  },

  async recordOfflineFlashcardReview(cardId: number, rating: string, timeSpentSeconds: number = 10): Promise<{
    updatedCard?: OfflineFlashcard;
    queueItem: PendingSyncItem;
  }> {
    const updatedCard = await updateOfflineFlashcardReview(cardId, rating);
    const queueItem = await queueOfflineAction("REVIEW_FLASHCARD", {
      flashcardId: cardId,
      rating,
      timeSpentSeconds,
      reviewedAt: new Date().toISOString(),
    });
    return { updatedCard, queueItem };
  },

  // Get local items & storage details
  getStorageUsage: getOfflineStorageDetails,
  getOfflineNotes,
  getOfflineFlashcards,
  getOfflineDocuments,
  deleteOfflineNote,
  deleteOfflineFlashcard,
  deleteOfflineDocument,
  clearAllOfflineData,
  getPendingSyncQueue,
};

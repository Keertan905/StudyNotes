import { useState, useEffect, useCallback } from "react";
import { offlineService } from "../services/offline.service";
import toast from "react-hot-toast";

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [storageInfo, setStorageInfo] = useState<{
    bytesUsed: number;
    usedPercentage: number;
    notesCount: number;
    flashcardsCount: number;
    documentsCount: number;
  }>({
    bytesUsed: 0,
    usedPercentage: 0,
    notesCount: 0,
    flashcardsCount: 0,
    documentsCount: 0,
  });

  const refreshStats = useCallback(async () => {
    try {
      const details = await offlineService.getStorageUsage();
      setPendingCount(details.pendingSyncCount);
      setStorageInfo({
        bytesUsed: details.bytesUsed,
        usedPercentage: details.usedPercentage,
        notesCount: details.notesCount,
        flashcardsCount: details.flashcardsCount,
        documentsCount: details.documentsCount,
      });
    } catch {
      // Storage estimate error ignored
    }
  }, []);

  const triggerSync = useCallback(async (silent: boolean = false) => {
    if (!navigator.onLine) {
      if (!silent) toast.error("Cannot sync: Internet connection is currently offline.");
      return;
    }
    setIsSyncing(true);
    try {
      const res = await offlineService.syncPendingData();
      await refreshStats();
      if (!silent) {
        if (res.syncedSessionsCount > 0 || res.syncedReviewsCount > 0) {
          toast.success(
            `Synced ${res.syncedSessionsCount} study session(s) & ${res.syncedReviewsCount} flashcard review(s)! +${res.totalXpEarned} XP 🔥`
          );
        } else {
          toast.success("Offline storage is up to date!");
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please log in when online to sync your progress.", { duration: 6000 });
      } else {
        if (!silent) toast.error("Sync failed: Check network connection.");
      }
    } finally {
      setIsSyncing(false);
    }
  }, [refreshStats]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Internet connection restored! 🌐");
      // Auto-sync pending items
      triggerSync(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast("You are currently offline. Offline Study Library is ready! 📚", {
        icon: "📡",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    refreshStats();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [triggerSync, refreshStats]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    storageInfo,
    triggerSync,
    refreshStats,
  };
}

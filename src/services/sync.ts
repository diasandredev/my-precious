import { executeBatch, BatchAction, getCollection } from "./firestore";

import { dbService, QUEUE_KEY } from "./db";

const SYNC_INTERVAL_MS = 60 * 1000; // 1 minute
const BATCH_THRESHOLD = 5;

type QueuedAction = BatchAction & { timestamp: number };

const getQueue = async (): Promise<QueuedAction[]> => {
    return (await dbService.get<QueuedAction[]>(QUEUE_KEY)) || [];
};

const setQueue = async (queue: QueuedAction[]) => {
    await dbService.set(QUEUE_KEY, queue);
};

// Start Compaction/Deduplication Logic
const compactQueue = (queue: QueuedAction[], newAction: QueuedAction): QueuedAction[] => {
    const actionData = (newAction as any).data;
    // Identify target ID. usage: update/delete have .id, create has .data.id
    const targetId = newAction.type === 'create' ? actionData?.id : newAction.id;

    if (!targetId) return [...queue, newAction]; // Safety fallback

    const existingIndex = queue.findIndex(a => {
        const aData = (a as any).data;
        const aId = a.type === 'create' ? aData?.id : a.id;
        return a.collection === newAction.collection && aId === targetId;
    });

    if (existingIndex === -1) {
        return [...queue, newAction];
    }

    const existing = queue[existingIndex];
    const newQueue = [...queue];

    // Merge Logic
    if (existing.type === 'create' && newAction.type === 'update') {
        // Create + Update -> Create (with merged data)
        newQueue[existingIndex] = {
            ...existing,
            data: { ...existing.data, ...(newAction.data as any) },
            timestamp: Date.now()
        };
    } else if (existing.type === 'create' && newAction.type === 'delete') {
        // Create + Delete -> Remove both (never existed on server)
        newQueue.splice(existingIndex, 1);
        return newQueue; // Return early, we removed item
    } else if (existing.type === 'update' && newAction.type === 'update') {
        // Update + Update -> Update (merged)
        newQueue[existingIndex] = {
            ...existing,
            data: { ...existing.data, ...(newAction.data as any) },
            timestamp: Date.now()
        };
    } else if (existing.type === 'update' && newAction.type === 'delete') {
        // Update + Delete -> Delete (replace update)
        newQueue[existingIndex] = {
            type: 'delete',
            collection: newAction.collection,
            id: targetId,
            timestamp: Date.now()
        } as QueuedAction;
    } else if (existing.type === 'delete' && newAction.type === 'create') {
        // Delete + Create -> Update (technically a re-creation, but treating as update often safer, or just Replace)
        // If we strictly follow Firestore, Delete then Set is valid.
        // Let's replace the Delete with the Create.
        newQueue[existingIndex] = newAction;
    } else {
        // Default: replace existing with new (e.g. Delete + Delete -> Delete)
        newQueue[existingIndex] = newAction;
    }

    return newQueue;
}

// Concurrency Guard
let isSyncing = false;

export const queueAction = async (action: BatchAction, options: { autoSync?: boolean } = { autoSync: true }) => {


    const newAction = { ...action, timestamp: Date.now() };

    // Apply compaction utilizing atomic update
    const updatedQueue = await dbService.update<QueuedAction[]>(QUEUE_KEY, (queue = []) => {
        return compactQueue(queue, newAction);
    });

    if (options.autoSync && updatedQueue.length >= BATCH_THRESHOLD) {

        syncPendingActions();
    }
};

export const getPendingActionCount = async (): Promise<number> => {
    return (await getQueue()).length;
};

export const syncPendingActions = async () => {
    if (isSyncing) {

        return;
    }
    isSyncing = true;

    try {
        const queue = await getQueue();
        if (queue.length === 0) {
            isSyncing = false;
            return;
        }



        // Send all pending actions
        await executeBatch(queue);
        // Clear queue on success
        await setQueue([]);

    } catch (error) {
        console.error("Sync failed:", error);
        // On failure, keep items in queue to retry later
    } finally {
        isSyncing = false;
    }
};

export const fetchUserData = async (uid: string) => {
    try {
        const [accounts, snapshots, fixedItems, transactions, categories, settingsDocs] = await Promise.all([
            getCollection(`users/${uid}/accounts`),
            getCollection(`users/${uid}/snapshots`),
            getCollection(`users/${uid}/fixedItems`),
            getCollection(`users/${uid}/transactions`),
            getCollection(`users/${uid}/categories`),
            getCollection(`users/${uid}/settings`)
        ]);

        const rawData = {
            accounts,
            snapshots,
            fixedItems,
            transactions,
            categories,
            // Settings is likely a singleton, so take 'general' doc if exists, else first item or default
            settings: settingsDocs.find(d => d.id === 'general') || settingsDocs[0] || {}
        };

        // Replay Pending Actions (Optimistic Consistency on Reload)
        const queue = await getQueue();
        if (queue.length > 0) {


            queue.forEach(action => {
                // Determine collection key from path (e.g., "users/uid/accounts" -> "accounts")
                const pathParts = action.collection.split('/');
                const collectionKey = pathParts[pathParts.length - 1];

                // Handle Settings specifically
                if (collectionKey === 'settings') {
                    if (action.type === 'create' || action.type === 'update') {
                        rawData.settings = { ...rawData.settings, ...(action.data as any) };
                    }
                    return;
                }

                // Handle Lists (accounts, snapshots, etc)
                if (Array.isArray(rawData[collectionKey as keyof typeof rawData])) {
                    const list = rawData[collectionKey as keyof typeof rawData] as any[];

                    if (action.type === 'create') {
                        // Avoid duplicates if ID exists (though new items use random IDs)
                        if (!list.find(i => i.id === (action.data as any).id)) {
                            list.push(action.data);
                        }
                    } else if (action.type === 'update') {
                        const index = list.findIndex(i => i.id === action.id);
                        if (index !== -1) {
                            list[index] = { ...list[index], ...(action.data as any) };
                        }
                    } else if (action.type === 'delete') {
                        const index = list.findIndex(i => i.id === action.id);
                        if (index !== -1) {
                            list.splice(index, 1);
                        }
                    }
                }
            });
        }

        return rawData;
    } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
    }
}

// HMR-safe scheduler using window
const getWindow = () => window as any;

export const startSyncScheduler = () => {
    const w = getWindow();
    if (w._syncInterval) return;


    w._syncInterval = setInterval(() => {
        syncPendingActions();
    }, SYNC_INTERVAL_MS);
};

export const stopSyncScheduler = () => {
    const w = getWindow();
    if (w._syncInterval) {

        clearInterval(w._syncInterval);
        w._syncInterval = null;
    }
};

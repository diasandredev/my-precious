import { openDB, DBSchema } from 'idb';

interface MyPreciousDB extends DBSchema {
    keyvalue: {
        key: string;
        value: any;
    };
}

const DB_NAME = 'my-precious-db';
const STORE_NAME = 'keyvalue';
const DB_VERSION = 1;

const dbPromise = openDB<MyPreciousDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
        db.createObjectStore(STORE_NAME);
    },
});

export const dbService = {
    async get<T>(key: string): Promise<T | undefined> {
        return (await dbPromise).get(STORE_NAME, key);
    },
    async set(key: string, val: any) {
        return (await dbPromise).put(STORE_NAME, val, key);
    },
    async update<T>(key: string, updater: (val: T | undefined) => T) {
        const db = await dbPromise;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const val = await store.get(key);
        const newVal = updater(val);
        await store.put(newVal, key);
        await tx.done;
        return newVal;
    },
    async delete(key: string) {
        return (await dbPromise).delete(STORE_NAME, key);
    },
    async clear() {
        return (await dbPromise).clear(STORE_NAME);
    },
    async keys() {
        return (await dbPromise).getAllKeys(STORE_NAME);
    },
};

export const DATA_KEY = 'userdata';
export const QUEUE_KEY = 'sync_action_queue';

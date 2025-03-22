export const retrieveSelectedReportForm = async (reportFormatId = "reportFormat") => {
    var storedReportFormat = await storageIndexedDB.getItem(reportFormatId);
    if (!storedReportFormat) return 'Canada';
    var dropdown = document.getElementById(reportFormatId);
    dropdown.value = storedReportFormat;
};

export const storeSelectedReportForm = async (reportFormatId = "reportFormat") => {
    var dropdown = document.getElementById(reportFormatId);
    var selectedValue = dropdown.value;
    await storageIndexedDB.setItem(reportFormatId, selectedValue);
}

const getCache = async (key, dbname, storeName) => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbname);

        request.onerror = (event) => {
            reject(`Error opening database: ${event.target.error}`);
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(storeName, 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const getRequest = objectStore.get(key); //objectStore.getAll(); //

            getRequest.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    resolve(result.value);
                } else {
                    reject(`Item with key "${key}" not found in "${storeName}"`);
                }
            };

            getRequest.onerror = (event) => {
                reject(`Error retrieving item: ${event.target.error}`);
            };
        };

        request.onupgradeneeded = async (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                const objectStore = db.createObjectStore(storeName, { keyPath: "key" });
                objectStore.createIndex("valueIndex", "value", { unique: false });
                db.close();
            }
        };
    });
}
const setCache = async (key, value, dbName = 'taxboxer', storeName = 'cacheStore') => {
    try {
        const db = await openDatabase(dbName, 1); // Version 1
        if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, { keyPath: "key" });
            objectStore.createIndex("valueIndex", "value", { unique: false });
            db.close();
            db = await openDatabase(dbName, 1, storeName); // Version 1
        }
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        store.add({ "key": key, "value": value });
        db.close();
        console.log(`Data saved ${key}`);
    } catch (error) {
        console.error('Error setCache:', error);
    }
};

async function clearObjectStore(dbName, version, storeName) {
    try {
        const db = await openDatabase(dbName, version, storeName);
        const transaction = db.transaction(storeName, 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const clearRequest = objectStore.clear();
        db.close();
        clearRequest.onsuccess = () => {
            console.log(`Cleared data in ${storeName} successfully.`);
        };

        clearRequest.onerror = (event) => {
            console.error(`Error clearing data in ${storeName}: ${event.target.error}`);
        };
    } catch (error) {
        console.error(`Error opening database: ${error}`);
    }
}
 
async function openDatabase(dbName, version, storeName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);

        request.onerror = reject;

        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = async (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(storeName)) {
                await db.createObjectStore(storeName);
            }
        };
    });
}
async function deleteItemFromDatabase(dbName, version, storeName, itemId) {
    const db = await openDatabase(dbName, version, storeName);
    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.delete(itemId);
    db.close();
    request.onsuccess = () => {
        console.log('Item deleted successfully.');
    };

    request.onerror = (event) => {
        console.error('Error deleting item:', event.target.error);
    };
}

export const storageIndexedDB = {
    dbName: 'taxboxer',
    storeName: 'cacheStore',
    version: 1,
    setItem: async (id, value) => {
        const saved = await storageIndexedDB.getItem(id);
        if (saved === value) return;

        await deleteItemFromDatabase(storageIndexedDB.dbName, storageIndexedDB.version, storageIndexedDB.storeName, id);
        await setCache(id, value, storageIndexedDB.dbName, storageIndexedDB.storeName);
    },
    getItem: async (id) => {
        try {
            return await getCache(id, storageIndexedDB.dbName, storageIndexedDB.storeName);
        }
        catch (error) {
            console.debug(`getItem ${error}`);
            return ''
        }
    },
    removeItem: async (id) => {
        await deleteItemFromDatabase(storageIndexedDB.dbName, storageIndexedDB.version, storageIndexedDB.storeName, id);
    },
    clear: async () => {
        await clearObjectStore(storageIndexedDB.dbName, storageIndexedDB.version, storageIndexedDB.storeName);
    }
};

export const saveDataUrl = async (dataUrl,db, fileName='') => {
    if (!db) db = storageIndexedDB;
    if (!fileName) fileName = dataUrl.generateUniqueFileName();
    await db.setItem(fileName, dataUrl);
    return fileName;
}
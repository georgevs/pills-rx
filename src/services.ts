import { BadStateError } from "./utils";

export class Services {
  datasets?: Db.Datasets;

  async init(): Promise<Services> {
    const [remoteDb, localDb] = await Promise.all([
      new Db.RemoteDb().init(),
      new Db.LocalDb(window.indexedDB).open()
    ])
    this.datasets = new Db.Datasets(remoteDb, localDb);
    return this;
  }
}

export namespace Db {

  export class LocalDb {
    db?: IDBDatabase;

    constructor(public indexedDb: IDBFactory) { }
    
    async open(): Promise<LocalDb> {
      const upgrade = (db: IDBDatabase, _event: IDBVersionChangeEvent) => {
        db.createObjectStore('History'); // out-of-line key
      };
      this.db = await new Promise((resolve, reject) => {
        const req = this.indexedDb.open('PillsRx', 1);
        req.onerror = () => { reject(req.error) };
        req.onsuccess = () => { resolve(req.result) };
        req.onupgradeneeded = (event) => { upgrade(req.result, event) };
      });
      return this;
    }

    async get<T>(storeName: string): Promise<T[]> {
      const { db } = this;
      if (!db) { throw new BadStateError() }
      return new Promise((resolve, reject) => {
        const tr = db.transaction([storeName], 'readonly');
        tr.onerror = () => { reject(tr.error) };
        const store = tr.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => { resolve(req.result) };
      });
    }

    async delete(ids: number[], storeName: string): Promise<void> {
      const { db } = this;
      if (!db) { throw new BadStateError() }
      return new Promise((resolve, reject) => {
        const tr = db.transaction([storeName], 'readwrite');
        tr.onerror = () => { reject(tr.error) };
        tr.oncomplete = () => { resolve() };
        const store = tr.objectStore(storeName);
        ids.forEach(id => { store.delete(id) });
      });
    }
  }

  class History {
    static storeName = 'History';

    constructor(public db: LocalDb) { }

    async get(): Promise<Log[]> {
      return this.db.get(History.storeName);
    }
    async put(values: Log[]): Promise<void> {
      const { db } = this.db;
      if (!db) { throw new BadStateError() }
      return new Promise((resolve, reject) => {
        const tr = db.transaction(History.storeName, 'readwrite');
        tr.onerror = () => { reject(tr.error) };
        tr.oncomplete = () => { resolve() };
        const store = tr.objectStore(History.storeName);
        values.forEach(value => {
          const { pid, did, time, day } = value;
          const key = [pid, did, time, day];
          store.put(value, key);
        });
      });
    }
  }
  
  export class RemoteDb {
    async init() { // TODO
      return this;
    }
    async get<T>(url: string, options?: RequestInit): Promise<T> {
      const response = await fetch(url, options);
      if (!response.ok) { throw new Error(response.statusText) }
      return await response.json();
    }
  }
  
  export class Datasets {
    drugs: Drugs;
    prescriptions: Prescriptions;
    rules: Rules;
    takes: Takes;
    history: History;

    constructor(remoteDb: RemoteDb, localDb: LocalDb) {
      this.drugs = new Drugs(remoteDb);
      this.prescriptions = new Prescriptions(remoteDb);
      this.rules = new Rules(remoteDb);
      this.takes = new Takes(remoteDb);
      this.history = new History(localDb);
    }
  }

  class Takes {
    constructor(public db: RemoteDb) {}
    async get(id: number, options?: RequestInit): Promise<Db.Take[]> {
      return this.db.get(`./data/takes.${id}.json`, options);
    }
  }
  
  class Rules {
    constructor(public db: RemoteDb) {}
    async get(options?: RequestInit): Promise<Db.Rule[]> {
      return this.db.get('./data/rules.json', options);
    }
  }
  
  class Prescriptions {
    constructor(public db: RemoteDb) {}
    async get(id: number, options?: RequestInit): Promise<Db.Prescription[]> {
      return (
        (await this.db.get(`./data/prescriptions.${id}.json`, options) as { id: number; start: string; numDays: number }[])
        .flatMap(row => {
          const start = new Date(row.start);
          return isNaN(start.getFullYear()) ? [] : [{ ...row, start }];
        })
      );
    }
  }
  
  class Drugs {
    constructor(public db: RemoteDb) {}
    async get(options?: RequestInit): Promise<Db.Drug[]> {
      return this.db.get('./data/drugs.json', options);
    }
  }
  
  export interface Drug { 
    id: number; 
    description: string; 
    doses: number;
  }

  export interface Prescription {
    id: number;
    start: Date;
    numDays: number;
  }

  export interface Take {
    pid: number;
    did: number;
    dose: number;
    slots: number[];
    rid?: number;
  }
  
  export interface Rule {
    id: number;
    days: number[];
    cycleNumDays?: number;
  }

  export interface Log {
    pid: number;
    did: number;
    time: number;
    day: number;
    taken: boolean;
  }
}

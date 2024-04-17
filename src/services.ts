export class Services {
  datasets: Db.Datasets;
  constructor() {
    const remoteDb = new Db.RemoteDb();
    this.datasets = new Db.Datasets(remoteDb);
  }
}

export namespace Db {

  export class RemoteDb {
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

    constructor(remoteDb: RemoteDb) {
      this.drugs = new Drugs(remoteDb);
      this.prescriptions = new Prescriptions(remoteDb);
      this.rules = new Rules(remoteDb);
      this.takes = new Takes(remoteDb);
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
}

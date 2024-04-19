import { Db } from './services';
import { Dates, legendLabel } from './utils';

export namespace Model {
  type Drug = { did: number; description: string };
  type Slot = { time: number; label: string };
  type Take = { key: number; slot: Slot; drug: Drug; dose: number };
  type Log = { take: Take; taken: boolean };
  type Day = { day: number; date: Date; logs: Map<number, Log> };

  export class Prescription {
    pid: number;
    drugs: Drug[];
    slots: Slot[];
    takes: Take[];
    days: Day[];

    constructor(
      pid: number, 
      db: { 
        drugs: Db.Drug[],
        prescriptions: Db.Prescription[],
        takes: Db.Take[],
        logs: Db.Log[]
    }) {

      const prescription = db.prescriptions.find(({ pid: id }) => id === pid);
      if (!prescription) { throw new Error('Not found') }

      const drugByDid = db.drugs.reduce((acc, drug) => acc.set(drug.did, drug), new Map);

      const drugs = Array.from(new Set(db.takes.map(({ did }) => did)).values())
        .map(did => {
          const drug  = drugByDid.get(did);
          if (!drug) { throw new Error('Missing drug') }
          return {...drug, label: '' };
        });
      drugs.sort(({ description: lhs }, { description: rhs }) => lhs.localeCompare(rhs));
      drugs.forEach((drug, i) => { drug.label = legendLabel(i) });
      const drugIndex = new Map(drugs.map(({ did }, i) => [did, i]));

      const slots = Array.from(new Set(db.takes.map(({ time }) => time)).values())
        .map(time => ({ time, label: time.toString() }));
      slots.sort(({ time: lhs }, { time: rhs }) => lhs - rhs);
      const slotsIndex = new Map(slots.map(({ time }, i) => [time, i]));

      const takeKey = (time: number, did: number) => slotsIndex.get(time)!*drugIndex.size + drugIndex.get(did)!;
      const takes = db.takes.map(({ did, dose, time, days }) => ({ 
        key: takeKey(time, did), 
        drug: drugByDid.get(did)!,
        slot: slots[slotsIndex.get(time)!],
        dose, 
        days
      }));
      takes.sort(({ key: lhs }, { key: rhs }) => lhs - rhs);
      const takesIndex = new Map(takes.map(({ key }, i) => [key, i]));

      const dailyTakes = (day: number) => {
        return new Map(
          db.takes.filter(({ days }) => !days || days.some(k => day % prescription.numDays === k))
            .map(({ time, did }) => {
              const key = takeKey(time, did);
              return [key, { take: takes[takesIndex.get(key)!], taken: false }];
            })
        );
      };
      const days = [];
      for (let day = 0; day < prescription.numDays; ++day) {
        const logs = dailyTakes(day);
        if (logs.size > 0) {
          const date = Dates.addDays(prescription.start, day);
          days.push({ day, date, logs });
        }
      }

      console.log({ pid, drugByDid, drugs, slots, drugIndex, slotsIndex, takes, takesIndex, days });

      this.pid = prescription.pid;
      this.drugs = drugs;
      this.slots = slots
      this.takes = takes;
      this.days = days;
    }
  }
}  // namespace Model

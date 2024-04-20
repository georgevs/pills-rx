import { Db } from './services';
import { Dates, legendLabel } from './utils';

export namespace Model {
  type Drug = { did: number; description: string; label: string };
  type Slot = { time: number; label: string };
  type Take = { tid: number; slot: Slot; drug: Drug; dose: number };
  type Log = { take: Take; taken: boolean; lid: number };
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
      if (!prescription) { throw new Error('Prescription not found') }

      let drugById = new Map(db.drugs.map(drug => [drug.did, drug]));
      const drugs = Array.from(new Set(db.takes.map(({ did }) => did)).values()).map(did => {
        const drug = drugById.get(did);
        if (!drug) { throw new Error('Drug not found') }
        return drug;
      });
      drugs.sort(({ description: lhs }, { description: rhs }) => lhs.localeCompare(rhs));
      const drugsIndex = new Map(drugs.map(({ did }, i) => [did, i]));

      const slotById = new Map(db.takes.map(({ time }) => [time, { time }]));
      const slots = Array.from(slotById.values())
      slots.sort(({ time: lhs }, { time: rhs }) => lhs - rhs);
      const slotsIndex = new Map(slots.map(({ time }, i) => [time, i]));

      const takeId = (time: number, did: number) => slotsIndex.get(time)!*drugsIndex.size + drugsIndex.get(did)!;
      const takeById = new Map(db.takes.map(({ time, did, dose }) => { const tid = takeId(time, did); return [tid, { tid, time, did, dose }] }));
      const takes = Array.from(takeById.values());
      takes.sort(({ tid: lhs }, { tid: rhs }) => lhs - rhs);
      const takesIndex = new Map(takes.map(({ tid }, i) => [tid, i]));

      const logId = (time: number, did: number, day: number) => takeId(time, did) * prescription.numDays + day;
      const logById = new Map(db.logs.map(log => { const lid = logId(log.time,log.did,log.day); return [lid, log]}));

      const dailyTakes = (day: number) => (
        db.takes.filter(({ days }) => !days || days.some(k => day % prescription.numDays === k))
          .map(({ time, did }) => takeById.get(takeId(time, did))!)
      );
      const days = [];
      for (let day = 0; day < prescription.numDays; ++day) {
        const takes = dailyTakes(day);
        if (takes.length > 0) {
          const date = Dates.addDays(prescription.start, day);
          days.push({ day, date, takes });
        }
      }

      this.pid = prescription.pid;
      this.drugs = drugs.map(({ did, description }, i) => ({ did, description, label: legendLabel(i) }));
      this.slots = slots.map(({ time }) => ({ time, label: time.toString() }));
      this.takes = takes.map(({ tid, time, did }) => ({
        tid,
        slot: this.slots[slotsIndex.get(time)!],
        drug: this.drugs[drugsIndex.get(did)!],
        dose: takeById.get(tid)!.dose
      }));
      this.days = days.map(({ day, date, takes }) => {
        const logs = new Map(
          takes.map(({ time, did }) => {
            const tid = takeId(time, did);
            const take = this.takes[takesIndex.get(tid)!];
            const lid = logId(time, did, day);
            const { taken = false } = logById.get(lid) ?? {};
            return [tid, { take, taken, lid }];
          })
        );
        return { day, date, logs };
      });
    }
  }
}  // namespace Model

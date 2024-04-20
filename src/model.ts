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

    updateLog?: (options: any) => void;

    constructor(
      options: { 
        prescription: Db.Prescription,
        drugs: Db.Drug[],
        takes: Db.Take[],
        logs: Db.Log[],
        updateHistory?: (values: Db.Log[]) => Promise<void>
      }
    ) {
      const { prescription, drugs, takes, logs, updateHistory } = options;

      let drugById = new Map(drugs.map(drug => [drug.did, drug]));
      const sortedDrugs = Array.from(new Set(takes.map(({ did }) => did)).values()).map(did => {
        const drug = drugById.get(did);
        if (!drug) { throw new Error('Drug not found') }
        return drug;
      });
      sortedDrugs.sort(({ description: lhs }, { description: rhs }) => lhs.localeCompare(rhs));
      const drugsIndex = new Map(sortedDrugs.map(({ did }, i) => [did, i]));

      const slotById = new Map(takes.map(({ time }) => [time, { time }]));
      const sortedSlots = Array.from(slotById.values())
      sortedSlots.sort(({ time: lhs }, { time: rhs }) => lhs - rhs);
      const slotsIndex = new Map(sortedSlots.map(({ time }, i) => [time, i]));

      const takeId = (time: number, did: number) => slotsIndex.get(time)!*drugsIndex.size + drugsIndex.get(did)!;
      const takeById = new Map(takes.map(({ time, did, dose }) => { const tid = takeId(time, did); return [tid, { tid, time, did, dose }] }));
      const sortedTakes = Array.from(takeById.values());
      sortedTakes.sort(({ tid: lhs }, { tid: rhs }) => lhs - rhs);
      const takesIndex = new Map(sortedTakes.map(({ tid }, i) => [tid, i]));

      const logId = (time: number, did: number, day: number) => takeId(time, did) * prescription.numDays + day;
      const logById = new Map(logs.map(log => { const lid = logId(log.time, log.did, log.day); return [lid, log] }));
      const logForId = (lid: number) => {
        const day = lid % prescription.numDays;
        const tid = lid / prescription.numDays | 0;
        const { time, did } = sortedTakes[takesIndex.get(tid)!];
        return { pid: prescription.pid, did, time, day, taken: false };
      };

      const dailyTakes = (day: number) => (
        takes.filter(({ days }) => !days || days.some(k => day % prescription.numDays === k))
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
      this.drugs = sortedDrugs.map(({ did, description }, i) => ({ did, description, label: legendLabel(i) }));
      this.slots = sortedSlots.map(({ time }) => ({ time, label: time.toString() }));
      this.takes = sortedTakes.map(({ tid, time, did }) => ({
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

      if (updateHistory) {
        this.updateLog = function updateLog({ lid, taken }: { lid: number; taken: boolean }) {
          const log = logById.get(lid) ?? logForId(lid);
          updateHistory([{ ...log, taken }]);
        };
      }
    }
  }
}  // namespace Model

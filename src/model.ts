
import { Db } from './services';
import { Dates } from './utils';

export namespace Model {

  export type Drug = { index: number; did: number; description: string };
  export type Slot = { index: number; time: number; drug: Drug; }
  export type Take = { slot: Slot; dose: number; taken: boolean };
  export type Day = { day: number; date: Date; takes: Map<number, Take> };
  
  export class Prescription {
    id: number;
    drugs: Map<number, Drug>;
    slots: Map<number, Slot>;
    days: Day[];
    
    constructor(
      id: number, 
      db: { 
        drugs: Db.Drug[],
        prescriptions: Db.Prescription[],
        rules: Db.Rule[],
        takes: Db.Take[],
        logs: Db.Log[]
    }) {
      const prescription = db.prescriptions.find(({ id: prescriptionId }) => id === prescriptionId);
      if (!prescription) { throw new Error('Not found') }

      const rulesIndex = db.rules.reduce((acc, rule) => acc.set(rule.id, rule), new Map<number, Db.Rule>());
      const drugsIndex = db.drugs.reduce((acc, drug) => acc.set(drug.id, drug), new Map<number, Db.Drug>());

      const uniqueSlots = new Set<number>();
      const uniqueDrugs = new Set<Db.Drug>();
      const days = [];
      for (let day = 0; day < prescription.numDays; ++day) {
        const takes = db.takes.filter(({ rid })=> !rid || Prescription.includes(rulesIndex.get(rid), day, prescription.numDays))
          .flatMap(({ did, dose, slots }) => slots.flatMap(time => {
            const drug = drugsIndex.get(did);
            return drug ? [{ time, drug, dose }] : []
          }));
        if (takes.length) {
          days.push({ day, date: Dates.addDays(prescription.start, day), takes });
          takes.forEach(({ time, drug }) => { uniqueSlots.add(time); uniqueDrugs.add(drug) }) ;
        }
      }

      const sortedSlots = Array.from(uniqueSlots);
      sortedSlots.sort((lhs, rhs) => lhs - rhs);
      const slotsOrder = new Map(sortedSlots.map((time, i) => [time, i]));

      const sortedDrugs = Array.from(uniqueDrugs);
      sortedDrugs.sort(({ description: lhs }, { description: rhs }) => lhs.localeCompare(rhs));
      const drugsOrder = new Map(sortedDrugs.map((drug, i) => [drug, i]));

      const takeKey = ({ time, drug }: { time: number, drug: Db.Drug }) => slotsOrder.get(time)! * drugsOrder.size + drugsOrder.get(drug)!;
      const takesIndex = days.flatMap(({ takes }) => takes).reduce((acc, take) => acc.set(takeKey(take), take), new Map<number, { time: number, drug: Db.Drug, dose: number }>());
      const sortedTakes = Array.from(takesIndex.keys());
      sortedTakes.sort((lhs, rhs) => lhs - rhs);
      const takesOrder = new Map(sortedTakes.map((key, i) => [key, i]));


      const logKey = ({ time, drug, day }: {time: number, drug: Db.Drug, day: number}) => day*takesOrder.size + takesOrder.get(takeKey({ time, drug }))!;
      const logsIndex = db.logs.filter(({ pid }) => pid === id)
        .reduce((acc, log) => {
          const { did, time, day } = log;
          const drug = drugsIndex.get(did);
          if (drug) {
            acc.set(logKey({ time, drug, day }), log);
          }
          return acc;
        }, new Map<number, Db.Log>());
      
      console.log({ logsIndex });
      
      this.id = id;

      this.drugs = new Map(
        Array.from(drugsOrder.entries()).map(([drug, index]) => 
          [index, { index, did: drug.id, description: drug.description }]
        )
      );
      this.slots = new Map(
        Array.from(takesOrder.entries()).map(([key, index]) => {
          const { time, drug } = takesIndex.get(key)!;
          return [index, { index, time, drug: this.drugs.get(drugsOrder.get(drug)!)!}];
        })
      );
      this.days = days.map(({ day, date, takes }) => {
        const takesIndex = new Map(
          takes.map(take => {
            const index = takesOrder.get(takeKey(take))!;
            const slot = this.slots.get(index)!;
            const { taken = false } = logsIndex.get(logKey({ time: slot.time, drug: take.drug, day})) ?? {};
            return [slot.index, { slot, dose: take.dose, taken }];
          })
        );
        return { day, date, takes: takesIndex };
      });
    }

    static includes(rule: Db.Rule | undefined, day: number, numDays: number): boolean | undefined {
      if (rule) {
        const n = rule.cycleNumDays || numDays;
        return rule.days.some(k => day % n === k);
      }
    }
  }
}  // namespace Model

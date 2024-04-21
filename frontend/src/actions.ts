import { Model } from "./model";
import { Db, Services } from "./services";
import { BadStateError } from "./utils";

export async function fetchPrescription(
  pid: number, 
  { services, signal }: { services: Services, signal?: AbortSignal }
): Promise<Model.Prescription | undefined> {
  const { datasets } = services;
  if (!datasets) { throw new BadStateError() }

  const options = { signal };
  const [drugs = [], prescriptions = [], takes = [], logs = []] = await Promise.all([
    datasets.drugs.get(options),
    datasets.prescriptions.get(pid, options),
    datasets.takes.get(pid, options),
    datasets.history.get(),
  ]);
  // console.debug('fetched', { drugs, prescriptions, takes, logs });

  const prescription = prescriptions.find(({ pid: id }) => id === pid);
  if (prescription) {
    function updateHistory(values: Db.Log[]): Promise<void> {
      // console.debug('updateHistory', { values });
      return datasets!.history.put(values);
    }
    return new Model.Prescription({ prescription, drugs, takes, logs, updateHistory });
  }
}

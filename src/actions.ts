import { Model } from "./model";
import { Services } from "./services";
import { BadStateError } from "./utils";

export async function fetchPrescription(
  id: number, 
  { services, signal }: { services: Services, signal?: AbortSignal }
): Promise<Model.Prescription> {
  const { datasets } = services;
  if (!datasets) { throw new BadStateError() }

  const options = { signal };
  const [drugs = [], prescriptions = [], rules = [], takes = [], logs = []] = await Promise.all([
    datasets.drugs.get(options),
    datasets.prescriptions.get(id, options),
    datasets.rules.get(options),
    datasets.takes.get(id, options),
    datasets.history.get(),
  ]);
  console.debug('fetched', { drugs, prescriptions, rules, takes, logs });
  return new Model.Prescription(id, { drugs, prescriptions, rules, takes, logs });
}

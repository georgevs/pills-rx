import { Model } from "./model";
import { Services } from "./services";
import { BadStateError } from "./utils";

export async function fetchPrescription(
  pid: number, 
  { services, signal }: { services: Services, signal?: AbortSignal }
): Promise<Model.Prescription> {
  const { datasets } = services;
  if (!datasets) { throw new BadStateError() }

  const options = { signal };
  const [drugs = [], prescriptions = [], takes = [], logs = []] = await Promise.all([
    datasets.drugs.get(options),
    datasets.prescriptions.get(pid, options),
    datasets.takes.get(pid, options),
    datasets.history.get(),
  ]);
  console.debug('fetched', { drugs, prescriptions, takes, logs });
  return new Model.Prescription(pid, { drugs, prescriptions, takes, logs });
}

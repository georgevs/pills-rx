import { Model } from "./model";
import { Services } from "./services";

export async function fetchPrescription(
  id: number, 
  { services, signal }: { services: Services, signal?: AbortSignal }
): Promise<Model.Prescription> {
  const options = { signal };
  const [drugs = [], prescriptions = [], rules = [], takes = []] = await Promise.all([
    services.datasets.drugs.get(options),
    services.datasets.prescriptions.get(id, options),
    services.datasets.rules.get(options),
    services.datasets.takes.get(id, options),
  ]);
  return new Model.Prescription(id, { drugs, prescriptions, rules, takes });
}

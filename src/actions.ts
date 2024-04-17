import { Model } from "./model";
import { Services } from "./services";

export async function fetchPrescription(
  id: number, 
  options: { services: Services, signal: AbortSignal }
): Promise<Model.Prescription> {
  const { services, signal } = options;
  const [drugs = [], prescriptions = [], rules = [], takes = []] = await Promise.all([
    services.datasets.drugs.get({ signal }),
    services.datasets.prescriptions.get({ id, signal }),
    services.datasets.rules.get({ signal }),
    services.datasets.takes.get({ pid: id, signal }),
  ]);
  return new Model.Prescription(id, { drugs, prescriptions, rules, takes });
}

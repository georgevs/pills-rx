import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { createBrowserRouter, createRoutesFromElements, Outlet, Route, RouterProvider } from 'react-router-dom';
import { Services } from './services';
import { Model } from './model';
import { fetchPrescription } from './actions';
import { FormatDate } from './utils';

export default function App() {
  return (
    <ServicesProvider>
      <RouterProvider router={createAppRouter()} />
    </ServicesProvider>
  );
}

const ServicesContext = createContext<Services | undefined>(undefined);
const useServices = () => useContext(ServicesContext);

interface ServicesProviderProps { 
  children: ReactNode
}

function ServicesProvider({ children }: ServicesProviderProps) {
  const [services, setServices] = useState<Services>();
  
  useEffect(() => {
    let canceled = false;
    new Services().init()
      .then(services => { !canceled && setServices(services) });
    return () => { canceled = true }  
  }, []);

  return (
    <ServicesContext.Provider value={services}>
      {children}
    </ServicesContext.Provider>
  );
}

function createAppRouter() {
  return (
    createBrowserRouter(
      createRoutesFromElements(
        <Route path='/' element={<Layout />} >
          <Route index element={<PrescriptionPage />} />
        </Route>
      ),
      {
        basename: window.location.pathname
      }
    )
  );
}

function Layout() {
  return (
    <>
      <h1 className='title'>Pills Rx</h1>
      <Outlet />
    </>
  );
}

function PrescriptionPage() {
  const services = useServices();
  const [prescription, setPrescription] = useState<Model.Prescription>();
  
  useEffect(() => {
    if (services) {
      let canceled = false;
      const controller = new AbortController();
      const signal = controller.signal;
      const pid = 1; // TODO
  
      fetchPrescription(pid, { services, signal })
        .then(prescription => { !canceled && setPrescription(prescription) });
  
      return () => {
        controller.abort();
        canceled = true;
      }
    }
  }, [services]);

  const viewModel = useMemo(() => {
    if (prescription) { 
      console.debug({ prescription });
      const schedule = new ViewModel.Schedule(prescription);
      const legend = new ViewModel.Legend(prescription);
      return { schedule, legend };
    }
  }, [prescription]);

  console.debug({ viewModel });

  // function handleLogChange(options: { pid: number; did: number; time: number; day: number; taken: boolean }) {
  //   services?.datasets?.history.put([options]);
  // }

  return (
    <>
      {!viewModel && <p>Loading...</p>}
      {viewModel && <Schedule schedule={viewModel.schedule} onLogChange={console.log.bind(console)} />}
      {viewModel && <Legend legend={viewModel.legend} />}
    </>
  );
}

interface ScheduleProps {
  schedule: ViewModel.Schedule;
  onLogChange?: (options: any) => void;
}

function Schedule({ schedule, onLogChange }: ScheduleProps) {
  const { slots, drugs, days } = schedule;
  
  const handleLogChange = useMemo(() => {
    if (onLogChange) {
      return function handleLogChange(options: any, event: any) {
        const input = event.target as HTMLInputElement;
        const { checked: taken } = input;
        const { lid } = options;
        onLogChange({ lid, taken });
      }
    }
  }, [onLogChange]);

  return (
    <>
      <table className='prescription'>
        <thead>
          <tr className='slots'>
            <th colSpan={2}></th>
            {slots.map(({ span, label }, colIndex) => (
              <th key={colIndex} colSpan={span}>{label}</th>
            ))}
          </tr>
          <tr>
            <th colSpan={2}></th>
            {drugs.map(({ label }, colIndex) => (
              <th key={colIndex}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(({ day, date, logs }, rowIndex) => (
            <tr key={rowIndex} data-day={day}>
              <td className='day'>{day}</td>
              <td className='date'>{FormatDate.weekDay(date)}</td>
              {logs.map((log, colIndex) => (
                <td key={colIndex} className='log'>
                  {log && <input type='checkbox' checked={log.taken} onChange={handleLogChange?.bind(null, log)} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

interface LegendProps {
  legend: ViewModel.Legend;
}

function Legend({ legend }: LegendProps) {
  const { drugs } = legend;
  return (
    <>
      <h3>Legend:</h3>
      <table className='legend'>
        <tbody>
          {drugs.map(({ label, description }, index) => (
            <tr key={index}>
              <td className='key'>{label}</td>
              <td>{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

namespace ViewModel {
  
  export class Legend {
    drugs: Array<{ label: string; description: string }>;
    
    constructor(prescription: Model.Prescription) {
      this.drugs = prescription.drugs.map(({ description, label }) => ({ description, label }));
    }
  }
  
  export class Schedule {
    pid: number;
    slots: Array<{ span: number; label: string }>;
    drugs: Array<{ label: string }>;
    days: Array<{ day: number; date: Date; logs: Array<{ taken: boolean; lid: number } | undefined> }>;
    
    constructor(prescription: Model.Prescription) {
      this.pid = prescription.pid;
      this.slots = prescription.takes
        .reduce((acc, { slot: { time, label } }, i) => {
          if (i > 0 && acc[acc.length - 1].time === time) { acc[acc.length - 1].span++ }
          else { acc.push({ span: 1, time, label }) }
          return acc;
        }, new Array<{ span: number; time: number; label: string }>())
        .map(({ span, label }) => ({ span, label }));
      this.drugs = prescription.takes.map(({ drug: { label }}) => ({ label }));
      this.days = prescription.days.map(({ day, date, logs }) => ({
        day,
        date,
        logs: prescription.takes.map(({ tid }) => {
          const log = logs.get(tid);
          if (log) {
            const { taken, lid } = log;
            return { taken, lid };
          }
        })
      }));
    }
  }

} // namespace ViewModel

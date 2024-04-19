import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { createBrowserRouter, createRoutesFromElements, Outlet, Route, RouterProvider } from 'react-router-dom';
import { Services } from './services';
import { Model } from './model';
import { fetchPrescription } from './actions';

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

  const schedule = useMemo(() => {
    if (prescription) { 
      console.debug({ prescription });
      return new ViewModel.Schedule(prescription);
    }
  }, [prescription]);

  function handleTakeChange(options: { pid: number; did: number; time: number; day: number; taken: boolean }) {
    services?.datasets?.history.put([options]);
  }

  return (
    <>
      {!schedule && <p>Loading...</p>}
      {schedule && <Schedule schedule={schedule} onTakeChange={handleTakeChange}/>}
      {schedule && <Legend legend={schedule.legend} />}
    </>
  );
}

interface ScheduleProps {
  schedule: ViewModel.Schedule;
  onTakeChange(options: { pid: number; did: number, time: number, day: number, taken: boolean }): void;
}

function Schedule(_props: ScheduleProps) {
  // const { slots, drugs, days } = schedule;
  
  // const handleTakeChange = useMemo(() => {
  //   if (onTakeChange) {
  //     return function handleTakeChange(take: ViewModel.Take, event: any) {
  //       const input = event.target as HTMLInputElement;
  //       const { checked: taken } = input;
  //       const { day = '' } = input.closest('tr')?.dataset ?? { };
  //       const { id: pid } = schedule;
  //       const { did, time } = take;
  //       onTakeChange({ pid, did, time, day: parseInt(day), taken });
  //     }
  //   }
  // }, [onTakeChange]);

  return (
    <>
      <table className='prescription'>
        <thead>
          {/* <tr className='slots'>
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
          </tr> */}
        </thead>
        <tbody>
          {/* {days.map(({ day, date, takes }, rowIndex) => (
            <tr key={rowIndex} data-day={day}>
              <td className='day'>{day}</td>
              <td className='date'>{FormatDate.weekDay(date)}</td>
              {takes.map((take, colIndex) => (
                <td key={colIndex} className='take'>
                  {take && <input type='checkbox' checked={take.taken} onChange={handleTakeChange?.bind(null, take)}/>}
                </td>
              ))}
            </tr>
          ))} */}
        </tbody>
      </table>
    </>
  );
}

interface LegendProps {
  legend: ViewModel.Legend;
}

function Legend(_props: LegendProps) {
  return (
    <>
      <h3>Legend:</h3>
      <table className='legend'>
        <tbody>
          {/* {legend.map(({ label, description }, index) => (
            <tr key={index}>
              <td className='key'>{label}</td>
              <td>{description}</td>
            </tr>
          ))} */}
        </tbody>
      </table>
    </>
  );
}

namespace ViewModel {
  // type Slot = { span: number; label: string };
  // type Drug = { label: string };
  // type Take = { did: number; time: number; dose: number; taken: boolean };
  // type Day = { day: number; date: Date; takes: Array<Take | undefined> }
  export type Legend = Array<{ label: string; description: string }>;

  export class Schedule {
    // id: number;
    // slots: Slot[];
    // drugs: Drug[];
    // days: Day[];
    legend: Legend;
    
    constructor(_prescription: Model.Prescription) {
      this.legend = [];
    }
  }

} // namespace ViewModel

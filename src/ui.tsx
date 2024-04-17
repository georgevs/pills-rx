import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { createBrowserRouter, createRoutesFromElements, Outlet, Route, RouterProvider } from 'react-router-dom';
import { Services } from './services';
import { Model } from './model';
import { fetchPrescription } from './actions';
import { FormatDate, legendLabel } from './utils';

export default function App() {
  return (
    <ServicesProvider services={new Services()}>
      <RouterProvider router={createAppRouter()} />
    </ServicesProvider>
  );
}

const ServicesContext = createContext<Services | null>(null);

interface ServicesProviderProps { 
  services: Services; 
  children: ReactNode
}

function ServicesProvider({ services, children }: ServicesProviderProps) {
  return (
    <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>
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
  const [prescription, setPrescription] = useState<Model.Prescription | null>(null);
  const services = useContext(ServicesContext)!;
  
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const id = 1; // TODO

    fetchPrescription(id, { services, signal })
      .then(setPrescription);

    return () => { controller.abort() }
  }, []);

  const schedule = useMemo(() => {
    if (prescription) { 
      return new ViewModel.Schedule(prescription);
    }
  }, [prescription]);

  return (
    <>
      {!schedule && <p>Loading...</p>}
      {schedule && <Schedule schedule={schedule}/>}
      {schedule && <Legend legend={schedule.legend} />}
    </>
  );
}

interface ScheduleProps {
  schedule: ViewModel.Schedule;
}

function Schedule({ schedule }: ScheduleProps) {
  const { slots, drugs, days } = schedule;
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
          {days.map(({ day, date, takes }, rowIndex) => (
            <tr key={rowIndex}>
              <td className='day'>{day}</td>
              <td className='date'>{FormatDate.weekDay(date)}</td>
              {takes.map((take, colIndex) => (
                <td key={colIndex} className='take'>{take && <input type='checkbox' />}</td>
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
  return (
    <>
      <h3>Legend:</h3>
      <table className='legend'>
        <tbody>
          {legend.map(({ label, description }, index) => (
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
  type Slot = { span: number; label: string };
  type Drug = { label: string };
  type Take = { dose: number };
  type Day = { day: number; date: Date; takes: Array<Take | undefined> }
  export type Legend = Array<{ label: string; description: string }>;

  export class Schedule {
    slots: Slot[];
    drugs: Drug[];
    days: Day[];
    legend: Legend;
    
    constructor(prescription: Model.Prescription) {
      const sortedSlots = Array.from(prescription.slots.values())
        .sort(({ index: lhs }, { index: rhs }) => lhs - rhs);

      this.slots = sortedSlots.map(({ time }) => ({ time, span: 1, label: time.toString() }))
        .reduce((acc, slot, i) => {
          if (i > 0 && acc[acc.length-1].time === slot.time) { acc[acc.length-1].span++ }
          else { acc.push(slot) }
          return acc;
        }, new Array<{ time: number, span: number; label: string }>());

      this.drugs = sortedSlots.map(({ drug: { index } }) => ({ label: legendLabel(index) }));

      this.days = prescription.days.map(({ day, date, takes }) => ({ 
        day, 
        date, 
        takes: Array.from(Array(this.drugs.length), (_, index) => takes.get(index))
      }));

      this.legend = Array.from(prescription.drugs.values())
        .map(({ index, description }) => ({ label: legendLabel(index), description }));
    }
  }

} // namespace ViewModel

export type Shape<T> = T & { [key: string]: any };

export class Dates {
  static addDays(dt: Date, legendIndex: number): Date {
    return new Date(dt.getTime() + legendIndex * 24 * 60 * 60 * 1000);
  }
  static toDateOnly(dt: Date): Date {
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }
  static diffDays(lhs: Date, rhs: Date): number {
    return ((Dates.toDateOnly(lhs).getTime() - Dates.toDateOnly(rhs).getTime()) / 1000 / 60 / 60 / 24) | 0;
  }
  static *range(bdt: Date, edt?: Date): Generator<Date> {
    for (let dt = bdt; edt === undefined || dt < edt; dt = Dates.addDays(dt, 1)) {
      yield dt;
    }
  }
}

export class FormatDate {
  static day(dt: Date): string {
    return dt === undefined ? '' : `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }
  static weekDay(dt: Date): string {
    return dt === undefined ? '' : `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')} ${FormatDate.weekday[dt.getDay()]}`;
  }
  static weekday = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
}

export function legendLabel(legendIndex: number): string {
  const r = [(legendIndex | 0) % 26];
  while ((legendIndex = (legendIndex / 26) | 0) !== 0) {
    r.unshift(legendIndex % 26);
  }
  return r.map(i => String.fromCharCode(65 + i)).join('');
}

export class BadStateError extends Error { 
  constructor() { super('Bad state') } 
}

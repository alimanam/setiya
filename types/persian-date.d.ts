declare module 'persian-date' {
  class PersianDate {
    constructor(date?: Date | number[] | string);
    format(format: string): string;
    toDate(): Date;
  }
  export = PersianDate;
}
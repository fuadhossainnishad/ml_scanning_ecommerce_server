import AppError from "../app/error/AppError";
import httpStatus from "http-status";
import { parse } from "date-fns";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const dayCount = (start: Date, end: Date): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diff = endDate.getTime() - startDate.getTime();
  const days = Math.ceil(diff / MS_PER_DAY);
  return Math.max(days, 1);
};

export const dateParse = (date: string, time: string): Date => {
  const dateTime = `${date} ${time}`;
  const parsedDate = parse(dateTime, "dd/MM/yyyy hh:mm a", new Date());
  if (isNaN(parsedDate.getTime())) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Invalid date or time format. Must be 'dd/MM/yyyy' and 'hh:mm AM/PM'"
    );
  }
  return parsedDate;
};

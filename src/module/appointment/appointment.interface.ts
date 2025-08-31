export interface IAppointment {
  dateTime: Date;
  details: string;
  location: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}
export type Subscription = Partial<IAppointment>;

export type TAppointmentUpdate = Partial<IAppointment> & {
  appointmentId: string;
};

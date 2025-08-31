import { Types } from "mongoose";

export enum TMedpro {
  vision = "vision",
  immunization = "immunization",
  hearing = "hearing",
  dental = "dental",
  dlc = "dlc",
  hiv = "hiv",
  pha = "pha",
  dna = "dna",
}

export interface IMedpro {
  type?: TMedpro;
  name: string;
  date: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export enum TQualificationLevel {
  marksman = "marksman",
  sharpshooter = "sharpshooter",
  expert = "expert",
}
export interface IWeaponQualification extends IMedpro {
  pass: boolean;
  score: number;
  qualificationLevel: TQualificationLevel;
}
export interface IPhysicalFitness extends IMedpro {
  pass: boolean;
}
export interface IRangeQualification extends IMedpro {
  score: number;
  qualificationLevel: TQualificationLevel;
}

export interface ICounseling extends IMedpro {
  nextDate: Date;
  counseledBy: string;
  notes: string;
}

export interface IAdminUser extends Omit<IMedpro, "name" | "date"> {
  lesCorrect: boolean;
  vehicleRegistration: string;
  vehicleInsurance: string;
  educationMilitary: string;
  educationCivilian: string;
  volunteerHour: number;
}

export interface ITrackType {
  medpro: IMedpro;
  weaponQualification: IWeaponQualification;
  physicalFitness: IPhysicalFitness;
  rangeQualification: IRangeQualification;
  counseling: ICounseling;
  adminUser: IAdminUser;
}
export enum TTrackType {
  medpro = "medpro",
  weaponQualification = "weaponQualification",
  physicalFitness = "physicalFitness",
  rangeQualification = "rangeQualification",
  counseling = "counseling",
  adminUser = "adminUser",
}

export type TrackBase<K extends keyof ITrackType> = {
  trackType: K;
} & {
  [P in K]: ITrackType[K];
};

export type TTrack = {
  [K in keyof ITrackType]: TrackBase<K>;
}[keyof ITrackType];

export type TTrackUpdate = Partial<TTrack> & {
  trackId: Types.ObjectId;
};

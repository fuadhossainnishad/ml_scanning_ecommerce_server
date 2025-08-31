export interface ISettings {
  type: string;
  content: string;
  updatedAt: Date;
  createdAt: Date;
  isDeleted: boolean;
}

export type TSettingsUpdate = Partial<ISettings>;

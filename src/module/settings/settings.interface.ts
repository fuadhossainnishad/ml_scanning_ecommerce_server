export enum SettingType {
  TERMS_AND_CONDITIONS = "terms_and_conditions",
  PRIVACY_POLICY = "privacy_policy",
}
export interface ISettings {
  type: SettingType;
  content: string;
  updatedAt: Date;
  createdAt: Date;
  isDeleted: boolean;
}

export type TSettingsUpdate = Partial<ISettings>;

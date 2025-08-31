import { model, Model, Schema } from "mongoose";
import MongooseHelper from "../../utility/mongoose.helpers";
import {
  IMedpro,
  IPhysicalFitness,
  IRangeQualification,
  IWeaponQualification,
  TMedpro,
  TQualificationLevel,
  TTrack,
  TTrackType,
} from "./track.interface";

// const isRequired = function (this: IAdmin): boolean {
//   return !(this.role === "Admin");
// };

const MedproSchema: Schema = new Schema<IMedpro>(
  {
    type: {
      type: String,
      enum: Object.values(TMedpro),
      required: false,
    },
    name: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const WeaponQualificationSchema: Schema = new Schema<IWeaponQualification>({
  pass: {
    type: Boolean,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  qualificationLevel: {
    type: String,
    enum: Object.values(TQualificationLevel),
    required: true,
  },
}).add(MedproSchema);

const PhysicalFitnessSchema: Schema = new Schema<IPhysicalFitness>({
  pass: {
    type: Boolean,
    required: true,
  },
}).add(MedproSchema);

const RangeQualificationSchema: Schema = new Schema<IRangeQualification>({
  qualificationLevel: {
    type: String,
    enum: Object.values(TQualificationLevel),
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
}).add(PhysicalFitnessSchema);

const CounselingSchema: Schema = new Schema({
  nextDate: {
    type: Date,
    required: true,
  },
  counseledBy: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
    default: "",
  },
}).add(MedproSchema);

const AdminUserSchema: Schema = new Schema({
  lesCorrect: {
    type: Boolean,
    default: false,
  },
  vehicleRegistration: {
    type: String,
    default: "",
  },
  vehicleInsurance: {
    type: String,
    default: "",
  },
  educationMilitary: {
    type: String,
    default: "",
  },
  educationCivilian: {
    type: String,
    default: "",
  },
  volunteerHour: {
    type: Number,
    default: 0,
  },
}).add(MedproSchema);

const TrackTypeSchemaList = {
  medpro: MedproSchema,
  weaponQualification: WeaponQualificationSchema,
  physicalFitness: PhysicalFitnessSchema,
  rangeQualification: RangeQualificationSchema,
  counseling: CounselingSchema,
  adminUser: AdminUserSchema,
};

const TrackSchema: Schema = new Schema({
  trackType: {
    type: String,
    enum: Object.values(TTrackType),
    required: true,
  },
  ...Object.fromEntries(
    Object.entries(TrackTypeSchemaList).map(([key, schema]) => [
      key,
      {
        type: schema,
        required: function (this: TTrack): boolean {
          return this.trackType === key;
        },
      },
    ])
  ),
});

// MongooseHelper.excludeFields(AdminSchema, ["firstName", "lastName"], "Admin");
MongooseHelper.applyToJSONTransform(TrackSchema);
TrackSchema.index({
  medpro: "text",
  weaponQualification: "text",
  physicalFitness: "text",
  rangeQualification: "text",
  counseling: "text",
  adminUser: "text",
});
const Track: Model<TTrack> = model<TTrack>("Track", TrackSchema);
export default Track;

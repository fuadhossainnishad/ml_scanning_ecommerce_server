import { model, Model, Schema } from 'mongoose';
import { IShipment, ShipmentStatus } from './shipment.interface';
import MongooseHelper from '../../utility/mongoose.helpers';

const ShipmentEventSchema = new Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, required: true },
    description: { type: String },
  },
  { _id: false }
);

const ShipmentSchema = new Schema<IShipment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
    cartProductIds: [{ type: Schema.Types.ObjectId, required: true }],

    senderAddressCode: { type: Number, required: true },
    receiverAddressCode: { type: Number, required: true },

    requestToken: { type: String },
    selectedCourierName: { type: String },
    selectedServiceCode: { type: String },
    selectedCourierId: { type: String },
    shippingCost: { type: Number, required: true, default: 0 },

    shipbubbleOrderId: { type: String, index: true },
    trackingCode: { type: String },
    trackingUrl: { type: String },
    waybillUrl: { type: String },

    status: {
      type: String,
      enum: Object.values(ShipmentStatus),
      default: ShipmentStatus.PENDING,
    },
    estimatedDeliveryDays: { type: Number },
    events: [ShipmentEventSchema],

    pickedUpAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MongooseHelper.applyToJSONTransform(ShipmentSchema);

const Shipment: Model<IShipment> = model<IShipment>('Shipment', ShipmentSchema);
export default Shipment;

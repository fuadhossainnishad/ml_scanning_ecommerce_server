import { Types } from "mongoose";

// export enum TBillingCycle {
//   FREE = "free",
//   MONTHLY = "monthly",
//   YEARLY = "yearly",
// }

export enum TCategory {
  SHIRT = "shirt",
  TSHIRT = "tshirt",
  PANT = "pant"
}

export enum TSize {
  XS = 'xs',
  S = 's',
  M = 'm',
  L = 'l',
  XL = 'xl',
  XXL = 'xxl'
}

export interface IMeasurement {
  size: TSize
  chest: number
  waist: number
  hips: number
  heightRange: number
}

export interface IProduct {
  brandId: Types.ObjectId
  stripe_product_id: string
  productName: string
  shortDescription: string
  productImages: string[]
  colors: string[]
  category: TCategory
  measurement: IMeasurement[]
  totalQuantity: number
  price: number
  stripe_price_id: string
  discountPrice: number
  saleTag: boolean
  shippingNote: string
}

export type TUpdateProduct = Partial<IProduct> & {
  id: Types.ObjectId
}
import { Types } from "mongoose";

// export enum TBillingCycle {
//   FREE = "free",
//   MONTHLY = "monthly",
//   YEARLY = "yearly",
// }

export enum TCategory {
  SHIRT = "shirt",
  TSHIRT = "tshirt",
  PANT = "pant",
  JEANS = 'jeans',
  JACKET = 'jacket'
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
  chest: string
  waist: string
  hips: string
  heightRange: string
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
  inStock: boolean
  stripe_price_id: string
  discountPrice: number
  saleTag: boolean
  shippingNote: string,
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
}

export type TUpdateProduct = Partial<IProduct> & {
  id: Types.ObjectId
}


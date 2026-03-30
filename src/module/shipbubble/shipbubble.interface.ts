export interface ShipbubbleAddressInput {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface ShipbubbleValidatedAddress {
  address_code: number;
  formatted_address: string;
  country: string;
  country_code: string;
  city: string;
  state: string;
  state_code: string;
  postal_code: string;
  latitude: number;
  longitude: number;
}

export interface ShipbubblePackageItem {
  name: string;
  description: string;
  unit_weight: number; // in KG
  unit_amount: number; // item value
  quantity: number;
}

export interface ShipbubblePackageDimension {
  length: number; // in CM
  width: number;
  height: number;
}

export interface ShipbubbleFetchRatesInput {
  sender_address_code: number;
  receiver_address_code: number;
  pickup_date: string; // yyyy-mm-dd
  category_id: string;
  package_items: ShipbubblePackageItem[];
  package_dimension: ShipbubblePackageDimension;
  service_type?: 'pickup' | 'dropoff';
}

export interface ShipbubbleCourier {
  courier_id: string;
  courier_name: string;
  service_code: string;
  rate_card_amount: number;
  total: number;
  currency: string;
  pickup_eta_time: string;
  delivery_eta_time: string;
  is_cod_available: boolean;
  tracking_level: number;
  service_type: string;
}

export interface ShipbubbleFetchRatesResponse {
  request_token: string;
  couriers: ShipbubbleCourier[];
  fastest_courier: ShipbubbleCourier;
  cheapest_courier: ShipbubbleCourier;
}

export interface ShipbubbleCreateLabelInput {
  request_token: string;
  service_code: string;
  courier_id: string;
}

export interface ShipbubbleLabel {
  order_id: string;
  tracking_url: string;
  waybill_document: string;
  tracking_code: string;
  fee_amount: number;
  fee_currency: string;
}

export interface ShipbubbleWebhookPayload {
  order_id: string;
  status: string;
  tracking_code: string;
  tracking_url: string;
  waybill_document: string;
  package_status: {
    status: string;
    timestamp: string;
    description?: string;
  }[];
  events: {
    status: string;
    timestamp: string;
    description?: string;
  }[];
}

export interface ShipbubbleWalletBalance {
  balance: number;
  currency: string;
}

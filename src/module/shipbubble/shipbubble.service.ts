import axios, { AxiosInstance } from 'axios';
import config from '../../app/config';
import AppError from '../../app/error/AppError';
import httpStatus from 'http-status';
import {
  ShipbubbleAddressInput,
  ShipbubbleValidatedAddress,
  ShipbubbleFetchRatesInput,
  ShipbubbleFetchRatesResponse,
  ShipbubbleCreateLabelInput,
  ShipbubbleLabel,
  ShipbubbleWalletBalance,
} from './shipbubble.interface';

class ShipbubbleServiceClass {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.shipbubble.baseUrl,
      headers: {
        Authorization: `Bearer ${config.shipbubble.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async validateAddress(input: ShipbubbleAddressInput): Promise<ShipbubbleValidatedAddress> {
    try {
      const { data } = await this.client.post('/shipping/address/validate', input);
      if (!data?.data?.address_code) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Could not validate address. Please check and try again.');
      }
      return data.data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      const message = error.response?.data?.message || error.message || 'Address validation failed';
      throw new AppError(httpStatus.BAD_REQUEST, message);
    }
  }

  async fetchRates(input: ShipbubbleFetchRatesInput): Promise<ShipbubbleFetchRatesResponse> {
    try {
      const { data } = await this.client.post('/shipping/fetch_rates', input);
      if (!data?.data?.request_token) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Could not fetch shipping rates');
      }
      return {
        request_token: data.data.request_token,
        couriers: data.data.couriers || [],
        fastest_courier: data.data.fastest_courier,
        cheapest_courier: data.data.cheapest_courier,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      const message = error.response?.data?.message || error.message || 'Failed to fetch shipping rates';
      throw new AppError(httpStatus.BAD_REQUEST, message);
    }
  }

  async createLabel(input: ShipbubbleCreateLabelInput): Promise<ShipbubbleLabel> {
    try {
      const { data } = await this.client.post('/shipping/labels', input);
      if (!data?.data?.order_id) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Could not create shipping label');
      }
      return {
        order_id: data.data.order_id,
        tracking_url: data.data.tracking_url || '',
        waybill_document: data.data.waybill_document || '',
        tracking_code: data.data.tracking_code || '',
        fee_amount: data.data.payment_summary?.fee_amount || 0,
        fee_currency: data.data.payment_summary?.fee_currency || 'NGN',
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      const message = error.response?.data?.message || error.message || 'Failed to create shipping label';
      throw new AppError(httpStatus.BAD_REQUEST, message);
    }
  }

  async cancelShipment(orderId: string): Promise<void> {
    try {
      await this.client.post(`/shipping/labels/cancel/${orderId}`);
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to cancel shipment';
      throw new AppError(httpStatus.BAD_REQUEST, message);
    }
  }

  async getWalletBalance(): Promise<ShipbubbleWalletBalance> {
    try {
      const { data } = await this.client.get('/shipping/wallet/balance');
      return {
        balance: data.data?.balance ?? 0,
        currency: data.data?.currency || 'NGN',
      };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch wallet balance';
      throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, message);
    }
  }

  async getShipmentDetails(orderId: string): Promise<any> {
    try {
      const { data } = await this.client.get(`/shipping/labels/list/${orderId}`);
      return data.data;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch shipment details';
      throw new AppError(httpStatus.BAD_REQUEST, message);
    }
  }
}

const ShipbubbleService = new ShipbubbleServiceClass();
export default ShipbubbleService;

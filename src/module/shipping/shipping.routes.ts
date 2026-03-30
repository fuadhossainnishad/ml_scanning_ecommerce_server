import express from 'express';
import auth from '../../middleware/auth';
import ShippingController from './shipping.controller';

const router = express.Router();

// Address validation
router.post(
  '/validate-address',
  auth('User', 'Brand'),
  ShippingController.validateAddress
);

// Brand pickup address
router.put(
  '/pickup-address',
  auth('Brand'),
  ShippingController.updatePickupAddress
);

// Checkout rates (customer)
router.post(
  '/checkout-rates',
  auth('User'),
  ShippingController.getCheckoutRates
);

// Book shipment (brand marks ready)
router.post(
  '/book',
  auth('Brand'),
  ShippingController.bookShipment
);

// Tracking
router.get(
  '/tracking/:orderId',
  auth('User', 'Brand'),
  ShippingController.getTracking
);

// Wallet balance (admin)
router.get(
  '/wallet-balance',
  auth('Admin'),
  ShippingController.getWalletBalance
);

const ShippingRouter = router;
export default ShippingRouter;

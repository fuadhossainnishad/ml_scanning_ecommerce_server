import { Router } from "express";
import auth from "../../middleware/auth";
import OrderController from "./order.controller";
import EarningsController from "../earnings/earnings.controller";
import RewardController from "../reward/reward.controller";

const router = Router()

router
    .route('/')
    .get(
        auth('User', 'Brand'),
        OrderController.getOrders
    )
// .post(
//     auth('User', 'Brand'),
//     OrderController.getOrders
// )

router
    .route('/status')
    .post(
        auth('Brand'),
        OrderController.updateStatus,
        EarningsController.insertEarning,
        RewardController.insertReward
    )

router
    .route('/transaction')
    .get(
        auth('Brand'),
        OrderController.getTransaction,
        // EarningsController.insertEarning
    )

const OrderRouter = router
export default OrderRouter
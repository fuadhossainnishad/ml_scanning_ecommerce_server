import { Router } from "express";
import auth from "../../middleware/auth";
import OrderController from "./order.controller";

const router = Router()

router.post(
    '/payment',
    auth('User'),
    OrderController.payment
)
import express from 'express';
import Health from './health.controller';

const router = express.Router()
router.get('/health', Health.healthController)

const HealthRouter = router
export default HealthRouter
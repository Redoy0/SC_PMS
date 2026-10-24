import express from 'express';
import { requireAuth, requireRoles } from '../middleware/auth.js';
import { trackingLimiter } from '../middleware/rateLimits.js';
import * as parcelController from '../controllers/parcel.controller.js';

const router = express.Router();

// Public tracking route (no auth required, rate limited, returns a reduced view)
router.get('/track/:trackingCode', trackingLimiter, parcelController.getParcelByTrackingCode);

router.use(requireAuth);

router.get('/', parcelController.listParcels);
router.post('/', requireRoles('customer'), parcelController.createParcel);
router.get('/:id', parcelController.getParcel);
router.post('/:id/assign', requireRoles('admin'), parcelController.assignAgent);
router.post('/:id/status', requireRoles('admin', 'agent'), parcelController.updateStatus);
router.post('/:id/location', requireRoles('agent'), parcelController.updateLocation);
router.delete('/:id', requireRoles('admin'), parcelController.deleteParcel);

export default router;

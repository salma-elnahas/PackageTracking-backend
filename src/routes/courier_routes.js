// Person 4: courier features (7, 8, 10), mounted at /api/courier
const router = require('express').Router();
const {
  getAssignedOrders,
  acceptOrder,
  declineOrder,
  updateDeliveryStatus,
  getCouriers,
  assignCourier
} = require('../controllers/courier_controller');
const { protect, authorize } = require('../middleware/auth');

// courier routes
router.get('/orders', protect, authorize('courier'), getAssignedOrders);
router.patch('/orders/:id/accept', protect, authorize('courier'), acceptOrder);
router.patch('/orders/:id/decline', protect, authorize('courier'), declineOrder);
router.patch('/orders/:id/status', protect, authorize('courier'), updateDeliveryStatus);

// admin routes
router.get('/couriers', protect, authorize('admin'), getCouriers);
router.put('/orders/:id/assign', protect, authorize('admin'), assignCourier);

module.exports = router;


const router = require('express').Router();

const { createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  deleteOrder } = require('../controllers/order_controller');
const { protect, authorize } = require('../middleware/auth');

//create order
router.post('/', protect, authorize('user'), createOrder);
//Get orders belonging to the logged-in user
router.get('/my-orders', protect, authorize('user'), getMyOrders);

// Cancel own order
router.patch('/:id/cancel', protect, authorize('user'), cancelOrder);

// admin routes
// Get all orders
router.get('/', protect, authorize('admin'), getAllOrders);
// Update order's status
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
// Delete an order
router.delete('/:id', protect, authorize('admin'), deleteOrder);

// Get order by ID (accessible by both user and admin)
router.get('/:id', protect, getOrderById);

module.exports = router;


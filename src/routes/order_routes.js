
const router = require('express').Router();

const { createOrder, getMyOrders } = require('../controllers/order_controller');
const { protect, authorize } = require('../middleware/auth');

//create order
router.post('/', protect, authorize('user'), createOrder);
//Get orders belonging to the logged-in user
router.get('/my-orders', protect, authorize('user'), getMyOrders);
module.exports = router;

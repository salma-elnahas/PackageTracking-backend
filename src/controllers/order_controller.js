const Order = require('../models/Order');
const mongoose = require('mongoose');
const STATUSES = Order.schema.path('status').enumValues;

exports.createOrder = async (req, res) => {
    try {
        const { pickupLocation, dropoffLocation, packageDetails, deliveryTime } = req.body;

        // required fields (must be non-empty strings)
        const fields = { pickupLocation, dropoffLocation, packageDetails };
        for (const [name, value] of Object.entries(fields)) {
            if (typeof value !== 'string' || value.trim().length < 3)
                return res.status(400).json({ message: `${name} is required (at least 3 characters)` });
        }

        // delivery time must be a valid date in the future
        if (!deliveryTime)
            return res.status(400).json({ message: 'deliveryTime is required' });
        const when = new Date(deliveryTime);
        if (isNaN(when.getTime()))
            return res.status(400).json({ message: 'deliveryTime is not a valid date' });
        if (when.getTime() <= Date.now())
            return res.status(400).json({ message: 'deliveryTime must be in the future' });

        const order = await Order.create({
            user: req.user.id,                       // taken from the token, never from the body
            pickupLocation: pickupLocation.trim(),
            dropoffLocation: dropoffLocation.trim(),
            packageDetails: packageDetails.trim(),
            deliveryTime: when,
            status: 'Pending',
            statusHistory: [{ status: 'Pending' }]
        });

        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};
// Feature 5
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            count: orders.length,
            orders
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error' });
    }
};

// helper function to load an order by ID for features 6,7,8,10
async function loadOrder(id, res) {
    if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ message: 'Invalid order ID' });
        return null;
    }
    const order = await Order.findById(id)
        .populate('user', 'name email phone')
        .populate('courier', 'name email phone');
    if (!order) {
        res.status(404).json({ message: 'Order not found at loadOrder' });
        return null;
    }
    return order;
}

// Feature 6: user gets order details
exports.getOrderById = async (req, res) => {
    try {
        const order = await loadOrder(req.params.id, res);
        if (!order) return;
        const { id, role } = req.user;
        const isOwner = order.user?._id.toString() === id;
        const isCourier = order.courier?._id.toString() === id;
        if (role !== 'admin' && !isOwner && !isCourier)
            return res.status(403).json({ message: 'You are not allowed to view this order' });
        res.status(200).json({ order });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error while getting order by ID' });
    }
};

// Feature 6: user cancels pending order 
exports.cancelOrder = async (req, res) => {
    try {
        const order = await loadOrder(req.params.id, res);
        if (!order) return;
        if (order.user?._id.toString() !== req.user.id)
            return res.status(403).json({ message: 'You can only cancel your own orders' });
        if (order.status !== 'Pending')
            return res.status(409).json({ message: `Only pending orders can be cancelled (current status: ${order.status})` });
        order.status = 'Cancelled';
        order.statusHistory.push({ status: 'Cancelled' });
        await order.save();
        res.status(200).json({ message: 'Order cancelled successfully', order });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error at cancel Order' });
    }
};

// Feature 9: admin displays all orders
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('user', 'name email phone')
            .populate('courier', 'name email phone')
            .sort({ createdAt: -1 });
        res.status(200).json({ count: orders.length, orders });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error at get All Orders' });
    }
};

// Feature 9: admin updates order status 
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !STATUSES.includes(status))
            return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(', ')}` });
        const order = await loadOrder(req.params.id, res);
        if (!order) return;
        if (order.status === status)
            return res.status(400).json({ message: `Order is already ${status}` });
        order.status = status;
        order.statusHistory.push({ status });
        await order.save();
        res.status(200).json({ message: 'Order status updated', order });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error at update Order Status' });
    }
};

// Feature 9: admin deletes order
exports.deleteOrder = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(400).json({ message: 'Invalid order ID' });
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found at deleteOrder' });
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error at delete Order' });
    }
};
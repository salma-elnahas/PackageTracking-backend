const mongoose = require('mongoose');
const Order = require('../models/Order');
const User = require('../models/User');

// Feature 8: the only forward step a courier can make from each status
const NEXT_STATUS = {
    'Accepted': 'Picked Up',
    'Picked Up': 'In Transit',
    'In Transit': 'Delivered'
};

// Feature 10: an admin can only (re)assign an order before it is picked up
const ASSIGNABLE = ['Pending', 'Accepted', 'Declined'];

// loads an order and sends 400/404 itself when it can't
async function findOrder(id, res) {
    if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ message: 'Invalid order ID' });
        return null;
    }
    const order = await Order.findById(id);
    if (!order) {
        res.status(404).json({ message: 'Order not found' });
        return null;
    }
    return order;
}

// loads an order that must be assigned to the logged-in courier
async function findMyOrder(req, res) {
    const order = await findOrder(req.params.id, res);
    if (!order) return null;
    if (order.courier?.toString() !== req.user.id) {
        res.status(403).json({ message: 'This order is not assigned to you' });
        return null;
    }
    return order;
}

// reloads an order with the customer's and courier's details for the response
function withDetails(id) {
    return Order.findById(id)
        .populate('user', 'name email phone')
        .populate('courier', 'name email phone');
}

// changes the status, records it in statusHistory and saves
async function setStatus(order, status) {
    order.status = status;
    order.statusHistory.push({ status });
    await order.save();
    return withDetails(order._id);
}

// Feature 7: courier sees the orders assigned to them (id comes from the token)
exports.getAssignedOrders = async (req, res) => {
    try {
        const orders = await Order.find({ courier: req.user.id })
            .populate('user', 'name email phone')
            .sort({ deliveryTime: 1 });
        res.status(200).json({ count: orders.length, orders });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error at get Assigned Orders' });
    }
};

// Feature 7: courier accepts an order assigned to them
exports.acceptOrder = async (req, res) => {
    try {
        const order = await findMyOrder(req, res);
        if (!order) return;
        if (order.status !== 'Pending')
            return res.status(409).json({ message: `Only pending orders can be accepted (current status: ${order.status})` });
        const updated = await setStatus(order, 'Accepted');
        res.status(200).json({ message: 'Order accepted', order: updated });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error at accept Order' });
    }
};

// Feature 7: courier declines an order; it stays linked to them so the admin
// can see who declined it, and the admin then reassigns it (feature 10)
exports.declineOrder = async (req, res) => {
    try {
        const order = await findMyOrder(req, res);
        if (!order) return;
        if (order.status !== 'Pending')
            return res.status(409).json({ message: `Only pending orders can be declined (current status: ${order.status})` });
        const updated = await setStatus(order, 'Declined');
        res.status(200).json({ message: 'Order declined', order: updated });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error at decline Order' });
    }
};

// Feature 8: courier moves the order one step: Picked Up -> In Transit -> Delivered
exports.updateDeliveryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await findMyOrder(req, res);
        if (!order) return;
        const next = NEXT_STATUS[order.status];
        if (!next)
            return res.status(409).json({ message: `Status can't be changed from ${order.status}` });
        if (status !== next)
            return res.status(400).json({ message: `Next status must be "${next}" (current status: ${order.status})` });
        const updated = await setStatus(order, next);
        res.status(200).json({ message: `Order marked as ${next}`, order: updated });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error at update Delivery Status' });
    }
};

// Feature 10: admin gets the list of couriers for the assign dropdown
exports.getCouriers = async (req, res) => {
    try {
        const couriers = await User.find({ role: 'courier' })
            .select('name email phone')
            .sort({ name: 1 });
        res.status(200).json({ count: couriers.length, couriers });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error at get Couriers' });
    }
};

// Feature 10: admin assigns or reassigns a courier; the order goes back to Pending
// so the new courier can accept or decline it
exports.assignCourier = async (req, res) => {
    try {
        const { courierId } = req.body;
        if (!mongoose.isValidObjectId(courierId))
            return res.status(400).json({ message: 'A valid courierId is required' });
        const courier = await User.findById(courierId);
        if (!courier || courier.role !== 'courier')
            return res.status(400).json({ message: 'Selected user is not a courier' });

        const order = await findOrder(req.params.id, res);
        if (!order) return;
        if (!ASSIGNABLE.includes(order.status))
            return res.status(409).json({ message: `Orders that are ${order.status} can't be reassigned` });
        if (order.courier?.toString() === courierId && order.status !== 'Declined')
            return res.status(400).json({ message: `Order is already assigned to ${courier.name}` });

        order.courier = courier._id;
        if (order.status !== 'Pending') {
            // Declined/Accepted go back to Pending so the new courier can accept or decline
            order.status = 'Pending';
            order.statusHistory.push({ status: 'Pending' });
        }
        await order.save();
        const updated = await withDetails(order._id);
        res.status(200).json({ message: `Order assigned to ${courier.name}`, order: updated });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Server error at assign Courier' });
    }
};

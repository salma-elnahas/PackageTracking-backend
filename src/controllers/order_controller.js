const Order = require('../models/Order');

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
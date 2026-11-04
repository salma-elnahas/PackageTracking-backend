const mongoose = require('mongoose');
const orderSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courier:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  pickupLocation:  { type: String, required: true },
  dropoffLocation: { type: String, required: true },
  packageDetails:  { type: String, required: true },
  deliveryTime:    { type: Date, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Declined', 'Picked Up', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  statusHistory: [{ status: String, at: { type: Date, default: Date.now } }]
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);
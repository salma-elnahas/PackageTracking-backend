const app = require('./app');
const connectDB = require('./config/database');
connectDB().then(() => app.listen(process.env.PORT || 3000, () => console.log('API running')));
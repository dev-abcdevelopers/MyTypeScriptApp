import express from 'express';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Protected route example
app.get('/api/private', require('./middlewares/auth.middleware').authenticate, (req, res) => {
  res.send('This is a protected route');
});

const PORT = process.env.PORT || 5000;
sequelize.sync({ force: true }).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

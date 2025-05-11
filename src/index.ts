import express from 'express';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import authRoutes from './routes/auth.routes';

dotenv.config();

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/private', require('./middlewares/auth.middleware').authenticate, (req, res) => {
  res.send('This is a protected route');
});

const PORT = process.env.PORT || 5000;
sequelize.sync({ force: true }).then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

import dotenv from 'dotenv';
import app from './src/app.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

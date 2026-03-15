import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

// CORS configuration
const isDev = process.env.NODE_ENV !== 'production';

const corsOptions: cors.CorsOptions = isDev
  ? {} // allow all origins in development
  : {
    origin: [
      'https://up-down-cards.web.app',
      'https://up-down-cards.firebaseapp.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Routes
app.use(routes);

export default app;

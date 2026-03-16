import express from 'express';
import cors from 'cors';
import routes from './routes';

const app = express();

// CORS configuration
const isDev = process.env.NODE_ENV !== 'production';

const allowedOrigins = [
  'https://up-down-cards.web.app',
  'https://up-down-cards.firebaseapp.com',
];

const corsOptions: cors.CorsOptions = isDev
  ? {} // allow all origins in development
  : {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^https:\/\/up-down-cards--[^.]+\.web\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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

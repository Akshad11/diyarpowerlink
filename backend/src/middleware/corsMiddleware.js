const rawOrigins = process.env.CORS_ORIGINS || '';
const allowedOrigins = rawOrigins
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const originMatchesPattern = (origin, pattern) => {
  if (pattern === '*') return true;
  if (!pattern.includes('*')) return origin === pattern;
  const regex = new RegExp(`^${pattern.split('*').map(escapeRegex).join('.*')}$`);
  return regex.test(origin);
};

const isOriginAllowed = (origin) => {
  if (allowedOrigins.length === 0) return true;
  const allowed = allowedOrigins.some((pattern) => originMatchesPattern(origin, pattern));
  if (origin && !allowed) {
    console.warn(`[CORS] Blocked request from origin: ${origin}. Allowed origins:`, allowedOrigins);
  }
  return allowed;
};

export const corsHeadersMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  if (req.method === 'OPTIONS') {
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  }
  next();
};

export const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 204
};

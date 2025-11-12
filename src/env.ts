import { envsafe, port, str, url } from 'envsafe';

export const env = envsafe({
  REDISHOST: str(),
  REDISPORT: port(),
  REDISUSER: str(),
  REDISPASSWORD: str(),
  PORT: port({
    devDefault: 3000,
  }),
  RAILWAY_STATIC_URL: str({
    devDefault: 'http://localhost:3000',
  }),
  // EON Provider Configuration
  EON_API_BASE_URL: url({
    devDefault: 'https://api2.eon.ro',
  }),
  EON_API_KEY: str({
    devDefault: '674e9032df9d456fa371e17a4097a5b8',
  }),
  EON_USERNAME: str(),
  EON_PASSWORD: str(),
});

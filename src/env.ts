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
  // Authentication Configuration
  API_TOKEN: str({
    desc: 'API token for endpoint authentication',
  }),
  ADMIN_USERNAME: str({
    desc: 'Username for Bull Board admin UI',
    devDefault: 'admin',
  }),
  ADMIN_PASSWORD: str({
    desc: 'Password for Bull Board admin UI',
    devDefault: 'admin',
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
  // Nova Apa Serv Provider Configuration
  NOVA_APA_SERV_API_BASE_URL: url({
    devDefault: 'https://www.apabotosani.ro',
  }),
  NOVA_APA_SERV_USERNAME: str({
    devDefault: '',
  }),
  NOVA_APA_SERV_PASSWORD: str({
    devDefault: '',
  }),
});

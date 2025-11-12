# 🧾 Invoice Notifier

> ⚡ Queue-based utility invoice automation • Multi-provider • Type-safe • Bull Board

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![BullMQ](https://img.shields.io/badge/BullMQ-5.63-red.svg)](https://bullmq.io/)
[![Fastify](https://img.shields.io/badge/Fastify-5.6-black.svg)](https://www.fastify.io/)
[![Work in Progress](https://img.shields.io/badge/status-WIP-yellow.svg)](https://github.com/albertomario/invoice-notifier)

A work-in-progress queue worker for managing utility invoices across providers. Built with BullMQ, Fastify, and TypeScript.

## ✨ What's Working

- **🎯 Job Queue** - ACTION-ENTITY pattern for invoice operations
- **🔌 EON Provider** - Fetch account data and invoices
- **📊 Dashboard** - Bull Board UI for monitoring
- **🔒 Type-Safe** - Full TypeScript coverage

## 🎯 Available Jobs

| Job Type | EON | Enel | Electrica | Digi |
|----------|-----|------|-----------|------|
| `fetch-account-data` | ✅ | 🚧 | 🚧 | 🚧 |
| `fetch-invoice` | ✅ | 🚧 | 🚧 | 🚧 |
| `pay-invoice` | 🚧 | 🚧 | 🚧 | 🚧 |

## 🚀 Quick Start

1. **Install**:
   ```bash
   npm install
   ```

2. **Setup**:
   ```bash
   cp .env.example .env
   # Add your credentials
   ```

3. **Run Redis**:
   ```bash
   docker run -d --name redis -p 6379:6379 redis:alpine redis-server --requirepass redis123
   ```

4. **Start**:
   ```bash
   npm run build && npm run dev
   ```

5. **Monitor**: http://localhost:3000

## 📡 Usage

**Fetch account balance:**
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{"type":"fetch-account-data","provider":"eon","accountContract":"002202348574"}'
```

**List invoices:**
```bash
curl -X POST http://localhost:3000/add-job \
  -H "Content-Type: application/json" \
  -d '{"type":"fetch-invoice","provider":"eon","accountContract":"002202348574","status":"unpaid"}'
```

See [JOB_TYPES.md](./JOB_TYPES.md) for more examples.

## 📚 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [JOB_TYPES.md](./JOB_TYPES.md) - Job reference
- [TESTING.md](./TESTING.md) - Testing guide

## 🛠️ Built With

BullMQ • Fastify • TypeScript • Bull Board • Redis

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📋 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code.

## � License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

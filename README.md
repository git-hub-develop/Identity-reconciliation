# 🔗 Contact Identity Resolution API

A robust service for identifying and linking user contact data by resolving multiple entries (email/phone) into a single, canonical identity. Useful for deduplicating contact lists and maintaining consistent user records.

## 🚀 Features

- 🔍 Resolves contacts using email and/or phone number
- 📚 Auto-generated Swagger docs for easy API exploration
- ✅ Test suite using Supertest & Jest
- 🧠 Logic handles primary/secondary contact relationships
- 🔒 Clean error handling & validation via Zod
- ⚙️ Built with TypeScript, Express, and Prisma ORM

---

## 📦 Tech Stack

- **Node.js** + **Express**
- **TypeScript**
- **Prisma** (PostgreSQL or SQLite)
- **Jest + Supertest** for testing
- **Zod** for schema validation
- **Swagger** for API documentation

---

## 📄 API Docs

> 🌐 Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 🔧 Installation

```bash
# 1. Clone repo
git clone https://github.com/git-hub-develop/Identity-reconciliation.git
cd Identity-reconciliation

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in your DATABASE_URL in the .env file

# 4. Run migrations
npx prisma migrate dev

# 5. Start dev server
npm run dev

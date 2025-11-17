# 🚀 Supabase SaaS Admin Panel

Production-ready React Admin panel for SaaS Search Service built with **Supabase**, **shadcn/ui**, and **TypeScript**.

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React Admin](https://img.shields.io/badge/React_Admin-5.13.1-green.svg)](https://marmelab.com/react-admin/)
[![Supabase](https://img.shields.io/badge/Supabase-2.81-green.svg)](https://supabase.com/)

## ✨ Features

### 🎯 Core Functionality
- **Multi-Tenant Architecture** - Complete tenant management with RLS security
- **Document Management** - Upload, index, and search documents with pgvector embeddings
- **Search Analytics** - Comprehensive search logs and performance metrics
- **API Key Management** - Secure API key generation and usage tracking
- **Real-time Dashboard** - Live analytics with usage statistics and trends

### 🎨 Modern UI/UX
- **shadcn/ui Components** - Beautiful, accessible components built with Radix UI
- **Tailwind CSS** - Utility-first styling with custom theme
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Dark Mode Ready** - (Coming soon)

### 🔐 Security & Auth
- **Supabase Authentication** - Secure JWT-based auth
- **Row Level Security (RLS)** - Database-level security policies
- **Role-Based Access Control** - Fine-grained permissions (Coming soon)
- **API Key Authentication** - Secure programmatic access

### 📊 Analytics & Monitoring
- **Usage Tracking** - Real-time tenant usage metrics
- **Search Analytics** - Query performance and trends
- **Daily Statistics** - Aggregated metrics per tenant
- **Embedding Analytics** - Vector generation monitoring

## 🏗️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | React 19.2.0, TypeScript, Vite 7.2.2 |
| **Admin Framework** | React Admin 5.13.1 |
| **UI Components** | shadcn/ui, Radix UI, Tailwind CSS 3.4 |
| **Backend** | Supabase (PostgreSQL 17) |
| **Database Extensions** | pgvector, pg_cron, pg_net |
| **Data Provider** | ra-supabase 3.5.2 |
| **Icons** | Lucide React |
| **Forms** | React Hook Form, Zod |

## 📦 Database Schema

The project includes **28 comprehensive tables**:

### Core Tables
- `tenants` - Organizations/workspaces
- `user_tenants` - User-tenant relationships with roles
- `documents` - Indexed documents with embeddings
- `profiles` - User profiles

### Search & Analytics
- `search_logs` - Search query logs
- `search_queries_log` - Detailed query tracking
- `search_analytics` - Aggregated search metrics
- `embedding_analytics` - Vector generation tracking

### Billing & Usage
- `billing_plans` - Subscription plans
- `tenant_billing` - Tenant billing relationships
- `tenant_usage` - Real-time usage tracking
- `daily_usage_stats` - Aggregated daily metrics

### API & Integrations
- `tenant_api_keys` - API key management
- `cms_integrations` - CMS connectors
- `cms_connections` - CMS sync configuration
- `widgets` - Embeddable search widgets

### Security & Monitoring
- `audit_logs` - Audit trail
- `usage_metrics` - Detailed usage tracking
- `sync_errors` - Error logging

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AAChibilyaev/supabase-saas-admin.git
cd supabase-saas-admin
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. **Set up Supabase database**

Run the SQL script in your Supabase SQL Editor:
```bash
# The database migrations are already applied if you're using the project
# Check supabase-setup.sql for manual setup
```

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:5173` 🎉

## 📖 Project Structure

```
supabase-admin/
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   └── layout/              # Layout components
│   ├── resources/               # React Admin resources
│   │   ├── tenants/            # Tenant CRUD
│   │   ├── documents/          # Document management
│   │   ├── search-logs/        # Search logs
│   │   └── api-keys/           # API key management
│   ├── providers/
│   │   ├── supabaseClient.ts   # Supabase client
│   │   ├── dataProvider.ts     # React Admin data provider
│   │   └── authProvider.ts     # React Admin auth provider
│   ├── Dashboard.tsx           # Main dashboard
│   ├── App.tsx                 # App entry point
│   └── main.tsx               # React entry point
├── supabase-setup.sql          # Database setup script
├── components.json             # shadcn/ui config
└── vite.config.ts             # Vite config
```

## 🎯 Key Resources

### Tenants
- **List**: View all tenants with filtering
- **Edit**: Manage tenant settings, branding, users
- **Create**: Add new tenants
- **Features**: Plan management, custom domains, branding

### Documents
- **List**: Browse indexed documents
- **Features**: File type filtering, embedding status, tenant filtering

### Search Logs
- **List**: View search queries and performance
- **Analytics**: Response times, result counts, IP tracking

### API Keys
- **List**: Manage API keys with scopes
- **Features**: Usage tracking, expiration, revocation

## 🔧 Configuration

### Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

Example:
```bash
npx shadcn@latest add chart calendar
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ |

## 📊 Dashboard Features

The dashboard provides:

- **Real-time Statistics**: Tenants, documents, searches, active users
- **Tenant Overview**: Recent tenants with plan badges
- **Usage Breakdown**: Storage, API calls, search metrics
- **Search Analytics**: Recent queries with performance metrics
- **Recent Documents**: Latest indexed documents with embedding status

## 🔐 Security

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ JWT-based authentication via Supabase
- ✅ Secure API key generation with bcrypt hashing
- ✅ HTTPS-only connections to Supabase
- ✅ Environment variables for sensitive data
- 🚧 Role-Based Access Control (Coming soon)

## 📈 Performance

- ⚡ Vite for lightning-fast development
- ⚡ Optimized bundle size with code splitting
- ⚡ Efficient database queries with proper indexing
- ⚡ React Admin built-in caching
- ⚡ pgvector for fast semantic search

## 🎨 Customization

### Theme

Edit theme in `src/App.tsx`:

```typescript
const theme = {
  ...defaultTheme,
  palette: {
    primary: {
      main: 'hsl(222.2, 47.4%, 11.2%)', // Your primary color
    },
  },
}
```

### Branding

Add tenant-specific branding via:
- Logo URL in tenant settings
- Primary color (hex format)
- Custom domain configuration

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build output will be in `dist/`.

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

### Deploy to Netlify

```bash
npm run build
# Drag and drop dist/ folder to Netlify
```

### Environment Variables

Don't forget to set environment variables in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🐛 Troubleshooting

### Common Issues

**Issue**: "Missing Supabase environment variables"
**Solution**: Make sure `.env` file exists with valid credentials

**Issue**: "Failed to fetch data"
**Solution**: Check RLS policies in Supabase and ensure you're authenticated

**Issue**: "Build fails with TypeScript errors"
**Solution**: Run `npm run build` to see detailed errors

## 📝 Roadmap

See [GitHub Issues](https://github.com/AAChibilyaev/supabase-saas-admin/issues) for planned features:

- [ ] Advanced filtering and data export (#1)
- [ ] Role-Based Access Control (#2)
- [ ] Real-time updates with Supabase subscriptions (#3)
- [ ] Enhanced dashboard with charts (#4)
- [ ] Multi-tenant context switching (#5)
- [ ] Dark mode
- [ ] Mobile app
- [ ] Internationalization (i18n)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [React Admin](https://marmelab.com/react-admin/) - Amazing admin framework
- [Supabase](https://supabase.com/) - Open-source Firebase alternative
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📧 Contact

**Alexandr Chibilyaev**
- GitHub: [@AAChibilyaev](https://github.com/AAChibilyaev)
- Website: [aachibilyaev.com](https://aachibilyaev.com)
- Email: AAChibilyaev@gmail.com

---

⭐ **Star this repo if you find it useful!**

Built with ❤️ using React Admin, Supabase, and shadcn/ui

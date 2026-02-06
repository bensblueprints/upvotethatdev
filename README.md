# Upvote Alchemy - Development Environment

**⚠️ This is the DEVELOPMENT version. DO NOT use for production!**

## 🔗 Repository Links

- **Production Repo**: [upvote-alchemy-order](https://github.com/bensblueprints/upvote-alchemy-order) (DO NOT MODIFY)
- **Development Repo**: [upvotethatdev](https://github.com/bensblueprints/upvotethatdev) (This repo)

## 📊 Database Information

### Production Database (READ-ONLY)
- **Project ID**: `kuuulgjkgyhgzkjyembj`
- **Dashboard**: https://supabase.com/dashboard/project/kuuulgjkgyhgzkjyembj
- ⛔ **DO NOT MODIFY THIS DATABASE**

### Development Database (Safe to modify)
- **Project ID**: `cfadojgkbaahihrzdyws`
- **Dashboard**: https://supabase.com/dashboard/project/cfadojgkbaahihrzdyws
- **Supabase URL**: https://cfadojgkbaahihrzdyws.supabase.co
- ✅ **Safe for testing and development**

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Deploy to Netlify** (create new dev site):
   ```bash
   netlify init
   ```

## 📁 Project Structure

This is a React + TypeScript application built with:
- ⚛️ React + Vite
- 🎨 Tailwind CSS
- 🗄️ Supabase (PostgreSQL)
- 💳 Airwallex payment integration
- 🚀 Netlify Functions
- 📊 Reddit upvote tracking system

## 🔧 Environment Variables

The `.env` file is already configured for the development database:
- `VITE_SUPABASE_URL`: Dev database URL
- `VITE_SUPABASE_ANON_KEY`: Dev database anon key
- `VITE_BUYUPVOTES_API_KEY`: BuyUpvotes API key

## ⚙️ Supabase Functions

Located in `/supabase/functions/`:
- `admin-adjust-balance`
- `admin-list-users`
- `admin-user-transactions`
- `airwallex-webhook`
- `create-airwallex-checkout`
- `create-checkout-session`
- `create-crypto-payment`
- `instant-signup`
- `nowpayments-webhook`
- `send-support-email`
- `stripe-webhook`

## 📝 Development Notes

- All changes should be made in this repository
- The database schema was cloned from production (schema only, no data)
- Test all features thoroughly before deploying to production
- Never commit sensitive API keys to the repository

## 🎯 Next Steps

See [DEV-SETUP.md](./DEV-SETUP.md) for detailed setup information.

---

**Built with ❤️ for Reddit upvote automation**

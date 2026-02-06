# Development Environment Setup

## Database Cloning Summary

Successfully cloned production database schema to development environment.

### Production (DO NOT TOUCH)
- **Repo**: `upvote-alchemy-order`
- **Database**: `kuuulgjkgyhgzkjyembj`
- **URL**: https://supabase.com/dashboard/project/kuuulgjkgyhgzkjyembj

### Development (Safe to modify)
- **Repo**: `upvote-alchemy-dev-app`
- **Database**: `cfadojgkbaahihrzdyws`
- **URL**: https://supabase.com/dashboard/project/cfadojgkbaahihrzdyws
- **Supabase URL**: https://cfadojgkbaahihrzdyws.supabase.co

## What Was Done

1. ✅ Installed Supabase CLI v2.75.0
2. ✅ Dumped production database schema (39KB, 1418 lines)
3. ✅ Created new development database project
4. ✅ Applied production schema to dev database via migration
5. ✅ Copied production code to `upvote-alchemy-dev-app`
6. ✅ Updated `.env` with dev database credentials
7. ✅ Updated `supabase/config.toml` with dev project ID

## Next Steps

1. Install dependencies:
   ```bash
   cd ~/repos/upvote-alchemy-dev-app
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Deploy to Netlify (create new site for dev):
   ```bash
   netlify init
   ```

## Important Notes

- **NEVER** modify files in `upvote-alchemy-order` - it's production!
- All development work should be done in `upvote-alchemy-dev-app`
- The dev database has the same schema as production but is isolated
- No production data was copied (schema only)

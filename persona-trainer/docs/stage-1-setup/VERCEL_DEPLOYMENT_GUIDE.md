# Vercel Deployment Guide - Persona Trainer

This guide will walk you through deploying the Persona Trainer application to Vercel.

## Overview

Persona Trainer is a React + TypeScript + Vite application with Supabase backend. Vercel is an excellent choice for hosting this type of application as it:
- Provides automatic deployments from Git
- Has built-in support for Vite applications
- Offers serverless functions (if needed in the future)
- Includes automatic HTTPS and CDN
- Provides preview deployments for each pull request

## Prerequisites

Before deploying, ensure you have:

1. **A Vercel account** - Sign up at [vercel.com](https://vercel.com)
2. **A GitHub/GitLab/Bitbucket account** - For connecting your repository
3. **Supabase project** - Your database and authentication backend
4. **Environment variables** - API keys for OpenAI and Supabase

## Pre-Deployment Checklist

### 1. Fix Build Errors

Before deploying, you need to fix the TypeScript build errors:

**Error 1**: `src/components/dashboard/MyTrainingScenarios.tsx:176`
- Issue: Incorrect use of `const` assertion
- Fix this line in the file

**Error 2**: `src/components/training/TrainingChatModal.tsx:449`
- Issue: `overallScore` property doesn't exist on `ScoringResult`
- Update the property name or the type definition

Run the build locally to ensure it passes:
```bash
npm run build
```

### 2. Environment Variables

You'll need to configure these environment variables in Vercel:

| Variable Name | Description | Where to Get It |
|--------------|-------------|-----------------|
| `VITE_OPENAI_API_KEY` | OpenAI API key for AI interactions | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | Supabase Dashboard → Settings → API |

**Important**: Vite requires environment variables to be prefixed with `VITE_` to be accessible in the browser.

### 3. Update .gitignore

Ensure your `.gitignore` includes:
```
# Environment variables
.env
.env.local
.env.production

# Build output
dist
.vercel

# Dependencies
node_modules
```

Never commit `.env` files with real API keys to version control.

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended for First Deploy)

1. **Push your code to Git**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import project to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize Vercel to access your repositories
   - Select the `TrainingSimulatorApp/persona-trainer` repository

3. **Configure project settings**
   - **Framework Preset**: Vercel should auto-detect "Vite"
   - **Root Directory**: Set to `persona-trainer` if your repo root is `TrainingSimulatorApp`
   - **Build Command**: `npm run build` (should be auto-detected)
   - **Output Directory**: `dist` (should be auto-detected)
   - **Install Command**: `npm install` (should be auto-detected)

4. **Add environment variables**
   - In the "Environment Variables" section, add:
     - `VITE_OPENAI_API_KEY`: Your OpenAI API key
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - Make sure they're available for Production, Preview, and Development

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project directory**
   ```bash
   cd /Users/ryecrowen/Documents/TrainingSimulator/TrainingSimulatorApp/persona-trainer
   vercel
   ```

4. **Follow the prompts**
   - Set up and deploy? Yes
   - Which scope? Select your account
   - Link to existing project? No (for first deploy)
   - Project name? (accept default or customize)
   - In which directory is your code located? `./`
   - Want to modify settings? Yes
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Development Command: `npm run dev`

5. **Add environment variables**
   ```bash
   vercel env add VITE_OPENAI_API_KEY
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

   For each variable, select the environment (Production, Preview, Development) and paste the value.

6. **Deploy to production**
   ```bash
   vercel --prod
   ```

## Post-Deployment Configuration

### 1. Configure Supabase Redirects

Update your Supabase project to allow redirects from your Vercel domain:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Site URL": `https://your-project-name.vercel.app`
3. Add to "Redirect URLs": `https://your-project-name.vercel.app/**`

### 2. Set Up Custom Domain (Optional)

1. In Vercel Dashboard → Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Update Supabase redirect URLs to include your custom domain

### 3. Configure CORS (If needed)

If you add any serverless functions later, you may need to configure CORS. Create a `vercel.json` in your project root:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" }
      ]
    }
  ]
}
```

## Continuous Deployment

Once set up, Vercel will automatically:

- **Deploy on every push to main** - Production deployment
- **Deploy preview for every PR** - Preview deployment with unique URL
- **Run build checks** - Fail deployment if build fails

### Branch Deployments

- **Main branch** → Production (`your-project.vercel.app`)
- **Other branches** → Preview deployments (`branch-name-your-project.vercel.app`)
- **Pull requests** → Preview deployments with unique URLs

## Monitoring and Maintenance

### View Deployment Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on any deployment to view:
   - Build logs
   - Function logs (if applicable)
   - Runtime logs
   - Performance metrics

### Environment Variable Management

To update environment variables:

1. **Via Dashboard**:
   - Project Settings → Environment Variables
   - Edit or add new variables
   - Redeploy to apply changes

2. **Via CLI**:
   ```bash
   vercel env ls                    # List all variables
   vercel env add VARIABLE_NAME     # Add new variable
   vercel env rm VARIABLE_NAME      # Remove variable
   ```

### Rollback Deployment

If a deployment has issues:

1. Go to Vercel Dashboard → Deployments
2. Find a previous working deployment
3. Click the three dots → "Promote to Production"

## Performance Optimization

### 1. Enable Compression

Vercel automatically enables Brotli and Gzip compression.

### 2. Optimize Build

In your `vite.config.ts`, consider adding:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    }
  }
})
```

### 3. Add Analytics (Optional)

Vercel provides built-in analytics:

1. Go to Project Settings → Analytics
2. Enable Vercel Analytics
3. Add the analytics component to your app (follow Vercel's guide)

## Troubleshooting

### Build Fails

**Error**: "Build failed with exit code 1"
- Check build logs in Vercel dashboard
- Ensure `npm run build` works locally
- Verify all dependencies are in `package.json`
- Check TypeScript errors

### Environment Variables Not Working

- Ensure variables are prefixed with `VITE_`
- Redeploy after adding/updating environment variables
- Check that variables are set for the correct environment (Production/Preview)

### Page Not Found (404)

For React Router apps, create `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Authentication Issues

- Verify Supabase URL configuration includes your Vercel domain
- Check that environment variables are correctly set
- Ensure CORS is configured if needed

## Cost Considerations

### Vercel Pricing (as of 2025)

- **Hobby (Free)**:
  - Unlimited deployments
  - 100GB bandwidth/month
  - 100 hours build time/month
  - Perfect for this project

- **Pro ($20/month)**:
  - Higher limits
  - Team collaboration features
  - Advanced analytics
  - Only needed for high-traffic or team environments

### Supabase Pricing

- **Free tier**: Up to 500MB database, 2GB bandwidth
- **Pro ($25/month)**: 8GB database, 250GB bandwidth
- Consider costs as user base grows

## Security Best Practices

1. **Never commit secrets** - Always use environment variables
2. **Use Supabase RLS** - Row Level Security policies are active in your DB
3. **Regular updates** - Keep dependencies updated
4. **Monitor logs** - Check Vercel logs regularly for errors
5. **Rate limiting** - Consider implementing on API routes if added

## Next Steps After Deployment

1. **Test thoroughly** - Check all features in production
2. **Set up monitoring** - Use Vercel Analytics or external tools
3. **Configure custom domain** - For professional appearance
4. **Set up staging environment** - Use Git branches for preview deployments
5. **Document for team** - Share access and procedures

## Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Vite Deployment Guide**: [vitejs.dev/guide/static-deploy](https://vitejs.dev/guide/static-deploy.html)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel Support**: Available via dashboard chat

## Summary

Deploying to Vercel requires:

1. Fix TypeScript build errors
2. Push code to Git repository
3. Import project to Vercel
4. Configure environment variables
5. Deploy and test
6. Update Supabase redirect URLs
7. Set up continuous deployment

Once configured, Vercel handles automatic deployments, HTTPS, CDN, and previews for a seamless development workflow.

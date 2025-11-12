# Railway Deployment Guide

This guide explains how to deploy the Node.js Backend template to Railway.

## Prerequisites

- Railway account ([sign up here](https://railway.app/))
- Railway CLI installed (optional, for local testing)

## One-Click Deployment

The easiest way to deploy this template:

1. **Click the Deploy button** in the README
2. **Sign in to Railway** if not already logged in
3. **Configure the deployment**:
   - Railway will automatically detect the configuration
   - Redis service will be provisioned automatically
   - Environment variables will be set up
4. **Deploy**: Click "Deploy" and wait for the build to complete
5. **Access your app**: Use the generated Railway URL

## Manual Deployment

If you want more control over the deployment:

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser for authentication.

### Step 3: Initialize Project

```bash
cd /path/to/your/project
railway init
```

Select "Create new project" or link to an existing one.

### Step 4: Add Redis Service

```bash
railway add
```

Select "Redis" from the list of available services.

### Step 5: Set Environment Variables

Railway will automatically set most variables, but you can verify:

```bash
railway variables
```

Required variables:
- `REDISHOST` - Automatically set to Redis service hostname
- `REDISPORT` - Automatically set to 6379
- `REDISUSER` - Set to "default"
- `REDISPASSWORD` - Automatically generated
- `PORT` - Set to 3000 (or Railway's default)
- `RAILWAY_STATIC_URL` - Automatically set to your public URL

### Step 6: Deploy

```bash
railway up
```

This will:
1. Build your application using nixpacks
2. Upload the build to Railway
3. Deploy to production
4. Generate a public URL

### Step 7: View Logs

```bash
railway logs
```

## Configuration Files

The template includes several configuration files for Railway:

### `railway.toml`

Main Railway configuration file specifying build and deploy commands.

```toml
[build]
builder = "nixpacks"
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
healthcheckPath = "/"
healthcheckTimeout = 10
```

### `nixpacks.toml`

Nixpacks-specific configuration for Node.js version and build process.

```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm start"
```

### `template.yaml`

Template configuration for Railway marketplace (for template creators).

## Environment Variables Reference

| Variable | Description | Source | Required |
|----------|-------------|--------|----------|
| `PORT` | Application port | Manual (default: 3000) | Yes |
| `NODE_ENV` | Node environment | Manual (default: production) | No |
| `REDISHOST` | Redis hostname | Railway (Redis service) | Yes |
| `REDISPORT` | Redis port | Railway (Redis service) | Yes |
| `REDISUSER` | Redis username | Manual (default: default) | Yes |
| `REDISPASSWORD` | Redis password | Railway (Redis service) | Yes |
| `RAILWAY_STATIC_URL` | Public URL | Railway (auto-generated) | Yes |

## Testing the Deployment

After deployment, test your application:

### 1. Check Health

```bash
curl https://your-app.railway.app/
```

You should see the Bull Board dashboard.

### 2. Add a Test Job

```bash
curl "https://your-app.railway.app/add-job?id=1&email=test@example.com"
```

Expected response:
```json
{"ok":true}
```

### 3. View the Dashboard

Open `https://your-app.railway.app/` in your browser to see the Bull Board UI with your queued jobs.

## Monitoring

### View Logs

In Railway dashboard:
1. Go to your project
2. Click on the "app" service
3. Click "Logs" tab

Or use CLI:
```bash
railway logs
```

### Metrics

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network traffic
- Request count

Access these in the Railway dashboard under the "Metrics" tab.

## Scaling

### Horizontal Scaling

Railway supports automatic horizontal scaling based on:
- CPU utilization
- Memory usage
- Custom metrics

Configure in `template.yaml`:

```yaml
settings:
  autoscaling:
    enabled: true
    targetCPUUtilization: 80
    minReplicas: 1
    maxReplicas: 10
```

### Vertical Scaling

Upgrade your Railway plan for more resources:
- Starter: 512MB RAM, 1 vCPU
- Developer: 8GB RAM, 8 vCPU
- Team: Custom limits

## Custom Domains

1. Go to your project settings in Railway
2. Click on the "app" service
3. Go to "Settings" → "Domains"
4. Click "Add Domain"
5. Enter your custom domain
6. Configure DNS records as instructed

## Troubleshooting

### Build Fails

**Problem**: Build fails with dependency errors

**Solution**:
- Check `package.json` for correct dependencies
- Ensure Node.js version is compatible (20+)
- Review build logs in Railway dashboard

### Redis Connection Errors

**Problem**: Application can't connect to Redis

**Solution**:
- Verify Redis service is running
- Check environment variables are set correctly
- Ensure `REDISHOST` points to the internal Railway hostname
- Use private networking (Railway automatically configures this)

### Application Crashes

**Problem**: App starts but crashes immediately

**Solution**:
- Check logs with `railway logs`
- Verify all required environment variables are set
- Ensure `dist/` directory is built correctly
- Test locally first

### Port Binding Issues

**Problem**: Application doesn't respond to requests

**Solution**:
- Ensure app listens on `0.0.0.0:${PORT}`
- Check `PORT` environment variable is set
- Verify Railway assigned a port (usually 3000)

## Production Checklist

Before going to production:

- [ ] Enable Redis persistence
- [ ] Set up monitoring and alerts
- [ ] Configure custom domain
- [ ] Set up backup strategy
- [ ] Review security settings
- [ ] Configure rate limiting
- [ ] Set appropriate timeouts
- [ ] Enable logging aggregation
- [ ] Test failover scenarios
- [ ] Document runbooks

## Advanced Configuration

### Custom Build Command

Override the default build in `railway.toml`:

```toml
[build]
buildCommand = "npm ci && npm run build && npm prune --production"
```

### Multiple Environments

Create separate Railway projects for:
- Development
- Staging
- Production

Link them using:
```bash
railway link <project-id>
railway environment <env-name>
```

### Private Networking

Railway automatically enables private networking between services. Use internal hostnames:

```env
REDISHOST=redis.railway.internal
```

### Health Checks

Configure custom health checks:

```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 10
```

Then add a health endpoint in your app:

```typescript
server.get('/health', async () => {
  return { status: 'healthy', timestamp: Date.now() };
});
```

## Cost Optimization

- Use Starter plan for development ($5/month)
- Enable autoscaling to scale down during low traffic
- Set appropriate resource limits
- Monitor usage in Railway dashboard
- Use Redis persistence to avoid data loss

## Support

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [GitHub Issues](https://github.com/railwayapp-templates/fastify-bullmq/issues)
- [Template Documentation](./TEMPLATE.md)

## Additional Resources

- [Nixpacks Documentation](https://nixpacks.com/)
- [Fastify Deployment](https://fastify.dev/docs/latest/Guides/Deployment/)
- [BullMQ Production Tips](https://docs.bullmq.io/guide/going-to-production)
- [Redis Best Practices](https://redis.io/topics/admin)

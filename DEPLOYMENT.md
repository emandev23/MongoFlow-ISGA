# Deployment Guide

This guide explains how to deploy MongoFlow to the internet and connect it to MongoDB.

## ⚠️ Important: Local MongoDB Won't Work

**Your local MongoDB server (`mongodb://localhost:27017`) is NOT accessible from the internet.** When you deploy your app to services like Vercel, Netlify, or any cloud platform, it cannot connect to your local machine.

## 🎯 Solution: Use MongoDB Atlas (Recommended)

MongoDB Atlas is MongoDB's cloud service that provides:
- ✅ Free tier (512MB storage)
- ✅ Accessible from anywhere
- ✅ Automatic backups
- ✅ Easy scaling
- ✅ Secure by default

### Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (choose the FREE tier)
4. Wait for cluster to be created (~5 minutes)

### Step 2: Configure Network Access

1. In Atlas dashboard, go to **Network Access**
2. Click **Add IP Address**
3. For development: Click **Allow Access from Anywhere** (adds `0.0.0.0/0`)
   - ⚠️ For production, add only your deployment platform's IPs
4. Click **Confirm**

### Step 3: Create Database User

1. Go to **Database Access**
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Create username and password (save these!)
5. Set user privileges: **Atlas admin** (or custom)
6. Click **Add User**

### Step 4: Get Connection String

1. Go to **Clusters** → Click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your database user credentials
5. Add your database name at the end:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/your-database-name?retryWrites=true&w=majority
   ```

## 🚀 Deploy to Vercel (Recommended)

Vercel is the easiest way to deploy Next.js apps.

### Step 1: Prepare Your Code

1. Make sure your code is pushed to GitHub
2. Your `.env.local` should NOT be committed (it's in `.gitignore`)

### Step 2: Deploy to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click **Add New Project**
4. Import your `MongoFlow-ISGA` repository
5. Configure environment variables:
   - **GEMINI_API_KEY**: Your Gemini API key
   - **MONGODB_URI** (optional): Your Atlas connection string (or users can enter it in the app)
6. Click **Deploy**

### Step 3: Configure Environment Variables in Vercel

1. Go to your project settings → **Environment Variables**
2. Add:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Optionally add default MongoDB connection:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database?retryWrites=true&w=majority
   ```

### Step 4: Update Your App (Optional)

You can modify the app to use `MONGODB_URI` from environment variables as a default:

```typescript
// In DatabaseConnection.tsx or wherever you handle connection
const defaultConnectionString = process.env.NEXT_PUBLIC_MONGODB_URI || '';
```

**Note:** For client-side access, use `NEXT_PUBLIC_` prefix. For server-side only, use without prefix.

## 🌐 Alternative Deployment Options

### Option 1: Netlify

1. Go to [https://netlify.com](https://netlify.com)
2. Connect GitHub repository
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables in site settings

### Option 2: Railway

1. Go to [https://railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy!

### Option 3: Self-Hosted Server

If you want to host on your own server:

1. **Deploy MongoDB on a VPS:**
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install -y mongodb
   sudo systemctl start mongodb
   ```

2. **Configure MongoDB for remote access:**
   - Edit `/etc/mongod.conf`
   - Set `bindIp: 0.0.0.0` (or your server's IP)
   - Restart MongoDB: `sudo systemctl restart mongodb`

3. **Set up firewall:**
   ```bash
   sudo ufw allow 27017/tcp
   ```

4. **Deploy your Next.js app:**
   ```bash
   npm install
   npm run build
   npm start
   ```

## 🔒 Security Best Practices

### For Production:

1. **MongoDB Atlas:**
   - ✅ Use IP whitelist (only allow your deployment platform IPs)
   - ✅ Use strong passwords
   - ✅ Enable encryption at rest
   - ✅ Regular backups

2. **Connection Strings:**
   - ❌ Never commit connection strings to Git
   - ✅ Use environment variables
   - ✅ Rotate passwords regularly
   - ✅ Use different users for dev/prod

3. **API Keys:**
   - ✅ Keep Gemini API key in environment variables
   - ✅ Monitor API usage
   - ✅ Set usage limits if possible

## 📝 Environment Variables Setup

### For Vercel/Netlify:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key

# Optional (default connection string)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

### For Local Development:

Create `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key
MONGODB_URI=mongodb://localhost:27017  # or your Atlas connection
```

## 🔄 Updating Your App for Production

### Option 1: Let Users Enter Connection String (Current)

Your app already allows users to enter connection strings, so this works as-is!

### Option 2: Use Environment Variable as Default

Modify `components/DatabaseConnection.tsx`:

```typescript
const defaultConnection = process.env.NEXT_PUBLIC_MONGODB_URI || '';
```

Then users can either:
- Use the default (if you set `NEXT_PUBLIC_MONGODB_URI`)
- Enter their own connection string

## ✅ Quick Deployment Checklist

- [ ] MongoDB Atlas account created
- [ ] Cluster created and running
- [ ] Network access configured (IP whitelist)
- [ ] Database user created
- [ ] Connection string copied
- [ ] Code pushed to GitHub
- [ ] Vercel/Netlify account created
- [ ] Environment variables configured
- [ ] App deployed successfully
- [ ] Tested connection from deployed app

## 🆘 Troubleshooting

### "Cannot connect to MongoDB"

1. Check network access in Atlas (IP whitelist)
2. Verify connection string format
3. Check username/password
4. Ensure database name is correct

### "Environment variable not found"

1. Check variable name (case-sensitive)
2. For client-side: use `NEXT_PUBLIC_` prefix
3. Redeploy after adding variables

### "API key invalid"

1. Verify Gemini API key is correct
2. Check API key has proper permissions
3. Ensure key is set in environment variables

## 📚 Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [MongoDB Connection String Guide](https://docs.mongodb.com/manual/reference/connection-string/)

## 🎯 Recommended Setup for Production

1. **MongoDB Atlas** (Free tier is perfect for small projects)
2. **Vercel** (Best for Next.js, free tier available)
3. **Environment Variables** for all secrets
4. **IP Whitelisting** in Atlas for security
5. **Regular Backups** (Atlas provides this)

---

**Your app is ready to deploy!** Just set up MongoDB Atlas and deploy to Vercel. 🚀


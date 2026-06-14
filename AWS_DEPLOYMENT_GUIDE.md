# 🚀 AWS Deployment Guide for Beginners
## AI Growth Manager Full Stack

---

## 📋 WHAT YOU'LL DO (Simple Version)

Think of AWS like **renting a computer in the cloud**:
- **EC2** = Your computer (runs Node.js backend)
- **RDS** = Database computer (runs PostgreSQL)
- **CloudFront** = Fast delivery of frontend
- **Route 53** = Domain management (optional)

---

## STEP 1: CREATE AWS ACCOUNT (5 min)

1. Go to https://aws.amazon.com
2. Click "Create an AWS Account"
3. Enter email, password, card (FREE tier for 12 months)
4. Verify email
5. Done! ✅

**What is FREE tier?**
- EC2: 750 hours/month free
- RDS: 750 hours/month free
- S3: 5GB storage free
- Perfect for your app!

---

## STEP 2: CREATE BACKEND SERVER (EC2) (10 min)

### What is EC2?
It's a virtual computer in the cloud that runs your Node.js app.

### How to create:

**2.1 Go to EC2 Dashboard**
- AWS Console → Search "EC2" → Click "EC2"
- Click "Launch Instances"

**2.2 Choose Configuration**
- Name: `ai-growth-backend`
- OS: `Ubuntu 22.04 LTS` (free tier eligible ✅)
- Instance type: `t2.micro` (free tier ✅)
- Key pair: Create new
  - Name: `ai-growth-key`
  - Format: `.pem`
  - Download & save safely! (you need this to login)
- Security group: Allow ports
  - Port 22 (SSH - to login)
  - Port 3001 (Your backend port)
  - Port 80, 443 (HTTP/HTTPS)

**2.3 Launch**
- Review settings
- Click "Launch Instance"
- Wait 2-3 minutes...
- Status: "Running" ✅

---

## STEP 3: CREATE DATABASE (RDS) (10 min)

### What is RDS?
It's a managed database server. AWS handles backups & maintenance.

### How to create:

**3.1 Go to RDS Dashboard**
- AWS Console → Search "RDS" → Click "RDS"
- Click "Create database"

**3.2 Choose Configuration**
- Engine: `PostgreSQL`
- Version: `15.x` (latest stable)
- Template: `Free tier`
- DB instance identifier: `ai-growth-db`
- Master username: `admin`
- Master password: `YourStrongPassword123!` (save this!)
- Storage: `20 GB` (free tier)
- Public accessibility: `Yes` (so backend can connect)

**3.3 Create**
- Click "Create database"
- Wait 5-10 minutes...
- Status: "Available" ✅
- Copy: **Endpoint** (you'll need this)

**Example endpoint**: `ai-growth-db.cvhs3jkd.us-east-1.rds.amazonaws.com`

---

## STEP 4: CONNECT TO EC2 & DEPLOY BACKEND (15 min)

### What you'll do:
1. Login to your EC2 computer
2. Upload your code
3. Install Node.js
4. Start your backend

### How:

**4.1 Connect via SSH (Terminal)**

On Windows (PowerShell):
```powershell
# Navigate to where you saved ai-growth-key.pem
cd C:\Users\YourName\Downloads

# Connect to EC2
ssh -i ai-growth-key.pem ubuntu@YOUR-EC2-PUBLIC-IP
```

Find YOUR-EC2-PUBLIC-IP:
- EC2 Dashboard → Instances → Your instance
- Look for "Public IPv4 address" (example: `54.123.45.67`)

**4.2 Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Verify
```

**4.3 Upload Your Backend Code**

On your LOCAL machine (PowerShell):
```powershell
scp -i ai-growth-key.pem -r "E:\AI Growth Manager\backend" ubuntu@YOUR-EC2-PUBLIC-IP:~/app
```

**4.4 Install Dependencies & Start**
```bash
cd ~/app/backend
npm install
```

**4.5 Create Production .env File**
```bash
nano .env
```

Paste this (replace with YOUR values):
```
NODE_ENV=production
PORT=3001

# Database (from RDS)
DATABASE_URL=postgresql://admin:YourPassword@ai-growth-db.cvhs3jkd.us-east-1.rds.amazonaws.com:5432/ai_growth

# Redis (use local or ElastiCache)
REDIS_URL=redis://localhost:6379

# Shopify (from your app)
SHOPIFY_API_KEY=your_key_here
SHOPIFY_API_SECRET=your_secret_here

# OpenAI
OPENAI_API_KEY=sk-your-key

# JWT
JWT_SECRET=your_random_secret_here

# CORS
CORS_ORIGIN=http://54.123.45.67:3000
```

Press: `Ctrl+X` → `Y` → `Enter`

**4.6 Start Backend**
```bash
npm start
```

You should see:
```
[INFO] AI Growth Manager server running
[INFO] port: 3001
[INFO] env: "production"
```

✅ **Backend running!** Keep this terminal open.

---

## STEP 5: DEPLOY FRONTEND (10 min)

### Option A: Use EC2 (Simple)

**5.1 On your LOCAL machine, build frontend:**
```powershell
cd "E:\AI Growth Manager\frontend"
npm run build
```

Creates `dist` folder with optimized files.

**5.2 Upload to EC2:**
```powershell
scp -i ai-growth-key.pem -r "E:\AI Growth Manager\frontend\dist" ubuntu@YOUR-EC2-PUBLIC-IP:~/app/frontend
```

**5.3 Install & Start Simple Server**
```bash
# SSH into EC2
ssh -i ai-growth-key.pem ubuntu@YOUR-EC2-PUBLIC-IP

# Install http-server
npm install -g http-server

# Start frontend on port 3000
cd ~/app/frontend/dist
http-server -p 3000
```

✅ **Frontend running on port 3000!**

### Option B: Use AWS S3 + CloudFront (Better)
- Upload frontend to S3 bucket
- Use CloudFront for fast delivery
- (More complex, skip if beginner)

---

## STEP 6: DATABASE MIGRATION (5 min)

### Copy your current database to AWS RDS:

**6.1 Backup current database:**
```bash
pg_dump -U postgres ai_growth > backup.sql
```

**6.2 Restore to AWS RDS:**
```bash
psql -h ai-growth-db.cvhs3jkd.us-east-1.rds.amazonaws.com -U admin -d ai_growth < backup.sql
```

Enter RDS password when prompted.

✅ **Database migrated!**

---

## STEP 7: GET A FREE DOMAIN (Optional but Recommended)

### Option 1: Use EC2 IP directly
- Backend: `http://54.123.45.67:3001`
- Frontend: `http://54.123.45.67:3000`

### Option 2: Get Free Domain
1. Go to https://www.freenom.com
2. Search domain (example: `aigrowthmanager.tk`)
3. Register FREE for 1 year
4. Point to EC2 IP using nameservers

### Option 3: Buy Domain ($5/year)
1. GoDaddy, Namecheap, Route53
2. Point DNS to EC2 IP

---

## STEP 8: SHOPIFY CONFIGURATION

### Update Shopify App Settings:

**8.1 Go to Shopify App Dashboard**
- https://shopify.dev/apps
- Your app → Settings

**8.2 Update URLs**

| Setting | Value |
|---------|-------|
| App URL | `http://54.123.45.67:3000` (or your domain) |
| Redirect URL | `http://54.123.45.67:3001/auth/shopify/callback` |
| Webhook URL | `http://54.123.45.67:3001/webhooks/shopify` |

**8.3 Reinstall App**
- Uninstall from your Shopify store
- Reinstall with new URLs

✅ **Shopify connected!**

---

## STEP 9: VERIFY EVERYTHING WORKS

### Test Backend:
```
GET http://54.123.45.67:3001/api/health
Expected: 200 OK
```

### Test Frontend:
```
Open http://54.123.45.67:3000
Expected: Login page loads
```

### Test Full Flow:
1. Login to app
2. Connect Shopify store
3. Create product
4. Analyze prices
5. Send email
6. Check Shopify for changes

✅ **All working!**

---

## 💰 ESTIMATED AWS COSTS

| Service | Free Tier | After Free |
|---------|-----------|-----------|
| EC2 | $0 (750 hrs) | ~$7-15/month |
| RDS | $0 (750 hrs) | ~$10-20/month |
| Data transfer | $0 (15GB) | ~$0.09/GB |
| **TOTAL** | **$0** | **~$20-40/month** |

---

## ⚠️ IMPORTANT SECURITY NOTES

1. **Save your .pem key safely** - You can't recover it!
2. **Use strong passwords** - Database, Shopify, etc.
3. **Enable backups** - RDS does this automatically
4. **Restrict security groups** - Only allow needed ports
5. **Monitor costs** - Set up AWS billing alerts

---

## 🆘 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Can't SSH | Check security group allows port 22 |
| Backend won't start | Check `.env` variables |
| Database connection fails | Check RDS endpoint & password |
| Frontend won't load | Check CORS settings in backend |
| Shopify won't connect | Verify callback URL matches |

---

## ✅ CHECKLIST TO COMPLETE

- [ ] AWS Account created
- [ ] EC2 instance running
- [ ] RDS database created
- [ ] Backend deployed & running
- [ ] Frontend deployed & running
- [ ] Database migrated
- [ ] Domain configured (or using IP)
- [ ] Shopify app reinstalled
- [ ] All features tested

**Estimated Total Time: 1-2 hours**

---

**Ready to deploy? Start with Step 1!** 🚀

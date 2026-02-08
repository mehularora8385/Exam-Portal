# AWS Deployment Guide - Examination Portal

A step-by-step beginner guide to deploy your Examination Portal on AWS.

---

## Prerequisites

Before starting, you need:
1. **AWS Account** - Sign up at https://aws.amazon.com (free tier available)
2. **Credit/Debit Card** - Required for AWS account verification
3. **Domain Name** (optional) - For custom URL like examportal.com

---

## Overview: What We'll Set Up

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                           │
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   Route 53  │────▶│    ALB      │────▶│   EC2       │   │
│  │   (Domain)  │     │(Load Balancer)    │  (Server)   │   │
│  └─────────────┘     └─────────────┘     └──────┬──────┘   │
│                                                  │          │
│  ┌─────────────┐                         ┌──────▼──────┐   │
│  │     S3      │                         │    RDS      │   │
│  │  (Images)   │                         │ (Database)  │   │
│  └─────────────┘                         └─────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## PART 1: Download Your Code from Replit

### Step 1.1: Export Project
1. In Replit, click the **three dots (⋯)** menu in the Files panel
2. Click **"Download as zip"**
3. Save the zip file to your computer
4. Extract the zip file

---

## PART 2: Set Up AWS Database (RDS)

### Step 2.1: Create PostgreSQL Database

1. **Log into AWS Console**: https://console.aws.amazon.com
2. **Search for "RDS"** in the search bar and click it
3. Click **"Create database"**

4. **Choose settings**:
   - Engine: **PostgreSQL**
   - Version: **PostgreSQL 15** (or latest)
   - Templates: **Free tier** (for testing) or **Production**
   
5. **Settings**:
   - DB instance identifier: `examportal-db`
   - Master username: `examadmin`
   - Master password: Choose a strong password (SAVE THIS!)

6. **Instance configuration**:
   - DB instance class: `db.t3.micro` (free tier)

7. **Connectivity**:
   - Public access: **Yes** (for initial setup)
   - VPC security group: Create new → name it `examportal-db-sg`

8. **Additional configuration**:
   - Initial database name: `examportal`

9. Click **"Create database"** (takes 5-10 minutes)

### Step 2.2: Configure Security Group

1. Once database is created, click on it
2. Click the **VPC security group** link
3. Edit **Inbound rules** → Add rule:
   - Type: **PostgreSQL**
   - Source: **Anywhere** (0.0.0.0/0) - for testing only
4. Save rules

### Step 2.3: Note Your Database Details

From the RDS dashboard, note these values:
```
Endpoint: examportal-db.xxxxx.region.rds.amazonaws.com
Port: 5432
Username: examadmin
Password: (the one you set)
Database: examportal
```

Your DATABASE_URL will be:
```
postgresql://examadmin:YOUR_PASSWORD@your-endpoint:5432/examportal
```

---

## PART 3: Set Up Storage (S3)

### Step 3.1: Create S3 Bucket

1. Search for **"S3"** in AWS Console
2. Click **"Create bucket"**
3. **Settings**:
   - Bucket name: `examportal-assets-yourname` (must be globally unique)
   - Region: Same as your database
   - Uncheck **"Block all public access"**
   - Check the acknowledgment box
4. Click **"Create bucket"**

### Step 3.2: Configure Bucket for Public Access

1. Click on your bucket
2. Go to **"Permissions"** tab
3. Edit **"Bucket policy"** and paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::examportal-assets-yourname/*"
        }
    ]
}
```
(Replace `examportal-assets-yourname` with your bucket name)

4. Save changes

### Step 3.3: Upload Your Logo and Images

1. Click **"Upload"**
2. Add your logo.png and background.jpg files
3. Click **"Upload"**
4. Click on each file to get its **Object URL** (like `https://examportal-assets-yourname.s3.amazonaws.com/logo.png`)

---

## PART 4: Create EC2 Server

### Step 4.1: Launch EC2 Instance

1. Search for **"EC2"** in AWS Console
2. Click **"Launch instance"**

3. **Configure**:
   - Name: `examportal-server`
   - AMI: **Amazon Linux 2023** (free tier eligible)
   - Instance type: `t2.micro` (free tier) or `t2.small`
   - Key pair: **Create new key pair**
     - Name: `examportal-key`
     - Type: RSA
     - Format: .pem
     - Download and SAVE this file securely!

4. **Network settings** → Edit:
   - Auto-assign public IP: **Enable**
   - Security group: Create new
     - Name: `examportal-server-sg`
     - Add rules:
       - SSH (port 22) - Source: My IP
       - HTTP (port 80) - Source: Anywhere
       - HTTPS (port 443) - Source: Anywhere
       - Custom TCP (port 5000) - Source: Anywhere

5. **Configure storage**: 20 GB (or more)

6. Click **"Launch instance"**

### Step 4.2: Connect to Your Server

**On Windows** (using PuTTY):
1. Download PuTTY: https://www.putty.org
2. Convert .pem to .ppk using PuTTYgen
3. Open PuTTY, enter your EC2 Public IP
4. Go to Connection → SSH → Auth → Credentials
5. Browse to your .ppk file
6. Click Open, login as `ec2-user`

**On Mac/Linux**:
```bash
chmod 400 examportal-key.pem
ssh -i examportal-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### Step 4.3: Install Node.js on Server

Run these commands on your EC2 server:

```bash
# Update system
sudo yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (keeps your app running)
sudo npm install -g pm2

# Install Git
sudo yum install -y git
```

---

## PART 5: Deploy Your Application

### Step 5.1: Upload Your Code

**Option A: Using Git (Recommended)**

If your code is on GitHub:
```bash
cd ~
git clone https://github.com/yourusername/yourrepo.git examportal
cd examportal
```

**Option B: Using SCP (from your computer)**

On your local machine:
```bash
scp -i examportal-key.pem -r /path/to/your/project ec2-user@YOUR_EC2_IP:~/examportal
```

### Step 5.2: Set Environment Variables

Create a `.env` file on the server:

```bash
cd ~/examportal
nano .env
```

Add these lines (replace with YOUR values):

```
DATABASE_URL=postgresql://examadmin:YOUR_PASSWORD@your-rds-endpoint:5432/examportal
SESSION_SECRET=your-super-secret-random-string-here-make-it-long
NODE_ENV=production
PORT=5000
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### Step 5.3: Install Dependencies and Build

```bash
cd ~/examportal

# Install dependencies
npm install

# Build the application
npm run build

# Set up the database tables
npm run db:push
```

### Step 5.4: Start the Application

```bash
# Start with PM2 (keeps running after you disconnect)
pm2 start npm --name "examportal" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Run the command it gives you
```

### Step 5.5: Verify It's Running

```bash
pm2 status
pm2 logs examportal
```

Your app should now be running! Visit:
```
http://YOUR_EC2_PUBLIC_IP:5000
```

---

## PART 6: Set Up Domain & HTTPS (Optional but Recommended)

### Step 6.1: Get a Domain (if you don't have one)

1. Search for **"Route 53"** in AWS
2. Click **"Register domain"**
3. Search for your desired domain name
4. Complete purchase

### Step 6.2: Get SSL Certificate

1. Search for **"Certificate Manager"** in AWS
2. Click **"Request certificate"**
3. Choose **"Request a public certificate"**
4. Domain name: `examportal.com` and `*.examportal.com`
5. Validation: **DNS validation**
6. Click **"Request"**
7. Click on the certificate → **"Create records in Route 53"**
8. Wait for status to become **"Issued"** (can take 30 minutes)

### Step 6.3: Create Load Balancer

1. Go to EC2 → **"Load Balancers"**
2. Click **"Create Load Balancer"**
3. Choose **"Application Load Balancer"**
4. Name: `examportal-alb`
5. Scheme: **Internet-facing**
6. Listeners:
   - HTTP (80)
   - HTTPS (443) - select your certificate
7. Availability Zones: Select at least 2
8. Security group: Allow HTTP and HTTPS from anywhere
9. Target group:
   - Name: `examportal-targets`
   - Port: 5000
   - Register your EC2 instance
10. Create load balancer

### Step 6.4: Point Domain to Load Balancer

1. Go to **Route 53** → Your hosted zone
2. Create record:
   - Record type: **A**
   - Alias: **Yes**
   - Route traffic to: **Application Load Balancer**
   - Select your load balancer
3. Create another for `www`:
   - Record name: `www`
   - Same settings as above

---

## PART 7: Configure Your Portal

### Step 7.1: Update Admin Settings

1. Visit your portal: `https://examportal.com` (or your domain)
2. Login as admin:
   - Email: `admin@portal.gov.in`
   - Password: `admin123`
3. Go to **Admin → Site Settings**
4. Add your S3 image URLs:
   - Logo URL: `https://examportal-assets-yourname.s3.amazonaws.com/logo.png`
   - Hero Background: `https://examportal-assets-yourname.s3.amazonaws.com/hero-bg.jpg`
5. Save settings

### Step 7.2: Change Admin Password!

**IMPORTANT**: Change the default admin password immediately after deployment!

---

## Troubleshooting

### App not starting?
```bash
pm2 logs examportal --lines 100
```

### Database connection failed?
- Check RDS security group allows your EC2's IP
- Verify DATABASE_URL is correct
- Test connection: `psql $DATABASE_URL`

### Can't connect to EC2?
- Check EC2 security group has SSH enabled for your IP
- Verify you're using the correct .pem file
- Make sure EC2 instance is running

### Website not loading?
- Check if app is running: `pm2 status`
- Check port 5000 is open in security group
- Try: `curl http://localhost:5000`

---

## Monthly Cost Estimate (AWS)

| Service | Specification | Cost/Month |
|---------|--------------|------------|
| EC2 | t2.micro (free tier) | ₹0-₹850 |
| RDS | db.t3.micro | ₹1,250-₹2,100 |
| S3 | 1GB storage | ₹2.50 |
| Route 53 | 1 domain | ₹42 |
| Load Balancer | ALB | ₹1,350-₹2,100 |
| **Total** | | **₹2,500-₹5,000/month** |

*Free tier eligible for first 12 months on EC2 and RDS*

---

## Quick Commands Reference

```bash
# Check app status
pm2 status

# View logs
pm2 logs examportal

# Restart app
pm2 restart examportal

# Stop app
pm2 stop examportal

# Update app (after uploading new code)
cd ~/examportal
git pull  # if using git
npm install
npm run build
pm2 restart examportal
```

---

## Security Checklist Before Going Live

- [ ] Change default admin password
- [ ] Set strong SESSION_SECRET
- [ ] RDS not publicly accessible (use VPC)
- [ ] EC2 SSH restricted to your IP only
- [ ] HTTPS enabled with valid certificate
- [ ] Regular database backups enabled

---

## Need Help?

If you get stuck:
1. Check AWS documentation: https://docs.aws.amazon.com
2. Search the error message on Google
3. AWS has free support for basic questions

Good luck with your deployment!

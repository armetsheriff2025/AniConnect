# 🚀 AniConnect Enhanced - Complete Setup Guide

This guide will walk you through setting up and running AniConnect Enhanced from scratch.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [First Run](#first-run)
4. [Configuration](#configuration)
5. [Using the Application](#using-the-application)
6. [Troubleshooting](#troubleshooting)
7. [Deployment](#deployment)

---

## 🖥️ System Requirements

### Minimum Requirements:
- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 14.0.0 or higher
- **RAM**: 512 MB available
- **Disk Space**: 100 MB free space
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

### Recommended:
- **Node.js**: Version 18.0.0 or higher
- **RAM**: 1 GB available
- **Internet**: Stable connection for real-time features

---

## 📦 Installation Steps

### Step 1: Install Node.js

If you don't have Node.js installed:

**Windows/macOS:**
1. Visit https://nodejs.org/
2. Download the LTS version
3. Run the installer
4. Follow the installation wizard

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm
```

**Verify installation:**
```bash
node --version  # Should show v14.0.0 or higher
npm --version   # Should show v6.0.0 or higher
```

### Step 2: Extract Project Files

1. Extract the AniConnect Enhanced files to a folder
2. Open terminal/command prompt in that folder

**Example locations:**
- Windows: `C:\Users\YourName\AniConnect`
- macOS/Linux: `~/AniConnect`

### Step 3: Install Dependencies

```bash
npm install
```

This will install:
- Express.js (web server)
- Socket.IO (real-time communication)
- Nodemon (development tool)

**Wait for installation to complete** (usually 1-2 minutes)

You should see:
```
added X packages in Xs
```

---

## 🎬 First Run

### Start the Server

**Production mode:**
```bash
npm start
```

**Development mode (auto-restart on changes):**
```bash
npm run dev
```

### Expected Output:
```
🚀 AniConnect Enhanced Server running on port 3000
📱 Open http://localhost:3000 in your browser
💫 Features: Real-time chat, DMs, Voice, Reactions, Polls, Leveling, Moderation
```

### Access the Application:

1. Open your web browser
2. Navigate to: `http://localhost:3000`
3. You should see the AniConnect login screen!

---

## ⚙️ Configuration

### Change the Port

If port 3000 is already in use:

**Edit `server.js`:**
```javascript
const PORT = process.env.PORT || 3000;  // Change 3000 to your desired port
```

Or set environment variable:
```bash
# Windows
set PORT=8080
npm start

# macOS/Linux
PORT=8080 npm start
```

### Customize Moderator Credentials

**Edit `app.js` (around line 22-24):**
```javascript
const MOD_EMAIL = 'your-email@example.com';
const MOD_PASS = 'your-secure-password';
```

**⚠️ Important**: Change these before deploying to production!

### Add/Remove Channels

**Edit `server.js` (data.channels array):**
```javascript
data.channels = [
    { id: 'general', name: 'general', icon: '💬', desc: 'General discussion', category: 'text' },
    // Add your channels here
    { id: 'yourchanel', name: 'Your Channel', icon: '🎮', desc: 'Your description', category: 'text' }
];
```

### Customize Theme

**Edit `style.css` (around line 10-26):**
```css
:root {
    --primary: #ff006e;      /* Change main pink color */
    --secondary: #00f5ff;    /* Change cyan color */
    --accent: #8338ec;       /* Change purple color */
    /* ... etc */
}
```

---

## 🎮 Using the Application

### First Login

1. **Quick Start**: Click any social login button (Google, Discord, etc.)
   - No actual OAuth needed - it generates a random username
   - Perfect for testing!

2. **Email Login**: Click "Continue with Email"
   - Enter any email and password
   - Click "Sign In"

3. **Moderator Login**: Click "🛡️ Moderator Access"
   - Use configured credentials
   - Get full moderation powers

### Basic Features Tour

**1. Send Your First Message:**
- Type in the bottom input box
- Press Enter or click the → button

**2. Switch Channels:**
- Click any channel in the sidebar
- Try: #recommendations, #fanart, #cosplay

**3. React to Messages:**
- Hover over any message
- Click the 😊 button
- Choose an emoji

**4. Send a Direct Message:**
- Click the 📨 tab in sidebar
- Click "DM" next to any online user
- Start chatting privately

**5. Check Your Profile:**
- Click the 👤 tab
- See your level, XP, and message count
- View the leaderboard

**6. Create a Poll (as mod):**
- Click the 📊 button in the input area
- Enter your question
- Add options (comma separated)
- Set duration

**7. Join Voice Channel:**
- Click the 🔊 tab
- Click any voice room to join
- (Note: Actual voice needs WebRTC implementation)

---

## 🔧 Troubleshooting

### Problem: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find what's using port 3000
# Windows:
netstat -ano | findstr :3000

# macOS/Linux:
lsof -i :3000

# Kill the process or use a different port
PORT=8080 npm start
```

### Problem: Cannot Find Module

**Error:** `Cannot find module 'express'` or `'socket.io'`

**Solution:**
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Problem: Browser Shows "Can't Connect"

**Check:**
1. Server is running (terminal shows "Server running")
2. Correct URL: `http://localhost:3000`
3. Firewall isn't blocking port 3000
4. No typos in the URL

**Solution:**
```bash
# Restart the server
Ctrl+C  # Stop server
npm start  # Start again
```

### Problem: Messages Not Sending

**Check:**
1. You're logged in
2. Internet connection is stable
3. Browser console for errors (F12)

**Solution:**
```bash
# Clear browser cache
# Or try in incognito/private mode
```

### Problem: Mod Features Not Working

**Check:**
1. You logged in with correct moderator credentials
2. Credentials match those in `app.js`

### Problem: Images Not Uploading

**Check:**
1. Image is less than 5MB
2. File is actually an image (JPG, PNG, GIF, etc.)
3. Browser supports FileReader API

---

## 🌍 Deployment

### Deploy to Heroku (Free)

1. **Install Heroku CLI**
   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create Heroku App**
   ```bash
   heroku create your-anicurrent-app
   ```

4. **Deploy**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku master
   ```

5. **Open App**
   ```bash
   heroku open
   ```

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. Follow the prompts

### Deploy to Your Own Server

1. **Copy files to server**
   ```bash
   scp -r * user@yourserver.com:/path/to/app/
   ```

2. **SSH into server**
   ```bash
   ssh user@yourserver.com
   cd /path/to/app/
   ```

3. **Install PM2 (process manager)**
   ```bash
   npm install -g pm2
   ```

4. **Start app with PM2**
   ```bash
   pm2 start server.js --name anicurrent
   pm2 save
   pm2 startup  # Follow instructions
   ```

5. **Setup Nginx reverse proxy** (optional)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 📊 Database Integration (Optional)

For production use, replace in-memory storage with a database:

### Using MongoDB

1. **Install Mongoose**
   ```bash
   npm install mongoose
   ```

2. **Connect in server.js**
   ```javascript
   const mongoose = require('mongoose');
   mongoose.connect('your-mongodb-url');
   ```

3. **Create Models**
   ```javascript
   const MessageSchema = new mongoose.Schema({
       author: String,
       content: String,
       timestamp: Date,
       channel: String
   });
   const Message = mongoose.model('Message', MessageSchema);
   ```

4. **Replace in-memory operations**
   ```javascript
   // Instead of: data.messages[channel].push(message)
   await Message.create(message);
   
   // Instead of: socket.emit('load_messages', data.messages[channel])
   const messages = await Message.find({ channel });
   socket.emit('load_messages', messages);
   ```

---

## 🔒 Security Considerations

Before deploying to production:

1. **Change Moderator Credentials**
   - Use strong, unique passwords
   - Store in environment variables

2. **Add Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

3. **Enable CORS Properly**
   - Don't use `origin: "*"` in production
   - Specify your domain

4. **Use HTTPS**
   - Get SSL certificate (Let's Encrypt is free)
   - Configure HTTPS in Express

5. **Sanitize User Input**
   - Already partially implemented
   - Consider additional XSS protection

6. **Set Up Authentication**
   - Implement proper OAuth if using social logins
   - Add session management

---

## 📈 Performance Tips

1. **Enable Compression**
   ```bash
   npm install compression
   ```
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

2. **Add Caching Headers**
   ```javascript
   app.use(express.static('public', {
       maxAge: '1d'
   }));
   ```

3. **Use CDN for Assets**
   - Serve fonts from Google Fonts CDN
   - Use CDN for Socket.IO client

4. **Implement Database Indexing**
   - Index frequently queried fields
   - Use compound indexes

---

## 🎓 Next Steps

After successful setup:

1. **Customize the theme** to match your community
2. **Add custom channels** for your topics
3. **Invite users** and start chatting!
4. **Set up moderation** rules
5. **Create polls** to engage users
6. **Monitor the leaderboard** for active members
7. **Consider WebRTC** for actual voice/video chat

---

## 📞 Getting Help

If you're stuck:

1. **Check the README.md** for general info
2. **Review this guide** again
3. **Check browser console** (F12) for errors
4. **Check server logs** in terminal
5. **Google the error message**
6. **Ask in the community** (once deployed!)

---

## ✅ Setup Checklist

Before going live, ensure:

- [ ] Node.js and npm installed
- [ ] Dependencies installed (`npm install`)
- [ ] Server starts without errors
- [ ] Can access in browser
- [ ] Can login successfully
- [ ] Can send messages
- [ ] Can create DMs
- [ ] Moderator login works
- [ ] Changed default mod credentials
- [ ] Customized theme/channels (optional)
- [ ] Tested on mobile
- [ ] Set up database (for production)
- [ ] Configured HTTPS (for production)
- [ ] Set up domain name (for production)

---

**You're all set! Enjoy AniConnect Enhanced! 🎉**

For questions: armetsheriff2025@gmail.com

---

*Last updated: February 2025*

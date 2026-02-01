# 🌸 AniConnect Enhanced

**The Ultimate Real-Time Chat Platform for Anime Fans**

Made for Anime Goons 😎 - Now with **MASSIVE** feature upgrades!

![Version](https://img.shields.io/badge/version-2.0.0-ff006e)
![License](https://img.shields.io/badge/license-MIT-8338ec)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-43b581)

---

## ✨ Features Overview

### 💬 **Core Chat Features**
- ✅ Real-time messaging with Socket.IO
- ✅ Multiple themed channels (anime, gaming, fanart, cosplay, etc.)
- ✅ Image sharing & uploads
- ✅ Message editing & deletion
- ✅ Rich text support with link detection
- ✅ @mention system with notifications
- ✅ Reply to messages
- ✅ Message search functionality
- ✅ Pinned messages (mod only)

### 🎭 **User Experience**
- ✅ Beautiful gradient UI with cyberpunk anime theme
- ✅ User profiles with avatars
- ✅ XP & leveling system (gamification)
- ✅ User status (online, away, DND, invisible)
- ✅ Custom status messages
- ✅ Dark/Light theme toggle
- ✅ Fully responsive design (mobile, tablet, desktop)
- ✅ Smooth animations & transitions

### 📨 **Direct Messages**
- ✅ Private 1-on-1 conversations
- ✅ DM notifications with unread count
- ✅ DM history persistence
- ✅ Send images in DMs

### 🔊 **Voice Channels** (UI Ready)
- ✅ Multiple voice rooms
- ✅ See participants count
- ✅ Join/leave voice channels
- *(WebRTC integration ready for future update)*

### 😊 **Reactions & Emojis**
- ✅ React to messages with emojis
- ✅ Multiple reactions per message
- ✅ Quick emoji picker
- ✅ See who reacted to messages

### 📊 **Polls & Voting**
- ✅ Create polls in channels
- ✅ Multiple choice options
- ✅ Real-time vote counting
- ✅ Vote percentage display
- ✅ Poll expiration timers

### 🏆 **Gamification**
- ✅ User levels (earn XP by chatting)
- ✅ Global leaderboard
- ✅ Level-up animations & notifications
- ✅ XP progress bars
- ✅ Message count tracking
- ✅ Achievement badges (coming soon)

### 🛡️ **Moderation Tools**
- ✅ Moderator roles & permissions
- ✅ Message deletion (own messages + mod override)
- ✅ User muting (temporary)
- ✅ User banning
- ✅ Content filter (bad words, spam detection)
- ✅ Message reporting system
- ✅ Report notifications for mods
- ✅ Pin/unpin messages
- ✅ Create/delete channels

### 📱 **Additional Features**
- ✅ Online user count & list
- ✅ Typing indicators
- ✅ Sound notifications (toggle-able)
- ✅ Desktop notifications
- ✅ Rate limiting (anti-spam)
- ✅ Message character counter
- ✅ Auto-scroll to latest
- ✅ Highlight mentioned messages
- ✅ Date dividers in chat
- ✅ Server statistics dashboard
- ✅ Settings panel

### 🔐 **Authentication**
- ✅ Social login (Google, Discord, GitHub, Apple, Facebook)
- ✅ Email/password login
- ✅ Special moderator login
- ✅ Session persistence (localStorage)
- ✅ Auto-reconnect on disconnect

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- npm >= 6.0.0

### Installation

1. **Clone or extract the project**
```bash
cd anicurrent-enhanced
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the server**
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:3000
```

---

## 🎮 Usage Guide

### For Regular Users

1. **Login**: Choose any social login or use email
   - Quick start: Just click any social button for instant access
   - Random anime-themed username will be generated

2. **Chat**: 
   - Select a channel from the sidebar
   - Type your message and press Enter or click Send
   - Use @username to mention someone
   - Click 📎 to attach images
   - Click 😊 for emoji picker

3. **React**: Click the 😊 button under any message to react

4. **Direct Messages**: Click the 📨 tab, then click "DM" next to any user

5. **Voice**: Click the 🔊 tab to join voice channels

6. **Profile**: Click 👤 to see your level, XP, and stats

### For Moderators

**Login Credentials:**
- Email: `armetsheriff2025@gmail.com`
- Password: `kimi@ArmetWeb231`

**Special Powers:**
- Delete any message
- Mute/ban users
- Pin messages
- Create/delete channels
- See all reports

---

## 📂 Project Structure

```
anicurrent-enhanced/
├── server.js          # Backend server with Socket.IO
├── app.js             # Frontend JavaScript (client logic)
├── index.html         # Main HTML structure
├── style.css          # Complete styling
├── package.json       # Dependencies
└── README.md          # This file
```

---

## 🔧 Configuration

### Moderator Credentials
Edit in `app.js`:
```javascript
const MOD_EMAIL = 'your-mod-email@example.com';
const MOD_PASS = 'your-secure-password';
```

### Server Port
Edit in `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Add New Channels
In `server.js`, add to `data.channels`:
```javascript
{
    id: 'channel-id',
    name: 'channel-name',
    icon: '🎮',
    desc: 'Description',
    category: 'text'
}
```

---

## 🎨 Customization

### Theme Colors
Edit CSS variables in `style.css`:
```css
:root {
    --primary: #ff006e;      /* Main pink */
    --secondary: #00f5ff;    /* Cyan */
    --accent: #8338ec;       /* Purple */
    /* ... more colors */
}
```

### Add Custom Emojis
In `app.js`:
```javascript
const EMOJI_LIST = ['❤️', '👍', '😂', /* your emojis */];
```

---

## 📊 Features Breakdown

| Feature | Status | Description |
|---------|--------|-------------|
| Real-time Chat | ✅ Complete | Socket.IO powered instant messaging |
| Channels | ✅ Complete | Multiple topic-based chat rooms |
| Direct Messages | ✅ Complete | Private conversations |
| Voice Channels | 🟡 UI Ready | Voice room infrastructure (WebRTC needed) |
| User Profiles | ✅ Complete | Levels, XP, stats, avatars |
| Reactions | ✅ Complete | Emoji reactions on messages |
| Polls | ✅ Complete | Interactive voting system |
| Moderation | ✅ Complete | Full mod toolkit |
| Search | ✅ Complete | Message & user search |
| Notifications | ✅ Complete | Toast & desktop notifications |
| Mobile Support | ✅ Complete | Fully responsive design |
| Themes | ✅ Complete | Dark/Light mode |

---

## 🌐 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

---

## 🔮 Roadmap (Future Updates)

- [ ] WebRTC voice/video chat integration
- [ ] File sharing (PDFs, documents)
- [ ] GIF picker integration
- [ ] Stickers & custom emojis
- [ ] Thread conversations
- [ ] Message pinning by users
- [ ] Channel categories
- [ ] User roles beyond mod/member
- [ ] Custom user badges
- [ ] Server boosts/premium features
- [ ] Export chat history
- [ ] Bot API for custom bots
- [ ] Webhooks
- [ ] Two-factor authentication
- [ ] End-to-end encryption for DMs

---

## ⚙️ Technical Stack

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5 & CSS3
- Socket.IO Client
- Google Fonts (Outfit)

**Backend:**
- Node.js
- Express.js
- Socket.IO Server

**Data Storage:**
- In-memory (current)
- *Ready for MongoDB/PostgreSQL integration*

---

## 🐛 Known Issues

- Voice channels need WebRTC implementation
- Large image uploads may slow on poor connections
- Poll results reset on server restart (use DB for persistence)

---

## 💡 Tips & Tricks

1. **Fast Channel Switch**: Use sidebar or keyboard shortcuts
2. **Quick Reactions**: Hover over message for action buttons
3. **Search Power**: Use search to find old conversations
4. **Level Up Faster**: Active chatting earns more XP
5. **Pin Important**: Mods can pin announcements for everyone

---

## 🤝 Contributing

This is a solo project for anime fans! Feel free to:
- Report bugs
- Suggest features
- Fork and customize
- Share with your anime community

---

## 📝 License

MIT License - Feel free to use and modify!

---

## 🎌 Credits

**Created by**: Armet & the AniConnect Team  
**For**: Anime Goons Worldwide 😎  
**Inspired by**: Discord, Slack, and anime culture  

**Special Thanks**:
- Socket.IO team for real-time magic
- Google Fonts for Outfit typeface
- All anime fans keeping the community alive!

---

## 📞 Support

Having issues? Want to suggest features?

- Open an issue on GitHub
- Contact mod team in-app
- Email: armetsheriff2025@gmail.com

---

## 🌟 Show Your Support

If you love AniConnect Enhanced, consider:
- ⭐ Starring the repository
- 🎉 Sharing with your anime friends
- 💬 Joining the community
- 🎨 Creating custom themes

---

**Made with 💖 for the anime community**

*"In the world of anime, we're all nakama!"* 🌸

---

## 📸 Screenshots

*(Add screenshots of your app here)*

- Login Screen
- Main Chat Interface
- Direct Messages
- User Profile
- Leaderboard
- Poll Creation
- Voice Channels
- Mobile View

---

## 🔄 Version History

### v2.0.0 (Enhanced Edition) - 2025
- ✨ Massive feature expansion
- 🎮 Added gamification (XP, levels, leaderboard)
- 📨 Direct messaging system
- 😊 Reactions & emoji picker
- 📊 Polls & voting
- 🔊 Voice channel UI
- 🛡️ Advanced moderation tools
- 📱 Enhanced mobile experience
- 🎨 Theme customization
- ⚡ Performance optimizations

### v1.0.0 (Initial Release)
- 💬 Basic real-time chat
- 🎨 Simple channel system
- 👤 User authentication
- 🖼️ Image sharing

---

**Enjoy chatting! 🎉**

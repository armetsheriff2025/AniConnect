const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Enhanced Data Storage (use database like MongoDB/PostgreSQL for production)
const data = {
    messages: {
        general: [],
        recommendations: [],
        fanart: [],
        cosplay: [],
        gaming: [],
        music: [],
        offtopic: []
    },
    users: new Map(), // userId -> user data
    onlineUsers: new Map(), // socketId -> user data
    userProfiles: new Map(), // userId -> profile data
    reactions: new Map(), // messageId -> {emoji: [userIds]}
    directMessages: new Map(), // conversationId -> messages[]
    channels: [
        { id: 'general', name: 'general', icon: '💬', desc: 'General anime discussion', category: 'text' },
        { id: 'recommendations', name: 'recommendations', icon: '📺', desc: 'Share and find anime', category: 'text' },
        { id: 'fanart', name: 'fanart', icon: '🎨', desc: 'Showcase your art', category: 'text' },
        { id: 'cosplay', name: 'cosplay', icon: '👘', desc: 'Cosplay photos', category: 'text' },
        { id: 'gaming', name: 'gaming', icon: '🎮', desc: 'Gaming discussions', category: 'text' },
        { id: 'music', name: 'music', icon: '🎵', desc: 'Anime OSTs & J-Pop', category: 'text' },
        { id: 'offtopic', name: 'off-topic', icon: '🌟', desc: 'Random stuff', category: 'text' }
    ],
    voiceChannels: [
        { id: 'vc-general', name: 'General Voice', icon: '🔊', participants: [] },
        { id: 'vc-anime', name: 'Anime Watch Party', icon: '📺', participants: [] },
        { id: 'vc-gaming', name: 'Gaming Session', icon: '🎮', participants: [] }
    ],
    polls: new Map(), // channelId -> active polls
    userStatus: new Map(), // userId -> {status, customStatus, activity}
    pinnedMessages: new Map(), // channelId -> [messageIds]
    serverStats: {
        totalMessages: 0,
        totalUsers: 0,
        activeUsers: 0
    },
    reports: [],
    bans: new Set(),
    mutes: new Map() // userId -> muteUntil timestamp
};

// Helper Functions
function saveUserProfile(userId, profileData) {
    data.userProfiles.set(userId, {
        ...data.userProfiles.get(userId),
        ...profileData,
        updatedAt: Date.now()
    });
}

function getUserProfile(userId) {
    return data.userProfiles.get(userId) || {
        bio: '',
        favoriteAnime: [],
        badges: [],
        joinedAt: Date.now(),
        messageCount: 0,
        level: 1,
        xp: 0
    };
}

function addXP(userId, amount = 10) {
    const profile = getUserProfile(userId);
    profile.xp += amount;
    
    // Level up calculation
    const xpForNextLevel = profile.level * 100;
    if (profile.xp >= xpForNextLevel) {
        profile.level++;
        profile.xp -= xpForNextLevel;
        return { leveledUp: true, newLevel: profile.level };
    }
    
    saveUserProfile(userId, profile);
    return { leveledUp: false };
}

function isUserMuted(userId) {
    const muteUntil = data.mutes.get(userId);
    if (!muteUntil) return false;
    
    if (Date.now() > muteUntil) {
        data.mutes.delete(userId);
        return false;
    }
    return true;
}

function getDMConversationId(user1, user2) {
    return [user1, user2].sort().join('_');
}

// Socket.IO Event Handlers
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    // User Authentication & Profile
    socket.on('user_login', (userData) => {
        socket.userId = userData.id;
        socket.username = userData.username;
        socket.userRole = userData.role;
        
        data.onlineUsers.set(socket.id, {
            id: userData.id,
            username: userData.username,
            avatar: userData.avatar,
            role: userData.role,
            socketId: socket.id,
            status: 'online',
            connectedAt: Date.now()
        });
        
        // Initialize profile if doesn't exist
        if (!data.userProfiles.has(userData.id)) {
            saveUserProfile(userData.id, {
                bio: '',
                favoriteAnime: [],
                badges: [],
                joinedAt: Date.now(),
                messageCount: 0,
                level: 1,
                xp: 0
            });
        }
        
        data.serverStats.activeUsers = data.onlineUsers.size;
        
        // Broadcast online users update
        io.emit('online_users_update', {
            count: data.onlineUsers.size,
            users: Array.from(data.onlineUsers.values())
        });
        
        // Send user their profile
        socket.emit('profile_data', getUserProfile(userData.id));
        
        console.log(`${userData.username} logged in`);
    });
    
    // Join Channel
    socket.on('join_channel', (channel) => {
        // Leave all other channels first
        Array.from(socket.rooms).forEach(room => {
            if (room !== socket.id) socket.leave(room);
        });
        
        socket.join(channel);
        socket.currentChannel = channel;
        
        // Send existing messages
        const messages = data.messages[channel] || [];
        socket.emit('load_messages', {
            channel,
            messages,
            pinnedMessages: data.pinnedMessages.get(channel) || []
        });
        
        // Notify others
        socket.to(channel).emit('user_joined_channel', {
            username: socket.username,
            timestamp: Date.now()
        });
        
        console.log(`${socket.username} joined #${channel}`);
    });
    
    // Send Message
    socket.on('send_message', (messageData) => {
        if (isUserMuted(socket.userId)) {
            socket.emit('error', { message: 'You are muted' });
            return;
        }
        
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            author: messageData.author,
            authorId: socket.userId,
            avatar: messageData.avatar,
            role: messageData.role,
            content: messageData.content,
            type: messageData.type || 'text',
            image: messageData.image || null,
            timestamp: Date.now(),
            socketId: socket.id,
            edited: false,
            reactions: {},
            mentions: messageData.mentions || [],
            replyTo: messageData.replyTo || null
        };
        
        const channel = messageData.channel || socket.currentChannel;
        
        // Save message
        if (!data.messages[channel]) data.messages[channel] = [];
        data.messages[channel].push(message);
        
        // Keep only last 500 messages per channel
        if (data.messages[channel].length > 500) {
            data.messages[channel] = data.messages[channel].slice(-500);
        }
        
        // Update stats and XP
        data.serverStats.totalMessages++;
        const xpResult = addXP(socket.userId, 10);
        
        // Broadcast message
        io.to(channel).emit('new_message', message);
        
        // If leveled up, send notification
        if (xpResult.leveledUp) {
            io.to(channel).emit('user_leveled_up', {
                userId: socket.userId,
                username: socket.username,
                level: xpResult.newLevel
            });
        }
        
        console.log(`Message in #${channel} from ${messageData.author}`);
    });
    
    // Edit Message
    socket.on('edit_message', (data) => {
        const { channel, messageId, newContent } = data;
        
        if (!data.messages[channel]) return;
        
        const message = data.messages[channel].find(m => m.id === messageId);
        if (message && message.authorId === socket.userId) {
            message.content = newContent;
            message.edited = true;
            message.editedAt = Date.now();
            
            io.to(channel).emit('message_edited', {
                messageId,
                newContent,
                editedAt: message.editedAt
            });
        }
    });
    
    // Delete Message
    socket.on('delete_message', (deleteData) => {
        const { channel, messageId } = deleteData;
        
        if (!data.messages[channel]) return;
        
        const message = data.messages[channel].find(m => m.id === messageId);
        
        // Only author or mods can delete
        if (message && (message.authorId === socket.userId || socket.userRole === 'moderator')) {
            data.messages[channel] = data.messages[channel].filter(m => m.id !== messageId);
            io.to(channel).emit('message_deleted', messageId);
            console.log(`Message ${messageId} deleted by ${socket.username}`);
        }
    });
    
    // Reactions
    socket.on('add_reaction', (reactionData) => {
        const { channel, messageId, emoji } = reactionData;
        
        if (!data.messages[channel]) return;
        
        const message = data.messages[channel].find(m => m.id === messageId);
        if (message) {
            if (!message.reactions[emoji]) {
                message.reactions[emoji] = [];
            }
            
            if (!message.reactions[emoji].includes(socket.userId)) {
                message.reactions[emoji].push(socket.userId);
                
                io.to(channel).emit('reaction_added', {
                    messageId,
                    emoji,
                    userId: socket.userId,
                    username: socket.username
                });
            }
        }
    });
    
    socket.on('remove_reaction', (reactionData) => {
        const { channel, messageId, emoji } = reactionData;
        
        if (!data.messages[channel]) return;
        
        const message = data.messages[channel].find(m => m.id === messageId);
        if (message && message.reactions[emoji]) {
            message.reactions[emoji] = message.reactions[emoji].filter(id => id !== socket.userId);
            
            if (message.reactions[emoji].length === 0) {
                delete message.reactions[emoji];
            }
            
            io.to(channel).emit('reaction_removed', {
                messageId,
                emoji,
                userId: socket.userId
            });
        }
    });
    
    // Typing Indicator
    socket.on('typing', (typingData) => {
        socket.to(typingData.channel).emit('user_typing', {
            author: typingData.author,
            channel: typingData.channel
        });
    });
    
    // Direct Messages
    socket.on('send_dm', (dmData) => {
        const { recipientId, content, type } = dmData;
        const conversationId = getDMConversationId(socket.userId, recipientId);
        
        const message = {
            id: `dm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            senderId: socket.userId,
            senderName: socket.username,
            recipientId,
            content,
            type: type || 'text',
            timestamp: Date.now(),
            read: false
        };
        
        if (!data.directMessages.has(conversationId)) {
            data.directMessages.set(conversationId, []);
        }
        
        data.directMessages.get(conversationId).push(message);
        
        // Send to recipient if online
        const recipientSocket = Array.from(data.onlineUsers.values())
            .find(u => u.id === recipientId);
        
        if (recipientSocket) {
            io.to(recipientSocket.socketId).emit('new_dm', message);
        }
        
        socket.emit('dm_sent', message);
    });
    
    socket.on('get_dm_history', (userId) => {
        const conversationId = getDMConversationId(socket.userId, userId);
        const messages = data.directMessages.get(conversationId) || [];
        socket.emit('dm_history', messages);
    });
    
    // Voice Channels
    socket.on('join_voice', (voiceChannelId) => {
        const vc = data.voiceChannels.find(v => v.id === voiceChannelId);
        if (vc && !vc.participants.includes(socket.userId)) {
            vc.participants.push(socket.userId);
            socket.join(voiceChannelId);
            
            io.emit('voice_channel_update', {
                channelId: voiceChannelId,
                participants: vc.participants
            });
        }
    });
    
    socket.on('leave_voice', (voiceChannelId) => {
        const vc = data.voiceChannels.find(v => v.id === voiceChannelId);
        if (vc) {
            vc.participants = vc.participants.filter(id => id !== socket.userId);
            socket.leave(voiceChannelId);
            
            io.emit('voice_channel_update', {
                channelId: voiceChannelId,
                participants: vc.participants
            });
        }
    });
    
    // User Status
    socket.on('update_status', (statusData) => {
        data.userStatus.set(socket.userId, {
            status: statusData.status, // online, away, dnd, invisible
            customStatus: statusData.customStatus || '',
            activity: statusData.activity || null,
            updatedAt: Date.now()
        });
        
        io.emit('user_status_update', {
            userId: socket.userId,
            username: socket.username,
            ...statusData
        });
    });
    
    // Create Poll
    socket.on('create_poll', (pollData) => {
        const { channel, question, options, duration } = pollData;
        
        const poll = {
            id: `poll_${Date.now()}`,
            question,
            options: options.map(opt => ({ text: opt, votes: [] })),
            createdBy: socket.userId,
            createdAt: Date.now(),
            expiresAt: Date.now() + (duration * 60000),
            active: true
        };
        
        if (!data.polls.has(channel)) {
            data.polls.set(channel, []);
        }
        
        data.polls.get(channel).push(poll);
        
        io.to(channel).emit('new_poll', poll);
    });
    
    socket.on('vote_poll', (voteData) => {
        const { channel, pollId, optionIndex } = voteData;
        
        const polls = data.polls.get(channel);
        if (!polls) return;
        
        const poll = polls.find(p => p.id === pollId);
        if (poll && poll.active) {
            // Remove previous vote if exists
            poll.options.forEach(opt => {
                opt.votes = opt.votes.filter(id => id !== socket.userId);
            });
            
            // Add new vote
            poll.options[optionIndex].votes.push(socket.userId);
            
            io.to(channel).emit('poll_updated', poll);
        }
    });
    
    // Pin Message (Mods only)
    socket.on('pin_message', (pinData) => {
        if (socket.userRole !== 'moderator') return;
        
        const { channel, messageId } = pinData;
        
        if (!data.pinnedMessages.has(channel)) {
            data.pinnedMessages.set(channel, []);
        }
        
        const pinned = data.pinnedMessages.get(channel);
        if (!pinned.includes(messageId)) {
            pinned.push(messageId);
            io.to(channel).emit('message_pinned', messageId);
        }
    });
    
    socket.on('unpin_message', (unpinData) => {
        if (socket.userRole !== 'moderator') return;
        
        const { channel, messageId } = unpinData;
        
        if (data.pinnedMessages.has(channel)) {
            const pinned = data.pinnedMessages.get(channel);
            data.pinnedMessages.set(channel, pinned.filter(id => id !== messageId));
            io.to(channel).emit('message_unpinned', messageId);
        }
    });
    
    // Reports
    socket.on('report_message', (reportData) => {
        const report = {
            id: `report_${Date.now()}`,
            reportedBy: socket.userId,
            reportedUser: reportData.userId,
            messageId: reportData.messageId,
            reason: reportData.reason,
            content: reportData.content,
            timestamp: Date.now(),
            status: 'pending'
        };
        
        data.reports.push(report);
        
        // Notify all moderators
        data.onlineUsers.forEach((user, socketId) => {
            if (user.role === 'moderator') {
                io.to(socketId).emit('new_report', report);
            }
        });
        
        socket.emit('report_submitted');
    });
    
    // Moderation Actions
    socket.on('mute_user', (muteData) => {
        if (socket.userRole !== 'moderator') return;
        
        const { userId, duration } = muteData; // duration in minutes
        const muteUntil = Date.now() + (duration * 60000);
        
        data.mutes.set(userId, muteUntil);
        
        io.emit('user_muted', {
            userId,
            mutedBy: socket.username,
            duration,
            until: muteUntil
        });
    });
    
    socket.on('ban_user', (banData) => {
        if (socket.userRole !== 'moderator') return;
        
        const { userId } = banData;
        data.bans.add(userId);
        
        // Disconnect banned user
        const bannedUser = Array.from(data.onlineUsers.values())
            .find(u => u.id === userId);
        
        if (bannedUser) {
            io.to(bannedUser.socketId).emit('banned', {
                reason: banData.reason,
                bannedBy: socket.username
            });
            
            io.sockets.sockets.get(bannedUser.socketId)?.disconnect();
        }
    });
    
    // Create Channel (Mods only)
    socket.on('create_channel', (channelData) => {
        if (socket.userRole !== 'moderator') return;
        
        const newChannel = {
            id: channelData.id,
            name: channelData.name,
            icon: channelData.icon,
            desc: channelData.desc,
            category: channelData.category || 'text',
            createdBy: socket.userId,
            createdAt: Date.now()
        };
        
        data.channels.push(newChannel);
        data.messages[newChannel.id] = [];
        
        io.emit('channel_created', newChannel);
    });
    
    socket.on('delete_channel', (channelId) => {
        if (socket.userRole !== 'moderator') return;
        
        data.channels = data.channels.filter(c => c.id !== channelId);
        delete data.messages[channelId];
        
        io.emit('channel_deleted', channelId);
    });
    
    // Get Server Stats
    socket.on('get_stats', () => {
        socket.emit('server_stats', {
            totalMessages: data.serverStats.totalMessages,
            totalUsers: data.userProfiles.size,
            activeUsers: data.onlineUsers.size,
            channels: data.channels.length,
            voiceChannels: data.voiceChannels.length
        });
    });
    
    // Get Leaderboard
    socket.on('get_leaderboard', () => {
        const leaderboard = Array.from(data.userProfiles.entries())
            .map(([userId, profile]) => ({
                userId,
                level: profile.level,
                xp: profile.xp,
                messageCount: profile.messageCount
            }))
            .sort((a, b) => b.level - a.level || b.xp - a.xp)
            .slice(0, 10);
        
        socket.emit('leaderboard_data', leaderboard);
    });
    
    // User Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Remove from voice channels
        data.voiceChannels.forEach(vc => {
            if (vc.participants.includes(socket.userId)) {
                vc.participants = vc.participants.filter(id => id !== socket.userId);
                io.emit('voice_channel_update', {
                    channelId: vc.id,
                    participants: vc.participants
                });
            }
        });
        
        data.onlineUsers.delete(socket.id);
        data.serverStats.activeUsers = data.onlineUsers.size;
        
        io.emit('online_users_update', {
            count: data.onlineUsers.size,
            users: Array.from(data.onlineUsers.values())
        });
    });
});

// API Endpoints
app.get('/api/channels', (req, res) => {
    res.json(data.channels);
});

app.get('/api/voice-channels', (req, res) => {
    res.json(data.voiceChannels);
});

app.get('/api/stats', (req, res) => {
    res.json({
        totalMessages: data.serverStats.totalMessages,
        totalUsers: data.userProfiles.size,
        activeUsers: data.onlineUsers.size,
        channels: data.channels.length
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 AniConnect Enhanced Server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
    console.log(`💫 Features: Real-time chat, DMs, Voice, Reactions, Polls, Leveling, Moderation`);
});

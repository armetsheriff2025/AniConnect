// Enhanced AniConnect Frontend - Full Feature Implementation
const socket = io();

// Enhanced State Management
const state = {
    currentUser: null,
    currentChannel: 'general',
    currentView: 'chat', // chat, profile, dms, settings, leaderboard
    channels: [],
    voiceChannels: [],
    messages: [],
    directMessages: new Map(),
    onlineUsers: [],
    userProfile: null,
    reactions: {},
    polls: [],
    notifications: [],
    unreadDMs: new Map(),
    typingUsers: new Set(),
    activeVoiceChannel: null,
    searchResults: [],
    pinnedMessages: [],
    userStatus: 'online',
    customStatus: '',
    theme: localStorage.getItem('theme') || 'dark',
    soundEnabled: localStorage.getItem('sound') !== 'false',
    notificationsEnabled: localStorage.getItem('notifications') !== 'false',
    currentDMUser: null,
    emojiPicker: null,
    replyingTo: null,
    editingMessage: null
};

// Constants
const EMOJI_LIST = ['❤️', '👍', '😂', '😮', '😢', '😡', '🎉', '🔥', '⭐', '💯'];
const STATUS_OPTIONS = ['online', 'away', 'dnd', 'invisible'];
const MOD_EMAIL = 'armetsheriff2025@gmail.com';
const MOD_PASS = 'kimi@ArmetWeb231';
const BAD_WORDS = ['spam', 'toxic', 'hate'];
const MAX_MESSAGE_LENGTH = 2000;
const MESSAGE_RATE_LIMIT = 3; // messages per 5 seconds

// DOM Elements Cache
const elements = {
    // Modals
    loginModal: document.getElementById('loginModal'),
    profileModal: document.getElementById('profileModal'),
    dmModal: document.getElementById('dmModal'),
    settingsModal: document.getElementById('settingsModal'),
    reportModal: document.getElementById('reportModal'),
    pollModal: document.getElementById('pollModal'),
    leaderboardModal: document.getElementById('leaderboardModal'),
    
    // Main Layout
    sidebar: document.getElementById('sidebar'),
    mainContent: document.getElementById('mainContent'),
    menuToggle: document.getElementById('menuToggle'),
    mobileOverlay: document.getElementById('mobileOverlay'),
    
    // Chat Elements
    channelList: document.getElementById('channelList'),
    voiceChannelList: document.getElementById('voiceChannelList'),
    messageContainer: document.getElementById('messageContainer'),
    msgInput: document.getElementById('msgInput'),
    sendBtn: document.getElementById('sendBtn'),
    typingIndicator: document.getElementById('typingIndicator'),
    pinnedMessageBar: document.getElementById('pinnedMessageBar'),
    
    // User Interface
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    userStatus: document.getElementById('userStatus'),
    
    // Header
    channelTitle: document.getElementById('channelTitle'),
    channelDesc: document.getElementById('channelDesc'),
    headerIcon: document.getElementById('headerIcon'),
    onlineCount: document.getElementById('onlineCount'),
    
    // Members & Search
    membersSidebar: document.getElementById('membersSidebar'),
    membersList: document.getElementById('membersList'),
    searchBar: document.getElementById('searchBar'),
    searchInput: document.getElementById('searchInput'),
    searchResults: document.getElementById('searchResults'),
    
    // Notifications
    toastContainer: document.getElementById('toastContainer'),
    notificationBadge: document.getElementById('notificationBadge'),
    notificationPanel: document.getElementById('notificationPanel'),
    
    // Misc
    fileInput: document.getElementById('fileInput'),
    emojiButton: document.getElementById('emojiButton'),
    emojiPicker: document.getElementById('emojiPicker'),
    gifButton: document.getElementById('gifButton'),
    pollButton: document.getElementById('pollButton'),
    
    // View Containers
    chatView: document.getElementById('chatView'),
    profileView: document.getElementById('profileView'),
    dmView: document.getElementById('dmView'),
    settingsView: document.getElementById('settingsView'),
    leaderboardView: document.getElementById('leaderboardView')
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    checkAuth();
    setupEventListeners();
    setupSocketListeners();
    loadTheme();
    initializeNotifications();
}

function checkAuth() {
    const saved = localStorage.getItem('anicurrent_user');
    if (saved) {
        state.currentUser = JSON.parse(saved);
        hideLogin();
        authenticateWithServer();
        initApp();
    }
}

function authenticateWithServer() {
    socket.emit('user_login', state.currentUser);
}

function initApp() {
    updateUserUI();
    renderChannels();
    loadChannels();
    loadVoiceChannels();
    switchChannel('general');
    startActivityTracking();
    checkForUpdates();
}

// ============================================================================
// SOCKET EVENT LISTENERS
// ============================================================================

function setupSocketListeners() {
    // Connection
    socket.on('connect', () => {
        console.log('Connected to server');
        if (state.currentUser) {
            authenticateWithServer();
            socket.emit('join_channel', state.currentChannel);
        }
    });
    
    socket.on('disconnect', () => {
        showToast('Disconnected from server', 'error');
    });
    
    // Messages
    socket.on('load_messages', (data) => {
        state.messages = data.messages;
        state.pinnedMessages = data.pinnedMessages || [];
        renderMessages();
        updatePinnedMessages();
    });
    
    socket.on('new_message', (msg) => {
        if (msg.socketId === socket.id && !msg.isBot) return;
        
        state.messages.push(msg);
        renderMessages();
        
        if (msg.authorId !== state.currentUser.id) {
            playNotificationSound();
            
            if (msg.mentions && msg.mentions.includes(state.currentUser.id)) {
                showToast(`${msg.author} mentioned you!`, 'info');
                addNotification({
                    type: 'mention',
                    from: msg.author,
                    content: msg.content,
                    timestamp: Date.now()
                });
            }
        }
    });
    
    socket.on('message_deleted', (messageId) => {
        state.messages = state.messages.filter(m => m.id !== messageId);
        renderMessages();
    });
    
    socket.on('message_edited', (data) => {
        const msg = state.messages.find(m => m.id === data.messageId);
        if (msg) {
            msg.content = data.newContent;
            msg.edited = true;
            msg.editedAt = data.editedAt;
            renderMessages();
        }
    });
    
    // Reactions
    socket.on('reaction_added', (data) => {
        const msg = state.messages.find(m => m.id === data.messageId);
        if (msg) {
            if (!msg.reactions[data.emoji]) {
                msg.reactions[data.emoji] = [];
            }
            if (!msg.reactions[data.emoji].includes(data.userId)) {
                msg.reactions[data.emoji].push(data.userId);
            }
            renderMessages();
        }
    });
    
    socket.on('reaction_removed', (data) => {
        const msg = state.messages.find(m => m.id === data.messageId);
        if (msg && msg.reactions[data.emoji]) {
            msg.reactions[data.emoji] = msg.reactions[data.emoji].filter(id => id !== data.userId);
            if (msg.reactions[data.emoji].length === 0) {
                delete msg.reactions[data.emoji];
            }
            renderMessages();
        }
    });
    
    // Typing Indicator
    socket.on('user_typing', (data) => {
        if (data.channel === state.currentChannel) {
            showTyping(data.author);
        }
    });
    
    // Direct Messages
    socket.on('new_dm', (dm) => {
        const conversationId = getDMConversationId(state.currentUser.id, dm.senderId);
        
        if (!state.directMessages.has(conversationId)) {
            state.directMessages.set(conversationId, []);
        }
        
        state.directMessages.get(conversationId).push(dm);
        
        // Update unread count
        if (state.currentView !== 'dms' || state.currentDMUser !== dm.senderId) {
            const unread = state.unreadDMs.get(dm.senderId) || 0;
            state.unreadDMs.set(dm.senderId, unread + 1);
            updateDMNotifications();
        }
        
        if (state.currentView === 'dms' && state.currentDMUser === dm.senderId) {
            renderDMMessages();
        }
        
        playNotificationSound();
        showToast(`New message from ${dm.senderName}`, 'info');
        
        addNotification({
            type: 'dm',
            from: dm.senderName,
            content: dm.content,
            timestamp: Date.now()
        });
    });
    
    socket.on('dm_history', (messages) => {
        const conversationId = getDMConversationId(state.currentUser.id, state.currentDMUser);
        state.directMessages.set(conversationId, messages);
        renderDMMessages();
    });
    
    // Online Users
    socket.on('online_users_update', (data) => {
        state.onlineUsers = data.users;
        updateOnlineCount(data.count);
        renderMembersList();
    });
    
    // Voice Channels
    socket.on('voice_channel_update', (data) => {
        const vc = state.voiceChannels.find(v => v.id === data.channelId);
        if (vc) {
            vc.participants = data.participants;
            renderVoiceChannels();
        }
    });
    
    // User Status
    socket.on('user_status_update', (data) => {
        const user = state.onlineUsers.find(u => u.id === data.userId);
        if (user) {
            user.status = data.status;
            user.customStatus = data.customStatus;
            renderMembersList();
        }
    });
    
    // Polls
    socket.on('new_poll', (poll) => {
        state.polls.push(poll);
        renderPoll(poll);
        showToast('New poll created!', 'info');
    });
    
    socket.on('poll_updated', (poll) => {
        const index = state.polls.findIndex(p => p.id === poll.id);
        if (index !== -1) {
            state.polls[index] = poll;
            renderPoll(poll);
        }
    });
    
    // Leveling
    socket.on('user_leveled_up', (data) => {
        if (data.userId === state.currentUser.id) {
            showLevelUpAnimation(data.level);
            showToast(`🎉 You leveled up to level ${data.level}!`, 'success');
        } else {
            showToast(`${data.username} reached level ${data.level}!`, 'info');
        }
    });
    
    socket.on('profile_data', (profile) => {
        state.userProfile = profile;
        updateProfileUI();
    });
    
    // Pinned Messages
    socket.on('message_pinned', (messageId) => {
        if (!state.pinnedMessages.includes(messageId)) {
            state.pinnedMessages.push(messageId);
            updatePinnedMessages();
        }
    });
    
    socket.on('message_unpinned', (messageId) => {
        state.pinnedMessages = state.pinnedMessages.filter(id => id !== messageId);
        updatePinnedMessages();
    });
    
    // Channels
    socket.on('channel_created', (channel) => {
        state.channels.push(channel);
        renderChannels();
        showToast(`New channel #${channel.name} created!`, 'info');
    });
    
    socket.on('channel_deleted', (channelId) => {
        state.channels = state.channels.filter(c => c.id !== channelId);
        if (state.currentChannel === channelId) {
            switchChannel('general');
        }
        renderChannels();
    });
    
    // Moderation
    socket.on('user_muted', (data) => {
        if (data.userId === state.currentUser.id) {
            showToast(`You have been muted for ${data.duration} minutes`, 'warning');
        }
    });
    
    socket.on('banned', (data) => {
        alert(`You have been banned. Reason: ${data.reason}`);
        localStorage.removeItem('anicurrent_user');
        location.reload();
    });
    
    socket.on('new_report', (report) => {
        if (state.currentUser.isMod) {
            showToast('New report received', 'warning');
            addNotification({
                type: 'report',
                content: `Report: ${report.reason}`,
                timestamp: Date.now()
            });
        }
    });
    
    // Stats
    socket.on('server_stats', (stats) => {
        updateServerStats(stats);
    });
    
    socket.on('leaderboard_data', (leaderboard) => {
        renderLeaderboard(leaderboard);
    });
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // Message Input
    elements.msgInput?.addEventListener('input', handleMessageInput);
    elements.msgInput?.addEventListener('keypress', handleMessageKeypress);
    elements.sendBtn?.addEventListener('click', sendMessage);
    
    // Emoji Picker
    elements.emojiButton?.addEventListener('click', toggleEmojiPicker);
    
    // File Upload
    elements.fileInput?.addEventListener('change', handleFileUpload);
    
    // Menu Toggle
    elements.menuToggle?.addEventListener('click', openSidebar);
    elements.mobileOverlay?.addEventListener('click', closeSidebar);
    
    // Search
    elements.searchInput?.addEventListener('input', handleSearch);
    
    // Status Change
    elements.userStatus?.addEventListener('click', showStatusMenu);
    
    // Poll Button
    elements.pollButton?.addEventListener('click', openPollCreator);
    
    // Theme Toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    
    // Notification Toggle
    document.getElementById('notificationToggle')?.addEventListener('click', toggleNotifications);
    
    // Sound Toggle
    document.getElementById('soundToggle')?.addEventListener('click', toggleSound);
    
    // Click outside to close
    document.addEventListener('click', handleOutsideClick);
    
    // Visibility change for notifications
    document.addEventListener('visibilitychange', handleVisibilityChange);
}

function handleMessageInput(e) {
    const value = e.target.value;
    
    elements.sendBtn?.classList.toggle('active', value.trim().length > 0);
    
    // Character count
    updateCharacterCount(value.length);
    
    // Typing indicator
    if (!state.isTyping && value.length > 0) {
        state.isTyping = true;
        socket.emit('typing', {
            channel: state.currentChannel,
            author: state.currentUser.username
        });
        
        setTimeout(() => {
            state.isTyping = false;
        }, 3000);
    }
    
    // Auto-mention detection
    detectMentions(value);
}

function handleMessageKeypress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (!query) {
        elements.searchResults.innerHTML = '';
        elements.searchResults.style.display = 'none';
        return;
    }
    
    const results = state.messages.filter(msg => 
        msg.content.toLowerCase().includes(query) ||
        msg.author.toLowerCase().includes(query)
    );
    
    renderSearchResults(results);
}

function handleOutsideClick(e) {
    // Close emoji picker if clicking outside
    if (elements.emojiPicker && !elements.emojiPicker.contains(e.target) && 
        !elements.emojiButton?.contains(e.target)) {
        elements.emojiPicker.style.display = 'none';
    }
    
    // Close status menu if clicking outside
    const statusMenu = document.getElementById('statusMenu');
    if (statusMenu && !statusMenu.contains(e.target) && 
        !elements.userStatus?.contains(e.target)) {
        statusMenu.remove();
    }
}

function handleVisibilityChange() {
    if (!document.hidden && state.currentView === 'dms' && state.currentDMUser) {
        // Mark DMs as read when tab becomes visible
        state.unreadDMs.delete(state.currentDMUser);
        updateDMNotifications();
    }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

function socialLogin(provider) {
    const names = ['AnimeLover', 'MangaReader', 'OtakuKing', 'WaifuHunter', 'SenpaiNoticed', 'NarutoRunner', 'TokyoGhoul', 'OnePunchFan'];
    const randomName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 1000);
    
    state.currentUser = {
        id: generateUserId(),
        username: randomName,
        avatar: ['pink', 'cyan', 'purple', 'orange', 'green', 'blue'][Math.floor(Math.random() * 6)],
        role: 'member',
        isMod: false
    };
    
    completeLogin();
}

function emailLogin() {
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    
    if (!email || !password) {
        showToast('Please enter email and password', 'error');
        return;
    }
    
    if (email === MOD_EMAIL) {
        showToast('Use Moderator Access button', 'warning');
        return;
    }
    
    state.currentUser = {
        id: generateUserId(),
        username: email.split('@')[0],
        avatar: 'pink',
        role: 'member',
        isMod: false
    };
    
    completeLogin();
}

function modLogin() {
    const email = document.getElementById('modEmail').value;
    const pass = document.getElementById('modPass').value;
    
    if (email === MOD_EMAIL && pass === MOD_PASS) {
        state.currentUser = {
            id: 'mod_' + Date.now(),
            username: 'Armet',
            avatar: 'purple',
            role: 'moderator',
            isMod: true
        };
        completeLogin();
        showToast('Welcome back, Moderator!', 'success');
    } else {
        showToast('Invalid moderator credentials', 'error');
    }
}

function completeLogin() {
    localStorage.setItem('anicurrent_user', JSON.stringify(state.currentUser));
    hideLogin();
    authenticateWithServer();
    initApp();
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('anicurrent_user');
        socket.disconnect();
        location.reload();
    }
}

function generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// MESSAGING
// ============================================================================

function sendMessage() {
    const content = elements.msgInput.value.trim();
    
    if (!content) return;
    
    if (content.length > MAX_MESSAGE_LENGTH) {
        showToast(`Message too long! Max ${MAX_MESSAGE_LENGTH} characters`, 'error');
        return;
    }
    
    // Rate limiting
    if (!checkRateLimit()) {
        showToast('Slow down! You\'re sending messages too fast', 'warning');
        return;
    }
    
    // Content moderation
    const violation = checkContentViolation(content);
    if (violation) {
        showToast(violation, 'warning');
        return;
    }
    
    // Detect mentions
    const mentions = detectMentions(content);
    
    const messageData = {
        channel: state.currentChannel,
        author: state.currentUser.username,
        avatar: state.currentUser.avatar,
        role: state.currentUser.role,
        content: content,
        type: 'text',
        mentions: mentions,
        replyTo: state.replyingTo
    };
    
    if (state.editingMessage) {
        socket.emit('edit_message', {
            channel: state.currentChannel,
            messageId: state.editingMessage,
            newContent: content
        });
        cancelEdit();
    } else {
        socket.emit('send_message', messageData);
    }
    
    elements.msgInput.value = '';
    elements.sendBtn.classList.remove('active');
    state.replyingTo = null;
    clearReplyPreview();
    updateCharacterCount(0);
}

function sendDirectMessage(recipientId, content) {
    if (!content.trim()) return;
    
    socket.emit('send_dm', {
        recipientId,
        content: content.trim(),
        type: 'text'
    });
}

function deleteMessage(messageId) {
    if (confirm('Delete this message?')) {
        socket.emit('delete_message', {
            channel: state.currentChannel,
            messageId
        });
    }
}

function editMessage(messageId) {
    const msg = state.messages.find(m => m.id === messageId);
    if (!msg || msg.authorId !== state.currentUser.id) return;
    
    state.editingMessage = messageId;
    elements.msgInput.value = msg.content;
    elements.msgInput.focus();
    
    showEditingIndicator(msg);
}

function cancelEdit() {
    state.editingMessage = null;
    elements.msgInput.value = '';
    hideEditingIndicator();
}

function replyToMessage(messageId) {
    const msg = state.messages.find(m => m.id === messageId);
    if (!msg) return;
    
    state.replyingTo = messageId;
    showReplyPreview(msg);
    elements.msgInput.focus();
}

function addReaction(messageId, emoji) {
    socket.emit('add_reaction', {
        channel: state.currentChannel,
        messageId,
        emoji
    });
}

function removeReaction(messageId, emoji) {
    socket.emit('remove_reaction', {
        channel: state.currentChannel,
        messageId,
        emoji
    });
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Only images are supported', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('File too large! Max 5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        socket.emit('send_message', {
            channel: state.currentChannel,
            author: state.currentUser.username,
            avatar: state.currentUser.avatar,
            role: state.currentUser.role,
            content: '📎 Shared an image',
            type: 'image',
            image: e.target.result
        });
        
        showToast('Image uploaded!', 'success');
    };
    
    reader.readAsDataURL(file);
    event.target.value = '';
}

// ============================================================================
// CONTENT MODERATION
// ============================================================================

function checkContentViolation(content) {
    const lower = content.toLowerCase();
    
    // Bad words check
    for (let word of BAD_WORDS) {
        if (lower.includes(word)) {
            return `Warning: Inappropriate language detected`;
        }
    }
    
    // Spam detection
    if (/(.)\1{4,}/.test(content)) {
        return 'Warning: Excessive character repetition';
    }
    
    if (content.toUpperCase() === content && content.length > 10) {
        return 'Warning: Excessive caps';
    }
    
    return null;
}

function checkRateLimit() {
    const now = Date.now();
    if (!state.lastMessages) state.lastMessages = [];
    
    // Remove messages older than 5 seconds
    state.lastMessages = state.lastMessages.filter(time => now - time < 5000);
    
    if (state.lastMessages.length >= MESSAGE_RATE_LIMIT) {
        return false;
    }
    
    state.lastMessages.push(now);
    return true;
}

function detectMentions(content) {
    const mentions = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
        const username = match[1];
        const user = state.onlineUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (user) {
            mentions.push(user.id);
        }
    }
    
    return mentions;
}

// ============================================================================
// CHANNELS
// ============================================================================

function loadChannels() {
    fetch('/api/channels')
        .then(res => res.json())
        .then(channels => {
            state.channels = channels;
            renderChannels();
        })
        .catch(err => console.error('Failed to load channels:', err));
}

function loadVoiceChannels() {
    fetch('/api/voice-channels')
        .then(res => res.json())
        .then(channels => {
            state.voiceChannels = channels;
            renderVoiceChannels();
        })
        .catch(err => console.error('Failed to load voice channels:', err));
}

function switchChannel(channelId) {
    state.currentChannel = channelId;
    state.messages = [];
    
    socket.emit('join_channel', channelId);
    
    const channel = state.channels.find(c => c.id === channelId);
    if (channel) {
        elements.channelTitle.textContent = channel.name;
        elements.channelDesc.textContent = channel.desc;
        elements.headerIcon.textContent = channel.icon;
    }
    
    renderChannels();
    closeSidebar();
}

function createChannel() {
    if (!state.currentUser?.isMod) {
        showToast('Only moderators can create channels', 'error');
        return;
    }
    
    const name = prompt('Channel name:');
    if (!name) return;
    
    const icon = prompt('Channel icon (emoji):', '💬');
    const desc = prompt('Channel description:', 'New channel');
    
    const channelId = name.toLowerCase().replace(/\s+/g, '-');
    
    socket.emit('create_channel', {
        id: channelId,
        name,
        icon,
        desc,
        category: 'text'
    });
}

function deleteChannel(channelId) {
    if (!state.currentUser?.isMod) return;
    
    if (confirm(`Delete channel #${channelId}?`)) {
        socket.emit('delete_channel', channelId);
    }
}

function joinVoiceChannel(channelId) {
    if (state.activeVoiceChannel) {
        leaveVoiceChannel();
    }
    
    state.activeVoiceChannel = channelId;
    socket.emit('join_voice', channelId);
    showToast('Joined voice channel', 'success');
    renderVoiceChannels();
}

function leaveVoiceChannel() {
    if (!state.activeVoiceChannel) return;
    
    socket.emit('leave_voice', state.activeVoiceChannel);
    state.activeVoiceChannel = null;
    showToast('Left voice channel', 'info');
    renderVoiceChannels();
}

// ============================================================================
// RENDERING
// ============================================================================

function renderChannels() {
    if (!elements.channelList) return;
    
    elements.channelList.innerHTML = '';
    
    state.channels.forEach(channel => {
        const div = document.createElement('div');
        div.className = `channel ${channel.id === state.currentChannel ? 'active' : ''}`;
        div.innerHTML = `
            <span class="channel-icon">${channel.icon}</span>
            <span class="channel-name">${channel.name}</span>
            ${state.currentUser?.isMod ? `<button class="channel-delete" onclick="deleteChannel('${channel.id}')" title="Delete">×</button>` : ''}
        `;
        div.onclick = (e) => {
            if (!e.target.classList.contains('channel-delete')) {
                switchChannel(channel.id);
            }
        };
        elements.channelList.appendChild(div);
    });
}

function renderVoiceChannels() {
    if (!elements.voiceChannelList) return;
    
    elements.voiceChannelList.innerHTML = '';
    
    state.voiceChannels.forEach(vc => {
        const div = document.createElement('div');
        div.className = `voice-channel ${state.activeVoiceChannel === vc.id ? 'active' : ''}`;
        div.innerHTML = `
            <div class="vc-header">
                <span class="vc-icon">${vc.icon}</span>
                <span class="vc-name">${vc.name}</span>
                <span class="vc-count">${vc.participants.length}</span>
            </div>
        `;
        
        div.onclick = () => {
            if (state.activeVoiceChannel === vc.id) {
                leaveVoiceChannel();
            } else {
                joinVoiceChannel(vc.id);
            }
        };
        
        elements.voiceChannelList.appendChild(div);
    });
}

function renderMessages(searchQuery = '') {
    if (!elements.messageContainer) return;
    
    elements.messageContainer.innerHTML = '';
    
    if (state.messages.length === 0) {
        elements.messageContainer.innerHTML = `
            <div class="welcome">
                <div class="welcome-icon">🌸</div>
                <h3>Welcome to #${state.currentChannel}</h3>
                <p>Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    // Group messages by date
    const today = new Date().toDateString();
    let lastDate = null;
    
    state.messages.forEach((msg, index) => {
        const msgDate = new Date(msg.timestamp).toDateString();
        
        if (msgDate !== lastDate) {
            const divider = document.createElement('div');
            divider.className = 'date-divider';
            divider.innerHTML = `<span>${msgDate === today ? 'Today' : msgDate}</span>`;
            elements.messageContainer.appendChild(divider);
            lastDate = msgDate;
        }
        
        if (searchQuery && !msg.content.toLowerCase().includes(searchQuery.toLowerCase())) {
            return;
        }
        
        const msgEl = createMessageElement(msg);
        elements.messageContainer.appendChild(msgEl);
    });
    
    scrollToBottom();
}

function createMessageElement(msg) {
    const isOwn = msg.authorId === state.currentUser?.id;
    const isMentioned = msg.mentions && msg.mentions.includes(state.currentUser?.id);
    
    const div = document.createElement('div');
    div.className = `message ${isOwn ? 'own' : ''} ${isMentioned ? 'mentioned' : ''}`;
    div.dataset.messageId = msg.id;
    
    let content = `<div class="msg-text">${linkify(escapeHtml(msg.content))}</div>`;
    
    if (msg.image) {
        content += `<img src="${msg.image}" class="msg-image" onclick="openImageModal('${msg.image}')">`;
    }
    
    if (msg.edited) {
        content += `<span class="msg-edited">(edited)</span>`;
    }
    
    // Reactions
    let reactionsHTML = '';
    if (msg.reactions && Object.keys(msg.reactions).length > 0) {
        reactionsHTML = '<div class="msg-reactions">';
        for (let [emoji, users] of Object.entries(msg.reactions)) {
            const hasReacted = users.includes(state.currentUser?.id);
            reactionsHTML += `
                <button class="reaction ${hasReacted ? 'active' : ''}" 
                        onclick="toggleReaction('${msg.id}', '${emoji}')">
                    ${emoji} ${users.length}
                </button>
            `;
        }
        reactionsHTML += '</div>';
    }
    
    div.innerHTML = `
        <div class="msg-avatar ${msg.avatar}">${msg.author.charAt(0).toUpperCase()}</div>
        <div class="msg-content">
            <div class="msg-header">
                <span class="msg-author">${escapeHtml(msg.author)}</span>
                ${msg.role === 'moderator' ? '<span class="mod-badge">MOD</span>' : ''}
                ${msg.role === 'bot' ? '<span class="bot-badge">BOT</span>' : ''}
                <span class="msg-time">${formatTime(msg.timestamp)}</span>
            </div>
            ${msg.replyTo ? createReplyPreview(msg.replyTo) : ''}
            ${content}
            ${reactionsHTML}
            <div class="msg-actions">
                <button class="msg-action-btn" onclick="showReactionPicker('${msg.id}')" title="React">😊</button>
                <button class="msg-action-btn" onclick="replyToMessage('${msg.id}')" title="Reply">💬</button>
                ${!isOwn ? `<button class="msg-action-btn" onclick="openReportModal('${msg.id}')" title="Report">⚠️</button>` : ''}
                ${isOwn || state.currentUser?.isMod ? `<button class="msg-action-btn" onclick="deleteMessage('${msg.id}')" title="Delete">🗑️</button>` : ''}
                ${isOwn ? `<button class="msg-action-btn" onclick="editMessage('${msg.id}')" title="Edit">✏️</button>` : ''}
                ${state.currentUser?.isMod ? `<button class="msg-action-btn" onclick="pinMessage('${msg.id}')" title="Pin">📌</button>` : ''}
            </div>
        </div>
    `;
    
    return div;
}

function createReplyPreview(replyToId) {
    const replyMsg = state.messages.find(m => m.id === replyToId);
    if (!replyMsg) return '';
    
    return `
        <div class="msg-reply-preview">
            <span class="reply-author">${escapeHtml(replyMsg.author)}</span>
            <span class="reply-content">${escapeHtml(replyMsg.content.substring(0, 50))}${replyMsg.content.length > 50 ? '...' : ''}</span>
        </div>
    `;
}

function renderMembersList() {
    if (!elements.membersList) return;
    
    elements.membersList.innerHTML = '<h4>Online — ' + state.onlineUsers.length + '</h4>';
    
    state.onlineUsers.forEach(user => {
        const div = document.createElement('div');
        div.className = 'member';
        div.innerHTML = `
            <div class="member-avatar ${user.avatar}">
                ${user.username.charAt(0).toUpperCase()}
                <span class="status-dot ${user.status || 'online'}"></span>
            </div>
            <div class="member-info">
                <div class="member-name">${escapeHtml(user.username)}</div>
                ${user.customStatus ? `<div class="member-status">${escapeHtml(user.customStatus)}</div>` : ''}
            </div>
            ${user.id !== state.currentUser.id ? `<button class="member-dm" onclick="openDM('${user.id}', '${user.username}')">DM</button>` : ''}
        `;
        elements.membersList.appendChild(div);
    });
}

function renderDMMessages() {
    const dmContainer = document.getElementById('dmMessagesContainer');
    if (!dmContainer || !state.currentDMUser) return;
    
    const conversationId = getDMConversationId(state.currentUser.id, state.currentDMUser);
    const messages = state.directMessages.get(conversationId) || [];
    
    dmContainer.innerHTML = '';
    
    messages.forEach(dm => {
        const isOwn = dm.senderId === state.currentUser.id;
        const div = document.createElement('div');
        div.className = `dm-message ${isOwn ? 'own' : ''}`;
        div.innerHTML = `
            <div class="dm-content">
                <div class="dm-author">${isOwn ? 'You' : dm.senderName}</div>
                <div class="dm-text">${escapeHtml(dm.content)}</div>
                <div class="dm-time">${formatTime(dm.timestamp)}</div>
            </div>
        `;
        dmContainer.appendChild(div);
    });
    
    dmContainer.scrollTop = dmContainer.scrollHeight;
}

function renderPoll(poll) {
    const pollEl = document.createElement('div');
    pollEl.className = 'poll';
    pollEl.innerHTML = `
        <div class="poll-question">${escapeHtml(poll.question)}</div>
        <div class="poll-options">
            ${poll.options.map((opt, i) => {
                const percentage = poll.options.reduce((sum, o) => sum + o.votes.length, 0) > 0
                    ? Math.round((opt.votes.length / poll.options.reduce((sum, o) => sum + o.votes.length, 0)) * 100)
                    : 0;
                const hasVoted = opt.votes.includes(state.currentUser?.id);
                
                return `
                    <button class="poll-option ${hasVoted ? 'voted' : ''}" 
                            onclick="votePoll('${poll.id}', ${i})"
                            ${!poll.active ? 'disabled' : ''}>
                        <div class="poll-option-bar" style="width: ${percentage}%"></div>
                        <span class="poll-option-text">${escapeHtml(opt.text)}</span>
                        <span class="poll-option-votes">${opt.votes.length} (${percentage}%)</span>
                    </button>
                `;
            }).join('')}
        </div>
        <div class="poll-footer">
            ${poll.active ? `Expires in ${Math.ceil((poll.expiresAt - Date.now()) / 60000)} minutes` : 'Poll ended'}
        </div>
    `;
    
    // Insert poll into messages
    const pollMsg = state.messages.find(m => m.pollId === poll.id);
    if (pollMsg) {
        const msgEl = document.querySelector(`[data-message-id="${pollMsg.id}"]`);
        if (msgEl) {
            msgEl.querySelector('.msg-content').appendChild(pollEl);
        }
    }
}

function renderLeaderboard(leaderboard) {
    const container = document.getElementById('leaderboardContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="leaderboard">
            <h2>🏆 Top Players</h2>
            ${leaderboard.map((user, index) => `
                <div class="leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}">
                    <div class="leaderboard-rank">#${index + 1}</div>
                    <div class="leaderboard-user">
                        <div class="leaderboard-name">${escapeHtml(user.username || 'User')}</div>
                        <div class="leaderboard-stats">
                            Level ${user.level} • ${user.xp} XP • ${user.messageCount} messages
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================================================
// POLLS
// ============================================================================

function openPollCreator() {
    const question = prompt('Poll question:');
    if (!question) return;
    
    const optionsStr = prompt('Options (comma separated):');
    if (!optionsStr) return;
    
    const options = optionsStr.split(',').map(o => o.trim()).filter(Boolean);
    if (options.length < 2) {
        showToast('Poll needs at least 2 options', 'error');
        return;
    }
    
    const duration = parseInt(prompt('Duration in minutes:', '10'));
    if (!duration || duration < 1) {
        showToast('Invalid duration', 'error');
        return;
    }
    
    socket.emit('create_poll', {
        channel: state.currentChannel,
        question,
        options,
        duration
    });
}

function votePoll(pollId, optionIndex) {
    socket.emit('vote_poll', {
        channel: state.currentChannel,
        pollId,
        optionIndex
    });
}

// ============================================================================
// DIRECT MESSAGES
// ============================================================================

function openDM(userId, username) {
    state.currentView = 'dms';
    state.currentDMUser = userId;
    
    // Clear unread
    state.unreadDMs.delete(userId);
    updateDMNotifications();
    
    // Load DM history
    socket.emit('get_dm_history', userId);
    
    // Show DM view
    showView('dmView');
    document.getElementById('dmUsername').textContent = username;
    
    closeSidebar();
}

function sendDM() {
    const input = document.getElementById('dmInput');
    const content = input.value.trim();
    
    if (!content || !state.currentDMUser) return;
    
    sendDirectMessage(state.currentDMUser, content);
    input.value = '';
    
    // Optimistically add message
    const conversationId = getDMConversationId(state.currentUser.id, state.currentDMUser);
    if (!state.directMessages.has(conversationId)) {
        state.directMessages.set(conversationId, []);
    }
    
    state.directMessages.get(conversationId).push({
        id: 'temp_' + Date.now(),
        senderId: state.currentUser.id,
        senderName: state.currentUser.username,
        content,
        timestamp: Date.now()
    });
    
    renderDMMessages();
}

function getDMConversationId(user1, user2) {
    return [user1, user2].sort().join('_');
}

// ============================================================================
// UI HELPERS
// ============================================================================

function showView(viewName) {
    ['chatView', 'profileView', 'dmView', 'settingsView', 'leaderboardView'].forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = v === viewName ? 'flex' : 'none';
    });
}

function updateUserUI() {
    if (!state.currentUser) return;
    
    if (elements.userAvatar) {
        elements.userAvatar.textContent = state.currentUser.username.charAt(0).toUpperCase();
        elements.userAvatar.className = 'avatar ' + state.currentUser.avatar;
    }
    
    if (elements.userName) {
        elements.userName.textContent = state.currentUser.username;
    }
    
    if (elements.userRole) {
        elements.userRole.textContent = state.currentUser.isMod ? 'Moderator' : 'Member';
        elements.userRole.style.color = state.currentUser.isMod ? 'var(--primary)' : 'var(--text-muted)';
    }
}

function updateProfileUI() {
    if (!state.userProfile) return;
    
    document.getElementById('profileLevel').textContent = state.userProfile.level;
    document.getElementById('profileXP').textContent = state.userProfile.xp;
    document.getElementById('profileMessages').textContent = state.userProfile.messageCount;
    
    const xpBar = document.getElementById('profileXPBar');
    if (xpBar) {
        const xpForNext = state.userProfile.level * 100;
        const percentage = (state.userProfile.xp / xpForNext) * 100;
        xpBar.style.width = percentage + '%';
    }
}

function updateOnlineCount(count) {
    if (elements.onlineCount) {
        elements.onlineCount.textContent = count + ' online';
    }
}

function updateCharacterCount(length) {
    const counter = document.getElementById('charCounter');
    if (counter) {
        counter.textContent = `${length}/${MAX_MESSAGE_LENGTH}`;
        counter.style.color = length > MAX_MESSAGE_LENGTH * 0.9 ? 'var(--danger)' : 'var(--text-muted)';
    }
}

function updatePinnedMessages() {
    if (!elements.pinnedMessageBar) return;
    
    if (state.pinnedMessages.length === 0) {
        elements.pinnedMessageBar.style.display = 'none';
        return;
    }
    
    elements.pinnedMessageBar.style.display = 'flex';
    const pinnedMsg = state.messages.find(m => m.id === state.pinnedMessages[0]);
    if (pinnedMsg) {
        elements.pinnedMessageBar.innerHTML = `
            <span>📌 ${escapeHtml(pinnedMsg.content.substring(0, 100))}</span>
            ${state.currentUser?.isMod ? `<button onclick="unpinMessage('${pinnedMsg.id}')">×</button>` : ''}
        `;
    }
}

function updateDMNotifications() {
    const totalUnread = Array.from(state.unreadDMs.values()).reduce((sum, count) => sum + count, 0);
    
    if (elements.notificationBadge) {
        if (totalUnread > 0) {
            elements.notificationBadge.textContent = totalUnread;
            elements.notificationBadge.style.display = 'block';
        } else {
            elements.notificationBadge.style.display = 'none';
        }
    }
}

function showTyping(author) {
    if (!elements.typingIndicator) return;
    
    elements.typingIndicator.querySelector('span').textContent = `${author} is typing...`;
    elements.typingIndicator.classList.add('active');
    
    clearTimeout(window.typingTimer);
    window.typingTimer = setTimeout(() => {
        elements.typingIndicator.classList.remove('active');
    }, 3000);
}

function showReplyPreview(msg) {
    const preview = document.getElementById('replyPreview');
    if (preview) {
        preview.innerHTML = `
            <div class="reply-preview-content">
                <span>Replying to ${escapeHtml(msg.author)}</span>
                <button onclick="clearReplyPreview()">×</button>
            </div>
        `;
        preview.style.display = 'flex';
    }
}

function clearReplyPreview() {
    state.replyingTo = null;
    const preview = document.getElementById('replyPreview');
    if (preview) preview.style.display = 'none';
}

function showEditingIndicator(msg) {
    const indicator = document.getElementById('editingIndicator');
    if (indicator) {
        indicator.innerHTML = `
            <div class="editing-indicator-content">
                <span>Editing message</span>
                <button onclick="cancelEdit()">Cancel</button>
            </div>
        `;
        indicator.style.display = 'flex';
    }
}

function hideEditingIndicator() {
    const indicator = document.getElementById('editingIndicator');
    if (indicator) indicator.style.display = 'none';
}

function showLevelUpAnimation(level) {
    const animation = document.createElement('div');
    animation.className = 'level-up-animation';
    animation.innerHTML = `
        <div class="level-up-content">
            <h2>🎉 Level Up!</h2>
            <p>You reached level ${level}</p>
        </div>
    `;
    document.body.appendChild(animation);
    
    setTimeout(() => {
        animation.classList.add('fade-out');
        setTimeout(() => animation.remove(), 500);
    }, 3000);
}

// ============================================================================
// MODERATION
// ============================================================================

function pinMessage(messageId) {
    socket.emit('pin_message', {
        channel: state.currentChannel,
        messageId
    });
}

function unpinMessage(messageId) {
    socket.emit('unpin_message', {
        channel: state.currentChannel,
        messageId
    });
}

function openReportModal(messageId) {
    const msg = state.messages.find(m => m.id === messageId);
    if (!msg) return;
    
    const modal = document.getElementById('reportModal');
    if (modal) {
        document.getElementById('reportedContent').textContent = msg.content.substring(0, 100);
        modal.dataset.messageId = messageId;
        modal.dataset.userId = msg.authorId;
        modal.classList.remove('hidden');
    }
}

function submitReport() {
    const modal = document.getElementById('reportModal');
    const reason = document.querySelector('input[name="reason"]:checked')?.value;
    
    if (!reason) {
        showToast('Please select a reason', 'error');
        return;
    }
    
    socket.emit('report_message', {
        messageId: modal.dataset.messageId,
        userId: modal.dataset.userId,
        reason,
        content: document.getElementById('reportedContent').textContent
    });
    
    showToast('Report submitted', 'success');
    closeReportModal();
}

function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) modal.classList.add('hidden');
}

function muteUser(userId, duration) {
    if (!state.currentUser?.isMod) return;
    
    socket.emit('mute_user', { userId, duration });
    showToast(`User muted for ${duration} minutes`, 'success');
}

function banUser(userId, reason) {
    if (!state.currentUser?.isMod) return;
    
    if (confirm('Are you sure you want to ban this user?')) {
        socket.emit('ban_user', { userId, reason });
        showToast('User banned', 'success');
    }
}

// ============================================================================
// REACTIONS & EMOJI
// ============================================================================

function toggleReaction(messageId, emoji) {
    const msg = state.messages.find(m => m.id === messageId);
    if (!msg) return;
    
    const hasReacted = msg.reactions[emoji]?.includes(state.currentUser?.id);
    
    if (hasReacted) {
        removeReaction(messageId, emoji);
    } else {
        addReaction(messageId, emoji);
    }
}

function showReactionPicker(messageId) {
    const msg = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!msg) return;
    
    const picker = document.createElement('div');
    picker.className = 'reaction-picker';
    picker.innerHTML = EMOJI_LIST.map(emoji => 
        `<button onclick="addReaction('${messageId}', '${emoji}'); this.parentElement.remove()">${emoji}</button>`
    ).join('');
    
    msg.querySelector('.msg-content').appendChild(picker);
    
    setTimeout(() => picker.classList.add('active'), 10);
}

function toggleEmojiPicker() {
    if (!elements.emojiPicker) return;
    
    const isVisible = elements.emojiPicker.style.display === 'block';
    elements.emojiPicker.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible && elements.emojiPicker.children.length === 0) {
        // Populate emoji picker
        elements.emojiPicker.innerHTML = EMOJI_LIST.map(emoji => 
            `<button class="emoji-btn" onclick="insertEmoji('${emoji}')">${emoji}</button>`
        ).join('');
    }
}

function insertEmoji(emoji) {
    const input = elements.msgInput;
    const cursorPos = input.selectionStart;
    const text = input.value;
    
    input.value = text.substring(0, cursorPos) + emoji + text.substring(cursorPos);
    input.focus();
    input.selectionStart = input.selectionEnd = cursorPos + emoji.length;
    
    elements.emojiPicker.style.display = 'none';
}

// ============================================================================
// SETTINGS & PREFERENCES
// ============================================================================

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.body.classList.toggle('light-theme', state.theme === 'light');
    localStorage.setItem('theme', state.theme);
}

function loadTheme() {
    if (state.theme === 'light') {
        document.body.classList.add('light-theme');
    }
}

function toggleNotifications() {
    state.notificationsEnabled = !state.notificationsEnabled;
    localStorage.setItem('notifications', state.notificationsEnabled);
    showToast(`Notifications ${state.notificationsEnabled ? 'enabled' : 'disabled'}`, 'info');
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem('sound', state.soundEnabled);
    showToast(`Sound ${state.soundEnabled ? 'enabled' : 'disabled'}`, 'info');
}

function updateStatus(status) {
    state.userStatus = status;
    socket.emit('update_status', {
        status,
        customStatus: state.customStatus
    });
}

function setCustomStatus() {
    const status = prompt('Set custom status:');
    if (status !== null) {
        state.customStatus = status;
        socket.emit('update_status', {
            status: state.userStatus,
            customStatus: status
        });
    }
}

function showStatusMenu() {
    const menu = document.createElement('div');
    menu.id = 'statusMenu';
    menu.className = 'status-menu';
    menu.innerHTML = `
        <button onclick="updateStatus('online')">🟢 Online</button>
        <button onclick="updateStatus('away')">🟡 Away</button>
        <button onclick="updateStatus('dnd')">🔴 Do Not Disturb</button>
        <button onclick="updateStatus('invisible')">⚫ Invisible</button>
        <hr>
        <button onclick="setCustomStatus()">✏️ Set Custom Status</button>
    `;
    
    const existing = document.getElementById('statusMenu');
    if (existing) existing.remove();
    
    document.body.appendChild(menu);
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function initializeNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function addNotification(notification) {
    state.notifications.unshift({
        ...notification,
        id: Date.now(),
        read: false
    });
    
    // Keep only last 50 notifications
    if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
    }
    
    updateNotificationBadge();
    
    // Browser notification
    if (state.notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('AniConnect', {
            body: notification.content.substring(0, 100),
            icon: '/favicon.ico'
        });
    }
}

function updateNotificationBadge() {
    const unread = state.notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = unread;
        badge.style.display = unread > 0 ? 'block' : 'none';
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function linkify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
}

function formatTime(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    if (elements.messageContainer) {
        elements.messageContainer.scrollTop = elements.messageContainer.scrollHeight;
    }
}

function playNotificationSound() {
    if (!state.soundEnabled) return;
    
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 800;
        gain.gain.value = 0.1;
        
        osc.start();
        setTimeout(() => osc.stop(), 100);
    } catch(e) {
        console.error('Could not play sound:', e);
    }
}

function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openSidebar() {
    elements.sidebar?.classList.add('open');
    elements.mobileOverlay?.classList.add('active');
}

function closeSidebar() {
    elements.sidebar?.classList.remove('open');
    elements.mobileOverlay?.classList.remove('active');
}

function hideLogin() {
    if (elements.loginModal) {
        elements.loginModal.style.display = 'none';
    }
}

function showEmailLogin() {
    document.querySelector('.social-login').style.display = 'none';
    document.getElementById('emailForm').classList.remove('hidden');
}

function showSocialLogin() {
    document.querySelector('.social-login').style.display = 'flex';
    document.getElementById('emailForm').classList.add('hidden');
}

function toggleModLogin() {
    document.getElementById('modForm').classList.toggle('hidden');
}

function toggleMembers() {
    elements.membersSidebar?.classList.toggle('hidden');
    if (!elements.membersSidebar?.classList.contains('hidden')) {
        renderMembersList();
    }
}

function toggleSearch() {
    elements.searchBar?.classList.toggle('active');
    if (!elements.searchBar?.classList.contains('active')) {
        elements.searchInput.value = '';
        renderMessages();
    }
}

function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-content">
            <button class="image-modal-close" onclick="this.parentElement.parentElement.remove()">×</button>
            <img src="${imageUrl}" alt="Full size image">
        </div>
    `;
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
}

function renderSearchResults(results) {
    if (!elements.searchResults) return;
    
    if (results.length === 0) {
        elements.searchResults.innerHTML = '<div class="no-results">No results found</div>';
        elements.searchResults.style.display = 'block';
        return;
    }
    
    elements.searchResults.innerHTML = results.slice(0, 10).map(msg => `
        <div class="search-result" onclick="scrollToMessage('${msg.id}')">
            <div class="search-result-author">${escapeHtml(msg.author)}</div>
            <div class="search-result-content">${escapeHtml(msg.content.substring(0, 100))}</div>
            <div class="search-result-time">${formatTime(msg.timestamp)}</div>
        </div>
    `).join('');
    
    elements.searchResults.style.display = 'block';
}

function scrollToMessage(messageId) {
    const msgEl = document.querySelector(`[data-message-id="${messageId}"]`);
    if (msgEl) {
        msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        msgEl.classList.add('highlighted');
        setTimeout(() => msgEl.classList.remove('highlighted'), 2000);
    }
    elements.searchResults.style.display = 'none';
}

function startActivityTracking() {
    // Track user activity for stats
    setInterval(() => {
        if (state.currentUser) {
            socket.emit('heartbeat');
        }
    }, 60000); // Every minute
}

function checkForUpdates() {
    // Check for server updates
    socket.on('server_update', (data) => {
        showToast(data.message, 'info');
    });
}

function updateServerStats(stats) {
    // Update dashboard stats if visible
    const statsEl = document.getElementById('serverStats');
    if (statsEl) {
        statsEl.innerHTML = `
            <div class="stat">
                <span class="stat-label">Total Messages</span>
                <span class="stat-value">${stats.totalMessages.toLocaleString()}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Total Users</span>
                <span class="stat-value">${stats.totalUsers}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Active Users</span>
                <span class="stat-value">${stats.activeUsers}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Channels</span>
                <span class="stat-value">${stats.channels}</span>
            </div>
        `;
    }
}

// Export for debugging
window.AniConnect = {
    state,
    socket,
    sendMessage,
    switchChannel,
    logout
};

console.log('🌸 AniConnect Enhanced loaded successfully!');

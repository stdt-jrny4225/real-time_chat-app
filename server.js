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
app.use(express.static(path.join(__dirname, 'public')));

// Store active users
const users = {};
const userSockets = {};

// Store groups with their members and settings
const groups = {};
const groupMessages = {};

// Community chat
const communityMessages = [];

// Generate unique ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Handle Socket.io connections
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  // User joins/registers
  socket.on('user-join', (userData) => {
    users[socket.id] = {
      id: socket.id,
      name: userData.name,
      avatar: userData.avatar || `https://ui-avatars.com/api/?name=${userData.name}&background=random`,
      joinedAt: new Date()
    };
    userSockets[socket.id] = socket;

    // Broadcast updated user list
    io.emit('user-list-update', Object.values(users));
    console.log('User registered:', userData.name);
  });

  // ===== PERSONAL MESSAGES =====
  socket.on('send-personal-message', (messageData) => {
    const sender = users[socket.id];
    if (sender && messageData.recipientId) {
      const message = {
        id: Date.now(),
        sender: sender,
        recipientId: messageData.recipientId,
        content: messageData.content,
        timestamp: new Date(),
        type: 'personal',
        read: false
      };

      // Send to recipient
      io.to(messageData.recipientId).emit('receive-personal-message', message);
      // Send to sender
      socket.emit('personal-message-sent', message);
      console.log(`Personal message from ${sender.name} to ${messageData.recipientId}`);
    }
  });

  // ===== GROUP MESSAGES =====
  socket.on('create-group', (groupData) => {
    const sender = users[socket.id];
    if (sender) {
      const groupId = generateId();
      const isPrivate = !!groupData.password;
      
      groups[groupId] = {
        id: groupId,
        name: groupData.name,
        description: groupData.description || '',
        password: isPrivate ? groupData.password : null,
        createdBy: sender.id,
        creator: sender,
        members: [socket.id], // Auto-add creator
        createdAt: new Date(),
        isPrivate: isPrivate
      };
      groupMessages[groupId] = [];

      socket.join(`group-${groupId}`);

      // Notify all users about new group
      io.emit('group-created', groups[groupId]);
      console.log('Group created:', groupData.name, 'ID:', groupId);
    }
  });

  socket.on('join-group', (groupData) => {
    const sender = users[socket.id];
    const { groupId, password } = groupData;

    if (!groups[groupId]) {
      socket.emit('group-error', { message: 'Group not found' });
      return;
    }

    const group = groups[groupId];

    // Check password if group is private
    if (group.isPrivate) {
      if (!password || password !== group.password) {
        socket.emit('group-error', { message: 'Invalid password' });
        return;
      }
    }

    // Add member if not already in group
    if (!group.members.includes(socket.id)) {
      group.members.push(socket.id);
    }

    socket.join(`group-${groupId}`);

    // Notify group members
    io.to(`group-${groupId}`).emit('group-member-joined', {
      groupId,
      member: sender,
      totalMembers: group.members.length
    });

    // Send group messages history to user
    socket.emit('group-messages-history', {
      groupId,
      messages: groupMessages[groupId],
      group: group
    });

    console.log(`${sender.name} joined group ${group.name}`);
  });

  socket.on('send-group-message', (messageData) => {
    const sender = users[socket.id];
    if (sender && messageData.groupId) {
      const group = groups[messageData.groupId];
      if (!group || !group.members.includes(socket.id)) {
        socket.emit('group-error', { message: 'You are not a member of this group' });
        return;
      }

      const message = {
        id: Date.now(),
        sender: sender,
        content: messageData.content,
        timestamp: new Date(),
        type: 'group',
        groupId: messageData.groupId,
        read: false
      };

      groupMessages[messageData.groupId].push(message);
      io.to(`group-${messageData.groupId}`).emit('receive-group-message', message);
      console.log(`Group message from ${sender.name} in ${group.name}`);
    }
  });

  socket.on('leave-group', (groupData) => {
    const sender = users[socket.id];
    const { groupId } = groupData;

    if (groups[groupId]) {
      groups[groupId].members = groups[groupId].members.filter(id => id !== socket.id);
      socket.leave(`group-${groupId}`);

      io.to(`group-${groupId}`).emit('group-member-left', {
        groupId,
        member: sender,
        totalMembers: groups[groupId].members.length
      });

      console.log(`${sender.name} left group ${groups[groupId].name}`);
    }
  });

  // ===== COMMUNITY MESSAGES =====
  socket.on('join-community', () => {
    const sender = users[socket.id];
    socket.join('community');
    
    // Send community messages history
    socket.emit('community-messages-history', communityMessages);
    
    // Notify community
    io.to('community').emit('community-member-joined', sender);
    console.log(`${sender.name} joined community`);
  });

  socket.on('send-community-message', (messageData) => {
    const sender = users[socket.id];
    if (sender) {
      const message = {
        id: Date.now(),
        sender: sender,
        content: messageData.content,
        timestamp: new Date(),
        type: 'community',
        read: false
      };

      communityMessages.push(message);
      io.to('community').emit('receive-community-message', message);
      console.log(`Community message from ${sender.name}`);
    }
  });

  // ===== USER PROFILE UPDATE =====
  socket.on('update-profile', (profile) => {
    const user = users[socket.id];
    if (user) {
      // Update allowed profile fields
      if (profile.name) user.name = profile.name;
      if (profile.avatar) user.avatar = profile.avatar;
      if (profile.bio !== undefined) user.bio = profile.bio;

      // Broadcast updated user info
      io.emit('user-list-update', Object.values(users));
      io.emit('user-profile-updated', user);
      console.log('User profile updated:', user.name);
    }
  });

  socket.on('leave-community', () => {
    const sender = users[socket.id];
    socket.leave('community');
    io.to('community').emit('community-member-left', sender);
    console.log(`${sender.name} left community`);
  });

  // Get all groups
  socket.on('get-groups', () => {
    socket.emit('groups-list', Object.values(groups));
  });

  // Handle user typing in group
  socket.on('group-typing', (typingData) => {
    const sender = users[socket.id];
    if (sender && typingData.groupId) {
      io.to(`group-${typingData.groupId}`).emit('group-user-typing', {
        userId: socket.id,
        userName: sender.name,
        isTyping: typingData.isTyping,
        groupId: typingData.groupId
      });
    }
  });

  // Handle community typing
  socket.on('community-typing', (typingData) => {
    const sender = users[socket.id];
    if (sender) {
      io.to('community').emit('community-user-typing', {
        userId: socket.id,
        userName: sender.name,
        isTyping: typingData.isTyping
      });
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      console.log('User disconnected:', user.name);

      // Remove from groups
      Object.keys(groups).forEach(groupId => {
        const group = groups[groupId];
        if (group.members.includes(socket.id)) {
          group.members = group.members.filter(id => id !== socket.id);
          io.to(`group-${groupId}`).emit('group-member-left', {
            groupId,
            member: user,
            totalMembers: group.members.length
          });
        }
      });

      delete users[socket.id];
      delete userSockets[socket.id];
      io.emit('user-list-update', Object.values(users));
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

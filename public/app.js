// Socket.io initialization
const socket = io();

// State management
let currentUser = null;
let selectedUserId = null;
let selectedGroupId = null;
let selectedMode = 'personal'; // personal, group, community
let conversations = {};
let groups = {};
let communityMessages = [];
let communityJoined = false;
let groupMembers = {};
let typingUsers = {};

// DOM Elements
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const isNewUserCheckbox = document.getElementById('isNewUser');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');

const setupModal = document.getElementById('setupModal');
const setupForm = document.getElementById('setupForm');
const userNameInput = document.getElementById('userName');
const userList = document.getElementById('userList');
const groupList = document.getElementById('groupList');
const messagesArea = document.getElementById('messagesArea');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatHeader = document.getElementById('chatHeader');
const chatUserName = document.getElementById('chatUserName');
const chatUserAvatar = document.getElementById('chatUserAvatar');
const userStatus = document.getElementById('userStatus');
const inputArea = document.getElementById('inputArea');
const sidebar = document.querySelector('.sidebar');

// Tab navigation
const tabBtns = document.querySelectorAll('.tab-btn');
const chatSections = document.querySelectorAll('.chat-section');

// Modals
const createGroupModal = document.getElementById('createGroupModal');
const createGroupForm = document.getElementById('createGroupForm');
const joinGroupModal = document.getElementById('joinGroupModal');
const joinGroupForm = document.getElementById('joinGroupForm');
const groupMembersModal = document.getElementById('groupMembersModal');
const profileModal = document.getElementById('profileModal');
const profileForm = document.getElementById('profileForm');
const profileNameInput = document.getElementById('profileName');
const profileAvatarInput = document.getElementById('profileAvatar');
const profileBioInput = document.getElementById('profileBio');

// Mobile menu
const mobileMenuBtn = document.getElementById('mobileMenuBtn');

// Buttons
const createGroupBtn = document.getElementById('createGroupBtn');
const cancelGroupBtn = document.getElementById('cancelGroupBtn');
const cancelJoinGroupBtn = document.getElementById('cancelJoinGroupBtn');
const closeGroupMembersBtn = document.getElementById('closeGroupMembersBtn');
const joinCommunityBtn = document.getElementById('joinCommunityBtn');
const leaveBtn = document.getElementById('leaveBtn');
const profileBtn = document.getElementById('profileBtn');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // ===== MOBILE MENU HANDLERS =====
  function closeSidebar() {
    sidebar.classList.remove('active');
  }

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    });
  }

  // Close sidebar when clicking on a tab
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Close sidebar after tab selection on mobile
      setTimeout(closeSidebar, 100);
    });
  });

  // Close sidebar when clicking on a user or group
  document.addEventListener('click', (e) => {
    if (e.target.closest('.user-item') && window.innerWidth <= 768) {
      closeSidebar();
    }
    if (e.target.closest('.group-item') && window.innerWidth <= 768) {
      closeSidebar();
    }
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    const isClickInsideSidebar = sidebar.contains(e.target);
    const isMenuBtn = mobileMenuBtn && mobileMenuBtn.contains(e.target);
    if (!isClickInsideSidebar && !isMenuBtn && sidebar.classList.contains('active') && window.innerWidth <= 768) {
      closeSidebar();
    }
  });

  let savedUser = sessionStorage.getItem('chatvibe_user');
  
  if (savedUser) {
    const user = JSON.parse(savedUser);
    currentUser = user;
    socket.emit('user-join', currentUser);
    setupModal.classList.remove('active');
    messageInput.disabled = false;
    sendBtn.disabled = false;
    loginModal.classList.remove('active');
  } else {
    loginModal.classList.add('active');
  }
});

// ===== LOGIN FEATURE =====
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();
  const isNew = isNewUserCheckbox.checked;

  if (!username || !password) {
    alert('Username and password are required');
    return;
  }

  let users = JSON.parse(localStorage.getItem('chatvibe_users') || '{}');

  if (isNew) {
    if (users[username]) {
      alert('Username already exists! Please use a different username.');
      return;
    }
    users[username] = { password };
    localStorage.setItem('chatvibe_users', JSON.stringify(users));
    alert('Account created successfully! Please login with your credentials.');
    loginForm.reset();
    isNewUserCheckbox.checked = false;
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Login';
    loginUsername.focus();
    return;
  } else {
    if (!users[username] || users[username].password !== password) {
      alert('Invalid username or password!');
      return;
    }
  }

  currentUser = {
    name: username,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&bold=true`
  };

  sessionStorage.setItem('chatvibe_user', JSON.stringify(currentUser));
  socket.emit('user-join', currentUser);

  loginModal.classList.remove('active');
  setupModal.classList.remove('active');
  messageInput.disabled = false;
  sendBtn.disabled = false;
  loginForm.reset();
});

isNewUserCheckbox.addEventListener('change', () => {
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.textContent = isNewUserCheckbox.checked ? 'Create Account' : 'Login';
});

setupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = userNameInput.value.trim();
  if (name) {
    currentUser = {
      name,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&bold=true`
    };
    sessionStorage.setItem('chatvibe_user', JSON.stringify(currentUser));
    socket.emit('user-join', currentUser);
    setupModal.classList.remove('active');
    messageInput.disabled = false;
    sendBtn.disabled = false;
  }
});

// ===== PROFILE MANAGEMENT =====
function openProfileModal(user, editable) {
  if (!profileModal || !user) return;
  profileModal.classList.add('active');
  profileNameInput.value = user.name || '';
  profileAvatarInput.value = user.avatar || '';
  profileBioInput.value = user.bio || '';

  profileNameInput.disabled = !editable;
  profileAvatarInput.disabled = !editable;
  profileBioInput.disabled = !editable;
  const titleEl = document.getElementById('profileModalTitle');
  if (titleEl) titleEl.textContent = editable ? 'Your Profile' : `${user.name} - Profile`;
  const saveBtn = profileForm ? profileForm.querySelector('#saveProfileBtn') : null;
  if (saveBtn) saveBtn.style.display = editable ? 'inline-block' : 'none';
}

if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    openProfileModal(currentUser || { name: '', avatar: '' }, true);
  });
}

if (cancelProfileBtn) {
  cancelProfileBtn.addEventListener('click', () => {
    profileModal.classList.remove('active');
  });
}

if (profileForm) {
  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = profileNameInput.value.trim();
    const avatar = profileAvatarInput.value.trim();
    const bio = profileBioInput.value.trim();

    if (!name) {
      alert('Display name is required');
      return;
    }

    currentUser = currentUser || {};
    currentUser.name = name;
    currentUser.avatar = avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&bold=true`;
    currentUser.bio = bio;
    sessionStorage.setItem('chatvibe_user', JSON.stringify(currentUser));

    socket.emit('update-profile', {
      name: currentUser.name,
      avatar: currentUser.avatar,
      bio: currentUser.bio
    });

    profileModal.classList.remove('active');
  });
}

// Listen for profile updates from server
socket.on('user-profile-updated', (user) => {
  console.log('Profile updated:', user.name);
});

// Tab navigation
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    chatSections.forEach(s => s.classList.remove('active'));
    document.getElementById(`${mode}Section`).classList.add('active');
    
    selectedMode = mode;
    selectedUserId = null;
    selectedGroupId = null;
    
    messagesArea.innerHTML = '<div class="empty-state"><p>Select a conversation</p></div>';
    messageInput.disabled = true;
    sendBtn.disabled = true;
    leaveBtn.style.display = 'none';
    
    if (mode === 'group') {
      socket.emit('get-groups');
    } else if (mode === 'community') {
      updateCommunityButton();
    }
  });
});

// Create group
createGroupBtn.addEventListener('click', () => {
  createGroupModal.classList.add('active');
});

cancelGroupBtn.addEventListener('click', () => {
  createGroupModal.classList.remove('active');
  createGroupForm.reset();
});

createGroupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const groupName = document.getElementById('groupName').value.trim();
  const description = document.getElementById('groupDescription').value.trim();
  const password = document.getElementById('groupPassword').value.trim();

  if (groupName) {
    socket.emit('create-group', {
      name: groupName,
      description: description || '',
      password: password || null
    });
    createGroupForm.reset();
    createGroupModal.classList.remove('active');
  }
});

// Update community button
function updateCommunityButton() {
  if (communityJoined) {
    joinCommunityBtn.textContent = 'Leave Community';
    joinCommunityBtn.style.background = 'var(--border-color)';
  } else {
    joinCommunityBtn.textContent = 'Join Community';
    joinCommunityBtn.style.background = 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)';
  }
}

// Join community
joinCommunityBtn.addEventListener('click', () => {
  if (!communityJoined) {
    socket.emit('join-community');
    communityJoined = true;
    updateCommunityButton();
    messagesArea.innerHTML = '';
    messageInput.disabled = false;
    sendBtn.disabled = false;
    chatUserName.textContent = 'Community Hall';
    chatUserAvatar.src = 'https://ui-avatars.com/api/?name=Community&background=A55CE8&bold=true';
    userStatus.textContent = 'all users';
    leaveBtn.style.display = 'flex';
  } else {
    socket.emit('leave-community');
    communityJoined = false;
    updateCommunityButton();
    messagesArea.innerHTML = '<div class="empty-state"><p>Select a conversation</p></div>';
    messageInput.disabled = true;
    sendBtn.disabled = true;
    leaveBtn.style.display = 'none';
  }
});

leaveBtn.addEventListener('click', () => {
  if (selectedMode === 'group' && selectedGroupId) {
    socket.emit('leave-group', { groupId: selectedGroupId });
    selectedGroupId = null;
    selectedMode = 'group';
  } else if (selectedMode === 'community') {
    socket.emit('leave-community');
    communityJoined = false;
    updateCommunityButton();
  }
  messagesArea.innerHTML = '<div class="empty-state"><p>Select a conversation</p></div>';
  messageInput.disabled = true;
  sendBtn.disabled = true;
  leaveBtn.style.display = 'none';
});

// Message input events
messageInput.addEventListener('input', (e) => {
  if (selectedMode === 'personal' && selectedUserId) {
    socket.emit('typing', {
      recipientId: selectedUserId,
      isTyping: e.target.value.length > 0
    });
  } else if (selectedMode === 'group' && selectedGroupId) {
    socket.emit('group-typing', {
      groupId: selectedGroupId,
      isTyping: e.target.value.length > 0
    });
  } else if (selectedMode === 'community') {
    socket.emit('community-typing', {
      isTyping: e.target.value.length > 0
    });
  }
});

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

// Send message function
function sendMessage() {
  const content = messageInput.value.trim();
  if (!content) return;

  if (selectedMode === 'personal' && selectedUserId) {
    socket.emit('send-personal-message', {
      content,
      recipientId: selectedUserId
    });
  } else if (selectedMode === 'group' && selectedGroupId) {
    socket.emit('send-group-message', {
      content,
      groupId: selectedGroupId
    });
  } else if (selectedMode === 'community') {
    socket.emit('send-community-message', {
      content
    });
  }

  messageInput.value = '';
  messageInput.focus();
}

// ===== SOCKET EVENTS =====

// User list update
socket.on('user-list-update', (usersList) => {
  updateUserList(usersList);
});

// Personal messages
socket.on('receive-personal-message', (message) => {
  if (!conversations[message.sender.id]) {
    conversations[message.sender.id] = [];
  }
  conversations[message.sender.id].push(message);

  if (message.sender.id === selectedUserId && selectedMode === 'personal') {
    addMessageToUI(message, 'received');
  }
});

socket.on('personal-message-sent', (message) => {
  if (!conversations[message.recipientId]) {
    conversations[message.recipientId] = [];
  }
  conversations[message.recipientId].push(message);

  if (message.recipientId === selectedUserId && selectedMode === 'personal') {
    addMessageToUI(message, 'sent');
  }
});

// Group events
socket.on('group-created', (group) => {
  groups[group.id] = group;
  socket.emit('get-groups');
});

socket.on('groups-list', (groupsList) => {
  updateGroupsList(groupsList);
});

socket.on('group-member-joined', (data) => {
  if (selectedGroupId === data.groupId) {
    addSystemMessage(`${data.member.name} joined the group`);
  }
});

socket.on('group-member-left', (data) => {
  if (selectedGroupId === data.groupId) {
    addSystemMessage(`${data.member.name} left the group`);
  }
});

socket.on('receive-group-message', (message) => {
  if (message.groupId === selectedGroupId && selectedMode === 'group') {
    addGroupMessageToUI(message);
  }
});

socket.on('group-messages-history', (data) => {
  selectedGroupId = data.groupId;
  groupMembers[data.groupId] = data.group.members;
  messagesArea.innerHTML = '';
  
  chatUserName.textContent = data.group.name;
  chatUserAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.group.name)}&background=A55CE8&bold=true`;
  userStatus.textContent = `${data.group.members.length} members`;
  leaveBtn.style.display = 'flex';
  messageInput.disabled = false;
  sendBtn.disabled = false;

  data.messages.forEach(msg => {
    addGroupMessageToUI(msg);
  });
});

socket.on('group-user-typing', (data) => {
  if (data.groupId === selectedGroupId) {
    if (data.isTyping) {
      typingUsers[data.userId] = data.userName;
      showGroupTypingIndicator();
    } else {
      delete typingUsers[data.userId];
      if (Object.keys(typingUsers).length === 0) {
        removeTypingIndicator();
      }
    }
  }
});

socket.on('group-error', (data) => {
  alert('Error: ' + data.message);
});

// Community messages
socket.on('community-messages-history', (messages) => {
  messagesArea.innerHTML = '';
  messages.forEach(msg => {
    addCommunityMessageToUI(msg);
  });
});

socket.on('receive-community-message', (message) => {
  if (selectedMode === 'community') {
    addCommunityMessageToUI(message);
  }
});

socket.on('community-member-joined', (member) => {
  if (selectedMode === 'community') {
    addSystemMessage(`${member.name} joined the community`);
  }
});

socket.on('community-member-left', (member) => {
  if (selectedMode === 'community') {
    addSystemMessage(`${member.name} left the community`);
  }
});

socket.on('community-user-typing', (data) => {
  if (selectedMode === 'community') {
    if (data.isTyping) {
      typingUsers[data.userId] = data.userName;
      showGroupTypingIndicator();
    } else {
      delete typingUsers[data.userId];
      if (Object.keys(typingUsers).length === 0) {
        removeTypingIndicator();
      }
    }
  }
});

// ===== UI FUNCTIONS =====

function updateUserList(usersList) {
  userList.innerHTML = '';
  usersList.forEach(user => {
    if (user.id !== socket.id) {
      const userItem = document.createElement('li');
      userItem.className = 'user-item';
      if (user.id === selectedUserId && selectedMode === 'personal') {
        userItem.classList.add('active');
      }

      userItem.innerHTML = `
        <img src="${user.avatar}" alt="${user.name}" class="user-avatar">
        <div class="user-info">
          <div class="user-name">${user.name}</div>
          <div class="user-time">online</div>
        </div>
        <div class="online-indicator"></div>
        <button class="view-profile-btn" title="View Profile">👤</button>
      `;

      userItem.addEventListener('click', () => selectPersonalUser(user));
      
      const viewBtn = userItem.querySelector('.view-profile-btn');
      if (viewBtn) {
        viewBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          openProfileModal(user, false);
        });
      }

      userList.appendChild(userItem);
    }
  });
}

function updateGroupsList(groupsList) {
  groupList.innerHTML = '';
  Object.values(groupsList).forEach(group => {
    const groupItem = document.createElement('li');
    groupItem.className = 'group-item';
    if (group.id === selectedGroupId) {
      groupItem.classList.add('active');
    }

    const isPrivate = group.isPrivate ? ' 🔒' : '';
    groupItem.innerHTML = `
      <div class="group-avatar">${group.name.charAt(0).toUpperCase()}</div>
      <div class="group-info">
        <div class="group-name">${group.name}${isPrivate}</div>
        <div class="group-members">${group.members.length} members</div>
      </div>
    `;

    groupItem.addEventListener('click', () => selectGroup(group));
    groupList.appendChild(groupItem);
  });
}

function selectPersonalUser(user) {
  selectedUserId = user.id;
  selectedMode = 'personal';
  
  document.querySelectorAll('.user-item').forEach(item => item.classList.remove('active'));
  event.currentTarget.classList.add('active');

  chatUserName.textContent = user.name;
  chatUserAvatar.src = user.avatar;
  userStatus.textContent = 'online';

  messagesArea.innerHTML = '';
  if (conversations[user.id]) {
    conversations[user.id].forEach(msg => {
      addMessageToUI(msg, msg.sender.id === socket.id ? 'sent' : 'received');
    });
  }

  messageInput.disabled = false;
  messageInput.focus();
  leaveBtn.style.display = 'none';
  sidebar.classList.remove('active');

  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function selectGroup(group) {
  if (group.isPrivate && !group.members.includes(socket.id)) {
    showJoinGroupModal(group);
  } else {
    socket.emit('join-group', {
      groupId: group.id,
      password: null
    });
  }
}

function showJoinGroupModal(group) {
  document.getElementById('joinGroupNameLabel').textContent = `Group: ${group.name}`;
  if (group.isPrivate) {
    document.getElementById('passwordGroupField').style.display = 'block';
  } else {
    document.getElementById('passwordGroupField').style.display = 'none';
  }
  
  joinGroupModal.classList.add('active');
  joinGroupModal.dataset.groupId = group.id;
  
  joinGroupForm.onsubmit = (e) => {
    e.preventDefault();
    const password = document.getElementById('groupJoinPassword').value;
    socket.emit('join-group', {
      groupId: group.id,
      password: password || null
    });
    joinGroupForm.reset();
    joinGroupModal.classList.remove('active');
  };
}

cancelJoinGroupBtn.addEventListener('click', () => {
  joinGroupModal.classList.remove('active');
  joinGroupForm.reset();
});

function addMessageToUI(message, type) {
  const messageEl = document.createElement('div');
  messageEl.className = `message ${type}`;
  messageEl.id = `msg-${message.id}`;

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  messageEl.innerHTML = `
    <img src="${message.sender.avatar}" alt="${message.sender.name}" class="message-avatar">
    <div class="message-bubble">
      <div class="message-content">${escapeHtml(message.content)}</div>
      <div class="message-time">${time}</div>
    </div>
  `;

  messagesArea.appendChild(messageEl);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function addGroupMessageToUI(message) {
  const messageEl = document.createElement('div');
  const isSent = message.sender.id === socket.id;
  messageEl.className = `message ${isSent ? 'sent' : 'received'}`;
  messageEl.id = `msg-${message.id}`;

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  messageEl.innerHTML = `
    <img src="${message.sender.avatar}" alt="${message.sender.name}" class="message-avatar">
    <div class="message-bubble">
      ${!isSent ? `<div class="message-sender">${message.sender.name}</div>` : ''}
      <div class="message-content">${escapeHtml(message.content)}</div>
      <div class="message-time">${time}</div>
    </div>
  `;

  messagesArea.appendChild(messageEl);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function addCommunityMessageToUI(message) {
  const messageEl = document.createElement('div');
  const isSent = message.sender.id === socket.id;
  messageEl.className = `message ${isSent ? 'sent' : 'received'}`;
  messageEl.id = `msg-${message.id}`;

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  messageEl.innerHTML = `
    <img src="${message.sender.avatar}" alt="${message.sender.name}" class="message-avatar">
    <div class="message-bubble">
      ${!isSent ? `<div class="message-sender">${message.sender.name}</div>` : ''}
      <div class="message-content">${escapeHtml(message.content)}</div>
      <div class="message-time">${time}</div>
    </div>
  `;

  messagesArea.appendChild(messageEl);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function addSystemMessage(text) {
  const messageEl = document.createElement('div');
  messageEl.style.cssText = 'text-align: center; color: var(--text-secondary); font-size: 12px; margin: 8px 0;';
  messageEl.textContent = text;
  messagesArea.appendChild(messageEl);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

function showGroupTypingIndicator() {
  let indicator = messagesArea.querySelector('.typing-indicator-container');
  if (!indicator && Object.keys(typingUsers).length > 0) {
    const container = document.createElement('div');
    container.className = 'message received';
    container.innerHTML = `
      <img src="https://ui-avatars.com/api/?name=typing&background=random" alt="Typing" class="message-avatar">
      <div class="message-bubble typing-indicator-container">
        <div class="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;
    messagesArea.appendChild(container);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
}

function removeTypingIndicator() {
  const indicator = messagesArea.querySelector('.typing-indicator-container');
  if (indicator) {
    indicator.parentElement.remove();
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Mobile sidebar close on window click
document.addEventListener('click', (e) => {
  if (window.innerWidth <= 768) {
    if (!sidebar.contains(e.target) && !profileBtn.contains(e.target)) {
      sidebar.classList.remove('active');
    }
  }
});

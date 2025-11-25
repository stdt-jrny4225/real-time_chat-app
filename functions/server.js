const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const serverless = require('serverless-http');
const path = require('path');

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

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

// WebSocket handling won't work in Netlify Functions directly
// Instead, we'll use this for REST API endpoints

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

app.get('/api/groups', (req, res) => {
  res.json(Object.values(groups));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports.handler = serverless(app);

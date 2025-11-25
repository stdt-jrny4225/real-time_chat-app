# ChatVibe — Real-Time Chat App

A real-time chat application built with Node.js, Express, and Socket.io.

## Features

- **Personal Messages**: Direct messaging between users
- **Group Chat**: Create and join groups with optional password protection
- **Community Hall**: Public chat space for all users
- **Typing Indicators**: See when others are typing
- **User Profiles**: Customize avatar and bio
- **Real-time Updates**: Instant message delivery via WebSockets

## Quick Start

### Local Development

```powershell
npm install
npm start
```

Server runs on `http://localhost:3000`

### Development with Auto-reload

```powershell
npm run dev
```

Uses `nodemon` to automatically restart on file changes.

## Deployment

### Deploy to Render

1. **Push your code to GitHub** (already done ✓)
   ```
   https://github.com/stdt-jrny4225/real-time-chat-app
   ```

2. **Create a Render account** at https://render.com (free)

3. **Connect your GitHub repo to Render**:
   - Click "New" → "Web Service"
   - Select "Connect a repository"
   - Find and connect `stdt-jrny4225/real-time-chat-app`

4. **Configure the service**:
   - **Name**: `chatvibe-app` (or your choice)
   - **Environment**: Select `Docker`
   - **Region**: Choose closest to you (e.g., `Oregon`)
   - **Plan**: `Free` (or upgrade for production)
   - Leave **Build Command** empty (Dockerfile handles it)
   - Leave **Start Command** empty (Dockerfile handles it)

5. **Enable Auto-Deploy** (optional but recommended):
   - Check "Auto-deploy" so every GitHub push triggers a new deployment

6. **Create the service**
   - Render builds and deploys automatically
   - You'll get a public URL like `https://chatvibe-app.onrender.com`

### Deploy with Docker Locally

**Build the image:**
```powershell
docker build -t chatvibe .
```

**Run the container:**
```powershell
docker run -p 3000:3000 chatvibe
```

Access at `http://localhost:3000`

## Tech Stack

- **Backend**: Node.js + Express
- **Real-time**: Socket.io
- **Frontend**: HTML + CSS + JavaScript
- **Hosting**: Render (with Docker)

## Project Structure

```
.
├── server.js              # Main server file
├── public/
│   ├── index.html         # Frontend
│   ├── app.js             # Client-side logic
│   └── styles.css         # Styling
├── package.json           # Dependencies
├── Dockerfile             # Container configuration
├── Procfile               # Heroku-style deployment
└── render.yaml            # Render IaC (optional)
```

## Environment Variables

Render automatically provides:
- `PORT` — The port your app listens on (set in `server.js`)

No additional setup needed for the free tier.

## Troubleshooting

**App crashes after deploy?**
- Check Render logs: Open your service on Render, click "Logs"
- Ensure `server.js` is listening on `process.env.PORT || 3000`

**WebSocket connection fails?**
- Render supports WebSockets — this should work out of the box
- Check browser console for errors

**Want to test changes before pushing?**
- Run locally with `npm start`
- Test thoroughly
- Then `git add .`, `git commit -m "..."`, `git push`
- Render auto-deploys

## Next Steps

- Visit your live app at the Render URL
- Share the link with friends
- Make changes locally → `git push` → Auto-deploy to Render
- Upgrade to paid plan if you need more resources or custom domain

## Support

For questions about:
- **Render**: https://render.com/docs
- **Socket.io**: https://socket.io/docs
- **Express**: https://expressjs.com

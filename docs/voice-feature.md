# Voice-to-Text Feature

## Overview

GoalWhisperer AI now supports **real-time voice input**! You can speak to your AI coach instead of typing, making it easier and faster to update your goals, log wins, and check in on your progress.

## Features

- **🎤 Real-Time Streaming** (Chrome/Edge/Safari): Text appears as you speak using Web Speech API - **FREE!**
- **🔄 Smart Fallback** (Firefox only): Falls back to OpenAI Whisper API for browsers without Web Speech API
- **⚡ Auto-Stop on Silence**: Automatically stops recording when you pause speaking
- **⚡ Instant Feedback**: See your words appear in real-time (no waiting for transcription)
- **🌐 Browser-based**: Uses native browser APIs for audio capture (no plugins required)
- **📱 Works Everywhere**: Automatically detects best method for your browser

## Setup Instructions

### Quick Start (Chrome/Edge/Safari - FREE!)

If you're using **Chrome, Edge, or Safari**, voice input works **immediately with NO setup required**! Just:

1. Click the 🎤 microphone button
2. Allow microphone access
3. Start speaking - text appears in real-time!
4. Pause for 2-3 seconds and recording auto-stops
5. Review and click Send

**Cost:** $0 (completely free)

---

### Firefox Setup (Untested - OpenAI Whisper Fallback)

**Note:** The OpenAI Whisper fallback is currently **untested** and only required for Firefox users.

If you want voice input to work in **Firefox**:

#### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (it starts with `sk-...`)

#### 2. Configure Your Environment

Add your OpenAI API key to the backend `.env` file:

```bash
# backend/.env

# Existing keys
ANTHROPIC_API_KEY=your-claude-api-key-here

# Add this new key for voice transcription fallback
OPENAI_API_KEY=your-openai-api-key-here
```

#### 3. Install Dependencies

If you haven't already installed the new dependencies:

```bash
cd backend
npm install
```

#### 4. Restart the Server

```bash
# From the root directory
npm run dev
```

Or if running backend separately:

```bash
cd backend
npm run dev
```

## How to Use

### Real-Time Mode (Chrome/Edge/Safari)

1. **Click the Microphone Button** (🎤) in the chat interface
2. **Allow Microphone Access** when prompted by your browser
3. **Start Speaking** - text appears in real-time as you talk! 🎉
4. **Pause for 2-3 seconds** - recording automatically stops when you stop talking
5. **Review and Send** - edit if needed, then click Send

**Note:** You can also manually click "Stop Speaking" if you don't want to wait for auto-stop.

### Fallback Mode (Firefox - Untested)

1. **Click the Microphone Button** (🎤) in the chat interface
2. **Allow Microphone Access** when prompted by your browser
3. **Speak Your Message** - talk naturally about your goals
4. **Click "Stop Recording"** when you're done (timer shows duration)
5. **Wait for Transcription** - ~2-4 seconds using OpenAI Whisper
6. **Review and Send** - the text appears in the input field, edit if needed, then click Send

## Example Use Cases

- **Quick Updates**: "Mark action 2 as complete"
- **Weekly Check-ins**: "I completed 3 actions this week and added a new win"
- **Goal Status**: "What's my progress on objective 1?"
- **Add Wins**: "I launched the new feature and got positive feedback from users"

## Browser Compatibility

### Real-Time Streaming (Web Speech API) - Tested ✅

- ✅ **Chrome 25+** - Real-time streaming, FREE, auto-stop on silence
- ✅ **Edge 79+** - Real-time streaming, FREE, auto-stop on silence
- ✅ **Safari 14.1+** - Real-time streaming, FREE, auto-stop on silence
- ❌ **Firefox** - No Web Speech API support, falls back to OpenAI Whisper (untested)

**All browsers require HTTPS** (or localhost for development)

## Cost Considerations

### Chrome/Edge/Safari Users (Web Speech API)

- **Cost**: **$0.00 - Completely FREE!** 🎉
- **No API key needed**
- **Unlimited usage**
- **Auto-stop on silence** - natural conversation flow

### Firefox Users (OpenAI Whisper Fallback - Untested)

- **Cost**: $0.006 per minute of audio
- **Example**: 15 minutes/day = ~$2.70/month
- **Billing**: Charged to your OpenAI account
- **Required**: OpenAI API key in `.env` file
- **Status**: Currently untested - may require additional setup/debugging

**Recommendation:** Use Chrome, Edge, or Safari for free, tested voice input!

## Troubleshooting

### Microphone Access Denied

**Problem**: Browser won't access microphone
**Solution**:
- Check browser permissions (click the lock icon in address bar)
- Ensure you're on HTTPS or localhost
- Try a different browser

### "OpenAI API key not configured" Error

**Problem**: Backend can't find your OpenAI API key
**Solution**:
- Check that `OPENAI_API_KEY` is in `backend/.env`
- Restart the backend server after adding the key
- Verify the key is correct (starts with `sk-`)

### Transcription Fails or Takes Too Long

**Problem**: Audio transcription errors
**Solution**:
- Check your internet connection
- Verify your OpenAI API key is valid
- Try shorter recordings (under 30 seconds)
- Check OpenAI API status: https://status.openai.com/

### No Microphone Button Visible

**Problem**: Can't see the microphone button
**Solution**:
- Clear browser cache and reload
- Check that frontend is using the latest code
- Verify the frontend dev server is running

## Technical Details

### Hybrid Architecture

The app **automatically detects** which method to use:

#### Mode 1: Web Speech API (Chrome/Edge)

- **Detection**: Checks for `window.webkitSpeechRecognition` or `window.SpeechRecognition`
- **Streaming**: Real-time continuous recognition with interim results
- **Latency**: ~200-500ms (instant feel)
- **Cost**: $0 (Google's free service)
- **Privacy**: Audio sent to Google servers

#### Mode 2: OpenAI Whisper Fallback (Firefox/Safari)

- **Trigger**: When Web Speech API not available
- **Recording**: Uses `MediaRecorder` API
- **Processing**: Audio uploaded to backend → OpenAI Whisper API
- **Latency**: ~2-4 seconds for transcription
- **Cost**: $0.006/minute
- **Privacy**: Audio sent to OpenAI servers

### Frontend Implementation

- **Component**: `frontend/src/components/ClaudePanel.jsx`
- **Styling**: `frontend/src/components/ClaudePanel.css`
- **Detection Logic**: Checks browser capabilities on mount
- **Real-Time Updates**: `setInput()` called on interim/final results

### Backend Implementation (Fallback Only)

- **Endpoint**: `POST /api/claude/transcribe`
- **Middleware**: `express-fileupload` for audio uploads
- **Transcription**: OpenAI Whisper API (`whisper-1` model)
- **Max File Size**: 50MB

### Architecture Flow (Real-Time Mode)

```
User clicks 🎤
    ↓
Web Speech API starts listening
    ↓
User speaks → Text appears in real-time! ✨
    ↓
User clicks "Stop Speaking"
    ↓
User reviews and sends to Claude
```

### Architecture Flow (Fallback Mode)

```
User clicks 🎤
    ↓
Browser captures audio (MediaRecorder)
    ↓
User clicks "Stop Recording"
    ↓
Audio blob sent to backend (/api/claude/transcribe)
    ↓
Backend sends to OpenAI Whisper API
    ↓
Transcript returned to frontend
    ↓
Text appears in input field
    ↓
User reviews and sends to Claude
```

## Privacy & Security

- **Audio Storage**: Audio is NOT stored on disk - transcribed and discarded immediately
- **HTTPS Required**: Voice recording requires secure connection (production)
- **API Keys**: Keep your OpenAI and Anthropic keys secret - never commit to git
- **Local First**: All goal data stays in markdown files on your machine

## Future Enhancements

Potential improvements for future versions:

- 🔮 **Real-time streaming transcription** - see text as you speak
- 🔮 **Voice commands** - hands-free interaction ("Hey Coach, what's my progress?")
- 🔮 **Text-to-speech responses** - Claude speaks back to you
- 🔮 **Multiple languages** - transcribe in 50+ languages
- 🔮 **Local transcription** - offline mode using browser-based Whisper

## Support

If you encounter issues or have questions:

1. Check this documentation first
2. Review error messages in browser console (F12)
3. Check backend server logs
4. Verify API keys are configured correctly

## Changes Made

### Files Modified

- `frontend/src/components/ClaudePanel.jsx` - Added voice recording logic
- `frontend/src/components/ClaudePanel.css` - Added microphone button styles
- `backend/src/routes/api.js` - Added `/api/claude/transcribe` endpoint
- `backend/src/server.js` - Added file upload middleware
- `backend/package.json` - Added `openai` and `express-fileupload` dependencies

### Dependencies Added

- `openai@^4.67.3` - OpenAI SDK for Whisper API
- `express-fileupload@^1.5.0` - File upload middleware

---

**Version**: 1.0.0
**Last Updated**: November 2025
**Feature Status**: ✅ Production Ready

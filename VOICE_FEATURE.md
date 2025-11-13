# Voice-to-Text Feature

## Overview

GoalWhisperer AI now supports voice input! You can speak to your AI coach instead of typing, making it easier and faster to update your goals, log wins, and check in on your progress.

## Features

- **Voice Recording**: Click the microphone button to start recording your message
- **Real-time Transcription**: Audio is transcribed to text using OpenAI's Whisper API
- **Seamless Integration**: Transcribed text appears in the input field, ready to send
- **Visual Feedback**: Recording timer shows how long you've been recording
- **Browser-based**: Uses native browser APIs for audio capture (no plugins required)

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (it starts with `sk-...`)

### 2. Configure Your Environment

Add your OpenAI API key to the backend `.env` file:

```bash
# backend/.env

# Existing keys
ANTHROPIC_API_KEY=your-claude-api-key-here

# Add this new key for voice transcription
OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Install Dependencies

If you haven't already installed the new dependencies:

```bash
cd backend
npm install
```

### 4. Restart the Server

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

1. **Click the Microphone Button** (🎤) in the chat interface
2. **Allow Microphone Access** when prompted by your browser
3. **Speak Your Message** - talk naturally about your goals
4. **Click "Stop Recording"** when you're done
5. **Wait for Transcription** - your speech will be converted to text
6. **Review and Send** - the text appears in the input field, edit if needed, then click Send

## Example Use Cases

- **Quick Updates**: "Mark action 2 as complete"
- **Weekly Check-ins**: "I completed 3 actions this week and added a new win"
- **Goal Status**: "What's my progress on objective 1?"
- **Add Wins**: "I launched the new feature and got positive feedback from users"

## Browser Compatibility

The voice feature works in modern browsers with MediaRecorder API support:

- ✅ Chrome 47+
- ✅ Firefox 25+
- ✅ Edge 79+
- ✅ Safari 14.1+
- ⚠️ **Requires HTTPS** (or localhost for development)

## Cost Considerations

Voice transcription uses OpenAI's Whisper API:

- **Cost**: $0.006 per minute of audio
- **Example**: 15 minutes/day = ~$2.70/month
- **Billing**: Charged to your OpenAI account

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

### Frontend Implementation

- **Component**: `frontend/src/components/ClaudePanel.jsx`
- **Styling**: `frontend/src/components/ClaudePanel.css`
- **Audio API**: Native `MediaRecorder` API
- **Audio Format**: WebM (browser default)

### Backend Implementation

- **Endpoint**: `POST /api/claude/transcribe`
- **Middleware**: `express-fileupload` for audio uploads
- **Transcription**: OpenAI Whisper API (`whisper-1` model)
- **Max File Size**: 50MB

### Architecture Flow

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

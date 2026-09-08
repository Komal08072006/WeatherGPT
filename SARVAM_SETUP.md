# Sarvam AI Integration & Setup Guide — WeatherGPT

This document details how Sarvam AI has been integrated into WeatherGPT to add multilingual voice interactions (Speech-to-Text & Text-to-Speech) across Indian languages and English, while preserving all existing weather intelligence, text chat, Gemini, Groq, OpenWeatherMap, Open-Meteo, and Firebase capabilities.

---

## 1. How to Obtain a Sarvam AI API Key

1. Visit the official Sarvam AI portal at [https://www.sarvam.ai/](https://www.sarvam.ai/).
2. Sign up or log into your account dashboard.
3. Navigate to **API Keys** section under your user profile/dashboard.
4. Generate a new API Key (Subscription Key).
5. Copy the generated key. (Keep this key confidential; never expose it in client-side code).

---

## 2. Environment Variables & Local Setup

Sarvam AI integration is managed strictly server-side in the FastAPI backend so that secrets are never exposed to the React frontend.

### Backend `.env` File (`backend/.env`)

Add your Sarvam API Key to `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_key_here
OPENWEATHER_API_KEY=your_openweather_key_here
GROQ_API_KEY=your_groq_key_here
SARVAM_API_KEY=your_sarvam_api_key_here
```

> [!IMPORTANT]
> - Never hardcode the key in code.
> - Never prefix it with `VITE_` or expose it in frontend files.
> - Ensure `.gitignore` includes `.env` so secrets are never committed to version control.

---

## 3. Required Dependencies

The backend requirements (`backend/requirements.txt`) include `python-multipart` to support raw audio uploads for Speech-to-Text:

```text
fastapi>=0.100.0
uvicorn[standard]>=0.22.0
pydantic>=2.0
httpx>=0.24.0
python-dotenv>=1.0.0
google-generativeai>=0.3.0
python-multipart>=0.0.6
```

To install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

---

## 4. Architecture & Workflow

Sarvam AI acts as an **addition** to WeatherGPT, not a replacement. Existing Gemini/Groq processing, weather API lookups, and text chat continue operating unchanged.

```text
[User Speaks]
      ↓
[MediaRecorder Browser API]
      ↓ (Audio Blob)
[FastAPI /sarvam/stt] ── (Server-to-Server API Key) ──> [Sarvam STT (saarika:v2)]
      ↓ (Transcribed Text)
[Existing WeatherGPT Chat Pipeline]
      ↓ (Weather Data + Gemini/Groq Response)
[Text Response Rendered in UI]
      ↓
[FastAPI /sarvam/tts] ── (Server-to-Server API Key) ──> [Sarvam TTS (bulbul:v1)]
      ↓ (Base64 WAV Audio)
[HTML5 Audio Player in Browser]
      ↓
[User Hears Voice Response]
```

### Voice Input (Speech-to-Text / STT)
1. User clicks the microphone button in WeatherGPT Chat or prompt input.
2. The browser records audio via `MediaRecorder`.
3. Audio blob is sent to `POST /sarvam/stt` on FastAPI backend.
4. Backend proxies audio to `https://api.sarvam.ai/speech-to-text` with `api-subscription-key`.
5. Transcribed text is placed directly into the existing WeatherGPT input box and processed through the standard AI pipeline.

### Voice Output (Text-to-Speech / TTS)
1. Next to each AI message (or automatically when Voice Mode is ON), a `🔊 Listen (Sarvam AI)` button is provided.
2. Clicking the button sends message text to `POST /sarvam/tts` on FastAPI backend.
3. Backend calls `https://api.sarvam.ai/text-to-speech` model `bulbul:v1`.
4. Synthesized audio base64 is returned and played in browser via HTML5 `Audio`.
5. The original text response remains 100% visible and accessible regardless of TTS status.

---

## 5. Supported Multilingual Languages

The following 11 Indian regional languages and English are supported by Sarvam STT & TTS:

| Language Name | Sarvam Code | Native Script |
| ------------- | ----------- | ------------- |
| English       | `en-IN`     | English       |
| Hindi         | `hi-IN`     | हिंदी         |
| Bengali       | `bn-IN`     | বাংলা         |
| Gujarati      | `gu-IN`     | ગુજરાતી       |
| Kannada       | `kn-IN`     | ಕನ್ನಡ         |
| Malayalam     | `ml-IN`     | മലയാളം       |
| Marathi       | `mr-IN`     | मराठी         |
| Odia          | `od-IN`     | ଓଡ଼ିଆ         |
| Punjabi       | `pa-IN`     | ਪੰਜਾਬੀ        |
| Tamil         | `ta-IN`     | தமிழ்         |
| Telugu        | `te-IN`     | తెలుగు        |

Users can switch the active voice language using the top-header Language Selector.

---

## 6. How to Run Locally

### Start FastAPI Backend

```bash
cd backend
python main.py
```
*(Backend runs on `http://localhost:8000`)*

### Start React Frontend

```bash
cd frontend
npm run dev
```
*(Frontend runs on `http://localhost:5173`)*

---

## 7. Configuring Sarvam AI on Deployed Backend (e.g. Render / Railway)

1. Open your hosting provider dashboard (e.g., Render Dashboard for `weathergpt-backend`).
2. Go to **Environment Variables**.
3. Add key: `SARVAM_API_KEY`
4. Set value: `<your_sarvam_subscription_key>`
5. Trigger a re-deploy or restart service.

---

## 8. Graceful Fallback & Error Handling

- **Missing `SARVAM_API_KEY`**: If the key is not set, `/sarvam/status` returns `{ enabled: false }`. Text chat, Gemini/Groq, weather lookups, and Firebase authentication remain fully functional. If the user clicks voice input, a clear alert is shown: `"Voice service is temporarily unavailable. You can continue using text chat."`
- **Microphone Permission Denied**: Shows `"Microphone permission is required for voice input."`
- **TTS Failure**: Shows `"Unable to play voice output."` while the text response stays fully available.

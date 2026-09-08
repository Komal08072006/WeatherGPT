import os
import json
import base64
import httpx
from fastapi import HTTPException

SARVAM_API_KEY = (os.getenv("SARVAM_API_KEY") or "").strip()

SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

# Mapping of friendly language names or ISO codes to Sarvam language codes
SARVAM_LANGUAGE_CODES = {
    "english": "en-IN",
    "hindi": "hi-IN",
    "bengali": "bn-IN",
    "gujarati": "gu-IN",
    "kannada": "kn-IN",
    "malayalam": "ml-IN",
    "marathi": "mr-IN",
    "odia": "od-IN",
    "punjabi": "pa-IN",
    "tamil": "ta-IN",
    "telugu": "te-IN",
    "en": "en-IN",
    "hi": "hi-IN",
    "bn": "bn-IN",
    "gu": "gu-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "mr": "mr-IN",
    "or": "od-IN",
    "pa": "pa-IN",
    "ta": "ta-IN",
    "te": "te-IN",
}

DEFAULT_SPEAKERS = {
    "hi-IN": "meera",
    "en-IN": "meera",
    "bn-IN": "meera",
    "gu-IN": "meera",
    "kn-IN": "meera",
    "ml-IN": "meera",
    "mr-IN": "meera",
    "od-IN": "meera",
    "pa-IN": "meera",
    "ta-IN": "meera",
    "te-IN": "meera",
}


def is_sarvam_configured() -> bool:
    """Check if SARVAM_API_KEY environment variable is present."""
    api_key = (os.getenv("SARVAM_API_KEY") or "").strip()
    return len(api_key) > 0


def get_sarvam_language_code(lang_input: str) -> str:
    """Resolve input language name or code to a valid Sarvam BCP-47 language tag."""
    if not lang_input:
        return "unknown"
    clean = lang_input.strip().lower()
    if clean in SARVAM_LANGUAGE_CODES:
        return SARVAM_LANGUAGE_CODES[clean]
    # Check for direct BCP-47 match like 'hi-IN'
    for code in SARVAM_LANGUAGE_CODES.values():
        if clean == code.lower():
            return code
    return "unknown"


async def sarvam_speech_to_text(audio_bytes: bytes, filename: str = "audio.wav", language: str = "unknown") -> dict:
    """
    Send audio file bytes to Sarvam Speech-to-Text API.
    Returns dict: {"transcript": str, "language_code": str}
    """
    api_key = (os.getenv("SARVAM_API_KEY") or "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Sarvam API key is not configured on backend. Voice input service is unavailable."
        )

    headers = {
        "api-subscription-key": api_key
    }

    sarvam_lang = get_sarvam_language_code(language)

    # Prepare multipart form fields
    mime_type = "audio/wav"
    if filename.endswith(".webm"):
        mime_type = "audio/webm"
    elif filename.endswith(".mp3"):
        mime_type = "audio/mp3"
    elif filename.endswith(".ogg"):
        mime_type = "audio/ogg"
    elif filename.endswith(".m4a"):
        mime_type = "audio/m4a"

    files = {
        "file": (filename, audio_bytes, mime_type)
    }

    data = {
        "model": "saarika:v2"
    }

    if sarvam_lang != "unknown":
        data["language_code"] = sarvam_lang

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                SARVAM_STT_URL,
                headers=headers,
                files=files,
                data=data
            )

        if response.status_code == 200:
            res_json = response.json()
            transcript = res_json.get("transcript", "").strip()
            detected_lang = res_json.get("language_code", sarvam_lang)
            return {
                "transcript": transcript,
                "language_code": detected_lang,
                "source": "Sarvam STT (saarika:v2)"
            }
        else:
            error_detail = response.text
            try:
                err_obj = response.json()
                error_detail = err_obj.get("detail") or err_obj.get("message") or response.text
            except Exception:
                pass
            print(f"[SARVAM STT ERROR] HTTP {response.status_code}: {error_detail}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Sarvam Speech-to-Text failed: {error_detail}"
            )
    except httpx.RequestError as req_err:
        print(f"[SARVAM STT REQUEST ERROR] {req_err}")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to Sarvam STT service: {str(req_err)}"
        )


async def sarvam_text_to_speech(text: str, language: str = "Hindi", speaker: str = None) -> dict:
    """
    Send text to Sarvam Text-to-Speech API.
    Returns dict: {"audio_base64": str, "format": "wav", "language_code": str}
    """
    api_key = (os.getenv("SARVAM_API_KEY") or "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Sarvam API key is not configured on backend. Voice output service is unavailable."
        )

    if not text or not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text payload cannot be empty for Text-to-Speech."
        )

    sarvam_lang = get_sarvam_language_code(language)
    if sarvam_lang == "unknown":
        sarvam_lang = "hi-IN" if language.lower() == "hindi" else "en-IN"

    selected_speaker = speaker or DEFAULT_SPEAKERS.get(sarvam_lang, "meera")

    # Clean text of markdown formatting symbols like **, ##, etc.
    clean_text = text.replace("**", "").replace("*", "").replace("#", "").replace("`", "").strip()
    # Truncate text to fit single-chunk limit if necessary (Sarvam limit ~500 chars per chunk)
    if len(clean_text) > 480:
        clean_text = clean_text[:480] + "..."

    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": [clean_text],
        "target_language_code": sarvam_lang,
        "speaker": selected_speaker,
        "pitch": 0,
        "pace": 1.05,
        "loudness": 1.5,
        "speech_sample_rate": 16000,
        "enable_preprocessing": True,
        "model": "bulbul:v1"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                SARVAM_TTS_URL,
                headers=headers,
                json=payload
            )

        if response.status_code == 200:
            res_json = response.json()
            audios = res_json.get("audios", [])
            if not audios or not audios[0]:
                raise HTTPException(status_code=502, detail="Sarvam TTS returned an empty audio response.")

            audio_b64 = audios[0]
            return {
                "audio_base64": audio_b64,
                "format": "wav",
                "language_code": sarvam_lang,
                "speaker": selected_speaker,
                "source": "Sarvam TTS (bulbul:v1)"
            }
        else:
            error_detail = response.text
            try:
                err_obj = response.json()
                error_detail = err_obj.get("detail") or err_obj.get("message") or response.text
            except Exception:
                pass
            print(f"[SARVAM TTS ERROR] HTTP {response.status_code}: {error_detail}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Sarvam Text-to-Speech failed: {error_detail}"
            )
    except httpx.RequestError as req_err:
        print(f"[SARVAM TTS REQUEST ERROR] {req_err}")
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to Sarvam TTS service: {str(req_err)}"
        )

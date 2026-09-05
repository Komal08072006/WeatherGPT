import json
import os
import re
from dotenv import load_dotenv
import google.generativeai as genai
import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

app = FastAPI(
    title="WeatherGPT Backend",
    description="FastAPI Backend Service for WeatherGPT",
    version="1.0.0"
)

# Enable CORS for frontend requests
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


async def fetch_weather_data(location: str) -> dict:
    if not location or not location.strip():
        raise HTTPException(status_code=400, detail="Location parameter must not be empty.")

    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Convert location name to latitude/longitude using Open-Meteo Geocoding API
        geo_url = "https://geocoding-api.open-meteo.com/v1/search"
        geo_response = await client.get(
            geo_url,
            params={"name": location.strip(), "count": 1, "language": "en", "format": "json"}
        )
        geo_response.raise_for_status()
        geo_data = geo_response.json()

        results = geo_data.get("results")
        if not results:
            raise HTTPException(
                status_code=404,
                detail=f"Location '{location}' not found."
            )

        location_info = results[0]
        lat = location_info.get("latitude")
        lon = location_info.get("longitude")
        location_name = location_info.get("name", location)

        # 2. Call Open-Meteo Forecast API using latitude and longitude
        forecast_url = "https://api.open-meteo.com/v1/forecast"
        forecast_params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
            "hourly": "temperature_2m,precipitation_probability",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
            "timezone": "auto",
        }
        forecast_response = await client.get(forecast_url, params=forecast_params)
        forecast_response.raise_for_status()
        weather_data = forecast_response.json()

        # 3. Return JSON response containing location name, coordinates, and full weather data
        return {
            "location": location_name,
            "country": location_info.get("country", ""),
            "admin1": location_info.get("admin1", ""),
            "coordinates": {
                "latitude": lat,
                "longitude": lon,
            },
            "weather": weather_data,
        }


@app.get("/")
def read_root():
    return {"message": "WeatherGPT Backend is running"}


@app.get("/weather")
async def get_weather(location: str = Query(..., description="Name of the location/city")):
    try:
        return await fetch_weather_data(location)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"External weather service responded with error status: {exc.response.status_code}"
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to external weather service: {str(exc)}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(exc)}"
        )


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY environment variable is not configured."
        )

    # 1. Use Gemini API to extract location and intent
    location_name = "Delhi"
    try:
        extractor_instruction = (
            "Respond ONLY with a JSON object containing exactly two fields: "
            '"location" (the place name mentioned in the message, or "unknown" if none is mentioned) '
            'and "intent" (one of: "forecast", "alert", "climate", "general"). '
            "Do not include code fences, markdown, or extra explanations."
        )
        model_extractor = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=extractor_instruction
        )
        response_extractor = model_extractor.generate_content(request.message.strip())
        raw_text = response_extractor.text.strip()

        # Clean markdown code fences if present
        clean_json_str = re.sub(r"^```(?:json)?|```$", "", raw_text, flags=re.MULTILINE).strip()
        parsed_json = json.loads(clean_json_str)

        extracted_loc = parsed_json.get("location")
        if extracted_loc and str(extracted_loc).strip().lower() not in ["unknown", "none", "null", ""]:
            location_name = str(extracted_loc).strip()
    except json.JSONDecodeError:
        # Fallback if Gemini response is not strict JSON
        pass
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error during intent analysis: {str(exc)}"
        )

    # 2. Fetch real weather data
    try:
        weather_data = await fetch_weather_data(location_name)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"External weather service responded with error status: {exc.response.status_code}"
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to external weather service: {str(exc)}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch weather data: {str(exc)}"
        )

    # 3. Generate simple answer with Gemini using real weather context
    try:
        answer_instruction = (
            "You are WeatherGPT, a weather assistant for everyday users with no technical background. "
            "You will receive real weather data as JSON. Answer the user's original question in 1-3 short, plain sentences. "
            "Do NOT use jargon like 'convective,' 'confidence interval,' model names, or coordinates. "
            "State what the weather is/will be and one practical suggestion if relevant. "
            "Base your answer only on the provided real data — never invent numbers."
        )
        model_answer = genai.GenerativeModel(
            "gemini-2.5-flash",
            system_instruction=answer_instruction
        )
        context_prompt = (
            f"User Question: {request.message}\n"
            f"Resolved Location: {weather_data.get('location', location_name)}\n"
            f"Real Weather Data JSON: {json.dumps(weather_data)}"
        )
        response_answer = model_answer.generate_content(context_prompt)
        simple_answer = response_answer.text.strip()
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error during response generation: {str(exc)}"
        )

    return {
        "simple_answer": simple_answer,
        "location_used": weather_data.get("location", location_name),
        "raw_data": weather_data,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)



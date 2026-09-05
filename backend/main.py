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


@app.get("/geocode")

async def geocode_location(query: str = Query("", description="Location search query")):
    if not query or not query.strip():
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            geo_url = "https://geocoding-api.open-meteo.com/v1/search"
            response = await client.get(
                geo_url,
                params={"name": query.strip(), "count": 5, "language": "en", "format": "json"}
            )
            response.raise_for_status()
            data = response.json()

            results = data.get("results")
            if not results:
                return []

            matches = []
            for item in results:
                matches.append({
                    "name": item.get("name", ""),
                    "country": item.get("country", ""),
                    "admin1": item.get("admin1", ""),
                    "latitude": item.get("latitude"),
                    "longitude": item.get("longitude"),
                })
            return matches

    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"External geocoding service error: {exc.response.status_code}"
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to external geocoding service: {str(exc)}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(exc)}"
        )


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


def evaluate_alert(weather_data: dict) -> dict:

    weather = weather_data.get("weather", {})
    daily = weather.get("daily", {})
    hourly = weather.get("hourly", {})

    precip_sums = daily.get("precipitation_sum", [0.0, 0.0])
    precip_today = precip_sums[0] if len(precip_sums) > 0 and precip_sums[0] is not None else 0.0
    precip_tomorrow = precip_sums[1] if len(precip_sums) > 1 and precip_sums[1] is not None else 0.0
    max_daily_precip = max(precip_today or 0.0, precip_tomorrow or 0.0)

    hourly_probs = hourly.get("precipitation_probability", [])
    max_hourly_prob = max([p for p in hourly_probs[:24] if p is not None], default=0)

    location_name = weather_data.get("location", "")
    admin1 = weather_data.get("admin1", "")
    country = weather_data.get("country", "")
    full_location = f"{location_name}, {admin1}" if admin1 else f"{location_name}, {country}"

    if max_daily_precip > 30.0 or max_hourly_prob > 90:
        severity = "Red"
        title = "Severe Rainfall Warning"
    elif max_daily_precip > 15.0 or max_hourly_prob > 70:
        severity = "Orange"
        title = "Heavy Rainfall Warning"
    else:
        return {
            "has_alert": False,
            "location": location_name,
            "full_location": full_location,
            "precipitation_expected_mm": round(max_daily_precip, 1),
            "source": "Open-Meteo",
        }

    if precip_today > 15.0 and precip_tomorrow > 15.0:
        window = "Next 48 Hours"
    elif precip_tomorrow > precip_today:
        window = "Next 24–48 Hours (Tomorrow)"
    else:
        window = "Next 24 Hours (Today)"

    return {
        "has_alert": True,
        "severity": severity,
        "title": title,
        "expected_window": window,
        "location": location_name,
        "full_location": full_location,
        "precipitation_expected_mm": round(max_daily_precip, 1),
        "precipitation_probability": max_hourly_prob,
        "source": "Open-Meteo",
    }


@app.get("/alerts")
async def get_alerts(location: str = Query(..., description="Name of the location/city")):
    try:
        weather_data = await fetch_weather_data(location)
        return evaluate_alert(weather_data)
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



def generate_gemini_content(prompt_or_contents: str, system_instruction: str = None) -> str:
    candidate_models = [
        "gemini-2.5-flash",
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
        "gemini-flash-lite-latest",
    ]
    last_exc = None
    for model_name in candidate_models:
        try:
            model = genai.GenerativeModel(
                model_name,
                system_instruction=system_instruction
            )
            resp = model.generate_content(prompt_or_contents)
            return resp.text.strip()
        except Exception as exc:
            last_exc = exc
            # Catch rate limits, 404 deprecated models, or quota errors and try next candidate
            if any(err in str(exc) for err in ["429", "404", "Quota", "quota", "RESOURCE_EXHAUSTED", "not found", "no longer available"]):
                continue
            raise exc
    if last_exc:
        raise last_exc



@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY environment variable is not configured."
        )

    user_text = request.message.strip()

    # 1. Use Gemini API to extract location and intent
    location_name = None
    try:
        extractor_instruction = (
            "Respond ONLY with a JSON object containing exactly two fields: "
            '"location" (the place name mentioned in the message, or "unknown" if none is mentioned) '
            'and "intent" (one of: "forecast", "alert", "climate", "general"). '
            "Do not include code fences, markdown, or extra explanations."
        )
        raw_text = generate_gemini_content(user_text, system_instruction=extractor_instruction)

        # Clean markdown code fences if present
        clean_json_str = re.sub(r"^```(?:json)?|```$", "", raw_text, flags=re.MULTILINE).strip()
        parsed_json = json.loads(clean_json_str)

        extracted_loc = parsed_json.get("location")
        if extracted_loc and str(extracted_loc).strip().lower() not in ["unknown", "none", "null", ""]:
            location_name = str(extracted_loc).strip()
    except json.JSONDecodeError:
        pass
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error during intent analysis: {str(exc)}"
        )

    # 2. If no location is mentioned, return a friendly clarification response instead of defaulting to Delhi
    if not location_name:
        user_lower = user_text.lower()
        greeting_keywords = ["hi", "hii", "hiii", "hello", "hey", "heyy", "greetings", "good morning", "good afternoon", "good evening"]
        words = re.findall(r'\b\w+\b', user_lower)
        is_greeting = any(w in greeting_keywords for w in words) or user_lower.startswith(("hi", "hello", "hey"))

        if is_greeting:
            clarification_answer = "Hi! I can tell you the weather for any city — which place would you like to check?"
        else:
            clarification_answer = "Which city or place would you like the weather for?"

        return {
            "simple_answer": clarification_answer,
            "location_used": None,
            "raw_data": None,
            "needs_location": True,
        }

    # 3. Fetch real weather data when location IS provided
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

    # 4. Generate simple answer with Gemini using real weather context
    try:
        answer_instruction = (
            "You are WeatherGPT, a weather assistant for everyday users with no technical background. "
            "You will receive real weather data as JSON. Answer the user's original question in 1-3 short, plain sentences. "
            "Do NOT use jargon like 'convective,' 'confidence interval,' model names, or coordinates. "
            "State what the weather is/will be and one practical suggestion if relevant. "
            "Base your answer only on the provided real data — never invent numbers."
        )
        context_prompt = (
            f"User Question: {user_text}\n"
            f"Resolved Location: {weather_data.get('location', location_name)}\n"
            f"Real Weather Data JSON: {json.dumps(weather_data)}"
        )
        simple_answer = generate_gemini_content(context_prompt, system_instruction=answer_instruction)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error during response generation: {str(exc)}"
        )

    return {
        "simple_answer": simple_answer,
        "location_used": weather_data.get("location", location_name),
        "raw_data": weather_data,
        "needs_location": False,
    }



if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)




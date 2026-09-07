import asyncio
import calendar
from datetime import date, timedelta
import json
import os
import re
import time
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
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

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
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://weathergpt-frontend-dl6l.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- In-Memory Caching & Rate Limit Mitigation ---
WEATHER_CACHE: dict[str, tuple[float, dict]] = {}
WEATHER_CACHE_TTL = 300  # 5 minutes in seconds

CLIMATE_CACHE: dict[str, tuple[float, dict]] = {}
CLIMATE_CACHE_TTL = 3600  # 1 hour in seconds

GEOCODING_CACHE: dict[str, tuple[float, list[dict]]] = {}
GEOCODING_CACHE_TTL = 300  # 5 minutes in seconds


async def fetch_with_retry(
    client: httpx.AsyncClient,
    url: str,
    params: dict | None = None,
    headers: dict | None = None,
    max_retries: int = 2,
    delays: list[float] | None = None,
) -> httpx.Response:
    """Perform HTTP GET request with retry & backoff for 429 Too Many Requests and unexpected errors (5xx, network errors)."""
    if delays is None:
        delays = [0.8, 1.5]

    last_res = None
    for attempt in range(max_retries + 1):
        try:
            res = await client.get(url, params=params, headers=headers)
            last_res = res
            if res.status_code == 429 or res.status_code >= 500:
                if attempt < max_retries:
                    delay = delays[attempt] if attempt < len(delays) else delays[-1]
                    print(f"[FETCH_RETRY] {url} returned HTTP {res.status_code}. Waiting {delay}s before attempt {attempt + 2}/{max_retries + 1}...")
                    await asyncio.sleep(delay)
                    continue
                elif res.status_code == 429:
                    raise HTTPException(
                        status_code=429,
                        detail="Weather service is temporarily busy, please try again in a moment."
                    )
            return res
        except (httpx.RequestError, httpx.HTTPStatusError) as exc:
            if attempt < max_retries:
                delay = delays[attempt] if attempt < len(delays) else delays[-1]
                print(f"[FETCH_RETRY ERROR] {url} raised {type(exc).__name__}: {exc}. Waiting {delay}s before attempt {attempt + 2}/{max_retries + 1}...")
                await asyncio.sleep(delay)
                continue
            raise exc

    return last_res


async def fetch_openweathermap_weather_data(
    client: httpx.AsyncClient,
    lat: float,
    lon: float,
    location_name: str,
    country: str,
    admin1: str,
) -> dict:
    """Fallback weather data provider using OpenWeatherMap API."""
    if not OPENWEATHER_API_KEY:
        raise ValueError("OPENWEATHER_API_KEY is not configured")

    curr_url = "https://api.openweathermap.org/data/2.5/weather"
    forecast_url = "https://api.openweathermap.org/data/2.5/forecast"

    params = {
        "lat": lat,
        "lon": lon,
        "appid": OPENWEATHER_API_KEY,
        "units": "metric",
    }

    try:
        curr_res, forecast_res = await asyncio.gather(
            client.get(curr_url, params=params),
            client.get(forecast_url, params=params),
        )
        curr_res.raise_for_status()
        forecast_res.raise_for_status()
    except Exception as http_err:
        print(f"[FALLBACK HTTP ERROR] OpenWeatherMap API HTTP request failed: {type(http_err).__name__}: {http_err}")
        raise http_err

    try:
        owm_curr = curr_res.json()
        owm_forecast = forecast_res.json()
        print(f"[OWM RAW DATA LOG] Current weather API keys: {list(owm_curr.keys())}, main: {owm_curr.get('main')}, weather: {owm_curr.get('weather')}")
        print(f"[OWM RAW DATA LOG] Forecast API keys: {list(owm_forecast.keys())}, items count: {len(owm_forecast.get('list', []))}")

        # Parse current conditions
        main_curr = owm_curr.get("main", {})
        wind_curr = owm_curr.get("wind", {})
        rain_curr = owm_curr.get("rain", {})
        curr_precip = 0.0
        if isinstance(rain_curr, dict):
            curr_precip = float(rain_curr.get("1h") or rain_curr.get("3h") or 0.0)
        elif isinstance(rain_curr, (int, float)):
            curr_precip = float(rain_curr)

        # Parse 5-day / 3-hour forecast list into hourly and daily format
        hourly_time = []
        hourly_temp = []
        hourly_precip_prob = []

        daily_groups = {}

        for item in owm_forecast.get("list", []):
            dt_txt = item.get("dt_txt", "")
            formatted_time = dt_txt.replace(" ", "T")[:16] if dt_txt else ""
            temp = round(float(item.get("main", {}).get("temp", 0.0)), 1)
            pop = float(item.get("pop", 0.0) or 0.0)
            pop_pct = int(round(pop * 100))

            if formatted_time:
                hourly_time.append(formatted_time)
                hourly_temp.append(temp)
                hourly_precip_prob.append(pop_pct)

            if dt_txt:
                day_str = dt_txt.split(" ")[0]
                if day_str not in daily_groups:
                    daily_groups[day_str] = {
                        "temp_mins": [],
                        "temp_maxs": [],
                        "precips": [],
                    }
                item_main = item.get("main", {})
                if "temp_min" in item_main:
                    daily_groups[day_str]["temp_mins"].append(float(item_main["temp_min"]))
                if "temp_max" in item_main:
                    daily_groups[day_str]["temp_maxs"].append(float(item_main["temp_max"]))

                rain_obj = item.get("rain")
                rain_val = 0.0
                if isinstance(rain_obj, dict):
                    rain_val = float(rain_obj.get("3h", 0.0) or 0.0)
                elif isinstance(rain_obj, (int, float)):
                    rain_val = float(rain_obj)
                daily_groups[day_str]["precips"].append(rain_val)

        daily_time = []
        daily_temp_max = []
        daily_temp_min = []
        daily_precip_sum = []

        for day_str, stats in daily_groups.items():
            daily_time.append(day_str)
            t_min = round(min(stats["temp_mins"]), 1) if stats["temp_mins"] else 0.0
            t_max = round(max(stats["temp_maxs"]), 1) if stats["temp_maxs"] else 0.0
            p_sum = round(sum(stats["precips"]), 1)
            daily_temp_min.append(t_min)
            daily_temp_max.append(t_max)
            daily_precip_sum.append(p_sum)

        now_iso = time.strftime("%Y-%m-%dT%H:%M")

        return {
            "location": location_name,
            "country": country,
            "admin1": admin1,
            "coordinates": {
                "latitude": lat,
                "longitude": lon,
            },
            "data_source": "OpenWeatherMap (fallback)",
            "weather": {
                "current": {
                    "time": now_iso,
                    "temperature_2m": round(float(main_curr.get("temp", 0.0)), 1),
                    "relative_humidity_2m": int(main_curr.get("humidity", 0)),
                    "precipitation": round(curr_precip, 1),
                    "wind_speed_10m": round(float(wind_curr.get("speed", 0.0)) * 3.6, 1),
                },
                "hourly": {
                    "time": hourly_time,
                    "temperature_2m": hourly_temp,
                    "precipitation_probability": hourly_precip_prob,
                },
                "daily": {
                    "time": daily_time,
                    "temperature_2m_max": daily_temp_max,
                    "temperature_2m_min": daily_temp_min,
                    "precipitation_sum": daily_precip_sum,
                },
            },
        }
    except Exception as parse_err:
        curr_text = getattr(curr_res, "text", "N/A")
        forecast_text = getattr(forecast_res, "text", "N/A")
        print(
            f"[FALLBACK PARSE ERROR] OpenWeatherMap parsing failed: {type(parse_err).__name__}: {parse_err}. "
            f"Raw current response: {curr_text[:500]!r}, Raw forecast response: {forecast_text[:500]!r}"
        )
        raise parse_err


class ChatRequest(BaseModel):
    message: str
    language: str = "English"


# Hardcoded lookup table for all 28 Indian States and 8 Union Territories
INDIAN_STATES_LOOKUP: dict[str, dict] = {
    # 28 States
    "andhra pradesh": {"name": "Amaravati", "latitude": 16.5131, "longitude": 80.5165, "admin1": "Andhra Pradesh", "country": "India", "population": 3000000},
    "arunachal pradesh": {"name": "Itanagar", "latitude": 27.0844, "longitude": 93.6053, "admin1": "Arunachal Pradesh", "country": "India", "population": 100000},
    "assam": {"name": "Guwahati", "latitude": 26.1445, "longitude": 91.7362, "admin1": "Assam", "country": "India", "population": 1100000},
    "bihar": {"name": "Patna", "latitude": 25.5941, "longitude": 85.1376, "admin1": "Bihar", "country": "India", "population": 2500000},
    "chhattisgarh": {"name": "Raipur", "latitude": 21.2514, "longitude": 81.6296, "admin1": "Chhattisgarh", "country": "India", "population": 1100000},
    "goa": {"name": "Panaji", "latitude": 15.4909, "longitude": 73.8278, "admin1": "Goa", "country": "India", "population": 114000},
    "gujarat": {"name": "Ahmedabad", "latitude": 23.0225, "longitude": 72.5714, "admin1": "Gujarat", "country": "India", "population": 8400000},
    "haryana": {"name": "Chandigarh", "latitude": 30.7333, "longitude": 76.7794, "admin1": "Haryana", "country": "India", "population": 1050000},
    "himachal pradesh": {"name": "Shimla", "latitude": 31.1048, "longitude": 77.1734, "admin1": "Himachal Pradesh", "country": "India", "population": 170000},
    "jharkhand": {"name": "Ranchi", "latitude": 23.3441, "longitude": 85.3096, "admin1": "Jharkhand", "country": "India", "population": 1100000},
    "karnataka": {"name": "Bengaluru", "latitude": 12.9716, "longitude": 77.5946, "admin1": "Karnataka", "country": "India", "population": 12000000},
    "kerala": {"name": "Thiruvananthapuram", "latitude": 8.5241, "longitude": 76.9366, "admin1": "Kerala", "country": "India", "population": 950000},
    "madhya pradesh": {"name": "Bhopal", "latitude": 23.2599, "longitude": 77.4126, "admin1": "Madhya Pradesh", "country": "India", "population": 1800000},
    "maharashtra": {"name": "Mumbai", "latitude": 19.0760, "longitude": 72.8777, "admin1": "Maharashtra", "country": "India", "population": 20000000},
    "manipur": {"name": "Imphal", "latitude": 24.8170, "longitude": 93.9368, "admin1": "Manipur", "country": "India", "population": 270000},
    "meghalaya": {"name": "Shillong", "latitude": 25.5788, "longitude": 91.8933, "admin1": "Meghalaya", "country": "India", "population": 140000},
    "mizoram": {"name": "Aizawl", "latitude": 23.7271, "longitude": 92.7176, "admin1": "Mizoram", "country": "India", "population": 290000},
    "nagaland": {"name": "Kohima", "latitude": 25.6751, "longitude": 94.1086, "admin1": "Nagaland", "country": "India", "population": 100000},
    "odisha": {"name": "Bhubaneswar", "latitude": 20.2961, "longitude": 85.8245, "admin1": "Odisha", "country": "India", "population": 840000},
    "orissa": {"name": "Bhubaneswar", "latitude": 20.2961, "longitude": 85.8245, "admin1": "Odisha", "country": "India", "population": 840000},
    "punjab": {"name": "Chandigarh", "latitude": 30.7333, "longitude": 76.7794, "admin1": "Punjab", "country": "India", "population": 1050000},
    "rajasthan": {"name": "Jaipur", "latitude": 26.9124, "longitude": 75.7873, "admin1": "Rajasthan", "country": "India", "population": 3100000},
    "sikkim": {"name": "Gangtok", "latitude": 27.3389, "longitude": 88.6065, "admin1": "Sikkim", "country": "India", "population": 100000},
    "tamil nadu": {"name": "Chennai", "latitude": 13.0827, "longitude": 80.2707, "admin1": "Tamil Nadu", "country": "India", "population": 11000000},
    "telangana": {"name": "Hyderabad", "latitude": 17.3850, "longitude": 78.4867, "admin1": "Telangana", "country": "India", "population": 10000000},
    "tripura": {"name": "Agartala", "latitude": 23.8315, "longitude": 91.2868, "admin1": "Tripura", "country": "India", "population": 400000},
    "uttar pradesh": {"name": "Lucknow", "latitude": 26.8467, "longitude": 80.9462, "admin1": "Uttar Pradesh", "country": "India", "population": 2800000},
    "uttarakhand": {"name": "Dehradun", "latitude": 30.3165, "longitude": 78.0322, "admin1": "Uttarakhand", "country": "India", "population": 570000},
    "west bengal": {"name": "Kolkata", "latitude": 22.5726, "longitude": 88.3639, "admin1": "West Bengal", "country": "India", "population": 15000000},

    # 8 Union Territories (+ aliases)
    "andaman and nicobar islands": {"name": "Port Blair", "latitude": 11.6234, "longitude": 92.7265, "admin1": "Andaman and Nicobar Islands", "country": "India", "population": 100000},
    "andaman and nicobar": {"name": "Port Blair", "latitude": 11.6234, "longitude": 92.7265, "admin1": "Andaman and Nicobar Islands", "country": "India", "population": 100000},
    "chandigarh": {"name": "Chandigarh", "latitude": 30.7333, "longitude": 76.7794, "admin1": "Chandigarh", "country": "India", "population": 1050000},
    "dadra and nagar haveli and daman and diu": {"name": "Daman", "latitude": 20.3974, "longitude": 72.8328, "admin1": "Dadra and Nagar Haveli and Daman and Diu", "country": "India", "population": 190000},
    "dadra and nagar haveli": {"name": "Daman", "latitude": 20.3974, "longitude": 72.8328, "admin1": "Dadra and Nagar Haveli and Daman and Diu", "country": "India", "population": 190000},
    "daman and diu": {"name": "Daman", "latitude": 20.3974, "longitude": 72.8328, "admin1": "Dadra and Nagar Haveli and Daman and Diu", "country": "India", "population": 190000},
    "delhi (nct)": {"name": "New Delhi", "latitude": 28.6139, "longitude": 77.2090, "admin1": "Delhi", "country": "India", "population": 11000000},
    "nct of delhi": {"name": "New Delhi", "latitude": 28.6139, "longitude": 77.2090, "admin1": "Delhi", "country": "India", "population": 11000000},
    "national capital territory of delhi": {"name": "New Delhi", "latitude": 28.6139, "longitude": 77.2090, "admin1": "Delhi", "country": "India", "population": 11000000},
    "jammu and kashmir": {"name": "Srinagar", "latitude": 34.0837, "longitude": 74.7973, "admin1": "Jammu and Kashmir", "country": "India", "population": 1200000},
    "jammu & kashmir": {"name": "Srinagar", "latitude": 34.0837, "longitude": 74.7973, "admin1": "Jammu and Kashmir", "country": "India", "population": 1200000},
    "ladakh": {"name": "Leh", "latitude": 34.1526, "longitude": 77.5771, "admin1": "Ladakh", "country": "India", "population": 30000},
    "lakshadweep": {"name": "Kavaratti", "latitude": 10.5667, "longitude": 72.6417, "admin1": "Lakshadweep", "country": "India", "population": 11000},
    "puducherry": {"name": "Puducherry", "latitude": 11.9416, "longitude": 79.8083, "admin1": "Puducherry", "country": "India", "population": 240000},
    "pondicherry": {"name": "Puducherry", "latitude": 11.9416, "longitude": 79.8083, "admin1": "Puducherry", "country": "India", "population": 240000},
}


def get_name_relevance_score(item: dict, query: str) -> int:
    q = query.strip().lower()
    name = (item.get("name") or "").strip().lower()
    admin1 = (item.get("admin1") or "").strip().lower()
    country = (item.get("country") or "").strip().lower()

    if not q:
        return 0

    # STAGE 1 - Name & Region Relevance Scoring:
    # 4: Exact match on name
    if name == q:
        return 4
    # 3: Exact match on admin1 (state/region name) or country
    if admin1 == q or country == q:
        return 3
    # 2: Name or admin1 starts with query, or query starts with name/admin1
    if name.startswith(q) or q.startswith(name) or admin1.startswith(q) or q.startswith(admin1):
        return 2
    # 1: Query appears within name, admin1, or country
    if q in name or q in admin1 or q in country:
        return 1

    return 0


async def search_geocoding_results(client: httpx.AsyncClient, query: str, count: int = 10) -> list[dict]:
    clean_query = query.strip().lower()

    # BEFORE calling external geocoding API, check if query matches an Indian state / UT
    if clean_query in INDIAN_STATES_LOOKUP:
        return [dict(INDIAN_STATES_LOOKUP[clean_query])]

    # Check in-memory geocoding cache
    now = time.time()
    if clean_query in GEOCODING_CACHE:
        ts, cached_list = GEOCODING_CACHE[clean_query]
        if now - ts < GEOCODING_CACHE_TTL:
            print(f"[GEOCODING CACHE] Cache hit for query '{clean_query}'")
            return cached_list

    # 1. Fetch from Open-Meteo Geocoding API (count=10)
    async def fetch_open_meteo():
        try:
            geo_url = "https://geocoding-api.open-meteo.com/v1/search"
            res = await fetch_with_retry(
                client,
                geo_url,
                params={"name": query.strip(), "count": count, "language": "en", "format": "json"},
                max_retries=2,
                delays=[0.8, 1.5]
            )
            if res and res.status_code == 200:
                geo_data = res.json()
                return [
                    {
                        "name": item.get("name", ""),
                        "country": item.get("country", ""),
                        "admin1": item.get("admin1", ""),
                        "latitude": item.get("latitude"),
                        "longitude": item.get("longitude"),
                        "population": item.get("population") or 0,
                    }
                    for item in (geo_data.get("results") or [])
                ]
        except Exception as err:
            print(f"[GEOCODING OPEN-METEO WARNING] {type(err).__name__}: {err}")
            pass
        return []

    # 2. Fetch from OpenStreetMap Nominatim for states/countries/regions missed by Open-Meteo
    async def fetch_nominatim():
        try:
            nom_url = "https://nominatim.openstreetmap.org/search"
            res = await client.get(
                nom_url,
                params={"q": query.strip(), "format": "json", "limit": 5, "addressdetails": 1},
                headers={"User-Agent": "WeatherGPTApp/1.0 (contact@weathergpt.local)"},
                timeout=3.0
            )
            if res.status_code == 200:
                nom_data = res.json() or []
                out = []
                for item in nom_data:
                    addr = item.get("address", {})
                    name = item.get("name") or (item.get("display_name", "").split(",")[0].strip())
                    country = addr.get("country", "")
                    admin1 = addr.get("state") or addr.get("region") or addr.get("county") or ""
                    importance = float(item.get("importance") or 0.5)
                    est_pop = int(importance * 10_000_000)

                    out.append({
                        "name": name,
                        "country": country,
                        "admin1": admin1,
                        "latitude": float(item.get("lat")),
                        "longitude": float(item.get("lon")),
                        "population": est_pop,
                    })
                return out
        except Exception:
            pass
        return []

    om_results, nom_results = await asyncio.gather(fetch_open_meteo(), fetch_nominatim())
    matches = om_results + nom_results

    if not matches:
        return []

    # Deduplicate near identical coordinates (within 0.02 degrees)
    unique_matches = []
    seen_coords = set()
    for m in matches:
        if m.get("latitude") is None or m.get("longitude") is None:
            continue
        coord_key = (round(float(m["latitude"]), 2), round(float(m["longitude"]), 2))
        if coord_key not in seen_coords:
            seen_coords.add(coord_key)
            unique_matches.append(m)

    # STAGE 1: Filter out results with no name/admin1/country relevance (score == 0)
    relevant_candidates = [m for m in unique_matches if get_name_relevance_score(m, query) > 0]

    # If Stage 1 finds no relevant candidates at all, return empty list
    if not relevant_candidates:
        return []

    # STAGE 2: Sort relevant candidates by (relevance_score, population) descending
    sorted_results = sorted(
        relevant_candidates,
        key=lambda x: (
            get_name_relevance_score(x, query),
            x.get("population") or 0
        ),
        reverse=True
    )
    GEOCODING_CACHE[clean_query] = (now, sorted_results)
    return sorted_results


async def fetch_weather_data(
    location: str | None = None,
    latitude: float | None = None,
    longitude: float | None = None,
) -> dict:
    print(f"[FETCH_WEATHER] Request received for location={location!r}, latitude={latitude}, longitude={longitude}")

    try:
        has_location = bool(location and location.strip())
        has_coords = latitude is not None and longitude is not None

        if not has_location and not has_coords:
            print("[FETCH_WEATHER ERROR] Neither location nor valid coordinates were provided.")
            raise HTTPException(
                status_code=400,
                detail="Either 'location' or both 'latitude' and 'longitude' must be provided."
            )

        # Check cache for weather data
        now = time.time()
        candidate_keys = []
        if has_coords:
            candidate_keys.append(f"coords:{round(latitude, 2)}:{round(longitude, 2)}")
        if has_location:
            candidate_keys.append(f"loc:{location.strip().lower()}")

        for k in candidate_keys:
            if k in WEATHER_CACHE:
                ts, data = WEATHER_CACHE[k]
                if now - ts < WEATHER_CACHE_TTL:
                    print(f"[FETCH_WEATHER CACHE] Cache hit for key '{k}'")
                    return data

        async with httpx.AsyncClient(timeout=10.0) as client:
            lat = None
            lon = None
            location_name = "Current Location"
            country = ""
            admin1 = ""

            if has_coords:
                lat = latitude
                lon = longitude
                try:
                    rev_res = await client.get(
                        "https://api.bigdatacloud.net/data/reverse-geocode-client",
                        params={"latitude": lat, "longitude": lon}
                    )
                    if rev_res.status_code == 200:
                        rev_data = rev_res.json()
                        name = (
                            rev_data.get("city")
                            or rev_data.get("locality")
                            or rev_data.get("localityInfo", {}).get("administrative", [{}])[0].get("name")
                        )
                        if name:
                            location_name = name
                        country = rev_data.get("countryName", "")
                        admin1 = rev_data.get("principalSubdivision", "")
                except Exception as rev_err:
                    print(f"[GEOCODING WARNING] Reverse geocoding failed: {type(rev_err).__name__}: {rev_err}")
            else:
                try:
                    sorted_results = await search_geocoding_results(client, location.strip(), count=10)
                except Exception as geo_err:
                    print(f"[GEOCODING ERROR] Geocoding lookup failed for '{location}': {type(geo_err).__name__}: {geo_err}")
                    raise HTTPException(
                        status_code=502,
                        detail=f"Failed to geocode location '{location}': {geo_err}"
                    )

                if not sorted_results:
                    print(f"[FETCH_WEATHER ERROR] Location '{location}' not found.")
                    raise HTTPException(
                        status_code=404,
                        detail=f"Location '{location}' not found."
                    )

                location_info = sorted_results[0]
                lat = location_info.get("latitude")
                lon = location_info.get("longitude")
                location_name = location_info.get("name", location)
                country = location_info.get("country", "")
                admin1 = location_info.get("admin1", "")

            # Check cache by resolved coordinates
            coord_key = f"coords:{round(lat, 2)}:{round(lon, 2)}"
            if coord_key in WEATHER_CACHE:
                ts, data = WEATHER_CACHE[coord_key]
                if now - ts < WEATHER_CACHE_TTL:
                    print(f"[FETCH_WEATHER CACHE] Cache hit for resolved coords key '{coord_key}'")
                    if has_location:
                        WEATHER_CACHE[f"loc:{location.strip().lower()}"] = (ts, data)
                    return data

            # 2. Call Open-Meteo Forecast API using latitude and longitude with retry & OWM fallback logic
            forecast_url = "https://api.open-meteo.com/v1/forecast"
            forecast_params = {
                "latitude": lat,
                "longitude": lon,
                "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
                "hourly": "temperature_2m,precipitation_probability",
                "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
                "timezone": "auto",
            }

            result = None
            try:
                forecast_response = await fetch_with_retry(
                    client,
                    forecast_url,
                    params=forecast_params,
                    max_retries=2,
                    delays=[0.8, 1.5]
                )
                forecast_response.raise_for_status()
                weather_data = forecast_response.json()
                result = {
                    "location": location_name,
                    "country": country,
                    "admin1": admin1,
                    "coordinates": {
                        "latitude": lat,
                        "longitude": lon,
                    },
                    "data_source": "Open-Meteo",
                    "weather": weather_data,
                }
                print(f"[FETCH_WEATHER SUCCESS] Successfully fetched weather data from Open-Meteo for '{location_name}'")
            except Exception as open_meteo_err:
                print(f"[OPEN-METEO ERROR] Open-Meteo request failed: {type(open_meteo_err).__name__}: {open_meteo_err}")

                loc_identifier = location if (location and location.strip()) else location_name
                print(f"[FALLBACK] Attempting OpenWeatherMap for {loc_identifier}")

                if OPENWEATHER_API_KEY:
                    try:
                        result = await fetch_openweathermap_weather_data(client, lat, lon, location_name, country, admin1)
                        print(f"[FALLBACK SUCCESS] Successfully fetched weather data from OpenWeatherMap for '{location_name}'")
                    except Exception as owm_err:
                        print(f"[FALLBACK ERROR] OpenWeatherMap fallback failed with {type(owm_err).__name__}: {owm_err}")
                        raise HTTPException(
                            status_code=503,
                            detail="Weather data is temporarily unavailable from all sources, please try again shortly."
                        )
                else:
                    print("[FALLBACK ERROR] OPENWEATHER_API_KEY is not configured. Cannot attempt fallback.")
                    if isinstance(open_meteo_err, HTTPException):
                        raise open_meteo_err
                    raise HTTPException(
                        status_code=502,
                        detail=f"Open-Meteo service failed and fallback key is missing: {open_meteo_err}"
                    )

            # Store in cache
            WEATHER_CACHE[coord_key] = (now, result)
            if has_location:
                WEATHER_CACHE[f"loc:{location.strip().lower()}"] = (now, result)
            if location_name:
                WEATHER_CACHE[f"loc:{location_name.strip().lower()}"] = (now, result)

            return result

    except HTTPException as http_exc:
        print(f"[FETCH_WEATHER ERROR] HTTPException {http_exc.status_code}: {http_exc.detail}")
        raise http_exc
    except Exception as exc:
        print(f"[FETCH_WEATHER UNHANDLED ERROR] Unhandled exception in fetch_weather_data: {type(exc).__name__}: {exc}")
        raise exc



@app.get("/")
def read_root():
    return {"message": "WeatherGPT Backend is running"}


@app.get("/geocode")
async def geocode_location(query: str = Query("", description="Location search query")):
    if not query or not query.strip():
        return []

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            sorted_results = await search_geocoding_results(client, query.strip(), count=10)
            matches = []
            for item in sorted_results:
                matches.append({
                    "name": item.get("name", ""),
                    "country": item.get("country", ""),
                    "admin1": item.get("admin1", ""),
                    "latitude": item.get("latitude"),
                    "longitude": item.get("longitude"),
                    "population": item.get("population") or 0,
                })
            return matches

    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Weather service is temporarily busy, please try again in a moment."
            )
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
async def get_weather(
    location: str | None = Query(None, description="Name of the location/city"),
    latitude: float | None = Query(None, description="Latitude coordinate"),
    longitude: float | None = Query(None, description="Longitude coordinate"),
):
    if not location and (latitude is None or longitude is None):
        raise HTTPException(
            status_code=400,
            detail="Either 'location' or both 'latitude' and 'longitude' must be provided."
        )
    try:
        return await fetch_weather_data(location=location, latitude=latitude, longitude=longitude)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Weather service is temporarily busy, please try again in a moment."
            )
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


@app.get("/test-openweather")
async def test_openweather(
    location: str | None = Query(None, description="Name of the location/city"),
    latitude: float | None = Query(None, description="Latitude coordinate"),
    longitude: float | None = Query(None, description="Longitude coordinate"),
):
    if not location and (latitude is None or longitude is None):
        raise HTTPException(
            status_code=400,
            detail="Either 'location' or both 'latitude' and 'longitude' must be provided."
        )

    if not OPENWEATHER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENWEATHER_API_KEY environment variable is not configured."
        )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            lat = latitude
            lon = longitude
            location_name = location or "Current Location"
            country = ""
            admin1 = ""

            if location and not (lat is not None and lon is not None):
                sorted_results = await search_geocoding_results(client, location.strip(), count=10)
                if not sorted_results:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Location '{location}' not found during geocoding lookup."
                    )
                location_info = sorted_results[0]
                lat = location_info.get("latitude")
                lon = location_info.get("longitude")
                location_name = location_info.get("name", location)
                country = location_info.get("country", "")
                admin1 = location_info.get("admin1", "")

            print(f"[TEST_OPENWEATHER] Directly calling OpenWeatherMap API for location='{location_name}', lat={lat}, lon={lon}")
            return await fetch_openweathermap_weather_data(client, lat, lon, location_name, country, admin1)

    except HTTPException as http_exc:
        raise http_exc
    except Exception as exc:
        print(f"[TEST_OPENWEATHER ERROR] Direct OpenWeatherMap fetch failed: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail=f"OpenWeatherMap API request failed: {type(exc).__name__}: {str(exc)}"
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
async def get_alerts(
    location: str | None = Query(None, description="Name of the location/city"),
    latitude: float | None = Query(None, description="Latitude coordinate"),
    longitude: float | None = Query(None, description="Longitude coordinate"),
):
    if not location and (latitude is None or longitude is None):
        raise HTTPException(
            status_code=400,
            detail="Either 'location' or both 'latitude' and 'longitude' must be provided."
        )
    try:
        weather_data = await fetch_weather_data(location=location, latitude=latitude, longitude=longitude)
        return evaluate_alert(weather_data)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Weather service is temporarily busy, please try again in a moment."
            )
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
        "gemini-3.5-flash",
        "gemini-3.6-flash",
        "gemini-3.7-flash",
        "gemini-flash-latest",
        "gemini-2.5-flash",
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
    print(f"\n[CHAT REQ] User message: {user_text!r} | Language: {request.language!r}")

    try:
        # 1. Use Gemini API to extract location and intent
        location_name = None
        extractor_instruction = (
            "The user's message may be in any language (English, Hindi, or others). "
            "Regardless of input language, always respond with a valid JSON object in the exact format specified, with location and intent as plain string values. "
            "Respond ONLY with a JSON object containing exactly two fields: "
            '"location" (the place name mentioned in the message, translated/transliterated to standard English place name if needed, or "unknown" if none is mentioned) '
            'and "intent" (one of: "forecast", "alert", "climate", "general"). '
            "Do not include code fences, markdown, or extra explanations outside the JSON."
        )

        raw_text = ""
        try:
            raw_text = generate_gemini_content(user_text, system_instruction=extractor_instruction)
            print(f"[CHAT GEMINI RAW EXTRACT]: {raw_text!r}")
        except Exception as gem_err:
            print(f"[CHAT ERROR] Gemini location extraction call failed: {gem_err}")

        parsed_json = None
        if raw_text:
            clean_json_str = re.sub(r"^```(?:json)?|```$", "", raw_text, flags=re.MULTILINE).strip()
            try:
                parsed_json = json.loads(clean_json_str)
            except Exception as parse_err:
                print(f"[CHAT LOG] Direct json.loads failed: {parse_err}. Attempting regex extraction.")
                match = re.search(r"\{.*\}", raw_text, re.DOTALL)
                if match:
                    try:
                        parsed_json = json.loads(match.group(0))
                        print(f"[CHAT LOG] Regex extracted JSON: {parsed_json}")
                    except Exception as regex_err:
                        print(f"[CHAT ERROR] Regex JSON parse also failed: {regex_err}")

        if parsed_json and isinstance(parsed_json, dict):
            extracted_loc = parsed_json.get("location")
            if extracted_loc and str(extracted_loc).strip().lower() not in ["unknown", "none", "null", ""]:
                location_name = str(extracted_loc).strip()

        print(f"[CHAT LOG] Extracted location_name: {location_name!r}")

        # 2. If no location is mentioned, return a friendly clarification response
        if not location_name:
            user_lower = user_text.lower()
            greeting_keywords = ["hi", "hii", "hiii", "hello", "hey", "heyy", "greetings", "good morning", "good afternoon", "good evening", "namaste", "pranam"]
            words = re.findall(r'\b\w+\b', user_lower)
            is_greeting = any(w in greeting_keywords for w in words) or user_lower.startswith(("hi", "hello", "hey", "namaste"))

            target_lang = request.language if request.language and request.language.strip() else "English"
            if target_lang.lower() in ["hindi", "hi"]:
                clarification_answer = "नमस्ते! मैं आपको किसी भी शहर का मौसम बता सकता हूँ — आप किस जगह का मौसम देखना चाहते हैं?" if is_greeting else "आप किस शहर या जगह का मौसम जानना चाहते हैं?"
            elif target_lang.lower() in ["english", "en"]:
                clarification_answer = "Hi! I can tell you the weather for any city — which place would you like to check?" if is_greeting else "Which city or place would you like the weather for?"
            else:
                try:
                    clarification_instruction = (
                        f"CRITICAL MANDATE: You MUST respond ONLY in {target_lang}. "
                        "Do NOT include any English, Hindi, translation notice, pronunciation guide, parenthetical notes, or meta-commentary of any kind — output ONLY the direct text in {target_lang}, nothing else."
                    )
                    prompt_text = (
                        f"Translate the following user-facing clarification message into {target_lang}: "
                        f"'{'Hi! I can tell you the weather for any city — which place would you like to check?' if is_greeting else 'Which city or place would you like the weather for?'}'"
                    )
                    clarification_answer = generate_gemini_content(prompt_text, system_instruction=clarification_instruction)
                except Exception:
                    clarification_answer = "Hi! I can tell you the weather for any city — which place would you like to check?" if is_greeting else "Which city or place would you like the weather for?"

            return {
                "simple_answer": clarification_answer,
                "location_used": None,
                "raw_data": None,
                "needs_location": True,
            }

        # 3. Fetch real weather data when location IS provided
        try:
            weather_data = await fetch_weather_data(location_name)
        except Exception as exc:
            print(f"[CHAT ERROR] fetch_weather_data for {location_name!r} failed: {exc}")
            target_lang = request.language if request.language and request.language.strip() else "English"
            is_hi = target_lang.lower() in ["hindi", "hi"]
            error_answer = f"क्षमा करें, मुझे '{location_name}' के लिए मौसम का डेटा नहीं मिल सका।" if is_hi else f"Sorry, I could not find weather data for '{location_name}'."
            return {
                "simple_answer": error_answer,
                "location_used": location_name,
                "raw_data": None,
                "needs_location": False,
            }

        # 4. Generate simple answer with Gemini using real weather context
        target_lang = request.language if request.language and request.language.strip() else "English"
        answer_instruction = (
            "You are WeatherGPT, a weather assistant for everyday users with no technical background. "
            "You will receive real weather data as JSON. Answer the user's original question in 1-3 short, plain sentences. "
            "Do NOT use jargon like 'convective,' 'confidence interval,' model names, or coordinates. "
            "State what the weather is/will be and one practical suggestion if relevant. "
            "Base your answer only on the provided real data — never invent numbers. "
            f"CRITICAL MANDATE: You MUST respond ONLY in {target_lang}. All output text MUST be written strictly and entirely in {target_lang} script/language as a native speaker would. "
            "Do NOT include any English explanation, Hindi fallback, translation notice, pronunciation guide, parenthetical notes, or meta-commentary of any kind — output ONLY the direct answer text in {target_lang}, nothing else."
        )
        context_prompt = (
            f"User Question: {user_text}\n"
            f"Resolved Location: {weather_data.get('location', location_name)}\n"
            f"Real Weather Data JSON: {json.dumps(weather_data)}"
        )
        simple_answer = generate_gemini_content(context_prompt, system_instruction=answer_instruction)

        return {
            "simple_answer": simple_answer,
            "location_used": weather_data.get("location", location_name),
            "raw_data": weather_data,
            "needs_location": False,
        }

    except Exception as top_exc:
        print(f"[CHAT TOP-LEVEL EXCEPTION]: {top_exc}")
        import traceback
        traceback.print_exc()
        target_lang = (request.language or "English").strip()
        is_hi = target_lang.lower() in ["hindi", "hi"]
        fallback_msg = (
            "क्षमा करें, मुझे इस समय आपके अनुरोध को संसाधित करने में समस्या हो रही है। कृपया पुनः प्रयास करें।"
            if is_hi
            else "I am having trouble processing that request right now. Please try again or rephrase your question."
        )
        return {
            "simple_answer": fallback_msg,
            "location_used": None,
            "raw_data": None,
            "needs_location": False,
        }



@app.get("/farmer-advisory")
async def get_farmer_advisory(
    location: str | None = Query(None, description="Name of the location/city"),
    latitude: float | None = Query(None, description="Latitude coordinate"),
    longitude: float | None = Query(None, description="Longitude coordinate"),
    language: str = Query("English", description="Target language for advisory recommendations"),
):
    if not location and (latitude is None or longitude is None):
        raise HTTPException(
            status_code=400,
            detail="Either 'location' or both 'latitude' and 'longitude' must be provided."
        )

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY environment variable is not configured."
        )

    try:
        weather_data = await fetch_weather_data(location=location, latitude=latitude, longitude=longitude)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Weather service is temporarily busy, please try again in a moment."
            )
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
            detail=f"Failed to fetch weather data for farmer advisory: {str(exc)}"
        )

    target_lang = language.strip() if language and language.strip() else "English"
    resolved_location = weather_data.get("location", location or "Current Location")

    advisory_instruction = (
        "You are an agricultural advisory assistant for Indian farmers. You will receive real weather data (current conditions, hourly forecast, 7-day forecast) as JSON. "
        "Generate 3-4 short, practical farming recommendations based ONLY on this real data — e.g. whether to delay irrigation, pause pesticide spraying, protect crops from heavy rain, or harvest before expected rain. "
        "Each recommendation should be one or two plain sentences, no jargon, no invented statistics or made-up organization names. "
        f"You MUST write the 'title' and 'advice' fields entirely in {target_lang} — do not include any English translation, pronunciation guide, or meta-commentary of any kind if {target_lang} is not English; output ONLY the direct text in {target_lang}. "
        "Respond as a JSON array of objects, each with 'title' and 'advice'. "
        "Do not include code fences, markdown formatting, or any introductory text outside the JSON array."
    )

    context_prompt = (
        f"Location: {resolved_location}\n"
        f"Target Language: {target_lang}\n"
        f"Real Weather Data JSON: {json.dumps(weather_data)}"
    )

    try:
        raw_text = generate_gemini_content(context_prompt, system_instruction=advisory_instruction)
        clean_json_str = re.sub(r"^```(?:json)?|```$", "", raw_text, flags=re.MULTILINE).strip()
        parsed = json.loads(clean_json_str)

        if isinstance(parsed, dict) and "recommendations" in parsed:
            recommendations = parsed["recommendations"]
        elif isinstance(parsed, list):
            recommendations = parsed
        else:
            recommendations = [parsed] if isinstance(parsed, dict) else []

        formatted_recs = []
        for item in recommendations:
            if isinstance(item, dict):
                title = item.get("title") or item.get("heading") or "Farming Recommendation"
                advice = item.get("advice") or item.get("recommendation") or item.get("description") or ""
                formatted_recs.append({"title": title, "advice": advice})

        if not formatted_recs:
            raise ValueError("No recommendations generated")

    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse AI response into JSON for farmer advisory: {str(exc)}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API error during advisory generation: {str(exc)}"
        )

    return {
        "location": resolved_location,
        "language": target_lang,
        "recommendations": formatted_recs,
        "source": "Open-Meteo + AI Analysis",
    }


@app.get("/climate-analysis")
async def get_climate_analysis(
    location: str | None = Query(None, description="Name of the location/city"),
    latitude: float | None = Query(None, description="Latitude coordinate"),
    longitude: float | None = Query(None, description="Longitude coordinate"),
):
    if not location and (latitude is None or longitude is None):
        raise HTTPException(
            status_code=400,
            detail="Either 'location' or both 'latitude' and 'longitude' must be provided."
        )

    has_coords = latitude is not None and longitude is not None
    has_location = bool(location and location.strip())

    # Check cache for climate analysis
    now = time.time()
    candidate_keys = []
    if has_coords:
        candidate_keys.append(f"coords:{round(latitude, 2)}:{round(longitude, 2)}")
    if has_location:
        candidate_keys.append(f"loc:{location.strip().lower()}")

    for k in candidate_keys:
        if k in CLIMATE_CACHE:
            ts, data = CLIMATE_CACHE[k]
            if now - ts < CLIMATE_CACHE_TTL:
                return data

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            lat = None
            lon = None
            location_name = "Current Location"
            country = ""
            admin1 = ""

            if has_coords:
                lat = latitude
                lon = longitude
                try:
                    rev_res = await client.get(
                        "https://api.bigdatacloud.net/data/reverse-geocode-client",
                        params={"latitude": lat, "longitude": lon}
                    )
                    if rev_res.status_code == 200:
                        rev_data = rev_res.json()
                        name = (
                            rev_data.get("city")
                            or rev_data.get("locality")
                            or rev_data.get("localityInfo", {}).get("administrative", [{}])[0].get("name")
                        )
                        if name:
                            location_name = name
                        country = rev_data.get("countryName", "")
                        admin1 = rev_data.get("principalSubdivision", "")
                except Exception:
                    pass
            else:
                sorted_results = await search_geocoding_results(client, location.strip(), count=10)
                if not sorted_results:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Location '{location}' not found."
                    )

                location_info = sorted_results[0]
                lat = location_info.get("latitude")
                lon = location_info.get("longitude")
                location_name = location_info.get("name", location)
                country = location_info.get("country", "")
                admin1 = location_info.get("admin1", "")

            # Check cache by resolved coordinates
            coord_key = f"coords:{round(lat, 2)}:{round(lon, 2)}"
            if coord_key in CLIMATE_CACHE:
                ts, data = CLIMATE_CACHE[coord_key]
                if now - ts < CLIMATE_CACHE_TTL:
                    if has_location:
                        CLIMATE_CACHE[f"loc:{location.strip().lower()}"] = (ts, data)
                    return data

            today = date.today()
            current_year = today.year
            current_month = today.month
            month_name = today.strftime("%B")
            days_in_month = calendar.monthrange(current_year, current_month)[1]

            past_years = [current_year - 5 + i for i in range(5)]
            start_date_str = f"{current_year - 5}-{current_month:02d}-01"
            
            latest_archive_date = min(today, today - timedelta(days=2))
            if latest_archive_date.year < current_year or latest_archive_date.month < current_month:
                end_date_str = f"{current_year - 1}-{current_month:02d}-{days_in_month:02d}"
            else:
                end_date_str = latest_archive_date.isoformat()

            archive_url = "https://archive-api.open-meteo.com/v1/archive"
            archive_params = {
                "latitude": lat,
                "longitude": lon,
                "start_date": start_date_str,
                "end_date": end_date_str,
                "daily": "temperature_2m_mean,precipitation_sum",
                "timezone": "auto"
            }

            archive_res = await fetch_with_retry(client, archive_url, params=archive_params)
            archive_res.raise_for_status()
            archive_data = archive_res.json()

            daily = archive_data.get("daily", {})
            times = daily.get("time", [])
            temps = daily.get("temperature_2m_mean", [])
            precips = daily.get("precipitation_sum", [])

            yearly_stats = {yr: {"temps": [], "precips": []} for yr in past_years + [current_year]}

            for t_str, t_val, p_val in zip(times, temps, precips):
                if not t_str:
                    continue
                parts = t_str.split("-")
                if len(parts) >= 2:
                    yr = int(parts[0])
                    m = int(parts[1])
                    if m == current_month and yr in yearly_stats:
                        if t_val is not None:
                            yearly_stats[yr]["temps"].append(t_val)
                        if p_val is not None:
                            yearly_stats[yr]["precips"].append(p_val)

            yearly_averages = []
            for yr in past_years:
                y_temps = yearly_stats[yr]["temps"]
                y_precips = yearly_stats[yr]["precips"]

                avg_temp = round(sum(y_temps) / len(y_temps), 1) if y_temps else 0.0
                avg_precip = round(sum(y_precips), 1) if y_precips else 0.0

                yearly_averages.append({
                    "year": yr,
                    "avg_temp": avg_temp,
                    "avg_precipitation": avg_precip
                })

            valid_past_temps = [item["avg_temp"] for item in yearly_averages if item["avg_temp"] > 0]
            five_year_avg_temp = round(sum(valid_past_temps) / len(valid_past_temps), 1) if valid_past_temps else 0.0

            curr_temps = yearly_stats[current_year]["temps"]
            if curr_temps:
                current_month_avg_temp = round(sum(curr_temps) / len(curr_temps), 1)
            else:
                current_month_avg_temp = five_year_avg_temp

            anomaly_celsius = round(current_month_avg_temp - five_year_avg_temp, 1)
            full_location = f"{location_name}, {admin1}" if admin1 else f"{location_name}, {country}" if country else location_name

            result = {
                "location": full_location,
                "current_month": month_name,
                "current_month_avg_temp": current_month_avg_temp,
                "five_year_avg_temp": five_year_avg_temp,
                "anomaly_celsius": anomaly_celsius,
                "yearly_averages": yearly_averages,
                "source": "Open-Meteo Historical Archive"
            }

            # Store in climate cache
            CLIMATE_CACHE[coord_key] = (now, result)
            if has_location:
                CLIMATE_CACHE[f"loc:{location.strip().lower()}"] = (now, result)
            if location_name:
                CLIMATE_CACHE[f"loc:{location_name.strip().lower()}"] = (now, result)

            return result

    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Weather service is temporarily busy, please try again in a moment."
            )
        raise HTTPException(
            status_code=502,
            detail=f"External archive weather service error: {exc.response.status_code}"
        )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to connect to historical weather archive: {str(exc)}"
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during climate analysis: {str(exc)}"
        )


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)





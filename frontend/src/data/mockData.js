export const mockLocations = [
  { id: 'lucknow', name: 'Lucknow, Uttar Pradesh', region: 'Gangetic Basin', code: 'Amausi (VILK)' },
  { id: 'kanpur', name: 'Kanpur, Uttar Pradesh', region: 'Gangetic Basin', code: 'Chakeri (VIKA)' },
  { id: 'varanasi', name: 'Varanasi, Uttar Pradesh', region: 'Eastern UP', code: 'Babatpur (VIBN)' },
  { id: 'delhi', name: 'New Delhi, Delhi NCR', region: 'Northern Plains', code: 'Safdarjung (VIDD)' }
];

export const mockCurrentWeather = {
  location: "Lucknow, Uttar Pradesh",
  country: "IN",
  basin: "Gangetic Basin",
  station: "Amausi (VILK)",
  dopplerStatus: "Doppler Live",
  temperature: 29,
  condition: "Partly Cloudy",
  feelsLike: 31,
  subCondition: "Dry surface air",
  lastUpdated: "18:45 IST",
  metrics: {
    humidity: {
      label: "HUMIDITY",
      value: "65%",
      subText: "Dew Point: 22°C",
      icon: "Droplets"
    },
    wind: {
      label: "WIND VECTOR",
      value: "12 km/h ENE",
      subText: "Gusts to 18 km/h",
      icon: "Wind"
    },
    precipProb: {
      label: "PRECIP PROB",
      value: "40%",
      subText: "Light convective showers",
      icon: "CloudRain"
    },
    aqi: {
      label: "AQI (CPCB)",
      value: "134",
      status: "Moderate",
      subText: "PM2.5: 52 µg/m³",
      icon: "Activity"
    },
    sunCycle: {
      label: "SUN CYCLE",
      value: "↑ 05:42 AM",
      sunset: "↓ 06:48 PM",
      subText: "13h 06m day length",
      icon: "Sun"
    },
    uvPressure: {
      label: "UV & PRESSURE",
      value: "UV 4",
      pressure: "1008 hPa",
      subText: "Barometer steady",
      icon: "ShieldAlert"
    }
  },
  quickInsight: "Mild evening breeze with humidity rising. Convective thunderstorms developing toward Barabanki; safe for evening commuting, but brief sprinkles likely after 20:00."
};

export const mockHourlyForecast = [
  { time: "6 PM", temp: 29, condition: "Partly", precip: 10, icon: "SunCloud" },
  { time: "7 PM", temp: 28, condition: "Cloudy", precip: 25, icon: "Cloud" },
  { time: "8 PM", temp: 27, condition: "Patchy", precip: 35, icon: "CloudDrizzle" },
  { time: "9 PM", temp: 26, condition: "Lt. Rain", precip: 50, icon: "CloudRain", selected: true },
  { time: "10 PM", temp: 25, condition: "Overcast", precip: 20, icon: "Cloud" },
  { time: "11 PM", temp: 24, condition: "Clear", precip: 10, icon: "Moon" },
  { time: "12 AM", temp: 24, condition: "Clear", precip: 5, icon: "Moon" },
  { time: "1 AM", temp: 23, condition: "Clear", precip: 5, icon: "Moon" }
];

export const mockWeeklyForecast = [
  { day: "Today", condition: "Partly Cloudy", precip: 40, maxTemp: 29, minTemp: 23, icon: "CloudSun" },
  { day: "Saturday", condition: "Mod. Storm", precip: 75, maxTemp: 30, minTemp: 20, icon: "CloudLightning" },
  { day: "Sunday", condition: "Showers", precip: 60, maxTemp: 28, minTemp: 22, icon: "CloudRain" },
  { day: "Monday", condition: "Partly Sunny", precip: 35, maxTemp: 31, minTemp: 24, icon: "Sun" },
  { day: "Tuesday", condition: "Sunny & Humid", precip: 10, maxTemp: 33, minTemp: 25, icon: "Sun" },
  { day: "Wednesday", condition: "Clear Skies", precip: 5, maxTemp: 34, minTemp: 26, icon: "Sun" },
  { day: "Thursday", condition: "Breezy Clouds", precip: 15, maxTemp: 32, minTemp: 25, icon: "Cloud" }
];

export const mockWeatherAlert = {
  title: "Heavy Rainfall Warning",
  badge: "Orange Alert • IMD Validated",
  severity: "orange",
  expectedWindow: "Tomorrow, 14:00–18:30 IST",
  affectedTract: "Lucknow, Unnao & Kanpur East",
  diagnostic: "Monsoonal trough shifting northward interacting with mid-tropospheric shear zone. Localized waterlogging possible in low-lying urban areas and agricultural tracts."
};

export const mockFarmerAdvisory = {
  zone: "Central UP Plain Zone • Rabi/Zaid Transition Cycle",
  modelBadge: "30-Day Agro-Met Model",
  primaryAlert: "Convective rain expected tomorrow afternoon across central UP plains. Estimated precipitation intensity: 15–25 mm. Follow pre-precipitation protocol below:",
  recommendations: [
    {
      id: 1,
      title: "Avoid chemical/pesticide spraying today",
      desc: "Upcoming showers will dilute and wash active agents into groundwater runoffs."
    },
    {
      id: 2,
      title: "Ensure proper field drainage in vegetable nurseries",
      desc: "Clear drainage furrows for tomato, chili, and cucurbit crops to avert collar rot."
    },
    {
      id: 3,
      title: "Delay scheduled canal irrigation for 48 hours",
      desc: "Conserve diesel/water-pump energy; natural precipitation will fulfill moisture requirements."
    },
    {
      id: 4,
      title: "Harvest mature pulse pods before Saturday morning",
      desc: "Moisture absorption may trigger fungal pod rot and shatter loss in standing lentils."
    }
  ]
};

export const mockClimateInsight = {
  subtitle: "Gangetic Basin Longitudinal Anomaly",
  baseline: "1991–2020 Baseline",
  weeklyDeviation: "+1.2°C",
  deviationDesc: "Lucknow is tracking 1.2°C warmer than the 30-year IMD climatological average for this week.",
  monsoonShift: "+3.4 days delay",
  chartData: [
    { year: "2015", shift: 1.0 },
    { year: "2018", shift: 1.8 },
    { year: "2021", shift: 2.5 },
    { year: "2024", shift: 3.1 },
    { year: "2026 Proj", shift: 3.4 }
  ],
  precipVariance: "+14% anomaly in Gangetic plains."
};

export const mockSuggestedPrompts = [
  "Will it rain tomorrow afternoon?",
  "Should farmers irrigate wheat fields this week?",
  "Is it safe to travel from Lucknow to Kanpur?",
  "Weekend forecast"
];

export const mockAIResponse = {
  question: "Will it rain tomorrow afternoon in Lucknow?",
  generatedTime: "420ms",
  answer: "Yes, moderate convective rain (75% probability) is forecasted tomorrow between 14:00 and 18:30 IST. Rain bands are expected to move along the Mohanlalganj-Sarojini Nagar corridor toward central Lucknow, bringing 15–22 mm total precipitation.",
  agriculturalImpact: "Halt soil nitrogen fertilization; delay mustard pod thrashing.",
  urbanLogistics: "Anticipate traffic delays on Shaheed Path & Hazratganj during 16:00 rush hour.",
  dataSources: ["IMD Amausi Doppler", "ECMWF IFS 0.1°", "INSAT-3D Thermal IR"]
};

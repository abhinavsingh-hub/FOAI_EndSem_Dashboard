# 🛰️ OrbitalDash: Real-Time ISS & News Dashboard

**OrbitalDash** is a full-stack, real-time web application built for the FOAI End-Sem examination. It serves as a unified dashboard that tracks the International Space Station live, aggregates breaking news headlines, and features a context-aware AI chatbot that can answer questions based strictly on the dashboard's current data state.

**Live Demo:** [https://foai-endsem-dashboard.vercel.app](https://foai-endsem-dashboard.vercel.app)

---

## ✨ Key Features

### 1. Live ISS Tracker
*   **Real-Time Telemetry:** Polls `api.open-notify.org` every 15 seconds to fetch the exact latitude and longitude of the ISS.
*   **Live Map Visualization:** Utilizes **Leaflet.js** to map the current location, tracking the last 15 trajectory points.
*   **Dynamic Speed Calculation:** Computes the live speed of the ISS using the mathematical **Haversine formula**.
*   **Reverse Geocoding:** Automatically translates raw coordinates into the nearest city/country or ocean using the Nominatim API.
*   **Astronaut Manifest:** Displays the real-time count and names of astronauts currently in space.

### 2. Intelligent News Dashboard
*   **News Aggregation:** Fetches the top 10 latest breaking articles dynamically using the NewsAPI.
*   **Smart Caching:** Implements a strict 15-minute `localStorage` cache mechanism to ensure high performance and prevent unnecessary API exhaustion.
*   **Interactivity:** Allows users to search through articles and sort them interactively by publication date or source.

### 3. Context-Aware AI Chatbot (Qwen-72B)
*   **Hugging Face Inference:** Integrated with `@huggingface/inference` to power a floating chatbot interface.
*   **Dynamic Prompt Engineering:** In the background, the app builds a massive context string containing the latest ISS speed, coordinate data, and cached news headlines. 
*   **Data-Isolation Rules:** The model (`Qwen/Qwen2.5-72B-Instruct`) is strictly instructed to **only** answer based on the dashboard's provided context, blocking hallucinated or external internet knowledge.

### 4. Data Visualization
*   **ISS Speed Trend:** A `Recharts` Line Chart that dynamically records and plots the last 30 live speed variations.
*   **News Distribution:** An interactive Doughnut Chart breaking down the distribution of the loaded articles by their respective publisher source.

---

## 🛠️ Technology Stack
*   **Frontend:** React (Vite), Tailwind CSS V4, Lucide React (Icons).
*   **Mapping:** `react-leaflet`, Leaflet.
*   **Data Visualization:** `recharts`.
*   **AI Integration:** `@huggingface/inference` (Qwen 2.5).
*   **Deployment & Backend Routing:** Vercel, Vercel Serverless Functions (`api/`).

---

## 🏗️ Technical Architecture & Problem Solving

To achieve a production-ready application deployed on **Vercel**, several critical backend workarounds were implemented:

1.  **Mixed-Content Errors:** The ISS tracking API (`api.open-notify.org`) strictly operates over HTTP. Calling it directly from a secure HTTPS Vercel frontend results in severe browser Mixed-Content blocks.
2.  **CORS & Origin Blocks:** The NewsAPI free tier blocks all fetch requests coming from non-localhost browser environments.
3.  **The Solution:** Instead of exposing API keys or failing in production, this project utilizes **Vercel Serverless API Routes** (`api/iss.js` and `api/news.js`). The React frontend calls these secure internal routes, which then privately proxy the requests to the external APIs, stripping Origin headers and bypassing all CORS/Mixed-Content limitations securely.

---

## 🚀 Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abhinavsingh-hub/FOAI_EndSem_Dashboard.git
   cd FOAI_EndSem_Dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your API keys:
   ```env
   VITE_NEWS_API_KEY=your_news_api_key_here
   VITE_AI_TOKEN=your_huggingface_token_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Deploy to Vercel:**
   ```bash
   npm i -g vercel
   vercel
   vercel --prod
   ```

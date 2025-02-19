import { useState, useEffect } from "react";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const EarthquakeAdvice = () => {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [earthquakes, setEarthquakes] = useState<any[]>([]);
  const [highestMagnitude, setHighestMagnitude] = useState<number | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geminiLoading, setGeminiLoading] = useState(false);

  const temperature = 0.4;
  const maxOutputTokens = 500;

  useEffect(() => {
    const generateGeminiAdvice = async () => {
      if (earthquakes.length > 0 || highestMagnitude !== null) {
        setGeminiLoading(true);
        setError(null);
        try {
          const prompt = `You are a highly skilled earthquake safety and disaster preparedness expert. You will analyze earthquake data and provide a professional, well-structured overview and actionable advice to the user. The goal is to inform and empower the user to take appropriate safety measures.

          The user is located at latitude: ${latitude}, longitude: ${longitude}.

          Here's a summary of recent earthquake activity:
          - Highest magnitude earthquake recorded in the past 5 years within the area: ${highestMagnitude}.
          - Total number of earthquakes recorded: ${earthquakes.length}.

          Here's a sample of the earthquake data (limited to the first 10 entries for brevity):
          ${JSON.stringify(earthquakes.slice(0, 10), null, 2)}

          Instructions for your response:

          1. **Executive Summary: Seismic Risk Assessment** (Approximately 2 sentences):
              *   Begin with a clear and concise assessment of the overall seismic risk in the area ("low," "moderate," or "high").  Justify your assessment based on the provided data (highest magnitude and frequency).

          2. **Data-Driven Analysis** (Approximately 3-4 bullet points):
              *   Analyze the key features of the earthquake data sample.  Specifically, address the following:
                  *   Magnitude Distribution:  Describe the distribution of earthquake magnitudes (e.g., "primarily small tremors with a few moderate events," "a mix of small, moderate, and large earthquakes").
                  *   Location Patterns:  Identify any notable patterns or clustering in the earthquake locations (latitude/longitude).  If no clear patterns are apparent, state that.
                  *   Depth Range:  Describe the range of earthquake depths. Is it relatively consistent or highly variable?

          3.  **Actionable Safety Recommendations** (Approximately 5-7 bullet points):
              *   Provide specific, actionable safety recommendations tailored to the identified seismic risk and earthquake patterns.  Examples:
                  *   "Due to the frequency of small tremors, focus on securing household items that could fall and cause injury."
                  *   "Given the potential for larger earthquakes, ensure your home is structurally sound and consider retrofitting if necessary."
                  *   "Prepare a comprehensive emergency kit that includes..."
                  *   "Familiarize yourself with local evacuation routes and emergency protocols."
                  *    "Know where your gas shutoff valve is and how to use it."
                  *   "Participate in earthquake drills to practice safety procedures."

          4. **Essential Earthquake Safety Tips** (Approximately 3-5 bullet points):
              *   Conclude with a few general earthquake safety tips that are always relevant, presented as bullet points. Examples:
                  *   "Drop, Cover, and Hold On during an earthquake."
                  *   "Secure heavy furniture and appliances to prevent them from falling."
                  *   "Prepare an emergency supply kit with essential items."
                  *   "Know your evacuation routes."

          Formatting and Tone:

          *   Use a professional and informative tone.
          *   Organize the information logically and clearly.
          *   Use bullet points to enhance readability.
          *   Be concise and avoid unnecessary jargon.
          *   Assume the user has limited knowledge of earthquake science.

          Keep the response under ${maxOutputTokens} tokens.

          Please use markdown formatting for better readability. Specifically, use paragraph breaks and bullet points where appropriate.`;

          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }], 
            generationConfig: {
              temperature: temperature,
              maxOutputTokens: maxOutputTokens,
            },
          });
    
          if (result && result.response) {
            const formattedAdvice = result.response.text()
              .replace(/\*/g, '•')  // Replace asterisks with bullet points
              .split('\n\n')         // Split by double line breaks for paragraph breaks
              .map(paragraph => `<p>${paragraph.trim().replace(/\n/g, '<br />')}</p>`) // Wrap each paragraph and preserve line breaks
              .join('');            // Join all paragraphs back together
    
            setAdvice(formattedAdvice);
    
          } else {
            console.warn("Gemini API returned an undefined response. Check your prompt, API key, and network connection.");
            setError("Gemini API returned an unexpected response. See console for details.");
            setAdvice(null);
          }
        } catch (geminiError: any) {
          console.error("Error generating advice:", geminiError);
          setError("Failed to generate advice. Please check the console for errors.");
          setAdvice(null);
        } finally {
          setGeminiLoading(false);
        }
      } else {
        setAdvice(null);
      }
    };
    generateGeminiAdvice();
  }, [earthquakes, highestMagnitude, latitude, longitude]);

  const fetchEarthquakeData = async () => {
    setLoading(true);
    setError(null);
    setAdvice(null);
    setEarthquakes([]);
    setHighestMagnitude(null);

    try {
      const response = await axios.get("/api/earthquakes/data", {
        params: { latitude, longitude },
      });

      setEarthquakes(response.data.earthquakes);
      setHighestMagnitude(response.data.highest_magnitude || 0);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch earthquake data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await fetchEarthquakeData();
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Earthquake Safety Advice</h1>
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 font-semibold">Latitude:</label>
          <input
            type="number"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter latitude"
            required
          />

          <label className="block mb-2 font-semibold">Longitude:</label>
          <input
            type="number"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter longitude"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? "Fetching..." : "Get Advice"}
          </button>
        </form>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {advice && (
        <div className="mt-6 bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
          <h2 className="text-lg font-bold mb-2">Advice</h2>
          {geminiLoading ? (
            <p>Generating advice...</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: advice }} />
          )}
          {highestMagnitude !== null && (
            <p className="mt-2 text-sm text-gray-600">
              Highest Recorded Magnitude: {highestMagnitude}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default EarthquakeAdvice;
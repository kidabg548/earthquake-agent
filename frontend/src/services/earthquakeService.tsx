import axios from "axios";

const baseUrl = "/api/earthquakes";

interface EarthquakeProperties {
  mag: number;
  place: string;
  time: number;
  distance_km?: number;
  [key: string]: any;
}

interface EarthquakeGeometry {
  type: string;
  coordinates: [number, number, number?];
}

export interface Earthquake {
  type: string;
  id: string;
  properties: EarthquakeProperties;
  geometry: EarthquakeGeometry;
}

interface HeatmapDataPoint {
  latitude: number;
  longitude: number;
  magnitude: number;
}

interface Prediction {
  predicted_time: string;
  predicted_magnitude: number;
}

const getAll = async (params: object = {}): Promise<Earthquake[]> => {
  try {
    const response = await axios.get<Earthquake[]>(baseUrl, { params });
    return response.data;
  } catch (error: any) {
    console.error("Error fetching earthquakes:", error);
    throw error;
  }
};

const getHeatmapData = async (
  params: object = {}
): Promise<HeatmapDataPoint[]> => {
  try {
    const response = await axios.get<HeatmapDataPoint[]>(
      "/api/earthquakes/heatmap",
      { params }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching heatmap data:", error);
    throw error;
  }
};

const getNearbyEarthquakes = async (
  latitude: number,
  longitude: number
): Promise<Earthquake[]> => {
  try {
    const response = await axios.get<Earthquake[]>(
      "/api/earthquakes/nearby", 
      {
        params: {
          latitude: latitude,
          longitude: longitude,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching nearby earthquakes:", error);
    throw error;
  }
};


const getEarthquakePrediction = async (
  latitude: number,
  longitude: number
): Promise<Prediction> => {
  try {
    const response = await axios.get<Prediction>(
      "/api/earthquakes/predict", // Prediction endpoint
      {
        params: {
          latitude: latitude,
          longitude: longitude,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error("Error fetching earthquake prediction:", error);
    throw error;
  }
};

const earthquakeService = { getAll, getHeatmapData, getNearbyEarthquakes, getEarthquakePrediction };
export default earthquakeService;
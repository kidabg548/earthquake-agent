// frontend/src/App.tsx
import { useState, useEffect, useCallback } from "react";
import "./App.css"; // Ensure this file is using the general styles
import earthquakeService, { Earthquake } from "./services/earthquakeService";
import EarthquakeList from "./components/EarthquakeList";
import MapView from "./components/MapView";
import NearbyEarthquakes from "./components/NearbyEarthquakes";



interface UserLocation {
    latitude: number | null;
    longitude: number | null;
}

function App() {
    const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<UserLocation>({
        latitude: null,
        longitude: null,
    });

    // State for additional filters (magnitude range, etc.)
    const [minMagnitude, setMinMagnitude] = useState<number | null>(null);
    const [maxMagnitude, setMaxMagnitude] = useState<number | null>(null);


    const fetchEarthquakeData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params: any = {}; // Start with an empty object

            // Add location parameters if valid
            if (userLocation.latitude !== null && userLocation.longitude !== null) {
                if (!isNaN(userLocation.latitude) && !isNaN(userLocation.longitude)) {
                    params.user_latitude = userLocation.latitude;
                    params.user_longitude = userLocation.longitude;
                } else {
                    console.warn("Invalid latitude or longitude. Location not sent in request.");
                }
            }

            //Add magnitude filters if valid
            if (minMagnitude !== null) {
                if (!isNaN(minMagnitude)) {
                    params.minmagnitude = minMagnitude;
                } else {
                    console.warn("Invalid minMagnitude. minMagnitude not sent in request.");
                }
            }

            if (maxMagnitude !== null) {
                if (!isNaN(maxMagnitude)) {
                    params.maxmagnitude = maxMagnitude;
                } else {
                    console.warn("Invalid maxMagnitude. maxMagnitude not sent in request.");
                }
            }


            const data = await earthquakeService.getAll(params);
            setEarthquakes(data);
        } catch (err: any) {
            console.error("Failed to fetch earthquake data:", err);
            setError(err.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, [userLocation, minMagnitude, maxMagnitude]); // Dependencies:  userLocation, minMagnitude, maxMagnitude

    useEffect(() => {
        fetchEarthquakeData();
    }, [fetchEarthquakeData]);


    if (loading) {
        return <div className="text-center py-4 text-gray-600">Loading earthquake data...</div>;
    }

    if (error) {
        return <div className="text-center py-4 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <header className="mb-8 flex items-center justify-between">
                <h1 className="text-3xl font-semibold text-gray-800">Earthquake Monitor</h1>
            </header>

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-white rounded-lg shadow-md">
                    <EarthquakeList earthquakes={earthquakes} />
                </div>
                <div className="p-4 bg-white rounded-lg shadow-md">
                    <MapView earthquakes={earthquakes} userLocation={userLocation} />
                </div>
            </div>

            {/* Nearby Earthquakes Section */}
            <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
                <NearbyEarthquakes />
            </div>
        </div>
    );
}

export default App;
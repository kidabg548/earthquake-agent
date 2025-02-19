import React, { useState, useEffect, useCallback } from "react";
import earthquakeService, { Earthquake } from "../services/earthquakeService";
import moment from "moment";

interface NearbyEarthquakesProps {}

const NearbyEarthquakes: React.FC<NearbyEarthquakesProps> = () => {
  const [earthquakes, setEarthquakes] = useState<Earthquake[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Initially false
  const [error, setError] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [submittedLatitude, setSubmittedLatitude] = useState<number | null>(
    null
  );
  const [submittedLongitude, setSubmittedLongitude] = useState<number | null>(
    null
  );
  const [prediction, setPrediction] = useState<{
    predicted_time: string;
    predicted_magnitude: number;
  } | null>(null);
  const [predictionLoading, setPredictionLoading] = useState<boolean>(
    false
  ); // Initially false
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const fetchNearbyEarthquakes = useCallback(
    async (lat: number, lng: number) => {
      setLoading(true); // Set loading to true before the request
      setError(null);

      try {
        const data = await earthquakeService.getNearbyEarthquakes(lat, lng);
        setEarthquakes(data);
      } catch (err: any) {
        console.error("Failed to fetch nearby earthquake data:", err);
        setError(err.message || "Failed to load nearby earthquake data");
      } finally {
        setLoading(false); // Set loading to false after the request
      }
    },
    []
  );

  const fetchEarthquakePrediction = useCallback(
    async (lat: number, lng: number) => {
      setPredictionLoading(true); // Set loading to true before the request
      setPredictionError(null);
      try {
        const data = await earthquakeService.getEarthquakePrediction(lat, lng);

        if (data && new Date(data.predicted_time) <= new Date()) {
          console.warn(
            "Prediction time is in the past. Adjusting time to the future."
          );
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + 1);
          data.predicted_time = futureDate.toISOString();
        }

        setPrediction(data);
      } catch (err: any) {
        console.error("Failed to fetch earthquake prediction:", err);
        setPredictionError(
          err.message || "Failed to load earthquake prediction"
        );
        setPrediction(null);
      } finally {
        setPredictionLoading(false); // Set loading to false after the request
      }
    },
    []
  );

  useEffect(() => {
    if (submittedLatitude !== null && submittedLongitude !== null) {
      fetchNearbyEarthquakes(submittedLatitude, submittedLongitude);
    } else {
      // Only reset earthquakes if the values are not null, otherwise keep the previous results for better UX.
      if (latitude === null && longitude === null) {
        setEarthquakes([]);
        setPrediction(null);
      }

    }
  }, [fetchNearbyEarthquakes, submittedLatitude, submittedLongitude, latitude, longitude]);

  const handleLatitudeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(event.target.value);
    setLatitude(isNaN(value) ? null : value);
  };

  const handleLongitudeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(event.target.value);
    setLongitude(isNaN(value) ? null : value);
  };

  const handleSubmit = () => {
    if (latitude !== null && longitude !== null) {
      setSubmittedLatitude(latitude);
      setSubmittedLongitude(longitude);
      setPrediction(null);
    } else {
      setError("Please enter both latitude and longitude.");
    }
  };

  const handlePredictClick = () => {
    if (submittedLatitude !== null && submittedLongitude !== null) {
      fetchEarthquakePrediction(submittedLatitude, submittedLongitude);
    } else {
      setError("Please submit location first.");
    }
  };

  const listMaxHeight = "300px";

  return (
    <div className="bg-white rounded-lg shadow-xl p-6">
      <h3 className="text-2xl font-semibold mb-5 text-gray-800">
        Explore Nearby Earthquakes
      </h3>

      {/* Location Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label
            htmlFor="latitude"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Latitude:
          </label>
          <input
            type="number"
            id="latitude"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter latitude..."
            value={latitude === null ? "" : latitude.toString()}
            onChange={handleLatitudeChange}
          />
        </div>

        <div>
          <label
            htmlFor="longitude"
            className="block text-gray-700 text-sm font-bold mb-2"
          >
            Longitude:
          </label>
          <input
            type="number"
            id="longitude"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            placeholder="Enter longitude..."
            value={longitude === null ? "" : longitude.toString()}
            onChange={handleLongitudeChange}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-start space-x-4 mb-6">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
          type="button"
          onClick={handleSubmit}
          disabled={loading} // Disable while loading
        >
          Find Earthquakes
        </button>

        <button
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
          type="button"
          onClick={handlePredictClick}
          disabled={earthquakes.length < 2 || predictionLoading} // Disable while loading
        >
          Predict Next Earthquake
        </button>
      </div>

      {/* Loading/Error State (Conditional Rendering) */}
      {loading && (
        <div className="text-gray-700 italic mt-4">
          Loading nearby earthquake data...
        </div>
      )}
      {predictionLoading && (
        <div className="text-gray-700 italic mt-4">
          Loading earthquake prediction...
        </div>
      )}
      {error && <div className="text-red-500 font-bold mt-4">Error: {error}</div>}
      {predictionError && (
        <div className="text-red-500 font-bold mt-4">
          Prediction Error: {predictionError}
        </div>
      )}

      {/* Earthquake List */}
      {!loading && !error && (
        <>
          {earthquakes.length === 0 ? (
            <div className="text-gray-500 italic mt-4">
              No nearby earthquakes found in the last month.
            </div>
          ) : (
            <div
              className="overflow-y-auto"
              style={{ maxHeight: listMaxHeight }}
            >
              <ul className="divide-y divide-gray-200">
                {earthquakes.map((earthquake) => (
                  <li key={earthquake.id} className="py-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-700">
                          {earthquake.properties.place}
                        </p>
                        <p className="text-sm text-gray-500">
                          Magnitude:{" "}
                          <span className="text-blue-500 font-semibold">
                            {earthquake.properties.mag.toFixed(1)}
                          </span>
                          <span className="ml-2">•</span>
                          <span className="ml-2">
                            {moment(earthquake.properties.time).format(
                              "YYYY-MM-DD, h:mm A"
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Prediction */}
      {!predictionLoading && !predictionError && prediction && (
        <div className="mt-6 p-5 bg-gray-50 rounded-md shadow-inner">
          <h4 className="font-semibold text-gray-800 mb-3">
            Earthquake Prediction
          </h4>
          <p className="text-gray-700">
            Predicted Time:{" "}
            <span className="font-medium">
              {new Date(prediction.predicted_time).toLocaleString()}
            </span>
          </p>
          <p className="text-gray-700">
            Predicted Magnitude:{" "}
            <span className="font-medium">
              {prediction.predicted_magnitude.toFixed(2)}
            </span>
          </p>

        </div>
      )}
    </div>
  );
};

export default NearbyEarthquakes;
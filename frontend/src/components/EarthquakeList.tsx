import { Earthquake } from "../services/earthquakeService";
import moment from "moment";

interface EarthquakeListProps {
  earthquakes: Earthquake[];
}

function EarthquakeList({ earthquakes }: EarthquakeListProps) {
  const maxHeight = "50vh";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">
          Recent Earthquakes
        </h2>
      </div>

      {earthquakes.length > 0 ? (
        <div className="overflow-y-auto" style={{ maxHeight: maxHeight }}>
          <ul className="divide-y divide-gray-100">
            {earthquakes.map((earthquake) => (
              <li
                key={earthquake.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {earthquake.properties.place}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      Magnitude:{" "}
                      <span
                        className={`font-semibold ${
                          earthquake.properties.mag > 6
                            ? "text-red-600"
                            : earthquake.properties.mag > 4
                            ? "text-orange-500"
                            : "text-green-500"
                        }`}
                      >
                        {earthquake.properties.mag.toFixed(1)}
                      </span>
                      <span className="ml-2">•</span>
                      <span className="ml-2">
                        {moment(earthquake.properties.time).format(
                          "YYYY-MM-DD, h:mm A"
                        )}
                      </span>
                      {earthquake.properties.distance_km && (
                        <span className="ml-2">
                          Distance: {earthquake.properties.distance_km.toFixed(2)} km
                        </span>
                      )}
                    </div>
                    {earthquake.properties.warning && (
                      <div className="mt-2 text-red-600 text-xs">
                        Warning: {earthquake.properties.warning}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {earthquake.properties.mag > 6 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Severe
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="px-6 py-4 text-center text-gray-500 italic">
          No earthquakes found.
        </div>
      )}
    </div>
  );
}

export default EarthquakeList;
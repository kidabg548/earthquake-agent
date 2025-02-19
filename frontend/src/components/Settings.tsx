// import React, { useState } from "react";

// interface UserLocation {
//     latitude: number | null;
//     longitude: number | null;
// }

// interface SettingsProps {
//     onSettingsUpdate: (
//         location: UserLocation,
//         minMagnitude: number | null,
//         maxMagnitude: number | null
//     ) => void;
// }

// const Settings: React.FC<SettingsProps> = ({ onSettingsUpdate }) => {
//     const [latitude, setLatitude] = useState<string>("");
//     const [longitude, setLongitude] = useState<string>("");
//     const [minMagnitude, setMinMagnitude] = useState<string>("");
//     const [maxMagnitude, setMaxMagnitude] = useState<string>("");

//     const handleSubmit = (e: React.FormEvent) => {
//         e.preventDefault();
//         const newLocation: UserLocation = {
//             latitude: parseFloat(latitude),
//             longitude: parseFloat(longitude),
//         };

//         const parsedMinMagnitude =
//             minMagnitude === "" ? null : parseFloat(minMagnitude);
//         const parsedMaxMagnitude =
//             maxMagnitude === "" ? null : parseFloat(maxMagnitude);

//         onSettingsUpdate(newLocation, parsedMinMagnitude, parsedMaxMagnitude);
//     };

//     return (
//         <div className="bg-white dark:bg-gray-700 shadow-md rounded-lg p-6">
//             <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
//                 Settings
//             </h2>
//             <form onSubmit={handleSubmit} className="space-y-4">
//                 <div>
//                     <label
//                         htmlFor="latitude"
//                         className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
//                     >
//                         Latitude:
//                     </label>
//                     <input
//                         type="number"
//                         id="latitude"
//                         value={latitude}
//                         onChange={(e) => setLatitude(e.target.value)}
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
//                     />
//                 </div>
//                 <div>
//                     <label
//                         htmlFor="longitude"
//                         className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
//                     >
//                         Longitude:
//                     </label>
//                     <input
//                         type="number"
//                         id="longitude"
//                         value={longitude}
//                         onChange={(e) => setLongitude(e.target.value)}
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
//                     />
//                 </div>

//                 <div>
//                     <label
//                         htmlFor="minMagnitude"
//                         className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
//                     >
//                         Min Magnitude:
//                     </label>
//                     <input
//                         type="number"
//                         id="minMagnitude"
//                         value={minMagnitude}
//                         onChange={(e) => setMinMagnitude(e.target.value)}
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
//                     />
//                 </div>

//                 <div>
//                     <label
//                         htmlFor="maxMagnitude"
//                         className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2"
//                     >
//                         Max Magnitude:
//                     </label>
//                     <input
//                         type="number"
//                         id="maxMagnitude"
//                         value={maxMagnitude}
//                         onChange={(e) => setMaxMagnitude(e.target.value)}
//                         className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500"
//                     />
//                 </div>

//                 <div>
//                     <button
//                         type="submit"
//                         className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
//                     >
//                         Update Settings
//                     </button>
//                 </div>
//             </form>
//         </div>
//     );
// };

// export default Settings;
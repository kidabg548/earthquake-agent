import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Earthquake } from "../services/earthquakeService";

interface MapViewProps {
    earthquakes: Earthquake[];
    userLocation: { latitude: number | null; longitude: number | null };
}

function MapView({ earthquakes, userLocation }: MapViewProps) {
    const mapRef = useRef<L.Map | null>(null);

    useEffect(() => {
        if (!mapRef.current) {
            const map = L.map("map").setView([0, 0], 2);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution:
                    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);
            mapRef.current = map;
        } else {
            mapRef.current.eachLayer((layer) => {
                if (layer instanceof L.Marker) {
                    mapRef.current!.removeLayer(layer);
                }
            });
        }

        if (
            userLocation.latitude !== null &&
            userLocation.longitude !== null &&
            mapRef.current
        ) {
            L.marker([userLocation.latitude, userLocation.longitude], {
                icon: createCustomIcon("blue"),
            })
                .addTo(mapRef.current)
                .bindPopup("Your Location");
        }

        earthquakes.forEach((earthquake) => {
            const [longitude, latitude] = earthquake.geometry.coordinates;
            if (longitude && latitude && mapRef.current) {
                try {
                    L.marker([latitude, longitude], { icon: createCustomIcon("red") })
                        .addTo(mapRef.current)
                        .bindPopup(
                            `${earthquake.properties.place} - Magnitude: ${earthquake.properties.mag}`
                        );
                } catch (error) {
                    console.error("Error adding marker:", error);
                }
            } else {
                console.warn("Invalid coordinates for earthquake:", earthquake.id);
            }
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [earthquakes, userLocation]);

    function createCustomIcon(color: string) {
        return L.divIcon({
            className: "custom-icon",
            html: `<div style="background-color:${color};width:12px;height:12px;border:1px solid black; border-radius: 50%;"></div>`,
        });
    }

    return <div id="map" style={{ height: "400px" }}></div>;
}

export default MapView;
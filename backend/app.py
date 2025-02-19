from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timezone, timedelta
import os
import logging
from earthquake_data_fetcher import EarthquakeDataFetcher

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app)

DEFAULT_MAGNITUDE = float(os.environ.get("DEFAULT_MAGNITUDE", 3.0))
DEFAULT_DAYS = int(os.environ.get("DEFAULT_DAYS", 7))


@app.route('/earthquakes')
def get_earthquakes():
    try:
        fetcher = EarthquakeDataFetcher()

        start_time = request.args.get('starttime')
        end_time = request.args.get('endtime')
        min_magnitude = request.args.get('minmagnitude', type=float)
        max_magnitude = request.args.get('maxmagnitude', type=float)

        # Location parameters (accepting these from the frontend)
        min_latitude = request.args.get('minlatitude', type=float)
        max_latitude = request.args.get('maxlatitude', type=float)
        min_longitude = request.args.get('minlongitude', type=float)
        max_longitude = request.args.get('maxlongitude', type=float)

        limit = request.args.get('limit', type=int)
        orderby = request.args.get('orderby')
        user_latitude = request.args.get('user_latitude', type=float)
        user_longitude = request.args.get('user_longitude', type=float)

        if not start_time or not end_time:
            now = datetime.now(timezone.utc)
            start_time = (now - timedelta(days=DEFAULT_DAYS)).isoformat()
            end_time = now.isoformat()

        try:
            if start_time:
                datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            if end_time:
                datetime.fromisoformat(end_time.replace('Z', '+00:00'))

        except ValueError:
            return jsonify({"error": "Invalid starttime or endtime format. Use ISO 8601 format."}), 400

        try:
            earthquakes = fetcher.fetch_earthquakes(
                start_time=start_time,
                end_time=end_time,
                min_magnitude=min_magnitude,
                max_magnitude=max_magnitude,
                min_latitude=min_latitude,
                max_latitude=max_latitude,
                min_longitude=min_longitude,
                max_longitude=max_longitude,
                limit=limit,
                orderby=orderby
            )
        except Exception as e:
            logging.error(f"Error fetching earthquakes: {e}")
            return jsonify({"error": "Failed to fetch earthquake data from the API"}), 500

        if earthquakes is None:
            return jsonify({"error": "Could not retrieve earthquake data"}), 500

        if user_latitude is not None and user_longitude is not None:
            for earthquake in earthquakes:
                try:
                    distance = fetcher.calculate_distance(user_latitude, user_longitude, earthquake)
                    earthquake['properties']['distance_km'] = distance if distance is not None else None
                except Exception as e:
                    logging.warning(f"Error calculating distance for earthquake {earthquake.get('id')}: {e}")
                    earthquake['properties']['distance_km'] = None

        return jsonify(earthquakes)

    except ValueError as e:
        return jsonify({"error": f"Invalid parameter type: {e}"}), 400
    except Exception as e:
        logging.exception(f"An unhandled error occurred: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


@app.route('/earthquakes/heatmap')
def get_earthquake_heatmap_data():
    try:
        fetcher = EarthquakeDataFetcher()

        start_time = request.args.get('starttime')
        end_time = request.args.get('endtime')
        min_magnitude = request.args.get('minmagnitude', type=float)
        max_magnitude = request.args.get('maxmagnitude', type=float)

        # Location parameters (accepting these from the frontend)
        min_latitude = request.args.get('minlatitude', type=float)
        max_latitude = request.args.get('maxlatitude', type=float)
        min_longitude = request.args.get('minlongitude', type=float)
        max_longitude = request.args.get('maxlongitude', type=float)

        limit = request.args.get('limit', type=int)

        if not start_time or not end_time:
            now = datetime.now(timezone.utc)
            start_time = (now - timedelta(days=DEFAULT_DAYS)).isoformat()
            end_time = now.isoformat()

        try:
            earthquakes = fetcher.fetch_earthquakes(
                start_time=start_time,
                end_time=end_time,
                min_magnitude=min_magnitude,
                max_magnitude=max_magnitude,
                min_latitude=min_latitude,
                max_latitude=max_latitude,
                min_longitude=min_longitude,
                max_longitude=max_longitude,
                limit=limit
            )
        except Exception as e:
            logging.error(f"Error fetching earthquakes for heatmap: {e}")
            return jsonify({"error": "Failed to fetch earthquake data from the API"}), 500

        if earthquakes is None:
            return jsonify({"error": "Could not retrieve earthquake data"}), 500

        heatmap_data = fetcher.get_heatmap_data(earthquakes)

        return jsonify(heatmap_data)

    except ValueError as e:
        return jsonify({"error": "Invalid parameter type: {e}"}), 400
    except Exception as e:
        logging.exception(f"An unhandled error occurred during heatmap data retrieval: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


@app.route('/earthquakes/nearby')
def get_earthquakes_nearby():
    try:
        fetcher = EarthquakeDataFetcher()

        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)

        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude are required parameters."}), 400

        now = datetime.now(timezone.utc)
        start_time = (now - timedelta(days=150)).isoformat()

        # Define a wider search radius (in degrees)
        search_radius = 2  # Increased from 1 to 2 degrees

        try:
            earthquakes = fetcher.fetch_earthquakes(
                start_time=start_time,
                end_time=now.isoformat(),
                min_latitude=latitude - search_radius,  # Wider range
                max_latitude=latitude + search_radius,  # Wider range
                min_longitude=longitude - search_radius,  # Wider range
                max_longitude=longitude + search_radius   # Wider range
            )
        except Exception as e:
            logging.error(f"Error fetching nearby earthquakes: {e}")
            return jsonify({"error": "Failed to fetch earthquake data from the API"}), 500

        if earthquakes is None:
            return jsonify({"error": "Could not retrieve earthquake data"}), 500

        # Calculate distance and add to response
        for earthquake in earthquakes:
            try:
                distance = fetcher.calculate_distance(latitude, longitude, earthquake)
                earthquake['properties']['distance_km'] = distance if distance is not None else None
            except Exception as e:
                logging.warning(f"Error calculating distance for earthquake {earthquake.get('id')}: {e}")
                earthquake['properties']['distance_km'] = None

        return jsonify(earthquakes)

    except ValueError as e:
        return jsonify({"error": f"Invalid parameter type: {e}"}), 400
    except Exception as e:
        logging.exception(f"An unhandled error occurred: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500
    

@app.route('/earthquakes/predict')
def predict_earthquake():
    try:
        fetcher = EarthquakeDataFetcher()
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)
        retrain = request.args.get('retrain', type=bool, default=False) #Added retrain boolean
        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude are required parameters."}), 400

        now = datetime.now(timezone.utc)
        start_time = (now - timedelta(days=730)).isoformat()  # Past 2 years (730 days)
        end_time = now.isoformat()

        try:
            earthquakes = fetcher.fetch_earthquakes(
                start_time=start_time,
                end_time=end_time,
                min_latitude=latitude - 1,  # Adjust the range as needed
                max_latitude=latitude + 1,
                min_longitude=longitude - 1,
                max_longitude=longitude + 1,
                orderby="time"  # Important: Order by time for prediction
            )
        except Exception as e:
            logging.error(f"Error fetching earthquakes for prediction: {e}")
            return jsonify({"error": "Failed to fetch earthquake data from the API"}), 500

        if earthquakes is None:
            return jsonify({"error": "Could not retrieve earthquake data"}), 500

        if len(earthquakes) < 2:
            return jsonify({"error": "Not enough earthquakes to make a prediction. Need at least 2"})

        prediction = fetcher.predict_next_earthquake_ml(earthquakes, retrain) #Pass the earthquakes into the ml predictor

        if prediction is None:
            return jsonify({"error": "Could not generate prediction."}), 500

        return jsonify(prediction)

    except ValueError as e:
        return jsonify({"error": f"Invalid parameter type: {e}"}), 400
    except Exception as e:
        logging.exception(f"An unhandled error occurred during prediction: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500


@app.route('/earthquakes/data')
def earthquake_data():
    try:
        fetcher = EarthquakeDataFetcher()
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)

        if latitude is None or longitude is None:
            return jsonify({"error": "Latitude and longitude are required parameters."}), 400

        now = datetime.now(timezone.utc)
        start_time = (now - timedelta(days=365 * 5)).isoformat()  # Fetch past 5 years of data
        end_time = now.isoformat()

        try:
            earthquakes = fetcher.fetch_earthquakes(
                start_time=start_time,
                end_time=end_time,
                min_latitude=latitude - 1,
                max_latitude=latitude + 1,
                min_longitude=longitude - 1,
                max_longitude=longitude + 1,
                orderby="time"
            )
        except Exception as e:
            logging.error(f"Error fetching earthquake data: {e}")
            return jsonify({"error": "Failed to fetch earthquake data from the API"}), 500

        if earthquakes is None or len(earthquakes) == 0:
            return jsonify({
                "earthquakes": [],
                "highest_magnitude": 0
            })

        highest_magnitude = max(earthquake['properties']['mag'] for earthquake in earthquakes if 'properties' in earthquake and 'mag' in earthquake['properties'])

        return jsonify({
            "earthquakes": earthquakes,
            "highest_magnitude": highest_magnitude
        })
    
    except ValueError as e:
        return jsonify({"error": f"Invalid parameter type: {e}"}), 400
    except Exception as e:
        logging.exception(f"An unhandled error occurred: {e}")
        return jsonify({"error": "An internal server error occurred"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')





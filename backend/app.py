from flask import Flask, jsonify, request
from flask_cors import CORS
from earthquake_data_fetcher import EarthquakeDataFetcher
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

@app.route('/earthquakes')
def get_earthquakes():
    try:
        fetcher = EarthquakeDataFetcher()

        # Get parameters from the request
        start_time = request.args.get('starttime')
        end_time = request.args.get('endtime')
        min_magnitude = request.args.get('minmagnitude', type=float)  # type=float ensures conversion
        max_magnitude = request.args.get('maxmagnitude', type=float)
        min_latitude = request.args.get('minlatitude', type=float)
        max_latitude = request.args.get('maxlatitude', type=float)
        min_longitude = request.args.get('minlongitude', type=float)
        max_longitude = request.args.get('maxlongitude', type=float)
        limit = request.args.get('limit', type=int)
        orderby = request.args.get('orderby')

        # Set default time range if not provided
        if not start_time or not end_time:
            now = datetime.utcnow()
            start_time = (now - timedelta(days=7)).isoformat()
            end_time = now.isoformat()

        # Fetch the earthquake data
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

        if earthquakes is None:
            return jsonify({"error": "Could not retrieve earthquake data"}), 500

        return jsonify(earthquakes)

    except ValueError as e:
        return jsonify({"error": f"Invalid parameter type: {e}"}), 400  # Bad Request
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
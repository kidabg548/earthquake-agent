import requests
import json
from datetime import datetime, timedelta

class EarthquakeDataFetcher:
    """
    Fetches earthquake data from the USGS API and provides data filtering.
    """

    def __init__(self, base_url="https://earthquake.usgs.gov/fdsnws/event/1/query"):
        self.base_url = base_url

    def fetch_earthquakes(self, start_time, end_time, min_magnitude=None,
                           max_magnitude=None, min_latitude=None, max_latitude=None,
                           min_longitude=None, max_longitude=None, limit=None,
                           orderby=None):  # Added orderby parameter
        """
        Fetches earthquake data from the USGS API with flexible filtering options.

        Args:
            start_time (str): Start time for the query in ISO 8601 format (e.g., '2023-01-01T00:00:00').
            end_time (str): End time for the query in ISO 8601 format.
            min_magnitude (float, optional): Minimum magnitude of earthquakes to retrieve. Defaults to None.
            max_magnitude (float, optional): Maximum magnitude of earthquakes to retrieve. Defaults to None.
            min_latitude (float, optional): Minimum latitude for the bounding box. Defaults to None.
            max_latitude (float, optional): Maximum latitude for the bounding box. Defaults to None.
            min_longitude (float, optional): Minimum longitude for the bounding box. Defaults to None.
            max_longitude (float, optional): Maximum longitude for the bounding box. Defaults to None.
            limit (int, optional): Maximum number of earthquakes to return. Defaults to None.
            orderby (str, optional): Order the results.  Allowed values are:
                                      'time', 'time-asc', 'magnitude', 'magnitude-asc'. Defaults to None.

        Returns:
            list: A list of earthquake features (GeoJSON) or None if there was an error.
        """
        params = {
            "format": "geojson",
            "starttime": start_time,
            "endtime": end_time,
        }

        if min_magnitude is not None:
            params["minmagnitude"] = min_magnitude
        if max_magnitude is not None:
            params["maxmagnitude"] = max_magnitude
        if min_latitude is not None:
            params["minlatitude"] = min_latitude
        if max_latitude is not None:
            params["maxlatitude"] = max_latitude
        if min_longitude is not None:
            params["minlongitude"] = min_longitude
        if max_longitude is not None:
            params["maxlongitude"] = max_longitude
        if limit is not None:
            params["limit"] = limit
        if orderby is not None:
            params["orderby"] = orderby

        try:
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
            data = response.json()
            return data["features"]  # Assuming GeoJSON format, "features" contains the earthquakes

        except requests.exceptions.RequestException as e:
            print(f"API request failed: {e}")
            return None
        except json.JSONDecodeError as e:
            print(f"Failed to decode JSON: {e}")
            return None


    def get_recent_earthquakes(self, min_magnitude=3.0, days_ago=7, orderby='time'):
        """
        A simplified method to fetch recent earthquakes above a certain magnitude.

        Args:
            min_magnitude (float): The minimum magnitude of earthquakes to retrieve.
            days_ago (int): The number of days to go back in time.
            orderby (str, optional): Order the results.  Allowed values are:
                                      'time', 'time-asc', 'magnitude', 'magnitude-asc'. Defaults to 'time'.

        Returns:
            list: A list of earthquake features (GeoJSON).
        """
        now = datetime.utcnow()
        start_time = now - timedelta(days=days_ago)
        start_time_str = start_time.isoformat()
        now_str = now.isoformat()

        return self.fetch_earthquakes(start_time_str, now_str, min_magnitude=min_magnitude, orderby=orderby)
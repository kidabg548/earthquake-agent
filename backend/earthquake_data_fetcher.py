import requests
import json
from datetime import datetime, timedelta, timezone
from math import radians, sin, cos, atan2, sqrt
import logging
import numpy as np  # pip install numpy
from sklearn.preprocessing import MinMaxScaler  # pip install scikit-learn
import tensorflow as tf #Fixed: Import tensorflow as tf
#from tensorflow import keras #Fixed: Not necessary and can cause confusion
#from keras.models import Sequential, load_model #Fixed:  Using tf.keras instead
#from keras.layers import LSTM, Dense #Fixed:  Using tf.keras instead
#from keras.optimizers import Adam #Fixed: Using tf.keras instead


logging.basicConfig(filename='earthquake_fetcher.log', level=logging.ERROR,
                    format='%(asctime)s - %(levelname)s - %(message)s')

class EarthquakeDataFetcher:
    """
    Fetches earthquake data from the USGS API and provides data filtering, distance calculation, and ML-based prediction.
    """

    def __init__(self, base_url="https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson", model_path="earthquake_model.h5"): #ADDED model_path
        self.base_url = base_url
        self.model = None #Initialized the model to None in case training is needed first
        self.model_path = model_path
        self.scaler = MinMaxScaler() #Initialize a scaler, good practice
        try:
            self.model = tf.keras.models.load_model(self.model_path) #Fixed: Using tf.keras
            logging.info("Loaded existing earthquake model from {}".format(self.model_path))
        except Exception as e:
            logging.warning("Could not load existing model. {}".format(e))
            logging.info("If this is the first run the model can be automatically trained with a boolean in predict_next_earthquake_ml")

    def fetch_earthquakes(self, start_time, end_time, min_magnitude=None,
                           max_magnitude=None, min_latitude=None, max_latitude=None,
                           min_longitude=None, max_longitude=None, limit=None,
                           orderby=None):
        """
        Fetches earthquake data from the USGS API with flexible filtering options.
        """
        if not isinstance(start_time, str):
            raise TypeError("start_time must be a string")
        if not isinstance(end_time, str):
            raise TypeError("end_time must be a string")


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
            response.raise_for_status()
            data = response.json()
            if "features" in data:
              return data["features"]
            else:
                logging.warning("API returned no features.  Check query parameters.")
                return None

        except requests.exceptions.RequestException as e:
            logging.error(f"API request failed: {e}")
            return None
        except json.JSONDecodeError as e:
            logging.error(f"Failed to decode JSON: {e}")
            return None
        except Exception as e:
            logging.exception("An unexpected error occurred during earthquake fetching:")
            return None


    def calculate_distance(self, user_latitude, user_longitude, earthquake, units="km"):
        """
        Calculates the distance between the user's location and the earthquake's epicenter.
        """
        try:
            earthquake_longitude, earthquake_latitude = earthquake['geometry']['coordinates']

            # Validate coordinates
            if not -90 <= user_latitude <= 90 or not -180 <= user_longitude <= 180:
                raise ValueError("Invalid user coordinates: latitude must be between -90 and 90, longitude between -180 and 180")
            if not -90 <= earthquake_latitude <= 90 or not -180 <= earthquake_longitude <= 180:
                raise ValueError(f"Invalid earthquake coordinates for earthquake ID {earthquake.get('id', 'unknown')}: latitude must be between -90 and 90, longitude between -180 and 180")


            user_latitude, user_longitude, earthquake_latitude, earthquake_longitude = map(radians, [user_latitude, user_longitude, earthquake_latitude, earthquake_longitude])

            dlon = earthquake_longitude - user_longitude
            dlat = earthquake_latitude - user_latitude

            a = sin(dlat / 2)**2 + cos(user_latitude) * cos(earthquake_latitude) * sin(dlon / 2)**2
            c = 2 * atan2(sqrt(a), sqrt(1 - a))

            distance_km = 6371 * c

            if units == "km":
                return distance_km
            elif units == "miles":
                return distance_km * 0.621371
            elif units == "nm":  # Nautical miles
                return distance_km * 0.539957
            else:
                raise ValueError("Invalid units.  Must be 'km', 'miles', or 'nm'.")
        except ValueError as e:
            print(f"Value Error: {e}")
            return None
        except KeyError as e:
            print(f"Key Error: {e}")
            return None


    def get_heatmap_data(self, earthquakes):
        """
        Extracts latitude, longitude, and magnitude data for heatmap visualization.
        """
        heatmap_data = []
        for earthquake in earthquakes:
            try:
                longitude, latitude = earthquake['geometry']['coordinates']
                magnitude = earthquake['properties']['mag']
                heatmap_data.append([latitude, longitude, magnitude])
            except (KeyError, TypeError) as e:
                logging.warning(f"Error extracting heatmap data for earthquake ID {earthquake.get('id', 'unknown')}: {e}")
                continue
        return heatmap_data

    def convert_time(self, earthquake):
        """Converts the earthquake time (milliseconds since epoch) to a datetime object.

        Args:
            earthquake (dict): An earthquake feature (GeoJSON).

        Returns:
            datetime: A datetime object representing the earthquake time, or None if there's an error.
        """
        try:
            timestamp_ms = earthquake['properties']['time']
            return datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)
        except (KeyError, TypeError) as e:
            print(f"Error converting time: {e}")
            return None


    def prepare_data_for_model(self, earthquakes, sequence_length=30):
        """
        Prepares the earthquake data for the LSTM model, including scaling and sequence creation.
        """
        magnitudes = np.array([e['properties']['mag'] for e in earthquakes]).reshape(-1, 1) #Magnitude is the main driving force

        # Scale the data
        magnitudes_scaled = self.scaler.fit_transform(magnitudes) #Scale the magnitudes to 0-1, fit the scaler first so each location learns on their own scale

        # Create sequences
        X, y = [], []
        for i in range(len(magnitudes_scaled) - sequence_length):
            X.append(magnitudes_scaled[i:i + sequence_length])
            y.append(magnitudes_scaled[i + sequence_length]) #The next value after the sequence

        return np.array(X), np.array(y)

    def create_lstm_model(self, sequence_length):
        """
        Creates a basic LSTM model.
        """
        model = tf.keras.models.Sequential() #Fixed: Using tf.keras
        model.add(tf.keras.layers.LSTM(50, activation='relu', input_shape=(sequence_length, 1))) #Fixed: Using tf.keras
        model.add(tf.keras.layers.Dense(1)) #Fixed: Using tf.keras
        model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001), loss='mse') #Fixed: Using tf.keras
        return model

    def train_model(self, X, y, sequence_length, epochs=10, batch_size=32): #Adjust epochs and batch size as needed
        """
        Trains the LSTM model and saves it.
        """
        logging.info("Training the LSTM model...")

        # Create the model
        self.model = self.create_lstm_model(sequence_length)

        # Train the model
        self.model.fit(X, y, epochs=epochs, batch_size=batch_size, verbose=0) #Set verbose to 1 to see training progress

        # Save the model
        self.model.save(self.model_path) #Fixed: Using tf.keras
        logging.info("Model saved to {}".format(self.model_path))
        return self.model

    def predict_next_earthquake_ml(self, earthquakes, retrain = False):
        """
        Predicts the magnitude of the next earthquake using the LSTM model.
        THIS IS NOT A RELIABLE PREDICTION METHOD.
        """
        sequence_length = 30 #The same sequence length used to train the model
        if not earthquakes or len(earthquakes) < sequence_length: #We need as much data as sequence length to make a prediction
            logging.warning("Not enough data to make a prediction.  Need at least {} earthquakes.".format(sequence_length))
            return None

        X, y = self.prepare_data_for_model(earthquakes, sequence_length) #Create the training data

        #Check for existing model
        if not self.model:
            logging.warning("No model found. Training a new model...")
            retrain = True #If there is no existing model then train a new one

        if retrain:
            try:
                self.model = self.train_model(X, y, sequence_length)
                logging.info("Training Completed")
            except Exception as e:
                logging.error("Could not train model {}".format(e))
                return None

        # Prepare the last sequence for prediction
        last_sequence = X[-1].reshape((1, sequence_length, 1)) #The model expects a 3D array (batch_size, sequence_length, features)

        # Make the prediction
        predicted_magnitude_scaled = self.model.predict(last_sequence, verbose = 0)[0][0] #Returns a scaled magnitude

        # Inverse transform to get the actual magnitude
        predicted_magnitude = self.scaler.inverse_transform([[predicted_magnitude_scaled]])[0][0] #Transform it back to its original scale

        #For predicting the time, using a simple average of the time differences
        times = [e['properties']['time'] for e in earthquakes]
        time_intervals = []
        for i in range(1, len(times)):
            time_intervals.append(times[i] - times[i - 1])
        average_time_interval_ms = sum(time_intervals) / len(time_intervals)
        last_earthquake_time_ms = times[-1]
        predicted_time_ms = last_earthquake_time_ms + average_time_interval_ms
        predicted_time = datetime.fromtimestamp(predicted_time_ms / 1000, tz=timezone.utc)

        return {
            "predicted_time": predicted_time.isoformat(),
            "predicted_magnitude": predicted_magnitude.item() #Returns a np.float32 which isn't JSON serializable so use .item() to return a regular float
        }
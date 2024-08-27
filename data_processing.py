import pandas as pd
import numpy as np
import requests
import psycopg2
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import logging
import joblib

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def get_race_data(season):
    logging.info(f"Fetching race data for season {season}")
    url = f"http://ergast.com/api/f1/{season}/results.json?limit=1000"
    response = requests.get(url)
    data = response.json()

    race_results = []
    for race in data['MRData']['RaceTable']['Races']:
        race_name = race['raceName']
        weather = simulate_weather()
        track_condition = simulate_track_condition(weather)
        for result in race['Results']:
            driver = result['Driver']['familyName']
            grid = int(result['grid'])
            laps = int(result['laps'])
            position = int(result['position'])

            # Simulating stints and additional factors
            stints = simulate_stints(driver, laps, weather, track_condition)

            for stint_num, stint in enumerate(stints, start=1):
                race_results.append({
                    'Year': season,
                    'Race': race_name,
                    'Driver': driver,
                    'Position': position,
                    'Grid': grid,
                    'Laps': laps,
                    'StintNumber': stint_num,
                    'StintLength': stint['length'],
                    'TireChoice': stint['tire'],
                    'PitStopTimes': len(stints) - 1,
                    'SafetyCars': stint['safety_cars'],
                    'Weather': weather,
                    'TrackCondition': track_condition,
                    'FuelLoad': stint['fuel_load'],
                    'AeroEfficiency': stint['aero_efficiency'],
                    'PredictedTop10': predict_top10(position, grid, stint)
                })
    return pd.DataFrame(race_results)

def simulate_stints(driver, total_laps, weather, track_condition):
    stints = []
    remaining_laps = total_laps
    stint_lengths = [np.random.randint(10, 25) for _ in range(3)]

    for i in range(3):
        stint_length = min(stint_lengths[i], remaining_laps)
        remaining_laps -= stint_length
        tire_choice = np.random.choice(['Soft', 'Medium', 'Hard'])
        safety_cars = np.random.choice([0, 1, 2], p=[0.7, 0.2, 0.1])  # Randomized for simplicity
        fuel_load = np.random.uniform(40, 110)  # Simulate fuel load in kg
        aero_efficiency = np.random.uniform(1.0, 2.5)  # Simulate aero efficiency

        stints.append({
            'length': stint_length,
            'tire': tire_choice,
            'safety_cars': safety_cars,
            'fuel_load': fuel_load,
            'aero_efficiency': aero_efficiency
        })
    
    return stints

def simulate_weather():
    return np.random.choice(['Sunny', 'Rainy', 'Cloudy', 'Overcast'])

def simulate_track_condition(weather):
    if weather == 'Rainy':
        return 'Wet'
    return 'Dry'

def predict_top10(position, grid, stint):
    # Replace this with a machine learning model in a real scenario
    probability = np.random.rand()  # Simulated probability for demonstration
    return probability > 0.5

def save_to_postgres(df, connection_string):
    logging.info("Saving data to PostgreSQL")
    conn = psycopg2.connect(connection_string)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS race_results (
            year INT,
            race_name VARCHAR,
            driver VARCHAR,
            position INT,
            grid INT,
            laps INT,
            stint_number INT,
            stint_length INT,
            tire_choice VARCHAR,
            pit_stop_times INT,
            safety_cars INT,
            weather VARCHAR,
            track_condition VARCHAR,
            fuel_load DECIMAL(5,2),
            aero_efficiency DECIMAL(4,2),
            predicted_top10 BOOLEAN,
            PRIMARY KEY (year, race_name, driver, stint_number)
        );
    """)

    for _, row in df.iterrows():
        cursor.execute("""
            INSERT INTO race_results (year, race_name, driver, position, grid, laps, stint_number, stint_length, tire_choice, pit_stop_times, safety_cars, weather, track_condition, fuel_load, aero_efficiency, predicted_top10)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (year, race_name, driver, stint_number) DO NOTHING;
        """, (
            row['Year'], row['Race'], row['Driver'], row['Position'], row['Grid'], row['Laps'], row['StintNumber'],
            row['StintLength'], row['TireChoice'], row['PitStopTimes'], row['SafetyCars'], row['Weather'],
            row['TrackCondition'], row['FuelLoad'], row['AeroEfficiency'], row['PredictedTop10']
        ))

    conn.commit()
    cursor.close()
    conn.close()

if __name__ == "__main__":
    connection_string = "dbname='f1_strategy_master' user='postgres' password='password' host='localhost' port='5432'"
    for season in range(2000, 2023 + 1):
        race_data = get_race_data(season)
        save_to_postgres(race_data, connection_string)

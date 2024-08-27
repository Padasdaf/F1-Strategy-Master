CREATE TABLE race_results (
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
    fuel_load DECIMAL(5, 2),
    aero_efficiency DECIMAL(4, 2),
    predicted_top10 BOOLEAN,
    PRIMARY KEY (year, race_name, driver, stint_number)
);

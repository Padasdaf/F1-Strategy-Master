require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    try {
        const yearsResult = await pool.query('SELECT DISTINCT year FROM race_results WHERE year BETWEEN 2000 AND 2023 ORDER BY year DESC;');
        res.render('index', { years: yearsResult.rows });
    } catch (err) {
        console.error(err);
        res.send('Error fetching data');
    }
});

app.get('/races/:year', async (req, res) => {
    const year = req.params.year;
    try {
        const racesResult = await pool.query('SELECT DISTINCT race_name FROM race_results WHERE year = $1;', [year]);
        res.json({ races: racesResult.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching race data');
    }
});

app.get('/race/:year/:name', async (req, res) => {
    const year = req.params.year;
    const raceName = req.params.name;
    try {
        console.log(`Fetching data for year: ${year}, race: ${raceName}`);
        const result = await pool.query('SELECT * FROM race_results WHERE year = $1 AND race_name = $2 ORDER BY driver, stint_number;', [year, raceName]);
        console.log(`Fetched ${result.rows.length} rows for race: ${raceName}`);
        res.json({ data: result.rows });
    } catch (err) {
        console.error('Error fetching race data:', err);
        res.status(500).send('Error fetching race data');
    }
});

app.get('/simulate', (req, res) => {
    res.render('simulate');
});

app.post('/simulate', (req, res) => {
    const { grid, laps, tire_choice_stint_1, tire_choice_stint_2, tire_choice_stint_3, stint_length, pit_stop_times, track, weather, time_of_day } = req.body;

    const inputData = {
        grid: parseInt(grid),
        laps: parseInt(laps),
        tire_choice_stint_1: tire_choice_stint_1,
        tire_choice_stint_2: tire_choice_stint_2,
        tire_choice_stint_3: tire_choice_stint_3,
        stint_length: parseInt(stint_length),
        pit_stop_times: parseInt(pit_stop_times),
        track: track,
        weather: weather,
        time_of_day: time_of_day
    };

    const predictedPosition = Math.random() > 0.5 ? "Top 10" : "Not in Top 10";

    res.json({
        outcome: {
            position: predictedPosition,
            tire_choice_stint_1: tire_choice_stint_1,
            tire_choice_stint_2: tire_choice_stint_2,
            tire_choice_stint_3: tire_choice_stint_3,
            stint_length: stint_length,
            pit_stop_times: pit_stop_times,
            track: track,
            weather: weather,
            time_of_day: time_of_day
        }
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const simulationEngine = require('./simulationEngine');
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
    // Parse simulation inputs from the request.
    const grid = parseInt(req.body.grid);
    const laps = parseInt(req.body.laps); // Laps can be used for further enhancements if needed.
    const pitStops = parseInt(req.body.pit_stop_times);
    const track = req.body.track;
    const weather = req.body.weather;
    const timeOfDay = req.body.time_of_day;

    // Gather dynamic stint data (pit stops + 1 stints).
    let stints = [];
    for (let i = 1; i <= pitStops + 1; i++) {
        let tire = req.body[`tire_choice_stint_${i}`];
        let stint_length = parseInt(req.body[`stint_length_${i}`]);
        stints.push({ tire, stint_length });
    }

    // Prepare parameters and invoke the simulation engine.
    const params = {
        grid: grid,
        pitStops: pitStops,
        stints: stints,
        weather: weather,
        track: track,
        timeOfDay: timeOfDay
    };

    const simulationResult = simulationEngine.simulateRaceOutcome(params);

    // Log the simulation breakdown for debugging.
    console.log("Simulation Breakdown:", simulationResult.breakdown);

    // Return the simulation outcome with detailed breakdown.
    res.json({
        outcome: {
            predictedPosition: simulationResult.predictedPosition,
            top10: simulationResult.top10,
            breakdown: simulationResult.breakdown,
            stints: stints,
            track: track,
            weather: weather,
            time_of_day: timeOfDay
        }
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

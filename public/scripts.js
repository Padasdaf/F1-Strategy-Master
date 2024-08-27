$(document).ready(function() {
    // Handle year selection change (existing code)
    $('#year-select').change(function() {
        var selectedYear = $(this).val();
        $('#race-list').html('<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>');

        $.get('/races/' + selectedYear, function(data) {
            var raceListHtml = '';
            data.races.forEach(function(race) {
                raceListHtml += '<a href="#" class="list-group-item list-group-item-action race-link" data-year="' + selectedYear + '" data-race="' + race.race_name + '">' + race.race_name + '</a>';
            });
            $('#race-list').html(raceListHtml);
        });
    });

    // Handle clicking on a race link (existing code)
    $(document).on('click', '.race-link', function() {
        var raceName = $(this).data('race');
        var year = $(this).data('year');
        $('#race-details').html('<div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div>');

        $.get('/race/' + year + '/' + raceName, function(data) {
            if (!data || !data.data || data.data.length === 0) {
                $('#race-details').html('<p>No data available for this race.</p>');
                return;
            }

            var raceTable = '<h2>' + raceName + ' (' + year + ') Details</h2>';
            raceTable += '<table class="table table-striped"><thead><tr>';
            raceTable += '<th>Driver</th>';
            raceTable += '<th>Finishing Position</th>';
            raceTable += '<th>Grid Position</th>';
            raceTable += '<th>Laps Completed</th>';
            raceTable += '<th>Stint Number</th>';
            raceTable += '<th>Stint Length (Laps)</th>';
            raceTable += '<th>Tire Choice</th>';
            raceTable += '<th>Safety Cars</th>';
            raceTable += '<th>Weather</th>';
            raceTable += '<th>Track Condition</th>';
            raceTable += '<th>Fuel Load (kg)</th>';
            raceTable += '<th>Aero Efficiency</th>';
            raceTable += '<th>Number of Pit Stops</th>';
            raceTable += '<th>Predicted Top 10 Finish</th>';
            raceTable += '</tr></thead><tbody>';

            data.data.forEach(row => {
                raceTable += '<tr>';
                raceTable += '<td>' + row.driver + '</td>';
                raceTable += '<td>' + row.position + '</td>';
                raceTable += '<td>' + row.grid + '</td>';
                raceTable += '<td>' + row.laps + '</td>';
                raceTable += '<td>' + row.stint_number + '</td>';
                raceTable += '<td>' + row.stint_length + '</td>';
                raceTable += '<td>' + row.tire_choice + '</td>';
                raceTable += '<td>' + row.safety_cars + '</td>';
                raceTable += '<td>' + row.weather + '</td>';
                raceTable += '<td>' + (row.track_condition ? row.track_condition : 'N/A') + '</td>';  // Handle missing track condition data
                raceTable += '<td>' + (parseFloat(row.fuel_load) || 0).toFixed(2) + '</td>';
                raceTable += '<td>' + (parseFloat(row.aero_efficiency) || 0).toFixed(2) + '</td>';
                raceTable += '<td>' + row.pit_stop_times + '</td>';
                raceTable += '<td>' + (row.predicted_top10 ? 'Yes' : 'No') + '</td>';
                raceTable += '</tr>';
            });

            raceTable += '</tbody></table>';
            $('#race-details').html(raceTable);
        }).fail(function() {
            $('#race-details').html('<p>Error loading race data.</p>');
        });
    });

    // Handle the number of pit stops change event
    $('#pit_stop_times').change(function() {
        var pitStops = parseInt($(this).val());
        var stintsContainer = $('#stints-container');
        stintsContainer.empty(); // Clear previous stints

        for (var i = 1; i <= pitStops + 1; i++) {
            var stintHTML = `
                <div class="form-group">
                    <label for="tire_choice_stint_${i}">Tire Choice (Stint ${i}):</label>
                    <select class="form-control" id="tire_choice_stint_${i}" name="tire_choice_stint_${i}">
                        <option value="Soft">Soft</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                        <option value="Intermediates">Intermediates</option>
                        <option value="Wets">Wets</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="stint_length_${i}">Stint Length (Laps) (Stint ${i}):</label>
                    <input type="number" class="form-control" id="stint_length_${i}" name="stint_length_${i}" value="25">
                </div>
            `;
            stintsContainer.append(stintHTML);
        }
    });

    // Trigger the change event to populate the form initially
    $('#pit_stop_times').trigger('change');

    $('#simulate-form').submit(function(event) {
        event.preventDefault();

        var formData = $(this).serialize();

        $.post('/simulate', formData, function(data) {
            var resultHtml = '<h3>Simulation Result</h3>';
            resultHtml += '<p>Predicted Position: ' + data.outcome.position + '</p>';
            for (var i = 1; i <= parseInt($('#pit_stop_times').val()) + 1; i++) {
                resultHtml += '<p>Tire Choice (Stint ' + i + '): ' + data.outcome['tire_choice_stint_' + i] + '</p>';
                resultHtml += '<p>Stint Length (Stint ' + i + '): ' + data.outcome['stint_length_' + i] + ' laps</p>';
            }
            resultHtml += '<p>Pit Stop Times: ' + data.outcome.pit_stop_times + '</p>';
            resultHtml += '<p>Track: ' + data.outcome.track + '</p>';
            resultHtml += '<p>Weather: ' + data.outcome.weather + '</p>';
            resultHtml += '<p>Time of Day: ' + data.outcome.time_of_day + '</p>';

            $('#simulation-result').html(resultHtml);
        });
    });
});
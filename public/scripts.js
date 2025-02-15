$(document).ready(function() {
    // Handle year selection change
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
  
    // Handle clicking on a race link
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
          raceTable += '<td>' + (row.track_condition ? row.track_condition : 'N/A') + '</td>';
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
  
    // Updated simulation form submission with visualization.
    $('#simulate-form').submit(function(event) {
      event.preventDefault();
  
      var formData = $(this).serialize();
  
      $.post('/simulate', formData, function(data) {
        var outcome = data.outcome;
        var resultHtml = '<h3>Simulation Result</h3>';
        resultHtml += '<p><strong>Predicted Finishing Position:</strong> ' + outcome.predictedPosition + '</p>';
        resultHtml += '<p><strong>Top 10 Finish:</strong> ' + (outcome.top10 ? 'Yes' : 'No') + '</p>';
        resultHtml += '<h4>Breakdown:</h4>';
        resultHtml += '<ul>';
        resultHtml += '<li>Grid Position: ' + outcome.breakdown.grid + '</li>';
        resultHtml += '<li>Pit Stop Penalty: ' + outcome.breakdown.pitStopPenalty + '</li>';
  
        if (outcome.breakdown.tireEffects) {
          outcome.breakdown.tireEffects.forEach(function(effect) {
            resultHtml += '<li>Stint ' + effect.stint + ' (' + effect.tire + ', ' + effect.stint_length + ' laps) Effect: ' + effect.effect.toFixed(2) + '</li>';
          });
        }
  
        resultHtml += '<li>Weather Effect: ' + outcome.breakdown.weatherEffect + '</li>';
        resultHtml += '<li>Track Effect: ' + outcome.breakdown.trackEffect + '</li>';
        resultHtml += '<li>Time of Day Effect: ' + outcome.breakdown.timeOfDayEffect + '</li>';
        resultHtml += '<li>Total Score: ' + outcome.breakdown.totalScore.toFixed(2) + '</li>';
        resultHtml += '</ul>';
  
        resultHtml += '<h4>Stints Detail:</h4>';
        outcome.stints.forEach(function(stint, index) {
          resultHtml += '<p>Stint ' + (index + 1) + ': Tire Choice - ' + stint.tire + ', Stint Length - ' + stint.stint_length + ' laps</p>';
        });
  
        resultHtml += '<p><strong>Track:</strong> ' + outcome.track + '</p>';
        resultHtml += '<p><strong>Weather:</strong> ' + outcome.weather + '</p>';
        resultHtml += '<p><strong>Time of Day:</strong> ' + outcome.time_of_day + '</p>';
  
        $('#simulation-result').html(resultHtml);
  
        // Visualization using Chart.js
        // Compute total tire effects
        var tireTotal = 0;
        if (outcome.breakdown.tireEffects && outcome.breakdown.tireEffects.length > 0) {
          tireTotal = outcome.breakdown.tireEffects.reduce((acc, effect) => acc + effect.effect, 0);
        }
  
        // Destroy existing chart if it exists
        if (window.simulationChart) {
          window.simulationChart.destroy();
        }
  
        var ctx = document.getElementById('simulationChart').getContext('2d');
        window.simulationChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Grid', 'Pit Stop', 'Tire Effects', 'Weather', 'Track', 'Time of Day', 'Total'],
            datasets: [{
              label: 'Simulation Breakdown',
              data: [
                outcome.breakdown.grid,
                outcome.breakdown.pitStopPenalty,
                tireTotal,
                outcome.breakdown.weatherEffect,
                outcome.breakdown.trackEffect,
                outcome.breakdown.timeOfDayEffect,
                outcome.breakdown.totalScore
              ],
              backgroundColor: [
                'rgba(75, 192, 192, 0.6)',
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(100, 100, 100, 0.6)'
              ],
              borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
                'rgba(100, 100, 100, 1)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            },
            plugins: {
              title: {
                display: true,
                text: 'Simulation Breakdown'
              }
            }
          }
        });
      });
    });
  });
  

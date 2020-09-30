//  Author: Christopher Orsolini

  const METER_TO_MILE = 0.00062137;

  // Hide the non-active forecast pages.
  $('#page-hourly').hide();
  $('#page-daily').hide();

  // On document load.
  $(document).ready(function() {

    // Change the brand name in the navbar.
    $('.navbar-brand').html("Weather Forecast");

    // Set the active navbar link.
    $('#weather-link').addClass('active');

    // Initialize the city name output with a default message.
    $('.output-city-name').html('Enter a Zip Code.');
    $('.output-city-name').addClass('text-muted');

    // Hide UI elements that are not used on page load.
    $('#output-current').hide();
    $('#icon').hide();
    $('#output-description').hide();

    // About this app card slide toggle.
    $('#aboutApp').hide();
    $('#aboutBtn').click(function(event) {
      $('#aboutApp').slideToggle();
    });

    // Force focus on to the zip code input.
    $('#zip-code').focus();

    // Zip code search //
    // Search button event.
    $('#zip-code-search-btn').click(function() {
      getLocation($('#zip-code').val());
    });

    // On keyup within the search bar.
    $('#zip-code').keyup(function(event) {
      // Input validation on zip code. //
      // Check the input length and if NaN.
      if($('#zip-code').val().length == 5 && isNaN($('#zip-code').val()) == false) {
        $('#zip-code').addClass('is-valid');
        $('#zip-code').removeClass('is-invalid');
        $('#zip-code-search-btn').removeClass(['disabled', 'btn-outline-danger']);
        $('#zip-code-search-btn').addClass('btn-outline-success');
        $('#zip-code-search-btn').prop('disabled', false);
        $('#zip-code-search-btn').css('cursor', 'pointer');

        // Search zip code on enter keyup.
        if(event.keyCode == 13) {
          getLocation($('#zip-code').val());
        }

      } else {
        $('#zip-code').addClass('is-invalid');
        $('#zip-code').removeClass('is-valid');
        $('#zip-code-search-btn').addClass('btn-outline-danger');
        $('#zip-code-search-btn').addClass(['disabled', 'btn-outline-danger']);
        $('#zip-code-search-btn').prop('disabled', true);
        $('#zip-code-search-btn').css('cursor', 'not-allowed')
      }

      // Clear any alerts when the backspace key is pressed in the zip code input.
      if(event.keyCode == 8 || event.keyCode == 46) {
        $('.alert').alert('close');
      }
    });

    // App tab navigation.
    $('.forecast-nav').click(function() {

      // Remove the active tag and background color from all tabs.
      $('.forecast-nav').removeClass(['active', 'bg-white']);

      // Add the active tag and background color to the tab that triggered the event.
      $(this).toggleClass(['active', 'bg-white']);

      // Display the selected forecast page.
      switch($(this).attr('id')) {
        case 'tab-current':
          $('#page-current').show();
          $('#page-hourly').hide();
          $('#page-daily').hide();
          break;

        case 'tab-hourly':
          $('#page-current').hide();
          $('#page-hourly').show();
          $('#page-daily').hide();
          break;

        case 'tab-daily':
          $('#page-current').hide();
          $('#page-hourly').hide();
          $('#page-daily').show();
          break;
      }

    });
  })

  /*
  *   Purpose: This function takes a US zip code from the user and sends a GET
  *            request to opendatasoft. The GET request returns some data about
  *            the users location. We specifically need the users latitude and
  *            longitude.
  *
  *   Input:   STRING - users zip code.
  *   Output:  NONE.
  */
  function getLocation(zipCode) {

    // Store the API URL.
    let url = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=us-zip-code-latitude-and-longitude&q=${zipCode}`;

    // Set the cursor the "loading" icon.
    $('body').css('cursor', 'wait');
    $('#zip-code').css('cursor', 'wait');

    // Make a AJAX GET request.
    $.getJSON(url, function(data) {

      // Check the JSON results for the number of hits. If no hits...
      if(data.nhits == 0) {

        if($('.alert').length > 0) {
          $('.alert').fadeToggle("fast");
          $('.alert').fadeToggle("fast");
        } else {
          // Output an alert if no zip code is found.
          $('#zip-code-search').after(`
            <div class=\"alert alert-warning alert-dismissible fade show\">
              Hmm... That zip code doesn't appear to be valid. Please try another.
            <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button></div>`);
        }

        // End the "loading" cursor and set the cursor back to the "auto" cursor.
        $('body').css('cursor', 'auto');
        $('#zip-code').css('cursor', 'auto');
      }
      // If there is hits...
      else{
        // Output the returned city name and state on the page.
        $('.output-city-name').html(data.records[0].fields.city + ', ' + data.records[0].fields.state);
        $('.output-city-name').removeClass('text-muted');

        // Get the weather from the API.
        getWeather(data.records[0].fields.latitude, data.records[0].fields.longitude);
      }
    })
    .fail(function() { console.log("Location AJAX request: Error"); });
  }

  /*
  *   Purpose: This function takes the users latitude and longitude and sends a
  *            GET request to openweather API. The resulting JSON is sent to
  *            output functions that display the resulting data on the page.
  *
  *   Input:   STRING - latitude, STRING - longitude.
  *   Output:  NONE.
  */
  function getWeather(lat, lon) {
    let url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely&units=imperial&appid=<<TOKEN>>`;

      // Make a GET request to the weather API.
      $.getJSON(url, function(data) {

      // Output the JSON result for the current conditions.
      outputCurrentConditions(data);

      // Empty any current content in the hourly forecast.
      $('#hourly-forecast').empty();

      // Output the JSON result for the hourly forecast.
      outputHourlyForecast(data);

      // Empty any current content in the daily forecast.
      $('#daily-forecast').empty();

      // Output the JSON result for the daily forecast.
      outputDailyForecast(data);

    })
    .fail(function() { console.log("Weather AJAX request: Error"); });
  }

  /*
  *   Purpose: This function takes the JSON object from the weather API and
  *            outputs the results on the users current conditions page.
  *
  *   Input:   STRING - users zip code.
  *   Output:  NONE.
  */
  function outputCurrentConditions(data) {
    // Store sunrise and sunset to convert unix timestamp to readable time.
    var sunriseTime = new Date(data.current.sunrise*1000);
    var sunsetTime = new Date(data.current.sunset*1000);

    // Get the icon associated with the current weather.
    var icon = `http://openweathermap.org/img/wn/${data.current.weather[0].icon}@2x.png`;

    // Apply background color to the UV index based on scale.
    if(data.current.uvi.toFixed(0) > 10) {
      $('#table-row-uv').addClass('table-danger');
      $('#table-row-uv').removeClass('table-warning');
    } else if(data.current.uvi.toFixed(0) > 8) {
      $('#table-row-uv').addClass('table-warning');
      $('#table-row-uv').removeClass('table-danger');
    } else {
      $('#table-row-uv').removeClass('table-danger');
      $('#table-row-uv').removeClass('table-warning');
    }

    // Output the data in the html.
    $('#output-current').html(data.current.weather[0].main).fadeIn();
    $('#icon').attr('src',icon).fadeIn();
    $('#output-description').html(data.current.weather[0].description.substr(0,1).toUpperCase()+data.current.weather[0].description.substr(1)+".").fadeIn();
    $('#output-temp').html(data.current.temp.toFixed(0) + '&deg;');
    $('#output-feelsLike').html(data.current.feels_like.toFixed(0) + '&deg;');
    $('#output-wind-speed').html(data.current.wind_speed.toFixed(0) + " mph");
    $('#output-wind-direction').html(data.current.wind_deg + '&deg;');
    $('#output-cloudiness').html(data.current.clouds + "&#37;");
    $('#output-uv').html(data.current.uvi.toFixed(0));
    $('#output-humidity').html(data.current.humidity + "&#37;");
    $('#output-dewpoint').html(data.current.dew_point.toFixed(0) + "&deg;");
    $('#output-pressure').html(data.current.pressure + " hPa");

    // Test the visability for NaN, if it is NaN, set the output to the infinity symbol.
    if(isNaN(data.current.visibility)) {
      $('#output-visibility').html("&infin; mi");
    } else {
      $('#output-visibility').html((data.current.visibility * METER_TO_MILE).toFixed(2) + " mi");
    }

    $('#output-sunrise').html(sunriseTime.toLocaleTimeString());
    $('#output-sunset').html(sunsetTime.toLocaleTimeString());

    // End the "loading" cursor and set the cursor back to the "auto" icon.
    $('body').css('cursor', 'auto');
    $('#zip-code').css('cursor', 'auto');
  }

  /*
  *   Purpose: This function takes the JSON object from the weather API and
  *            outputs the results on the users hourly forecast page.
  *
  *   Input:   STRING - users zip code.
  *   Output:  NONE.
  */
  function outputHourlyForecast(data) {
    // Convert the hourly time from unix time stamp to human readable.
    var hourlyForecastTime = new Date();

    // Output the table headers.
    $('#hourly-forecast').append(`
      <tr>
        <th class="text-center">Time</th>
        <th class="text-center">Conditions</th>
        <th class="text-center">Temp (f)</th>
      </tr>`);

    // Loop through each data object in the returned JSON object's array.
    $.each(data.hourly, function(key, value) {
      // Convert the time to human readable.
      hourlyForecastTime = new Date(value.dt*1000);
      hourlyForecastTime = hourlyForecastTime.toLocaleTimeString();
      hourlyForecastTime = hourlyForecastTime.substr(0, (hourlyForecastTime.length - 9)) + " " + hourlyForecastTime.substr((hourlyForecastTime.length - 2), hourlyForecastTime.length)

      // Get the icon associated with the current weather.
      var icon = `http://openweathermap.org/img/wn/${value.weather[0].icon}@2x.png`;

      // Output this hours data in a table row for each hour returned.
      $('#hourly-forecast').append(`
        <tr>
          <td class="text-center align-middle">${hourlyForecastTime}</td>
          <td class="text-center align-middle"><img src="${icon}" style="width: 50px; height: 50px;"></img>${value.weather[0].main}</td>
          <td class="text-center align-middle">${value.temp.toFixed(0)}&deg;</td>
        </tr>`);
    })
  }

  /*
  *   Purpose: This function takes the JSON object from the weather API and
  *            outputs the results on the users daily forecast page.
  *
  *   Input:   STRING - users zip code.
  *   Output:  NONE.
  */
  function outputDailyForecast(data) {
    // Convert the hourly time from unix time stamp to human readable.
    var hourlyForecastTime = new Date();
    var dayOfTheWeek;
    var weekDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Output the table headers.
    $('#daily-forecast').append(`
      <tr>
        <th class="text-center">Day</th>
        <th class="text-center">Conditions</th>
        <th class="text-center">Temp (f)</th>
      </tr>`);

    // Output this days data in a table row for each day returned.
    $.each(data.daily, function(key, value) {
      // Convert the time to human readable.
      hourlyForecastTime = new Date(value.dt*1000);
      dayOfTheWeek = weekDay[hourlyForecastTime.getDay()];
      hourlyForecastTime = hourlyForecastTime.toLocaleDateString();
      hourlyForecastTime = hourlyForecastTime.substr(0, hourlyForecastTime.length - 5);

      // Get the icon associated with the current weather.
      var icon = `http://openweathermap.org/img/wn/${value.weather[0].icon}@2x.png`;

      // Output this days data in a table row for each day returned.
      $('#daily-forecast').append(`
        <tr>
          <td class="text-center align-middle">${dayOfTheWeek} ${hourlyForecastTime}</td>
          <td class="text-center align-middle"><img src="${icon}" style="width: 50px; height: 50px;"></img>${value.weather[0].main}</td>
          <td class="text-center align-middle">${value.temp.day.toFixed(0)}&deg;</td>
        </tr>`);
    })
  }

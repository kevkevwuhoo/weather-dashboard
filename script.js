// dependencies (DOM elements) + initial data
currentWeatherDiv = $("#current-weather");
weatherForecastDiv = $("#weather-forecast");
var apikey = "47bb52af0d08408f1d53947435fc1415";
var citiesArray;

// get search history from local storage (if there is something there)
// fill cities array with cities from search history
if (localStorage.getItem("localWeatherSearches")) {
    citiesArray = JSON.parse(localStorage.getItem("localWeatherSearches"));
    // create the search history
    createSearchHistory(citiesArray);
    // populate weather with last searched city
    findWeather(citiesArray[citiesArray.length - 1]);
}
// if nothing in local storage, citiesArray is empty array
else {
    citiesArray = [];
}

// create the list group for the search history
function createSearchHistory(array) {
    array.forEach((city) => {
        var searchListItem = $("<li>").attr("class", "list-group-item");
        searchListItem.text(city);
        searchListItem.attr("data-city", city);
        $("#search-history").prepend(searchListItem);
    });
}

// add newly searched city to search history array and update array to local storage
function addToSearchHistory(city) {
    if (citiesArray.indexOf(city) === -1) {
        citiesArray.push(city);
        var searchListItem = $("<li>").attr("class", "list-group-item");
        searchListItem.text(city);
        searchListItem.attr("data-city", city);
        $("#search-history").prepend(searchListItem);
        localStorage.setItem("localWeatherSearches", JSON.stringify(citiesArray));
    }
}

// listen for click event on the search button
$("#submit-city").on("click", function (event) {
    event.preventDefault();
    var userCity = $("#city-input").val().trim();
    findWeather(userCity);
    addToSearchHistory(userCity);
});

// listen for click on list group items in the search history
// get weather of the clicked city
$("#search-history").on("click", ".list-group-item", function (event) {
    var searchHistoryCity = $(this).attr("data-city").trim();
    findWeather(searchHistoryCity);
});

// do AJAX request to openweatherapi
function findWeather(city) {
    currentWeatherDiv.empty();
    var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial&appid=" + apikey;

    $.ajax({
        url: queryURL,
        method: "GET",
    })
        .then(function (response) {
            // find and display: create new <p>, set text to data, append <p> to #current-weather div
            // city name
            var cityName = $("<h2>");
            cityName.text(response.name + ", " + response.sys.country);
            currentWeatherDiv.append(cityName);
            // city date
            var cityDate = $("<p>");
            cityDate.text(moment().format("L"));
            currentWeatherDiv.append(cityDate);
            // icon of weather conditions
            var weatherIcon = $("<img>");
            weatherIcon.attr("src", "https://openweathermap.org/img/wn/" + response.weather[0].icon + "@2x.png");
            weatherIcon.attr("alt", "Weather Icon");
            weatherIcon.css("height", "80px");
            currentWeatherDiv.append(weatherIcon);
            // the temperature
            var cityTemperature = $("<p>");
            cityTemperature.html("Temperature: " + response.main.temp + "&degF");
            currentWeatherDiv.append(cityTemperature);
            // the humidity
            var cityHumidity = $("<p>");
            cityHumidity.text("Humidity: " + response.main.humidity + "%");
            currentWeatherDiv.append(cityHumidity);
            // the wind speed
            var windSpeed = $("<p>");
            windSpeed.text("Wind Speed: " + response.wind.speed + " MPH");
            currentWeatherDiv.append(windSpeed);
            // the UV index
            useCoord(response.coord);
        })
        .catch((err) => console.log(err));
}

// 2nd ajax request for UV data and 5 day forecast
function useCoord(coordinates) {
    weatherForecastDiv.empty();
    // new AJAX request with coordinate parameters for UVIndex
    var coordURL =
        "https://api.openweathermap.org/data/2.5/onecall?lat=" +
        coordinates.lat +
        "&lon=" +
        coordinates.lon +
        "&units=imperial" +
        "&appid=" +
        apikey;

    $.ajax({
        url: coordURL,
        method: "GET",
    }).then(function (response) {
        // set UV index color based on favorable, moderate, or severe
        // if favorable, set to green
        // if moderate, set to yellow
        // if severe, set to red
        var uvIndex = response.current.uvi;
        var uvIndexDisplay = $("<p>")
            .attr("class", "uv-index")
            .text("UV Index: " + uvIndex);
        if (uvIndex <= 2) {
            uvIndexDisplay.css("background", "green");
        } else if (uvIndex <= 5) {
            uvIndexDisplay.css("background", "yellow");
        } else if (uvIndex <= 7) {
            uvIndexDisplay.css("background", "orange");
        } else if (uvIndex <= 10) {
            uvIndexDisplay.css("background", "red");
            uvIndexDisplay.css("color", "white");
        } else if (uvIndex > 10) {
            uvIndexDisplay.css("background", "purple");
            uvIndexDisplay.css("color", "white");
        }
        currentWeatherDiv.append(uvIndexDisplay);
        // then fill in forecast data
        // get the next 5 days
        var forecastArr = response.daily.slice(1, 7);
        forecastArr.map((forecast) => {
            // show readable date (MM/DD/YYYY)
            var card = $("<div>").attr("class", "card");
            var dailyForecastDate = forecast.dt;
            var dateStamp = moment.unix(dailyForecastDate).format("L");
            var cardBody = $("<div>").attr("class", "card-body");
            var cardTitle = $("<h5>").text(dateStamp);
            cardTitle.attr("class", "card-title");
            cardBody.append(cardTitle);

            // high and low forecast temp
            var cardHighTemp = $("<p>").html("High: " + forecast.temp.max + "&degF");
            cardHighTemp.attr("class", "card-text");
            var cardLowTemp = $("<p>").html("Low: " + forecast.temp.min + "&degF");
            cardLowTemp.attr("class", "card-text");
            cardBody.append(cardHighTemp);
            cardBody.append(cardLowTemp);

            // forecast humidity
            var cardHumidity = $("<p>").text("Humidity: " + forecast.humidity + "%");
            cardHumidity.attr("class", "card-text");
            cardBody.append(cardHumidity);

            // forecast weather icon
            var cardIcon = $("<img>");
            var forecastIcon = forecast.weather[0].icon;
            cardIcon.attr("class", "card-img-top");
            cardIcon.attr("src", "https://openweathermap.org/img/wn/" + forecastIcon + "@2x.png");
            cardIcon.attr("alt", "Forecast Icon");
            card.append(cardIcon);
            card.append(cardBody);
            weatherForecastDiv.append(card);
        });
    });
}

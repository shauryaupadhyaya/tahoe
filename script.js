document.addEventListener("DOMContentLoaded", () => {
  //background
  const bg = document.getElementById("background");
  const bgInput = document.getElementById("bgInput");
  const preview = document.getElementById("bgPreview");

  const savedBg = localStorage.getItem("userBg");
  if (savedBg) {
    bg.style.backgroundImage = savedBg;
    preview.style.backgroundImage = savedBg;
  }

  bgInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      preview.style.backgroundImage = `url(${reader.result})`;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("removeBgBtn").addEventListener("click", () => {
    localStorage.removeItem("userBg");
    bg.style.backgroundImage = "";
    preview.style.backgroundImage = "";
    bg.style.backgroundColor = "#000";
  });

  document.getElementById("saveBgBtn").addEventListener("click", () => {
    const style = preview.style.backgroundImage;
    if (!style) return;

    localStorage.setItem("userBg", style);
    bg.style.backgroundImage = style;
  });

  //opening and closing windows
  const opens = document.querySelectorAll("[data-open]");
  const closes = document.querySelectorAll("[data-close]");

  let topZ = 10;

  opens.forEach((icon) => {
    icon.onclick = () => {
      const id = icon.getAttribute("data-open");
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = "block";
      topZ++;
      el.style.zIndex = topZ;

      icon.classList.add("bouncing");
      setTimeout(() => {
        icon.classList.remove('bouncing');
      }, 300);
    };
  });

  closes.forEach((btn) => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-close");
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = "none";
    };
  });

  //clock
  function updateTop() {
    const t = new Date();
    const h = t.getHours().toString().padStart(2, "0");
    const m = t.getMinutes().toString().padStart(2, "0");
    const date = t.toDateString();

    document.querySelector(".top-time").innerText = `${h}:${m}`;
    document.querySelector(".top-date").innerText = date;
  }

  updateTop();
  setInterval(updateTop, 1000);

  // dragging windows
  function makeDraggable(win) {
    const header = win.querySelector(".window-header");
    let offsetX = 0;
    let offsetY = 0;
    let isDown = false;

    header.addEventListener("mousedown", (e) => {
      isDown = true;
      offsetX = e.clientX - win.offsetLeft;
      offsetY = e.clientY - win.offsetTop;
      header.style.cursor = "grabbing";
    });

    document.addEventListener("mouseup", () => {
      isDown = false;
      header.style.cursor = "grab";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      win.style.left = e.clientX - offsetX + "px";
      win.style.top = e.clientY - offsetY + "px";
    });
  }

  document.querySelectorAll(".window").forEach((win) => {
    makeDraggable(win);
  });

  //move window forward on click
  document.querySelectorAll(".window").forEach((win) => {
    win.addEventListener("mousedown", () => {
      topZ++;
      win.style.zIndex = topZ;
    });
  });

  // tab switching settings
  const tabs = document.querySelectorAll(".settings-tab");
  const pages = {
    appearance: document.getElementById("appearance-page"),
    theme: document.getElementById("theme-page"),
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      Object.values(pages).forEach((p) => p.classList.add("hidden"));
      pages[tab.dataset.tab].classList.remove("hidden");
    });
  });

  // weather
  const weatherApiKey = "0969f45a36776f2842a3469845175355";

  const weatherCodeToIcon = (code) => {
    if (code === 0) return "01d";
    if (code <= 2) return "02d";
    if (code <= 3) return "03d";
    if (code <= 48) return "50d";
    if (code <= 67) return "09d";
    if (code <= 77) return "13d";
    if (code <= 82) return "10d";
    if (code <= 99) return "11d";
    return "03d";
  };

  async function loadWeatherByCoords(lat, lon) {    
    const weatherContainer = document.querySelector(".weather-container");
    weatherContainer.classList.add("loading");

    try {      
      const geoRes = await fetch(
        `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${weatherApiKey}`
      );
      const geoData = await geoRes.json();
      const cityName = geoData[0]?.name || "Unknown Location";

      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey}`
      );
      const data = await res.json();

      if (data.cod !== 200 || !data.coord) {
        document.querySelector(".weather-location").innerText =
          "City not found";
        document.querySelector(".weather-temp").innerText = "---°C";
        document.querySelector(".weather-icon").src = "";
        document.querySelector(".weather-hourly").innerHTML = "";
        document.querySelector(".forecast-3day").innerHTML = "";
        document.querySelector(".air-quality .value").innerHTML = "---";
        return;
      }

      document.querySelector(".weather-location").innerText = cityName;
      document.querySelector(".weather-temp").innerText =
        Math.round(data.main.temp) + "°C";
      document.querySelector(
        ".weather-icon"
      ).src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

      // hourly
      const hourlyRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode&timezone=auto`
      );

      const hourlyData = await hourlyRes.json();

      const hourlyContainer = document.querySelector(".weather-hourly");
      hourlyContainer.innerHTML = "";

      if (hourlyData.hourly && hourlyData.hourly.time) {
        const now = new Date();
        const startIndex = Math.max(
          0,
          hourlyData.hourly.time.findIndex((t) => new Date(t) >= now)
        );

        hourlyData.hourly.time
          .map((t, i) => ({
            time: new Date(t),
            temp: Math.round(hourlyData.hourly.temperature_2m[i]),
            icon: weatherCodeToIcon(hourlyData.hourly.weathercode[i]),
          }))
          .slice(startIndex, startIndex + 24)
          .forEach((h) => {
            const hour = h.time.getHours().toString().padStart(2, "0");
            const div = document.createElement("div");
            div.className = "hour";
            div.innerHTML = `
                    <div>${hour}:00</div>
                    <img src="https://openweathermap.org/img/wn/${h.icon}.png">
                    <div>${h.temp}°</div>
                `;
            hourlyContainer.appendChild(div);
          });
      }

      // 3day
      const dailyRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
      );
      const dailyData = await dailyRes.json();

      const forecastDiv = document.querySelector(".forecast-3day");
      forecastDiv.innerHTML = "";

      if (dailyData.daily && dailyData.daily.time) {
        for (let i = 1; i <= 3; i++) {
          const date = new Date(dailyData.daily.time[i]);
          const name = date.toLocaleDateString("en-US", { weekday: "short" });
          const temp = Math.round(dailyData.daily.temperature_2m_max[i]);
          const icon = weatherCodeToIcon(dailyData.daily.weathercode[i]);
          const div = document.createElement("div");
          div.className = "day";
          div.innerHTML = `
            <span>${name}</span>
            <img src="https://openweathermap.org/img/wn/${icon}.png">
            <span>${temp}°</span>
            `;
          forecastDiv.appendChild(div);
        }
      }

      // air quality
      const aqiRes = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5&timezone=auto`
      );
      const aqiData = await aqiRes.json();

      const aqiValueEl = document.querySelector(".air-quality .value");
      aqiValueEl.className = "value";

      if (aqiData.hourly && aqiData.hourly.pm2_5) {
        const now = new Date();
        const index = aqiData.hourly.time.findIndex((t) => new Date(t) >= now);
        const idx = index === -1 ? 0 : index;
        const pm25 = aqiData.hourly.pm2_5[idx];

        let aqiText = "Good";
        let aqiClass = "aqi-good";

        if (pm25 > 12) {
          aqiText = "Moderate";
          aqiClass = "aqi-moderate";
        }

        if (pm25 > 35) {
          aqiText = "Poor";
          aqiClass = "aqi-poor";
        }

        if (pm25 > 55) {
          aqiText = "Very Poor";
          aqiClass = "aqi-very-poor";
        }

        if (pm25 >= 150) {
          aqiText = "Hazardous";
          aqiClass = "aqi-hazardous";
        }

        aqiValueEl.innerText = `${aqiText} (${Math.round(pm25)})`;
        aqiValueEl.classList.add(aqiClass);
      } else {
        aqiValueEl.innerText = "---";
      }
    } catch (err) {
        const weatherContainer = document.querySelector(".weather-container");
        weatherContainer.classList.remove("loading");
        
        document.querySelector(".weather-location").innerText = "Error";
        document.querySelector(".weather-temp").innerText = "---°C";
        document.querySelector(".weather-icon").src = "";
        document.querySelector(".weather-hourly").innerHTML = "";
        document.querySelector(".forecast-3day").innerHTML = "";
        document.querySelector(".air-quality .value").innerHTML = "---";
        
        const aqiValueEl = document.querySelector(".air-quality .value");
        aqiValueEl.className = "value";
        aqiValueEl.innerText = "---";
    } finally{
        weatherContainer.classList.remove("loading");
    }
  }

  async function loadWeather(city){
    const weatherContainer = document.querySelector(".weather-container");
    weatherContainer.classList.add("loading");

    try{
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${weatherApiKey}`
      )
      const data = await res.json();

      if (data.cod !== 200 || !data.coord) {
        document.querySelector(".weather-location").innerText =
          "City not found";
        document.querySelector(".weather-temp").innerText = "---°C";
        document.querySelector(".weather-icon").src = "";
        document.querySelector(".weather-hourly").innerHTML = "";
        document.querySelector(".forecast-3day").innerHTML = "";
        document.querySelector(".air-quality .value").innerHTML = "---";
        return;
      }

      const lat = data.coord.lat;
      const lon = data.coord.lon;

      await loadWeatherByCoords(lat, lon);
    } catch(err){
      const weatherContainer = document.querySelector(".weather-container");
      weatherContainer.classList.remove("loading");

      document.querySelector(".weather-location").innerText = "Error";
      document.querySelector(".weather-temp").innerText = "---°C";
      document.querySelector(".weather-icon").src = "";
      document.querySelector(".weather-hourly").innerHTML = "";
      document.querySelector(".forecast-3day").innerHTML = "";
      document.querySelector(".air-quality .value").innerHTML = "---";

      const aqiValueEl = document.querySelector(".air-quality .value");
      aqiValueEl.className = "value";
      aqiValueEl.innerText = "---";
    } finally{
      weatherContainer.classList.remove("loading")
    }
  }

  function initWeather(){
    if("geolocation" in navigator){
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          loadWeatherByCoords(lat, lon);
        },
        (error) => {
          console.log("Location access denied or unavailable, using default");
          loadWeather("Singapore");
        }
      );
    } else{
      loadWeather("Singapore")
    }
  }

  initWeather();

  console.log("Weather window display:", document.getElementById("weather-window").style.display);

  document.getElementById("searchCityBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    if (city) loadWeather(city);
  });

  // dropdown
  const cityInput = document.getElementById("cityInput");
  const cityDropdown = document.getElementById("cityDropdown");

  let cityTimeout;

  cityInput.addEventListener("input", () => {
    const query = cityInput.value.trim();
    cityDropdown.innerHTML = "";
    cityDropdown.classList.add("show");

    if (query.length < 2) return;

    clearTimeout(cityTimeout);

    cityTimeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${weatherApiKey}`
        );
        const data = await res.json();

        if (!data.length) return;

        cityDropdown.style.display = "block";

        data.forEach((city) => {
          const div = document.createElement("div");
          div.innerText = `${city.name}${
            city.state ? ", " + city.state : ""
          }, ${city.country}`;
          div.style.padding = "8px 10px";
          div.style.cursor = "pointer";
          div.style.background = "rgba(255,255,255,0.08)";
          div.style.borderRadius = "6px";
          div.style.marginTop = "4px";

          div.addEventListener("click", () => {
            cityInput.value = city.name;
            cityDropdown.innerHTML = "";
            cityDropdown.style.display = "none";
            loadWeather(city.name);
          });

          cityDropdown.appendChild(div);
        });
      } catch {
        cityDropdown.innerHTML = "";
        cityDropdown.classList.remove("show");
      }
    }, 300);
  });

  document.addEventListener("click", (e) => {
    if (!cityDropdown.contains(e.target) && e.target !== cityInput) {
      cityDropdown.innerHTML = "";
      cityDropdown.style.display = "none";
    }
  });
});

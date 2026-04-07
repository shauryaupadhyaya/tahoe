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

      // dynamic background video
      const videoMap = {
        "01d": "https://cdn.hackclub.com/019cdab8-129d-74e1-81c7-98291d8c4c22/sunny-day.mp4",
        "01n": "https://cdn.hackclub.com/019cdab4-de2f-73fd-8300-0902b60dc097/clear-night.mp4",
        "02d": "https://cdn.hackclub.com/019cdab6-9400-7a9f-991d-43531e2435a2/partly-cloudy.mp4",
        "02n": "https://cdn.hackclub.com/019cdab6-9400-7a9f-991d-43531e2435a2/partly-cloudy.mp4",
        "03d": "https://cdn.hackclub.com/019cdab5-8119-7f6b-b7a0-16414a52a0ee/cloudy.mp4",
        "03n": "https://cdn.hackclub.com/019cdab5-8119-7f6b-b7a0-16414a52a0ee/cloudy.mp4",
        "04d": "https://cdn.hackclub.com/019cdab6-3749-7568-8012-3da4889152ad/overcast.mp4",
        "04n": "https://cdn.hackclub.com/019cdab6-3749-7568-8012-3da4889152ad/overcast.mp4",
        "09d": "https://cdn.hackclub.com/019cdab5-d3d0-73c7-9a68-f5154066461c/drizzle.mp4",
        "09n": "https://cdn.hackclub.com/019cdab5-d3d0-73c7-9a68-f5154066461c/drizzle.mp4",
        "10d": "https://cdn.hackclub.com/019cdab7-4689-780b-8fd2-1bf5f40f2f29/rain.mp4",
        "10n": "https://cdn.hackclub.com/019cdab7-4689-780b-8fd2-1bf5f40f2f29/rain.mp4",
        "11d": "https://cdn.hackclub.com/019cdab8-309b-7615-958e-6defd2e36042/thunderstorm.mp4",
        "11n": "https://cdn.hackclub.com/019cdab8-309b-7615-958e-6defd2e36042/thunderstorm.mp4",
        "13d": "https://cdn.hackclub.com/019cdab7-c359-72b6-9a41-72e99a848fec/snow.mp4",
        "13n": "https://cdn.hackclub.com/019cdab7-c359-72b6-9a41-72e99a848fec/snow.mp4",
        "50d": "https://cdn.hackclub.com/019cdab6-081b-7e8d-861d-75f41e5fa8d5/fog.mp4",
        "50n": "https://cdn.hackclub.com/019cdab6-081b-7e8d-861d-75f41e5fa8d5/fog.mp4",
      }

      const iconCode = data.weather[0].icon;
      const videoUrl = videoMap[iconCode] ?? videoMap["01d"];

      const bgVideo = document.getElementById("weather-bg-video");
      const videoSource = bgVideo.querySelector("source");

      if (videoSource.src !== videoUrl) {
        videoSource.src = videoUrl;
        bgVideo.load();
        bgVideo.play().catch(e => console.log("Video play failed:", e));
      }

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

  document.addEventListener("mousedown", (e) => {
    if (!cityDropdown.contains(e.target) && e.target !== cityInput) {
      cityDropdown.innerHTML = "";
      cityDropdown.style.display = "none";
    }
  });

  //========================== timer ==========================
  let totalSeconds = 0;
  let remainingSeconds = 0;
  let timerInterval = null;
  let isRunning = false;

  const timeDisplay = document.querySelector(".timer-time");
  const timeInput = document.querySelector("#timeInput");
  const startPauseBtn = document.querySelector("#startPauseBtn");
  const cancelBtn = document.querySelector("#cancelBtn");

  const timerCircle = document.querySelector(".timer-circle");
  const progressRing = document.querySelector(".ring-progress");
  const radius = 100;
  const circumference = 2 * Math.PI * radius;

  if(progressRing){
    progressRing.style.strokeDasharray = circumference;
    progressRing.style.strokeDashoffset = 0;
  }

  // convert to seconds
  function parseTime(value){
    const parts = value.split(":").map(Number);
    if(parts.length !== 3) return 0;
    return parts[0]*3600 + parts[1]*60 + parts[2];
  }

  // convert to hour
  function formatTime(sec){
    const h = String(Math.floor(sec/3600)).padStart(2, "0");
    const m = String(Math.floor((sec%3600)/60)).padStart(2, "0");
    const s = String(sec%60).padStart(2, "0")
    return `${h}:${m}:${s}`
  }

  // update ring
  function updateRing(){
    if(!isRunning ||totalSeconds===0){
      progressRing.style.strokeDashoffset = 0;
      return;
    }

    const progress = remainingSeconds/totalSeconds;
    progressRing.style.strokeDashoffset = 
      circumference * (1-progress);
  }

  // update text
  function updateDisplay(){
    timeDisplay.textContent = formatTime(remainingSeconds);
    updateRing();
  }

  updateDisplay();

  // start/pause button
  startPauseBtn.addEventListener("click", () => {
    if(!isRunning){
      totalSeconds = parseTime(timeInput.value);
      remainingSeconds = totalSeconds;
      if(remainingSeconds <= 0) return;
      
      isRunning = true;
      startPauseBtn.textContent = "Pause";
      cancelBtn.classList.remove("hidden");
      setWheelLock(true);
      timerCircle.classList.add("running");

      timerInterval = setInterval(() => {
        remainingSeconds--;
        updateDisplay();
        
        if(remainingSeconds<=0){
          clearInterval(timerInterval);
          isRunning = false;
          startPauseBtn.textContent = "Start";
          cancelBtn.classList.add("hidden");
          setWheelLock(false);
          timerCircle.classList.remove("running");
          progressRing.style.strokeDashoffset = 0;
        }
      }, 1000);
    } else{
      clearInterval(timerInterval);
      isRunning = false;
      startPauseBtn.textContent = "Start";
      setWheelLock(false);
      timerCircle.classList.remove("running")
    }
  });

  // cancel button
  cancelBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    isRunning = false;
    remainingSeconds = 0;
    updateDisplay();
    startPauseBtn.textContent = "Start";
    cancelBtn.classList.add("hidden");
    setWheelLock(false);
    timerCircle.classList.remove("running")
  })

  // picker wheel (hour minute and second)
  let pickedHours = 0;
  let pickedMinutes = 0;
  let pickedSeconds = 0;
  const wheel = document.querySelector(".wheel");

  function setWheelLock(locked){
    document.querySelectorAll(".wheel").forEach(wheel => {
      wheel.style.pointerEvents = locked ? "none" : "auto";
      wheel.style.opacity = locked ? "0.6" : "1";
    })
  }

  function setupWheel(wheel, onChange){
    const items = [...wheel.querySelectorAll(".wheel-item:not(.wheel-spacer)")];
    let ticking = false;

    function update(){
      if(isRunning) return;

      const center = wheel.getBoundingClientRect().top + wheel.offsetHeight / 2;

      let closest = null;
      let dist = Infinity;

      items.forEach(child => {
        const r = child.getBoundingClientRect();
        const d = Math.abs((r.top + r.height / 2) - center);

        if(d < dist){
          dist = d;
          closest = child;
        }
      });

      if (!closest) return;

      items.forEach(i => i.classList.remove("active"));
      closest.classList.add("active");

      const value = Number(closest.textContent)

      if(wheel.classList.contains("hour-wheel")) pickedHours = value;
      if(wheel.classList.contains("minute-wheel")) pickedMinutes = value;
      if(wheel.classList.contains("second-wheel")) pickedSeconds = value;

      remainingSeconds = 
        pickedHours * 3600 + pickedMinutes * 60 + pickedSeconds;

      timeInput.value = 
        `${String(pickedHours).padStart(2, "0")}:` +
        `${String(pickedMinutes).padStart(2, "0")}:` +
        `${String(pickedSeconds).padStart(2, "0")}`;

      updateDisplay();
      ticking = false;
    }

    wheel.addEventListener("scroll", () => {
      if(!ticking){
        ticking = true;
        requestAnimationFrame(update);
      }
    });

    update();
  }

  const hourWheel = document.querySelector(".hour-wheel");
  const minuteWheel = document.querySelector(".minute-wheel");
  const secondWheel = document.querySelector(".second-wheel");

  if(hourWheel) setupWheel(hourWheel);
  if (minuteWheel) setupWheel(minuteWheel);
  if (secondWheel) setupWheel(secondWheel);

  // world clock
  function initWorldClock (canvasId, digitalId, timezone){
    const canvas = document.getElementById(canvasId);
    const digitalEl = document.getElementById(digitalId);
    if (!canvas || !digitalEl) return;

    const ctx = canvas.getContext("2d");
    const radius = canvas.height / 2;
    const drawRadius = radius * 0.9;

    function draw(){
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(radius, radius);

      const now = new Date();
      const timeStr = now.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const [h, m, s] = timeStr.split(":").map(Number);

      digitalEl.innerText = timeStr;

      for (let i = 0; i < 12; i++){
        const angle = i * Math.PI / 6;
        ctx.rotate(angle);
        ctx.translate(0, -drawRadius);
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.lineTo(0,6);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.translate(0, drawRadius);
        ctx.rotate(-angle);
        
      }

      ctx.beginPath();
      ctx.arc(0,0,drawRadius,0,2*Math.PI);
      ctx.strokeStyle = "rgba(255,255,255,255,0.2)";
      ctx.lineWidth = 4;
      ctx.stroke();

      function drawHand(angle,length,width,color){
        ctx.save();
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.lineCap = "round";
        ctx.strokeStyle = color;
        ctx.moveTo(0,0);
        ctx.rotate(angle);
        ctx.lineTo(0, -length);
        ctx.stroke();
        ctx.restore();
      }

      const hourAngle = (h % 12 * Math.PI / 6) + (m * Math.PI / 360);
      drawHand(hourAngle, drawRadius * 0.5, 5, "white");

      const minuteAngle = (m * Math.PI / 30) + (s * Math.PI / 1800);
      drawHand(minuteAngle, drawRadius * 0.5, 5, "rgba(255,255,255,0.8)");

      const secondAngle = (s * Math.PI / 30)
      drawHand(secondAngle, drawRadius * 0.5, 5, "#ff5f57");

      ctx.beginPath();
      ctx.arc(0,0,4,0,2 * Math.PI);
      ctx.fillStyle = "white";
      ctx.fill();
    }

    setInterval(draw, 1000);
    draw();
  }

  initWorldClock("analog-ny", "digital-ny", "America/New_York");
  initWorldClock("analog-london", "digital-london", "Europe/London");
  initWorldClock("analog-tokyo", "digital-tokyo", "Asia/Tokyo");

  // music section
  const SP_REDIRECT = window.location.origin + window.location.pathname;
  const hintEl = document.getElementById("spotify-redirect-hint");
  if (hintEl) hintEl.textContent = SP_REDIRECT;

  function spRandStr(len){
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const buf = new Uint8Array(len);
    crypto.getRandomValues(buf);
    return Array.from(buf, b => chars[b % chars.length]).join("");
  }

  async function spChallenge(verifier){
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function spGet(k) {return localStorage.getItem(k);}
  function spSet(k, v) {localStorage.setItem(k, v);}
  function spDel(k) {localStorage.removeItem(k);}

  function spSaveTokens(d){
    spSet("sp_at", d.access_token);
    if (d.refresh_token) spSet("sp_rt", d.refresh_token);
    spSet("sp_exp", Date.now() + (d.expires_in - 60) * 1000);
  }

  function spClear(){
    ["sp_at", "sp_rt", "sp_exp", "sp_ver", "sp_st"].forEach(spDel);
  }

  async function spFreshToken() {
    if(spGet("sp_at") && Date.now() < parseInt(spGet("sp_exp") || "0")) return spGet("sp_at");
    const rt = spGet("sp_rt");
    if (!rt) {spClear(); showSpotifyLogin(); return null;}
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: new URLSearchParams({grant_type: "refresh_token", refresh_token: rt, client_id: SPOTIFY_CONFIG.clientId})
    });
    if (!r.ok) {spClear(); showSpotifyLogin(); return null;}
    const d = await r.json();
    spSaveTokens(d);
    return d.access_token;
  }

  const spotifyLoginSection = document.getElementById("spotify-login-section");
  const spotifyDisplay = document.getElementById("spotify-display");
  const spotifyNothing = document.getElementById("spotify-nothing");

  function showSpotifyLogin(){
    spotifyLoginSection.classList.remove("hidden");
    spotifyDisplay.classList.add("hidden");
    if (spotifyNothing) spotifyNothing.classList.add("hidden");
  }

  function showSpotifyNothing(){
    spotifyLoginSection.classList.add("hidden");
    spotifyDisplay.classList.add("hidden");
    if (spotifyNothing) spotifyNothing.classList.remove("hidden");
  }

  function showSpotifyTrack(){
    spotifyLoginSection.classList.add("hidden");
    spotifyDisplay.classList.remove("hidden");
    if (spotifyNothing) spotifyNothing.classList.add("hidden");
  }

  function spFmtTime(ms){
    const s = Math.floor(ms/1000);
    return `${Math.floor(s/60)}:${String(s % 60).padStart(2, "0")}`;
  }

  let spProgressMs = 0, spDurationMs = 0, spIsPlaying = false, spTick = null;

  function spStartTick(){
    clearInterval(spTick);
    spTick = setInterval(() => {
      if(!spIsPlaying) return;
      spProgressMs = Math.min(spProgressMs + 1000, spDurationMs);
      spRenderProgress();
    }, 1000);
  }

  function spRenderProgress(){
    const pct = spDurationMs > 0 ? (spProgressMs/spDurationMs) * 100 : 0;
    const fill = document.getElementById("spotify-progress-fill");
    const cur = document.getElementById("spotify-time-current");
    const tot = document.getElementById("spotify-time-total");
    if (fill) fill.style.width = pct + "%";
    if (cur) cur.textContent = spFmtTime(spProgressMs);
    if (tot) tot.textContent = spFmtTime(spDurationMs);
  }

  const spotifyLoginBtn = document.getElementById("spotify-login-btn");
  if(spotifyLoginBtn){
    spotifyLoginBtn.onclick = async () => {
      const verifier = spRandStr(96);
      const challenge = await spChallenge(verifier);
      const state = spRandStr(16);
      spSet("sp_ver", verifier);
      spSet("sp_st", state);
      const params = new URLSearchParams({
        client_id: SPOTIFY_CONFIG.clientId,
        response_type: "code",
        redirect_uri: SP_REDIRECT,
        scope: "user-read-currently-playing user-read-playback-state", state,
        code_challenge_method: "S256",
        code_challenge: challenge,
      });
      window.location.href = "https://accounts.spotify.com/authorize?" + params;
    };
  }

  async function spHandleCallback(){
    const p = new URLSearchParams(window.location.search);
    const code = p.get("code");
    const state = p.get("state");
    const err = p.get("error");
    if (err){console.warn("Spotify auth error:", err); showSpotifyLogin(); return false;}
    if (!code) return false;
    if (state !== spGet("sp_st")) {console.warn("State mismatch"); showSpotifyLogin(); return false;}

    window.history.replaceState({}, document.title, window.location.pathname);

    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code", code,
        redirect_uri: SP_REDIRECT,
        client_id: SPOTIFY_CONFIG.clientId,
        code_verifier: spGet("sp_ver"),
      })
    });
    spDel("sp_ver"); spDel("sp_st");

    if (!r.ok){console.error("Token exchange failed", await r.text()); showSpotifyLogin(); return false;}
    spSaveTokens(await r.json());
    return true;
  }

  async function updateSpotify(){
    try{
      const token = await spFreshToken();
      if (!token) {showSpotifyLogin(); return;}
      
      const res = await fetch ("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {Authorization: "Bearer " + token}
      });

      if (res.status === 204 || res.status === 202){
        showSpotifyNothing();
        return;
      }

      if (res.status === 401){
        spClear();
        showSpotifyLogin();
        return;
      }

      if (!res.ok) return;

      const data = await res.json();
      if (!data || !data.item) {
        showSpotifyNothing();
        return;
      }

      spProgressMs = data.progress_ms || 0;
      spDurationMs = data.item.duration_ms || 0;
      spIsPlaying = data.is_playing;

      spStartTick();
      spRenderProgress();

      document.getElementById("track-art").src = data.item.album.images[0]?.url || "";
      document.getElementById("track-title").innerText = data.item.name;
      document.getElementById("track-artist").innerText = data.item.artists.map(a => a.name).join(", ") || "Unknown Artist";

      const albumEl = document.getElementById("track-album-name");
      if (albumEl) albumEl.innerText = data.item.name || "";

      showSpotifyTrack();
    } catch (err){
      console.error("spotify api error: ", err);
    } 
  }

  (async () => {
    const wasCallback = await spHandleCallback();
    if (wasCallback || spGet("sp_at") || spGet("sp_rt")){
      await updateSpotify();
      setInterval(updateSpotify, 8000);
    } else {
      showSpotifyLogin();
    }
  })();
});
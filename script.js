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

  opens.forEach((icon) => {
    icon.onclick = () => {
      const id = icon.getAttribute("data-open");
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = "block";
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
  let topZ = 10;
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
  const defaultCity = "Singapore";

  async function loadWeather(city) {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${weatherApiKey}`
      );
      const data = await res.json();
      
      if (data.cod !== 200 || !data.coord) {
        document.querySelector(".weather-location").innerText = "City not found";
        document.querySelector(".weather-temp").innerText = "---°C";
        document.querySelector(".weather-icon").src = "";
        document.querySelector(".weather-hourly").innerHTML = "";
        document.querySelector(".forecast-3day").innerHTML = "";
        document.querySelector(".air-quality .value").innerHTML = "---";
        return;
      }

      const lat = data.coord.lat;
      const lon = data.coord.lon;

      document.querySelector(".weather-location").innerText = data.name;
      document.querySelector(".weather-temp").innerText = Math.round(data.main.temp) + "°C";
      document.querySelector(".weather-icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

      // hourly
      const hourlyRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=Asia%2FSingapore`
      );

      const hourlyData = await hourlyRes.json();

      const hourlyContainer = document.querySelector(".weather-hourly");
      hourlyContainer.innerHTML = "";

      if (hourlyData.hourly && hourlyData.hourly.time){
            const now = new Date();

            const startIndex = hourlyData.hourly.time.findIndex(
                t => new Date(t) >= now
            );

            const hours = hourlyData.hourly.time
                .map((t, i) => ({
                    time: new Date(t),
                    temp: Math.round(hourlyData.hourly.temperature_2m[i])
                }))
                .slice(startIndex, startIndex+24);
            
            hours.forEach(h => {
                const hour = h.time.getHours().toString().padStart(2, "0");
                const div = document.createElement("div");
                div.className = "hour";
                div.innerHTML=`
                    <div>${hour}:00</div>
                    <div>${h.temp}°</div>
                `;
                hourlyContainer.appendChild(div);
            })
      }

      // 3day
      const dailyRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia/Singapore`);
      const dailyData = await dailyRes.json();

      const forecastDiv = document.querySelector(".forecast-3day");
      forecastDiv.innerHTML = ""
      if (dailyData.daily && dailyData.daily.time) {
        for (let i = 1; i <= 3; i++) {
            const date = new Date(dailyData.daily.time[i]);
            const name = date.toLocaleDateString("en-US", { weekday: "short" });
            const temp = Math.round(dailyData.daily.temperature_2m_max[i])
            const div = document.createElement("div");
            div.className = "day";
            div.innerHTML = `
            <span>${name}</span>
            <span>${temp}°</span>
            `;
            forecastDiv.appendChild(div);
        }
    }

      // air quality
      const aqiRes = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5&timezone=Asia/Singapore`
      );
      const aqiData = await aqiRes.json();

      if (aqiData.hourly && aqiData.hourly.pm2_5 && aqiData.hourly.pm2_5.length > 0) {
        const now = new Date();
        const idx = aqiData.hourly.time.findIndex(t => new Date(t) >= now) ?? 0;
        const pm25 = aqiData.hourly.pm2_5[idx] ?? aqiData.hourly.pm2_5[0];
        
        let aqiText = "Good";
        if (pm25 > 35) aqiText = "Moderate";
        if (pm25 > 55) aqiText = "Poor";
        if (pm25 > 150) aqiText = "Very Poor";
        document.querySelector(".air-quality .value").innerText = aqiText;
      } else {
        document.querySelector(".air-quality .value").innerText = "---";
      }
    } catch (err) {
        console.error("Weather API Error:", err);
        document.querySelector(".weather-location").innerText = "Error";
        document.querySelector(".weather-temp").innerText = "---°C";
        document.querySelector(".weather-icon").src = "";
        document.querySelector(".weather-hourly").innerHTML = "";
        document.querySelector(".forecast-3day").innerHTML = "";
        document.querySelector(".air-quality .value").innerHTML = "---";
    }
  }

  loadWeather(defaultCity);

  document.getElementById("searchCityBtn").addEventListener("click", () => {
    const city = document.getElementById("cityInput").value.trim();
    if (city) loadWeather(city);
  });
});
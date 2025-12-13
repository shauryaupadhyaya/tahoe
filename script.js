//background
document.addEventListener("DOMContentLoaded", () => {
    const bg = document.getElementById("background")
    const bgInput = document.getElementById("bgInput")
    const preview = document.getElementById("bgPreview")

    const savedBg = localStorage.getItem("userBg")
    if(savedBg) {
        bg.style.backgroundImage = savedBg
        preview.style.backgroundImage = savedBg
    }

    bgInput.addEventListener("change", e => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            preview.style.backgroundImage = `url(${reader.result})`
        }
        reader.readAsDataURL(file)
    })

    document.getElementById("saveBgBtn").addEventListener("click", () => {
        const style = preview.style.backgroundImage
        if (!style) return

        localStorage.setItem("userBg", style)
        bg.style.backgroundImage = style
    })
})

//opening and closing windows
const opens = document.querySelectorAll("[data-open]")
const closes = document.querySelectorAll("[data-close]")

opens.forEach(icon => {
    icon.onclick = () => {
        const id = icon.getAttribute("data-open")
        const el = document.getElementById(id)
        if (!el) return
        el.style.display = "block"
    }
})

closes.forEach(btn => {
    btn.onclick = () => {
        const id = btn.getAttribute("data-close")
        const el = document.getElementById(id)
        if (!el) return
        el.style.display = "none"
    }
})

//clock
function updateTop() {
    const t = new Date()
    const h = t.getHours().toString().padStart(2, "0")
    const m = t.getMinutes().toString().padStart(2, "0")
    const date = t.toDateString()

    document.querySelector(".top-time").innerText = `${h}:${m}`
    document.querySelector(".top-date").innerText = date
}

updateTop()
setInterval(updateTop, 1000)

// dragging windows
function makeDraggable(win) {
    const header = win.querySelector(".window-header")
    let offsetX = 0
    let offsetY = 0
    let isDown = false

    header.addEventListener("mousedown", e => {
        isDown = true
        offsetX = e.clientX - win.offsetLeft
        offsetY = e.clientY - win.offsetTop
        header.style.cursor = "grabbing"
    })

    document.addEventListener("mouseup", () => {
        isDown = false
        header.style.cursor = "grab"
    })

    document.addEventListener("mousemove", e => {
        if (!isDown) return
        win.style.left = (e.clientX - offsetX) + "px"
        win.style.top = (e.clientY - offsetY) + "px"
    })
}

document.querySelectorAll(".window").forEach(win => {
    makeDraggable(win)
})

//move window forward on click
let topZ = 10;
document.querySelectorAll(".window").forEach(win => {
    win.addEventListener("mousedown", () => {
        topZ++;
        win.style.zIndex = topZ
    })
})

// tab switching settings
const tabs = document.querySelectorAll(".settings-tab");
const pages = {
    appearance: document.getElementById("appearance-page"),
    theme: document.getElementById("theme-page")
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");

        Object.values(pages).forEach(p => p.classList.add("hidden"));
        pages[tab.dataset.tab].classList.remove("hidden");
    })
})
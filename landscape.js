let landscape = false;
const playerFrameWrap = document.querySelector(".playerFrameWrap");

// Update class on the element based on the boolean
function updatePlayerClass() {
    if (!playerFrameWrap) return;
    if (landscape) {
        playerFrameWrap.classList.add("landscape");
    } else {
        playerFrameWrap.classList.remove("landscape");
    }
}

function checkOrientation() {
    landscape = screen.orientation?.angle === 90 || screen.orientation?.angle === -90 || window.innerWidth > window.innerHeight;
    console.log("Landscape:", landscape); // true or false
    updatePlayerClass();


}

// Initial check
checkOrientation();

// Update on rotation or resize
screen.orientation?.addEventListener("change", checkOrientation);
window.addEventListener("resize", checkOrientation);

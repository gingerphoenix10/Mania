var vid = document.getElementById("custBG");
vid.muted = false;
vid.loop = false;
function update() {
    if (!vid) return;
    if (vid.paused != paused) {
        if (paused) {
            vid.pause();
        } else {
            vid.play();
        }
    }
    //if (Math.abs(vid.currentTime - audio.currentTime-27.5) > 1) vid.currentTime = audio.currentTime+27.5;
    if (Math.abs(vid.currentTime - audio.currentTime-0.3) > 1) vid.currentTime = audio.currentTime+0.3;
    requestAnimationFrame(update);
}
update();
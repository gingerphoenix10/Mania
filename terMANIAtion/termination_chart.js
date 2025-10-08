const origGetXPos = getXPos;
getXPos = (lane) => {
    if (lanes == 5) {
        if (lane < 2) return 50 + (lane - (lanes - 2) / 2) * distance;
        if (lane > 2) return 50 + (lane - 1 - (lanes - 2) / 2) * distance;
        else return window.innerHeight;
    }
    else { alert(lanes); origGetXPos(); }
};
reloadDots();

document.getElementById("tick").innerHTML = 0;

const mspb = 60 / 222 * 1000;
//alert(speed);
const mspbMult = mspb*1;
for (var tick in level.notes) {
    tick = parseFloat(tick);
    for (var note of level.notes[tick]) {
        if (note.Lane != 3) continue;
        if (!level.modchart[tick-mspbMult]) level.modchart[tick-mspbMult] = [];
        if (!level.modchart[tick-mspbMult*2]) level.modchart[tick-mspbMult*2] = [];
        level.modchart[tick-mspbMult].push({
            type: "RunJSFile",
            src: ghProxy+"terMANIAtion/termination_warning.js"
        });
        level.modchart[tick-mspbMult*2].push({
            type: "RunJSFile",
            src: ghProxy+"terMANIAtion/termination_warning.js"
        });
    }
}

function indicatorLoop() {
    if (playing) requestAnimationFrame(indicatorLoop);
}
indicatorLoop();

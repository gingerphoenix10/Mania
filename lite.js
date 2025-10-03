document.getElementById("version").innerText = "Current Version: v1.0.2N";
function errCapture(method) {
    try {method()} catch(e) {alert(e.stack)}
}
var chart = {};
var startOffset = 0;
var modDiv;
function parseModChart(lvl, so) {
    if (!("modchart" in lvl)) return;
    if (!modchartEnabled) return;
    chart = lvl.modchart;
    //startOffset=so;
    //for (var tick in chart) for (var event in chart[tick]) chart[tick][event].fired = false;
    modDiv = document.createElement("div");
    modDiv.id="modDiv";
    document.body.appendChild(modDiv);
    loop();
}
var runEvents = [];
var destroyEvents = [];
var time=0;
function loop() {
    errCapture(() => {
    time = audio.currentTime*1000;
    
    for (var tick in chart) {
        if (time-(tick==0?0:audioDelay) >= tick && !chart[tick].fired) {
            for (var event in chart[tick]) {
                var eventI = event;event=chart[tick][event];
                switch(event.type) {
                    case "CreateObject":
                        var newElement = document.createElement(event.elmnt || "div");
                        newElement.id = event.id;
                        if (!event.parent) modDiv.appendChild(newElement);
                        else document.getElementById(event.parent).appendChild(newElement);
                        break;
                    case "ObjectAttribute":
                        document.getElementById(event.id).setAttribute(event.AttName, event.AttValue);
                        break;
                    case "RemoveObject":
                        document.getElementById(event.id).remove();
                        break;
                    case "SetStyle":
                        document.getElementById(event.id).style[event.style] = event.value;
                        break;
                    case "RunJS":
                        eval(event.src);
                        break;
                    case "RunJSFile":
                        var jsFile = document.createElement("script");
                        jsFile.src = event.src;
                        jsFile.id = event.id;
                        if (!event.parent) modDiv.appendChild(jsFile);
                        else document.getElementById(event.parent).appendChild(jsFile);
                        break;
                    case "runOnSpawn":
                        runEvents.push({id: event.id, events: event.events});
                        break;
                    case "runOnDestroy":
                        destroyEvents.push({id: event.id, events: event.events});
                        break;
                    case "debug":
                    case "alert":
                        alert(event.msg ?? "Debugger");
                }
                chart[tick].fired = true;
            }
        }
    }
    for (var runEventIndex in runEvents) {
        var runEvent = runEvents[runEventIndex];
        if (document.getElementById(runEvent.id)) {
            if (chart[time] == undefined) chart[time] = [];
            for (var run of runEvent.events) {
                chart[time].push(run);
            }
            runEvents.splice(runEventIndex,1);
        }
    }
    if (playing) requestAnimationFrame(loop);
    else {
        modDiv.remove();
        modDiv = null;
    }
    });
}

function destroyEvent(id) {
    errCapture(() => {
    for (var destroyEventIndex in destroyEvents) {
        var destroyEvent = destroyEvents[destroyEventIndex];
        if (destroyEvent.id == id) {
            if (chart[time] == undefined) chart[time] = [];
            for (var event of destroyEvent.events) {
                chart[time].push(event);
            }
            destroyEvents.splice(destroyEventIndex,1);
        }
    } 
    });
}
function hitEvent(id) {}
function missEvent(id) {}

var lanes = 4;
var distance = 8;

var overlays = {};
var overlay = false;
var size = 60;
var overlaySize = 50;

function getXPos(lane) {
    return 50 + (lane - (lanes - 1) / 2) * distance;
}

function reloadDots() {
    overlays = {};
    var padding = 10;
    var spacing = 5;
    var gameArea = document.getElementById("dots");
    var overlayArea = document.getElementById("overlay");

    gameArea.replaceChildren();
    overlayArea.replaceChildren();

    for (let lane = 0; lane < lanes; lane++) {
        
        var positionPercentage = getXPos(lane);

        // Create the note
        var dot = document.createElement("div");
        dot.className = "circ";
        dot.style = `left: ${positionPercentage}%; bottom: 35px;width: ${size}px;height: ${size}px`;
        dot.id = "static" + (lane + 1);
        gameArea.appendChild(dot);

        if (overlay) {
            var overlayKey = document.createElement("div");
            overlayKey.className = "overlayKey";
            overlayKey.style = "position: absolute; left: "+((overlaySize+spacing)*lane+padding/2)+"px; top: "+padding/2+"px; width: "+overlaySize+"px; height: "+overlaySize+"px;background-color: white;";
            overlays[lane+1] = overlayKey;
            var keyText = document.createElement("p");
            keyText.className = "keyText";
            overlayKey.appendChild(keyText);
            document.getElementById("overlay").appendChild(overlayKey);
        }
    }
    if (overlay) {
        document.getElementById("overlay").style.display = "block";
        document.getElementById("overlay").style.width = (overlaySize+spacing)*lanes+padding/2+"px";
        document.getElementById("overlay").style.height = (overlaySize+padding)*2+"px";
        var kps = document.createElement("h1");
        kps.className = "kps";
        kps.style.top = overlaySize+"px";
        kps.style.height = overlaySize+padding+"px";
        kps.id = "kps";
        kps.innerHTML = "KPS - 0";
        document.getElementById("overlay").appendChild(kps);
        var nps = document.createElement("h2");
        nps.className = "kps";
        nps.style.top = (overlaySize+29)+"px";
        nps.style.height = overlaySize+padding+"px";
        nps.style.color = "gray";
        nps.id = "nps";
        nps.innerHTML = "NPS - 0";
        document.getElementById("overlay").appendChild(nps);
        updatekps();
    } else document.getElementById("overlay").style.display = "none";
    if (document.getElementById("touchContainer").style.display != "none")
        showTouchContainer();
}

reloadDots();

const healthbarPadding = 5;
document.getElementById("health").style.left = healthbarPadding+"px";
document.getElementById("health").style.top = healthbarPadding+"px";
document.getElementById("health").style.width = "calc(100% - "+healthbarPadding*2+"px)";
document.getElementById("health").style.height = "calc(100% - "+healthbarPadding*2+"px)";

var health = 100;

var notes = [];
var holds = [];
function createNote(lane, noteSpeed, id, holdDuration, hitTime) {
    if (lane < 1 || lane > lanes) return;
    const circle = document.createElement("span");
    circle.id = id;
    circle.className = "circ";
    circle.style = document.getElementById("static" + lane);
    circle.style.bottom = "0px";
    circle.style.width = size+"px";
    circle.style.height = size+"px";
    document.getElementById("notes").appendChild(circle);
    var noteData = { lane: lanes==1?1:lane, element: circle, y: 0, speed: noteSpeed, hitTime: hitTime };
    if (holdDuration && holdsEnabled) {
        const hold = document.createElement("div");
        hold.id = id;
        hold.className = "hold";
        hold.style = document.getElementById("static" + lane);
        hold.style.bottom = "0px";
        hold.style.height = (spawnHeight - 65) / speed / noteSpeed * holdDuration / 1000 +"px";
        hold.style.width = (size-10)+"px";
        document.getElementById("notes").appendChild(hold);
        noteData.holdElement = hold;
        noteData.holdDuration = holdDuration;
    }
    notes.push(noteData);
}
var combo = 0;
var acc = {};
var hits = 0;
var died = false;
var misses = 0;
var score = 0;
var scoreMulti = 1;
var holding = [false,false,false,false];
var ghostTapping = true;
var spamPrevention = false;
var ghostMS = {};
var paused = false;
var holdsEnabled = true;
var instantRequests = false;
function hideMenus() {
    for (var menu of document.getElementsByClassName("picker")) {
        menu.style.display = "none";
    }
}
function pause() {
    paused=!paused;
    if (paused) {
        audio.pause();
        hideMenus();
        document.getElementById("pause").style.display = "block";
        document.getElementById("menu").style.visibility = "visible";
        document.getElementById("menu").style.opacity = 1;
        setTimeout(() => {
            hideMenus();
            document.getElementById("pause").style.display = "block";
        }, 150);
        audio.currentTime -= 3;
errCapture(() => {
        for (let activeNote=0;activeNote<notes.length;activeNote++) {
            const hitTime = notes[activeNote].hitTime;
            if (!level.notes[hitTime]) level.notes[hitTime] = [];

            var origNote = {"Lane": notes[activeNote].lane, "Speed":  1/notes[activeNote].speed};
            
            notes[activeNote].element.remove();
            if (notes[activeNote].holdElement) {
                notes[activeNote].holdElement.remove();
                origNote.holdDuration = notes[activeNote].holdDuration;
            }

            level.notes[hitTime].push(origNote);

            notes.splice(activeNote, 1);
            activeNote--;
        }
})
    } else {
        audio.play();
        document.getElementById("menu").style.visibility = "hidden";
        document.getElementById("menu").style.opacity = 0;
        setTimeout(() => {
            hideMenus();
            document.getElementById("picker").style.display = "block";
        }, 150);
    }
}
document.getElementById("unpause").addEventListener("click", pause);
document.getElementById("quit").addEventListener("click", quit);
document.addEventListener("visibilitychange", function() {
    if (document.hidden && playing && !paused)
        pause();
});

var kps = [];
function updatekps() {
    var elmnt = document.getElementById("kps");
    var kpsLen = kps.length;
    while (kpsLen--) {
        if (Date.now() > kps[kpsLen]) kps.splice(kpsLen, 1);
    }
    if (elmnt) {
        elmnt.innerHTML = "KPS - "+kps.length;
    }
    var npsOverlay = document.getElementById("nps");
    if (npsOverlay) npsOverlay.innerHTML = "NPS - "+calculateNPSAtTime(level.notes, time);
    if (overlay) requestAnimationFrame(updatekps);
}
updatekps();
function keyPress(e, c) {
    if (!c && document.getElementById("touchContainer").style.display != "none") document.getElementById("touchContainer").style.display = "none";
    if (!c && e.keyCode == 27) pause();
    if (!c && e.key == "p") pause();
    //if (!c && e.key == " " && nextSpawnTime >= (audio.currentTime + 6)*1000 && notes.length == 0 && holds.length == 0) audio.currentTime = nextSpawnTime==audio.duration?nextSpawnTime/1000-1:nextSpawnTime;
    if (!c && paused && e.key == "c") {
        var lvlData = JSON.parse(JSON.stringify(prevLvl));
        lvlData.song = "";
        navigator.clipboard.writeText(JSON.stringify(lvlData));
        alert("Copied level data");
    }
    //if (!c && e.key == "c") alert(time);
    if (paused) return;
    var lane;
    if (!c) {
        let chr = e.key.toLowerCase();
        if (keybinds[lanes]) {
            if (!(chr in keybinds[lanes])) return;
            lane = keybinds[lanes][chr];
        } else {
            if (!(chr in keybinds[4])) return;
            lane = keybinds[4][chr];
        }
    } else {
        if (c == "gamepad") {
            lane = e;
        } else if (c == "touch") {
            lane = e;
        }
    }
    if (lanes >= 4) {
        if (holding[lane]) {return;} else {holding[lane] = true;}}
    else holding[lane] = true;
    kps.push(Date.now()+1000);
    if (overlay) {
        overlays[lane].style["background-color"] = "gray";
        if (e.key) overlays[lane].getElementsByClassName("keyText")[0].innerHTML = e.key.toUpperCase();
    }
    document.getElementById("static" + lane).classList.add("hit");
    var closest = { y: 0 };
    var closeindex = 0;
    var latestindex = 0;
    for (var note in notes) {
        latestindex = note;
        note = notes[note];
        if (note.lane == lane) {
            if (note.y > closest.y) {
                closeindex = latestindex;
                closest = note;
            }
        }
    }
    if (closest.element !== undefined) {
        var lanePosition = document
                .getElementById("static" + lane)
                .getBoundingClientRect(),
            notePosition = closest.element.getBoundingClientRect(),
            offset = Math.abs(notePosition.top - lanePosition.top);
        if (offset <= accuracy) {
            if (spamPrevention && ghostMS[lane] && ghostMS[lane] != 0 && performance.now()-ghostMS[lane] < 500) return;
            score += Math.floor(115/(offset+1)*20*scoreMulti);
            if (scoreMulti < 1.5) scoreMulti += 0.1;
            notes.splice(closeindex, 1);
            destroyEvent(closest.element.id);
            hitEvent(closest.element.id);
            if (closest.holdElement) {
                closest.holdElement.style.height = parseFloat(closest.holdElement.style.height)+offset+"px";
                closest.holdElement.style.bottom = document.getElementById("static" + lane).style.bottom;
                holds.push({element: closest.holdElement, height: parseFloat(closest.holdElement.style.height), speed: closest.speed, lane: closest.lane});
            }
            closest.element.remove();
            combo++;
            hits++;
            if (health+2.5 <= 100) health+=2.5;
            else health = 100;
            //document.getElementById("fps").innerHTML = Math.abs(accuracy-offset);
            if (Math.abs(offset-accuracy) >= 40 || autoplay) {
                //it's all a lie. Nothing is real. Autoplay doesn't only get perfects. You've been played for a fool
                createAlert("Perfect!", "#0044ff");
            } else if (Math.abs(offset-accuracy) >= 23) {
                createAlert("Good!", "#00ff00");
            } else if (Math.abs(offset-accuracy) >= 12) {
                createAlert("Nice!", "#ffff00");
            } else {
                createAlert("Okay!", "#ffa56b");
            }
            acc[Math.floor(audio.currentTime*1000)] = Math.abs(offset-accuracy);
        } else if (!ghostTapping) {
            miss();
        } else if (spamPrevention) {
            ghostMS[lane] = performance.now();
        }
    } else if (!ghostTapping) {
        miss();
    } else if (spamPrevention) {
        ghostMS[lane] = performance.now();
    }
}

/*var alertPadding = 1000;
function createAlert(text, color, x, y) {
    var alrt = document.createElement("h1");
    alrt.innerHTML = text;
    alrt.style.color = color;
    alrt.style.position = "absolute";
    if (y == undefined) y = 5;
    alrt.style.bottom = y+"px";
    alrt.style["text-align"] = "center";
    alrt.style["font-family"] = "monospace";
    alrt.style["font-size"] = "20px";
    alrt.style.transition = "opacity 1s";
    var tRange = document.createRange();
    if (x == "rnd" || x == undefined) x = alertPadding+Math.random()*(window.innerWidth-alertPadding*2);
    alrt.style.left = x-alrt.clientWidth+"px";
    document.body.appendChild(alrt);
    setTimeout(() => {
            alrt.style.opacity = 0;
        setTimeout(() => {
            alrt.remove();
        }, 1000);
   }, 200);
}*/
function createAlert(text, color) {
    //var alrt = document.getElementById("alert");
    let alrt = document.createElement("h1");
    alrt.className = "alert";
    alrt.id = "alert";
    document.body.appendChild(alrt);
    // Set the text and color
    alrt.innerHTML = text;
    alrt.style.color = color;

    // Remove the transition to make immediate changes
    alrt.style.transition = "none";
    alrt.style.fontSize = "2.75rem"; // Snap back to 1.2rem
    alrt.style.opacity = "1";
    alrt.style.top = "25%";

    // Force reflow to ensure the browser processes the style change
    alrt.offsetHeight; // This forces a reflow

    // Reapply the transition and shrink to 0rem
    alrt.style.transition = "font-size 0.2s, opacity 0.5s, top 0.2s";
    alrt.style.fontSize = "2.5rem";
    alrt.style.opacity = "0";
    alrt.style.top = "28%";
    setTimeout(() => {
        alrt.remove();
    }, 500);
}

var touchIndicatorColors = ["purple", "red", "blue", "green"];
var touching = [];

function showTouchContainer() {
        document.getElementById("touchContainer").replaceChildren();
        for (i=0;i<lanes;i++) {
            var indicator = document.createElement("div");
            indicator.className = "touchIndicator";
            indicator.style.width = (100/lanes)+"%";
            indicator.style.left = (100/lanes*i)+"%";
            indicator.style.outline = "10px solid "+touchIndicatorColors[i%touchIndicatorColors.length];
            document.getElementById("touchContainer").appendChild(indicator);
        }
        document.getElementById("touchContainer").style.display = "block";
}

function updateTouchInputs(e) {
    if (document.getElementById("touchContainer").style.display == "none")
        showTouchContainer();
    var updatedTouches = [];
    for (var touch of e.touches) {
        var lane = parseInt((touch.pageX/4) / (window.innerWidth/4) * lanes)+1;
        if (lane > lanes) lane = lanes;
        if (lane < 1) lane = 1;
        updatedTouches.push(lane);
        if (!touching.includes(lane)) {
            keyPress(lane, "touch");
            touching.push(lane);
        }
    }
    for (var laneIndex in touching) {
        var touchingLane = touching[laneIndex];
        if (!updatedTouches.includes(touchingLane)) {
            keyUp(touchingLane, "touch");
            touching.splice(laneIndex,1);
        }
    }
    if (playing && !paused) e.preventDefault();
}
function release(e) {
    /*for (touch of e.changedTouches) {
        var xPerc = parseInt(touch.pageX / window.innerWidth * lanes)+1;
        keyUp(xPerc,  "touch");
    }*/
}
function preventZoom(e) {
    if (e.touches.length > 1) e.preventDefault();
}
document.addEventListener('touchstart', preventZoom, {passive:false});

document.addEventListener('contextmenu', event => event.preventDefault());

var arrowKeys = true;


function keyUp(e, c) {
    var lane;
    if (!c) {
        let chr = e.key.toLowerCase();
        if (keybinds[lanes]) {
            if (!(chr in keybinds[lanes])) return;
            lane = keybinds[lanes][chr];
        } else {
            if (!(chr in keybinds[4])) return;
            lane = keybinds[4][chr];
        }
    } else {
        if (c == "gamepad") {
            if (!(e in controllerBinds)) return;
            lane = controllerBinds[e];
        } else if (c == "touch") {
            lane = e;
        }
    }
    holding[lane] = false;
    if (overlay) overlays[lane].style["background-color"] = "white";
    document.getElementById("static" + lane).classList.remove("hit");
    //alert(document.getElementById("static"+lane).class)
}
var playing = false;

var audio = new Audio();

audio.volume = 0.1;
const accuracy = 175;
var previousTime = performance.now();
var prev = [];
var time = 0;
var startOffset = 0;
var audioDelay = 0;
//var audioDelay = 30; //Bluetooth delay

const spawnHeight = screen.height;

var lastCalledTime;
var delta;
var fps = 60;
var autoHolds = {};
const autoHoldTime = 5;
var autoplay = false;
var oneshot = false;
var healthEnabled = true;
var modchartEnabled = true;
function kill() {
    //JSHint moment
    if(!lastCalledTime) {
        lastCalledTime = performance.now();
        fps = 0;
        move();
        return;
    }
    delta = (performance.now() - lastCalledTime)/1000;
    lastCalledTime = performance.now();
    fps = 1/delta;
    move();
}
var load = 0;
var nextSpawnTime = 0;
function calculateNPSAtTime(chart, currentTime) {
    const startTime = currentTime - 1000; // 1 second before the current time
    let noteCount = 0; // Counter for notes in the 1-second window

    for (let time in chart) {
        let timeValue = parseInt(time);

        // Check if the time falls within the 1-second window
        if (timeValue >= startTime && timeValue <= currentTime) {
            noteCount += chart[time].length; // Add the number of notes at this time
        }
    }

    return noteCount; // NPS is simply the count of notes within this window
}
function move() {
try{
    //document.getElementById("fps").innerHTML = Math.floor(fps);
    if (!audio) playing = false;
    if (!playing) {
        requestAnimationFrame(() => {
            if(!lastCalledTime) {
                lastCalledTime = performance.now();
                fps = 0;
                move();
                return;
            }
            delta = (performance.now() - lastCalledTime)/1000;
            lastCalledTime = performance.now();
            fps = 1/delta;
            move();
        });
        return;
    }

    if (load > 0) {
        time = -load;
        load -= 1;
    } else if (audio.paused && !paused) {
        pause();
        requestAnimationFrame(() => {
            if(!lastCalledTime) {
                lastCalledTime = performance.now();
                fps = 0;
                move();
                return;
            }
            delta = (performance.now() - lastCalledTime)/1000;
            lastCalledTime = performance.now();
            fps = 1/delta;
            move();
        });
        return;
        //audio.play();
        //time = audio.currentTime*1000;
    } else {
        time = audio.currentTime*1000;
    }
    //speed = 1.25+Math.sin(audio.currentTime/speed);
    //audio.playbackRate = speed;
    
    if (level.bpm || forcedBPM > 0) {
        if (!level.bpm) level.bpm = forcedBPM;
        var beat = level.bpm/120*audio.currentTime;
        var beatStep = 1 - (beat - Math.floor(beat));
        
        const beatTime = 0.3;
        
        var limited = (Math.max(beatStep, 1-beatTime) - (1-beatTime)) * (1/0.2);
        
        document.getElementById("healthBG").style.width = "calc(50% + " + (5*limited) + "px)";
        document.getElementById("healthBG").style.height = "calc(25px + " + (5*limited) + "px)";
    }
   
    nextSpawnTime = audio.duration*1000;
    for (var tick in level.notes) {
        for (var noteInfo in level.notes[tick]) {
            var spawnTime = tick - 1/level.notes[tick][noteInfo].Speed*1000*speed;
            if (spawnTime < nextSpawnTime && !level.notes[tick][noteInfo].created) nextSpawnTime = spawnTime;
            if (spawnTime <= time-audioDelay) {
                if (!level.notes[tick][noteInfo].created) {
                    level.notes[tick][noteInfo].created = true;
                    if (time-audioDelay > tick) {
                        //Don't even try. Will just cause lag
                        miss();
                        break;
                    }
                    createNote(
                        level.notes[tick][noteInfo].Lane,
                        1/level.notes[tick][noteInfo].Speed,
                        level.notes[tick][noteInfo].ID,
                        level.notes[tick][noteInfo].holdDuration,
                        tick
                    );
                }
            }
        }
    }
    //document.getElementById("tick").innerHTML = "";
    //if (nextSpawnTime >= (audio.currentTime + 6)*1000 && notes.length == 0 && holds.length == 0) document.getElementById("tick").innerHTML = "Press Space to skip."; 
    /*for (var noteInfo in level.notes[time]) {
        noteInfo = level.notes[time][noteInfo];
        if (delta) createNote(noteInfo.Lane, noteInfo.Speed);
        else createNote(noteInfo.Lane, noteInfo.Speed)
    };*/
    //document.getElementById("tick").innerHTML = time;
    if (oneshot) {
        document.getElementById("combo").innerHTML = combo;
        document.getElementById("misses").innerHTML = "SCORE:<br>" + score;
        document.getElementById("score").innerHTML = "";
    } else {
        document.getElementById("combo").innerHTML = "COMBO:<br>" + combo;
        document.getElementById("misses").innerHTML = "MISSES:<br>" + misses;
        document.getElementById("score").innerHTML = score.toLocaleString();
    }
    for (var note in notes) {
        if (paused) break;
        notes[note].y += (spawnHeight - 65) / (notes[note].speed) / fps;
        var noteVal = notes[note];
        noteVal.element.style.left = document.getElementById("static" + noteVal.lane).style.left;
        noteVal.element.style.bottom = Math.floor(spawnHeight - noteVal.y)+"px";
        if (noteVal.holdElement) {
            noteVal.holdElement.style.left = noteVal.element.style.left;
            noteVal.holdElement.style.bottom = noteVal.element.style.bottom;
        }
        //alert(noteVal.element.style.top);
        if (noteVal.y >= screen.height+60) {
            if (miss(noteVal)) {
                requestAnimationFrame(kill);
                return;
            }
            destroyEvent(noteVal.element.id);
            missEvent(noteVal.element.id);
            noteVal.element.remove();
            notes.splice(note, 1);
        }
    }
    for (var hold in holds) {
        //if (paused) break;
        var holdVal = holds[hold];
        holds[hold].height -= (spawnHeight - 65) / (holds[hold].speed) / fps;
        //alert(holdVal.height);
        holdVal.element.style.height = holdVal.height+"px";
        if (holdVal.height < 0 || !holding[holdVal.lane]) {
            if (holdVal.height > 175) miss(holdVal);
            holdVal.element.remove();
            holds.splice(hold, 1);
        }
    }
    try {
        if (!guitarMode) {
            if (navigator.getGamepads()[0] !== null) {
                const gamepad = navigator.getGamepads()[0];
                for (let i = 0; i < 17; i++) {
                    if (
                        gamepad.buttons[i].pressed !== prev[i] &&
                        gamepad.buttons[i].pressed == true &&
                        controllerBinds[i]
                    ) {
                        keyPress(controllerBinds[i], "gamepad");
                    }
                    if (
                        gamepad.buttons[i].pressed !== prev[i] &&
                        gamepad.buttons[i].pressed == false &&
                        controllerBinds[i]
                    ) {
                        keyUp(controllerBinds[i], "gamepad");
                    }
                    prev[i] = gamepad.buttons[i].pressed;
                }
            }
        } else {
            if (navigator.getGamepads()[0] !== null) {
                const gamepad = navigator.getGamepads()[0];
                if (gamepad.buttons[guitarBinds["strumDown"]].pressed) {
                    if (!prev["strumDown"]) {
                        for (var i = 1; i <= 5; i++) {
                            if (gamepad.buttons[guitarBinds[i]].pressed) {
                                keyPress(i, "gamepad");
                            }
                        }
                    }
                } else if (prev["strumDown"]) {
                    for (var i = 1; i <= 5; i++) {
                        keyUp(i, "gamepad");
                    }
                }
                prev["strumDown"] = gamepad.buttons[guitarBinds["strumDown"]].pressed;



                if (gamepad.buttons[guitarBinds["strumUp"]].pressed) {
                    if (!prev["strumUp"]) {
                        for (var i = 1; i <= 5; i++) {
                            if (gamepad.buttons[guitarBinds[i]].pressed) {
                                keyPress(i, "gamepad");
                            }
                        }
                    }
                } else if (prev["strumUp"]) {
                    for (var i = 1; i <= 5; i++) {
                        keyUp(i, "gamepad");
                    }
                }
                prev["strumUp"] = gamepad.buttons[guitarBinds["strumUp"]].pressed;
            }
        }
    } catch(e) {}
    previousTime = performance.now();
    if (autoplay) {
        for (var i=1;i<=lanes;i++) {
            for (var autoNote of notes) {
                if (autoNote.lane == i) {
                    var lanePosition = document
                        .getElementById("static" + i)
                        .getBoundingClientRect(),
                    notePosition = autoNote.element.getBoundingClientRect(),
                    offset = lanePosition.top - notePosition.top;
                    if (offset < 0) {
                        if (holding[i]) keyUp(i,"touch");
                        keyPress(i,"touch");
                        autoHolds[i] = {time: autoHoldTime, hold: autoNote.holdElement};
                    }
                }
            }
        }
        for (var autoHold in autoHolds) {
            if (autoHolds[autoHold].time<=0 && (autoHolds[autoHold].hold == undefined || autoHolds[autoHold].hold.parentElement == null)) {
                keyUp(autoHold,"touch");
            }
            else {
                //alert(autoHolds[autoHold].hold.parentElement);
                autoHolds[autoHold].time--;
            }
            
        }
    }
    document.getElementById("health").style.width = "calc("+health+"% - "+healthbarPadding*2+"px)";
    document.getElementById("health").style.height = "calc(100% - "+healthbarPadding*2+"px)";
    requestAnimationFrame(() => {
        if(!lastCalledTime) {
            lastCalledTime = performance.now();
            fps = 0;
            move();
            return;
        }
        delta = (performance.now() - lastCalledTime)/1000;
        lastCalledTime = performance.now();
        fps = 1/delta;
        move();
    });
} catch(e) { alert(e.toString()); }
}

var healthDrain = 18;

function miss(note) {
    combo=0;
    misses++;
    health -= healthDrain;
    if (health <= 0) died = true;
    if (health < 0) health = 0;
    createAlert("MISS!", "#ff0000");
    scoreMulti = 1;
    if (note && note.holdElement) {
        note.holdElement.remove();
    } else if (note && note.height) {
        note.element.remove();
    }
    if ((oneshot || health <= 0) && healthEnabled) {
        quit();
        start(JSON.stringify(prevLvl));
        document.getElementById("health").style.width = "calc("+health+"% - "+healthbarPadding*2+"px)";
        document.getElementById("health").style.height = "calc(100% - "+healthbarPadding*2+"px)";
        return true;
    }
    return false;
}
const keybinds = {
    [4]: {
        z:1,
        q:1,
        a:1,
        f:1,
        s:2,
        x:2,
        g:2,
        ",":3,
        k:3,
        b:3,
        ".":4,
        l:4,
        o:4,
        n:4,
        arrowleft:1,
        arrowdown:2,
        arrowup: 3,
        arrowright: 4
    }, [5]: {
        a: 1,
        s: 2,
        j: 3,
        " ": 3,
        k: 4,
        l: 5
    }, [1]: {
        a: 1,
        s: 1,
        k: 1,
        l: 1
    }, [2]: {
        a: 1,
        s: 1,
        k: 2,
        l: 2
    }, [8]: {
        a: 1,
        s: 2,
        w: 3,
        d: 4,
        arrowleft: 5,
        arrowdown: 6,
        arrowup: 7,
        arrowright: 8,
        q: 1,
        //w: 2,
        //a: 3,
        //s: 4,
        k: 5,
        l: 6,
        ".": 7,
        "/": 8
    }
};
//const controllerBinds = { 14: 1, 2: 1, 13: 2, 0: 2, 12: 3, 3: 3, 15: 4, 1: 4 };
const controllerBinds = {0: 1};
const guitarBinds = {1: 0, 2: 1, 3: 3, 4: 2, 5: 4, "strumUp": 12, "strumDown": 13};

var guitarMode = false;

var speed = 1;
var startTime = 0;
var forcedBPM = 0;
function menuKeyDown(e) {
    if (document.getElementById("picker").style.display != "block") return;
    if (e.key == "s") {
        var setSpeed = prompt("Choose speed (float)");
        setSpeed = parseFloat(setSpeed);
        if (!isNaN(setSpeed) && setSpeed <= 4) {
            speed = setSpeed;
        }
    } else if (e.key == "j") {
        var setStart = prompt("Choose start time (seconds)");
        setStart = parseFloat(setStart);
        if (!isNaN(setStart)) {
            startTime = setStart;
        }
    } else if (e.key == "b") {
        var setBPM = prompt("Force BPM");
        setBPM = parseFloat(setBPM);
        if (!isNaN(setBPM)) {
            forcedBPM = setBPM;
        }
    }
}

document.body.onkeydown = menuKeyDown;
modifiers = [
    {
        text: () => {return "Autoplay";},
        get: () => {return autoplay;},
        def: false
    },
    {
        text: () => {return "No-fail (died)";},
        get: () => {return died;},
        def: false
    },
    {
        text: () => {return "Holds disabled";},
        get: () => {return holdsEnabled;},
        def: true
    },
    {
        text: () => {return "Niko Oneshot";},
        get: () => {return oneshot;},
        def: false
    },
    {
        text: () => {return `Speed ${speed}x`;},
        get: () => {return speed;},
        def: 1
    },
    {
        text: () => {return "Ghost tapping disabled";},
        get: () => {return ghostTapping;},
        def: true
    },
    {
        text: () => {return "Spam Prevention";},
        get: () => {return spamPrevention;},
        def: false
    },
    {
        text: () => {return `Started ${Math.floor(startTime/60)}:${(startTime%60)<10?"0"+(startTime%60):(startTime%60)} in`;},
        get: () => {return startTime;},
        def: 0
    }
];

/*const graph = new Chart("endGraph", {
    type: "line",
    data: {
      labels: [0, 1],
      datasets: []
    },
    options: {
      legend: {display: false},
      scales: {
        yAxes: [],
      },
      animation: false
    }
});*/

function quit(finished=false) {
    hideMenus();
    if (finished == true) {
        errCapture(() => {
        var totalNotes = 0;
        for (var time in prevLvl.notes) {
            totalNotes += prevLvl.notes[time].length;
        } 
        document.getElementById("endTitle").innerHTML = misses==0?"Full Combo!":"Level Complete!"; 
        var username = "Player";
        try {
            if (localStorage.getItem("username")) username = localStorage.getItem("username")
        } catch(e){}
        document.getElementById("endHeader").innerHTML = `${username} passed ${prevLvl.name}!`;
        document.getElementById("endInfo").innerHTML = `Notes: ${hits}/${totalNotes}<br>Misses: ${misses}<br>Score: ${score}<br>Final Combo: ${combo}`;
        document.getElementById("endMods").style.display = "none";
        document.getElementById("endModsContainer").replaceChildren();
        for (var modifier of modifiers) {
            if (modifier.get() != modifier.def) {
                document.getElementById("endMods").style.display = "block";
                var modText = document.createElement("li");
                modText.innerHTML = modifier.text();
                document.getElementById("endModsContainer").appendChild(modText);
            }
        }
        document.getElementById("end").style.display = "block";
        /*var lastRead = 50;
        for (let pos=0; pos<audio.duration*1000; pos++) {
            if (!acc[pos]) {
                acc[pos] = lastRead;
            } else lastRead = acc[pos];
        }
        var final = [];
        for (var thing in acc) {
            final.push(acc[thing]);
        }
        var data = {
            labels: Array.from({length: 25}, (_, index) => index + 1),
            datasets: [{
                fill: true,
                lineTension: 0,
                backgroundColor: "rgba(0,0,255,1)",
                borderColor: "rgba(0,0,0,0)",
                data: final
            }]
        };
        graph.data = data;
        graph.update();*/
        });
    } else {
        document.getElementById("picker").style.display = "block";
    }
    playing = false;
    paused = false;
    audio.pause();
    audio.currentTime = 0;
    audio.src = "";
    combo = 0;
    acc = {};
    hits = 0;
    died = false;
    misses = 0;
    health = 100;
    score = 0;
    scoreMulti = 1;
    document.getElementById("combo").innerHTML = "COMBO:<br>0";
    document.getElementById("misses").innerHTML = "MISSES:<br>0";
    document.getElementById("score").innerHTML = "0";
    level = undefined;
    notes = [];
    document.getElementById("notes").replaceChildren();
    for (var i=1;i<=lanes;i++) {
        keyUp(i,"touch");
    }
    document.getElementById("menu").style.visibility = "visible";
    document.getElementById("menu").style.opacity = 1;
    document.body.onkeydown = menuKeyDown;
    document.body.onkeyup = undefined;
    document.removeEventListener('touchstart', updateTouchInputs, {passive:false});
    document.removeEventListener('touchend', updateTouchInputs, false);
    document.removeEventListener('touchmove', updateTouchInputs, {passive:false});
    document.addEventListener('touchstart', preventZoom, {passive:false});
}

var prevLvl;
      
async function start(lvl, bypass) {
    level = JSON.parse(lvl);
    autoHolds = {};
    if (level.lanes) {
        lanes = level.lanes;
        reloadDots();
    } else {
        lanes = 4;
        reloadDots();
    }
    prevLvl = JSON.parse(JSON.stringify(level));
    document.getElementById("menu").style.visibility = "hidden";
    document.getElementById("menu").style.opacity = 0;
    audio = new Audio(level.song);
    audio.playbackRate = speed;
    audio.currentTime = startOffset/1000 + startTime;
    audio.addEventListener("ended", () => {quit(true);});
    audio.play();
    //load = 2000;
    playing = true;

    document.body.onkeydown = keyPress;
    document.body.onkeyup = keyUp;
    for (var speedTick in level.notes) {
        if (speedTick/1000 < startTime + 1) {
            level.notes[speedTick] = [];
            continue;
        }
        for (var noteInfo in level.notes[speedTick]) {
            level.notes[speedTick][noteInfo].Speed *= scrollSpeed * speed;
            level.notes[speedTick][noteInfo].created = false;
        }
    }
    //parseModChart(level, startOffset);
    document.removeEventListener('touchstart', preventZoom, {passive:false});
    document.addEventListener('touchstart', updateTouchInputs, {passive:false});
    document.addEventListener('touchend', updateTouchInputs, false);
    document.addEventListener('touchmove', updateTouchInputs, {passive:false});
}

document.getElementById("optionsBT").addEventListener("click", () => {
    if (document.getElementById("picker").style.display != "none" || document.getElementById("pause").style.display != "none") {
        hideMenus();
        document.getElementById("options").style.display="block";
    } else {
        hideMenus();
        if (!paused) document.getElementById("picker").style.display="block";
        else document.getElementById("pause").style.display="block";
        document.getElementById("options").style.display="none";
    }
});

document.getElementById("endBt").addEventListener("click", () => {
    hideMenus();
    document.getElementById("picker").style.display = "block";
});

var scrollSpeed = 1;
document.getElementById("speedSlide").value = scrollSpeed;
document.getElementById("speedNum").value = scrollSpeed;
document.getElementById("sizeSlide").value = size;
document.getElementById("sizeNum").value = size;
document.getElementById("distSlide").value = distance;
document.getElementById("distNum").value = distance;
document.getElementById("drainSlide").value = healthDrain;
document.getElementById("drainNum").value = healthDrain;
document.getElementById("delaySlide").value = audioDelay;
document.getElementById("delayNum").value = audioDelay;
document.getElementById("modchartSetting").value = modchartEnabled;
function optionsThings() {
    if (playing) {
        requestAnimationFrame(optionsThings);
        return;
    }
    if (document.getElementById("speedSlide").value != scrollSpeed && !(document.getElementById("speedSlide").value == 3 && scrollSpeed > 3) && !(document.getElementById("speedSlide").value == 0.1 && scrollSpeed < 0.1)) {
        scrollSpeed = document.getElementById("speedSlide").value;
        document.getElementById("speedNum").value = scrollSpeed;
    }
    if (document.getElementById("speedNum").value != scrollSpeed) {
        scrollSpeed = document.getElementById("speedNum").value;
        if (scrollSpeed == "") scrollSpeed = 1;
        document.getElementById("speedSlide").value = scrollSpeed;
    }
    
    if (document.getElementById("sizeSlide").value != size && !(document.getElementById("sizeSlide").value == 120 && size > 120) && !(document.getElementById("sizeSlide").value == 20 && size < 20)) {
        size = document.getElementById("sizeSlide").value;
        document.getElementById("sizeNum").value = size;
        reloadDots();
    }
    if (document.getElementById("sizeNum").value != size) {
        size = document.getElementById("sizeNum").value;
        if (size == "") size = 1;
        document.getElementById("sizeSlide").value = size;
        reloadDots();
    }
    
    if (document.getElementById("distSlide").value != distance && !(document.getElementById("distSlide").value == 32 && distance > 32) && !(document.getElementById("distSlide").value == 2 && distance < 2)) {
        distance = document.getElementById("distSlide").value;
        document.getElementById("distNum").value = distance;
        reloadDots();
    }
    if (document.getElementById("distNum").value != distance) {
        distance = document.getElementById("distNum").value;
        if (distance == "") distance = 1;
        document.getElementById("distSlide").value = distance;
        reloadDots();
    }
    
    if (document.getElementById("drainSlide").value != healthDrain && !(document.getElementById("drainSlide").value == 100 && healthDrain > 100) && !(document.getElementById("drainSlide").value == 0 && healthDrain < 0)) {
        healthDrain = document.getElementById("drainSlide").value;
        document.getElementById("drainNum").value = healthDrain;
    }
    if (document.getElementById("drainNum").value != healthDrain) {
        healthDrain = document.getElementById("drainNum").value;
        if (healthDrain == "") healthDrain = 1;
        document.getElementById("drainSlide").value = healthDrain;
    }

    if (document.getElementById("delaySlide").value != audioDelay && !(document.getElementById("delaySlide").value == 1000 && audioDelay > 1000) && !(document.getElementById("delaySlide").value == -1000 && audioDelay < -1000)) {
        audioDelay = document.getElementById("delaySlide").value;
        document.getElementById("delayNum").value = audioDelay;
    }
    if (document.getElementById("delayNum").value != audioDelay) {
        audioDelay = document.getElementById("delayNum").value;
        if (audioDelay == "") audioDelay = 1;
        document.getElementById("delaySlide").value = audioDelay;
    }
    requestAnimationFrame(optionsThings);
}
optionsThings();
document.getElementById("autoplay").checked = autoplay;
document.getElementById("autoplay").addEventListener("change", (e) => {autoplay = e.target.checked;});
document.getElementById("oneshot").checked = oneshot;
document.getElementById("oneshot").addEventListener("change", (e) => {oneshot = e.target.checked;});
document.getElementById("healthSetting").checked = healthEnabled;
document.getElementById("healthSetting").addEventListener("change", (e) => {
    healthEnabled = e.target.checked;
    document.getElementById("healthBG").style.opacity = healthEnabled?1:0;
});
document.getElementById("ghostTapping").checked = ghostTapping;
document.getElementById("ghostTapping").addEventListener("change", (e) => {ghostTapping = e.target.checked;});
document.getElementById("spamPrevention").checked = spamPrevention;
document.getElementById("spamPrevention").addEventListener("change", (e) => {spamPrevention = e.target.checked;});
document.getElementById("holdsSetting").checked = holdsEnabled;
document.getElementById("holdsSetting").addEventListener("change", (e) => {holdsEnabled = e.target.checked;});
document.getElementById("modchartSetting").checked = modchartEnabled;
document.getElementById("modchartSetting").addEventListener("change", (e) => {modchartEnabled = e.target.checked;});
document.getElementById("overlaySetting").checked = overlay;
document.getElementById("overlaySetting").addEventListener("change", (e) => {
    overlay = e.target.checked;
    reloadDots();
    if (overlay) updatekps();
});
const themeStyle = document.getElementById("style");
const defThemes = {
    "Default": () => {
        themeStyle.innerHTML = "";
    },
    "Phoenix": () => {
// we got javascript harmony patches before GTA 6
createAlert = (text, color) => {
    if (text == "Perfect!") {
        text = "o(≧▽≦)o";
        color = "rgb(97, 176, 255)";
    } else if (text == "Good!") {
        text = "˜˜ヾ(^▽^)";
    } else if (text == "Nice!" || text == "Okay!") {
        text = "(>ᴗ<)";
    } else if (text == "MISS!") {
        text = "｡ﾟ･ (>﹏<) ･ﾟ｡";
    }
    var alrt = document.getElementById("alert");
    // Set the text and color
    alrt.textContent = text;
    alrt.style.color = color;

    // Remove the transition to make immediate changes
    alrt.style.transition = "none";
    alrt.style.fontSize = "2.75rem"; // Snap back to 1.2rem
    alrt.style.opacity = "1";

    // Force reflow to ensure the browser processes the style change
    alrt.offsetHeight; // This forces a reflow

    // Reapply the transition and shrink to 0rem
    alrt.style.transition = "font-size 0.2s, opacity 2s";
    alrt.style.fontSize = "2.5rem";
    alrt.style.opacity = "0";
};
document.getElementsByClassName("track")[0].style["background-color"] = "black";
document.getElementsByClassName("background")[0].style["background-color"] = "black";
document.body.style.backgroundColor = "black";

document.getElementById("distSlide").value = 6;
document.getElementById("distNum").value = 6;
distance = 6;

var split = true;

reloadDots = function() {
    overlays = {};
    var padding = 10;
    var spacing = 5;
    var gameArea = document.getElementById("dots");
    var overlayArea = document.getElementById("overlay");

    gameArea.replaceChildren();
    overlayArea.replaceChildren();

    for (let lane = 0; lane < lanes; lane++) {
        
        var positionPercentage = getXPos(lane);
        if (lanes == 8) {
            positionPercentage = getXPos(lane<4?lane-1:lane+1);
        }
        // Create the note
        var dot = document.createElement("div");
        dot.className = "circ";
        dot.style = `left: ${positionPercentage}%; bottom: 35px;width: ${size}px;height: ${size}px`;
        dot.id = "static" + (lane + 1);
        if ((lane != 0) && (lane != lanes-1)) {
            if (!(lanes == 8 && (lane == 3 || lane == 4))) dot.style["background-color"] = "rgb(0,209,255)";
        }
        gameArea.appendChild(dot);

        if (overlay) {
            var overlayKey = document.createElement("div");
            overlayKey.className = "overlayKey";
            overlayKey.style = "position: absolute; left: "+((size+spacing)*lane+padding/2)+"px; top: "+padding/2+"px; width: "+overlaySize+"px; height: "+overlaySize+"px;background-color: white;";
            overlays[lane+1] = overlayKey;
            var keyText = document.createElement("p");
            keyText.className = "keyText";
            overlayKey.appendChild(keyText);
            document.getElementById("overlay").appendChild(overlayKey);
        }
    }
    if (overlay) {
        document.getElementById("overlay").style.display = "block";
        document.getElementById("overlay").style.width = (overlaySize+spacing)*lanes+padding/2+"px";
        document.getElementById("overlay").style.height = (overlaySize+padding)*2+"px";
        var kps = document.createElement("h1");
        kps.className = "kps";
        kps.style.top = overlaySize+"px";
        kps.style.height = overlaySize+padding+"px";
        kps.id = "kps";
        kps.innerHTML = "KPS - 0";
        document.getElementById("overlay").appendChild(kps);
        var nps = document.createElement("h2");
        nps.className = "kps";
        nps.style.top = (overlaySize+29)+"px";
        nps.style.height = overlaySize+padding+"px";
        nps.style.color = "gray";
        nps.id = "nps";
        nps.innerHTML = "NPS - 0";
        document.getElementById("overlay").appendChild(nps);
    } else document.getElementById("overlay").style.display = "none";
    /*if (lanes/2 != Math.floor(lanes/2) && lanes != 1 && split) {
        document.getElementById("splitter").style.display = "block";
        document.getElementById("splitter").style.left = getXPos(lanes/2-1)+"%";
    } else document.getElementById("splitter").style.display = "none";*/
};

reloadDots();

createNote = function(lane, noteSpeed, id, holdDuration, hitTime) {
    if (lane < 1 || lane > lanes) return;
    const circle = document.createElement("span");
    circle.id = id;
    circle.className = "circ";
    circle.style = document.getElementById("static" + lane);
    circle.style.bottom = "0px";
    circle.style.width = size+"px";
    circle.style.height = size+"px";
    if (lane != 1 && lane != lanes) if (!(lanes == 8 && (lane == 4 || lane == 5))) circle.style.backgroundColor = "rgb(0,209,255)";
    document.getElementById("notes").appendChild(circle);
    var noteData = { lane: lanes==1?1:lane, element: circle, y: 0, speed: noteSpeed, hitTime: hitTime };
    if (holdDuration && holdsEnabled) {
        const hold = document.createElement("div");
        hold.id = id;
        hold.className = "hold";
        hold.style = document.getElementById("static" + lane);
        hold.style.bottom = "0px";
        hold.style.height = (spawnHeight - 65) / speed / noteSpeed * holdDuration / 1000 +"px";
        hold.style.width = (size-10)+"px";
        if (lane != 1 && lane != lanes) if (!(lanes == 8 && (lane == 4 || lane == 5))) hold.style.backgroundColor = "rgb(0,209,255)";
        document.getElementById("notes").appendChild(hold);
        noteData.holdElement = hold;
        noteData.holdDuration = holdDuration;
    }
    notes.push(noteData);
};

keyPress = function(e, c) {
    if (!c && document.getElementById("touchContainer").style.display != "none") document.getElementById("touchContainer").style.display = "none";
    if (!c && e.keyCode == 27) pause();
    if (!c && e.key == "p") pause();
    if (!c && e.key == " " && nextSpawnTime >= (audio.currentTime + 6)*1000 && notes.length == 0 && holds.length == 0) audio.currentTime = nextSpawnTime==audio.duration?nextSpawnTime/1000-1:nextSpawnTime;
    //if (!c && e.key == "c") alert(time);
    if (paused) return;
    var lane;
    if (!c) {
        let chr = e.key.toLowerCase();
        if (keybinds[lanes]) {
            if (!(chr in keybinds[lanes])) return;
            lane = keybinds[lanes][chr];
        } else {
            if (!(chr in keybinds[4])) return;
            lane = keybinds[4][chr];
        }
    } else {
        if (c == "gamepad") {
            lane = e;
        } else if (c == "touch") {
            lane = e;
        }
    }
    if (lanes >= 4) {
        if (holding[lane]) {return;} else {holding[lane] = true;}}
    else holding[lane] = true;
    kps.push(Date.now()+1000);
    if (overlay) {
        overlays[lane].style["background-color"] = "gray";
        if (e.key) overlays[lane].getElementsByClassName("keyText")[0].innerHTML = e.key.toUpperCase();
    }
    document.getElementById("static" + lane).classList.add("hit");
    if (lane != 1 && lane != lanes) if (!(lanes == 8 && (lane == 4 || lane == 5))) document.getElementById("static" + lane).style["background-color"] = "rgb(0, 104, 128)";
    var closest = { y: 0 };
    var closeindex = 0;
    var latestindex = 0;
    for (var note in notes) {
        latestindex = note;
        note = notes[note];
        if (note.lane == lane) {
            if (note.y > closest.y) {
                closeindex = latestindex;
                closest = note;
            }
        }
    }
    if (closest.element !== undefined) {
        var lanePosition = document
                .getElementById("static" + lane)
                .getBoundingClientRect(),
            notePosition = closest.element.getBoundingClientRect(),
            offset = Math.abs(notePosition.top - lanePosition.top);
        if (offset <= accuracy) {
            if (spamPrevention && ghostMS[lane] && ghostMS[lane] != 0 && performance.now()-ghostMS[lane] < 500) return;
            score += Math.floor(115/(offset+1)*20*scoreMulti);
            if (scoreMulti < 1.5) scoreMulti += 0.1;
            notes.splice(closeindex, 1);
            destroyEvent(closest.element.id);
            hitEvent(closest.element.id);
            if (closest.holdElement) {
                closest.holdElement.style.height = parseFloat(closest.holdElement.style.height)+offset+"px";
                closest.holdElement.style.bottom = document.getElementById("static" + lane).style.bottom;
                holds.push({element: closest.holdElement, height: parseFloat(closest.holdElement.style.height+offset), speed: closest.speed, lane: closest.lane});
            }
            closest.element.remove();
            combo++;
            hits++;
            if (health+2.5 <= 100) health+=2.5;
            else health = 100;
            //document.getElementById("fps").innerHTML = Math.abs(accuracy-offset);
            if (Math.abs(offset-accuracy) >= 40 || autoplay) {
                //it's all a lie, literally everything in life. Nothing is real. Autoplay doesn't only get perfects.
                createAlert("Perfect!", "#0044ff");
            } else if (Math.abs(offset-accuracy) >= 23) {
                createAlert("Good!", "#00ff00");
            } else if (Math.abs(offset-accuracy) >= 12) {
                createAlert("Nice!", "#ffff00");
            } else {
                createAlert("Okay!", "#ffa56b");
            }
            acc[Math.floor(audio.currentTime*1000)] = Math.abs(offset-accuracy);
        } else if (!ghostTapping) {
            miss();
        } else if (spamPrevention) {
            ghostMS = performance.now();
        }
    } else if (!ghostTapping) {
        miss();
    } else if (spamPrevention) {
        ghostMS = performance.now();
    }
};

keyUp = function(e, c) {
    var lane;
    if (!c) {
        let chr = e.key.toLowerCase();
        if (keybinds[lanes]) {
            if (!(chr in keybinds[lanes])) return;
            lane = keybinds[lanes][chr];
        } else {
            if (!(chr in keybinds[4])) return;
            lane = keybinds[4][chr];
        }
    } else {
        if (c == "gamepad") {
            if (!(e in controllerBinds)) return;
            lane = controllerBinds[e];
        } else if (c == "touch") {
            lane = e;
        }
    }
    holding[lane] = false;
    if (overlay) overlays[lane].style["background-color"] = "white";
    document.getElementById("static" + lane).classList.remove("hit");
    if (lane != 1 && lane != lanes) if (!(lanes == 8 && (lane == 4 || lane == 5))) document.getElementById("static" + lane).style["background-color"] = "rgb(0,209,255)";
    //alert(document.getElementById("static"+lane).class)
};
    },
    "Faces": () => {
createAlert = (text, color) => {
    if (text == "Perfect!") {
        text = "o(≧▽≦)o";
        color = "rgb(97, 176, 255)";
    } else if (text == "Good!") {
        text = "˜˜ヾ(^▽^)";
    } else if (text == "Nice!" || text == "Okay!") {
        text = "(>ᴗ<)";
    } else if (text == "MISS!") {
        text = "｡ﾟ･ (>﹏<) ･ﾟ｡";
    }
    var alrt = document.getElementById("alert");
    // Set the text and color
    alrt.textContent = text;
    alrt.style.color = color;

    // Remove the transition to make immediate changes
    alrt.style.transition = "none";
    alrt.style.fontSize = "2.75rem"; // Snap back to 1.2rem
    alrt.style.opacity = "1";

    // Force reflow to ensure the browser processes the style change
    alrt.offsetHeight; // This forces a reflow

    // Reapply the transition and shrink to 0rem
    alrt.style.transition = "font-size 0.2s, opacity 2s";
    alrt.style.fontSize = "2.5rem";
    alrt.style.opacity = "0";
};
    },
    "Soft": () => {
        themeStyle.innerHTML = `
.background {
    background: linear-gradient(160deg, rgba(86,139,255,1) 0%, rgba(150,113,255,1) 19%, rgba(255,99,253,1) 49%);
    background-repeat: no-repeat;
    background-attachment: fixed;
}

.track {
    display: none;
}

.healthBG {
    display: none;
}

.combo {
    display: none;
}

.misses {
    display: none;
}

.circ {
    outline: 0px white solid;
    outline-offset: -5px;
    background-color: rgba(255,255,255,0.5);
}`
    },
    "Minimal": () => {
        themeStyle.innerHTML = `
.combo {
    position: absolute;
    background-color: rgba(0,0,0,0) ;
    width: 15%;
    height: 15%;
    left: 50%;
    top: 5%;
    transform: translate(-50%);
}
.misses {
    position: absolute;
    background-color: rgba(0,0,0,0) ;
    width: 15%;
    height: 15%;
    right: 5%;
    top: 5%;
}
.misses h1 {
    color: rgba(0,0,0,0);
}
.combotxt {
    text-align: center;
    font-family: Comfortaa;
    color: white;
    position: absolute;
    left: 50%;
    transform: translate(-50%);
    top: -1400px;
    font-size: 3.5rem;
    line-height: 1000px
}`
    }
}
document.getElementById("theme").addEventListener("change", (e) => {
    if (defThemes[e.target.value])
        defThemes[e.target.value]();
});
document.getElementById("guitarSetting").checked = guitarMode;
document.getElementById("guitarSetting").addEventListener("change", (e) => { guitarMode = e.target.checked; })

var usrName = "";

try {
    if (localStorage.getItem("username")) document.getElementById("usrInp").value = localStorage.getItem("username");
}catch(e){}

var unloaded = false;

document.getElementById("usrConf").onclick = function() {
    usrName = document.getElementById("usrInp").value;
    localStorage.setItem("username", usrName);
};

document.getElementById("downloaderBT").addEventListener("click", () => {
    hideMenus();
    document.getElementById("downloader").style.display = "block";
});

function PL() {
    playing = !playing;
    previousTime = performance.now();
    if (playing) {
        audio.play();
    } else {
        audio.pause();
    }
}

move();
function parse(chartData) {
    const OsuToJson = function(line) {
        pair = {};
        if (line.split(" : ").length != 1) pair = {key: line.split(" : ")[0], value: line.slice(line.indexOf(":") + 1).trim()};
        else if (line.split(": ").length != 1) pair = {key: line.split(": ")[0], value: line.slice(line.indexOf(": ") + 1).trim()};
        else pair = {key: line.split(":")[0], value: line.slice(line.indexOf(":") + 1).trim()};
        if (!isNaN(pair.value)) pair.value = parseFloat(pair.value);
        return pair;
    };
    var result = {};
    
    var reading = "";
    for (var line of chartData.split("\n")) {
        line=line.replaceAll("\r", "");
        if (line.startsWith("//")) continue;
        if (line.startsWith("[")) {
            reading = line.substring(1, line.length-1);
            if (["Events", "TimingPoints", "HitObjects"].includes(reading)) result[reading] = [];
            else result[reading] = {};
            continue;
        }
        if (line.replaceAll(" ", "") == "") continue;
        var jsonified;
        switch (reading) {
            case "General":
                jsonified = OsuToJson(line);
                result[reading][jsonified.key] = jsonified.value;
                break;
            case "Colours":
                jsonified = OsuToJson(line);
                result[reading][jsonified.key] = jsonified.value;
                break;
            case "Editor":
                jsonified = OsuToJson(line);
                result[reading][jsonified.key] = jsonified.value;
                break;
            case "Metadata":
                jsonified = OsuToJson(line);
                result[reading][jsonified.key] = jsonified.value;
                break;
            case "Difficulty":
                jsonified = OsuToJson(line);
                result[reading][jsonified.key] = jsonified.value;
                break;
            case "HitObjects":
                const noteData = line.split(",");
                var noteType = "Circle";
                var hitSound = "hitNormal";
                switch (parseInt(noteData[3])) {
                    case 1:
                        //noteType = "Slider";
                        break;
                    case 2:
                        noteType = "NewCombo";
                        break;
                    case 3:
                        noteType = "Spinner";
                        break;
                    case 4:
                        noteType = "skip1";
                        break;
                    case 5:
                        noteType = "skip2";
                        break;
                    case 6:
                        noteType = "skip3";
                        break;
                    case 7:
                    case 128: //I don't even know
                        noteType = "Mania";
                        break;
                }
                switch (noteData[4]) {
                    case 1:
                        hitSound = "hitWhistle";
                        break;
                    case 2:
                        hitSound = "hitFinish";
                        break;
                    case 3:
                        hitSound = "hitClap";
                        break;
                }
                if (noteType == "Slider") {
                    var curveType = "Linear";
                    switch (noteData[5]) {
                        case "B":
                            curveType = "Bezier";
                            break;
                        case "C":
                            curveType = "Catmull";
                            break;
                        case "P":
                            curveType = "Circle";
                            break;
                    }
                    console.log(noteData);
                } else if (noteType == "Mania") result[reading].push({
                    x: parseInt(noteData[0]),
                    y: parseInt(noteData[1]),
                    time: parseInt(noteData[2]),
                    type: noteType,
                    hitSound: hitSound,
                    speed: 1,
                    holdTime: parseInt(noteData[5].split(":")[0])-parseInt(noteData[2])
                });
                else result[reading].push({
                    x: parseInt(noteData[0]),
                    y: parseInt(noteData[1]),
                    time: parseInt(noteData[2]),
                    type: noteType,
                    hitSound: hitSound,
                    speed: 1
                });
                break;
            case "Events":
                var EventSplit = line.split(",");
                for (var EventValue in EventSplit) {
                    if (!isNaN(EventSplit[EventValue])) EventSplit[EventValue] = parseFloat(EventSplit[EventValue]);
                    else if (EventSplit[EventValue].startsWith("\"") && EventSplit[EventValue].endsWith("\"")) EventSplit[EventValue] = EventSplit[EventValue].substring(1, EventSplit[EventValue].length-1);
                }
                result[reading].push(EventSplit);
                break;
            case "TimingPoints":
                var TimingSplit = line.split(",");
                for (var TimingValue in TimingSplit) {
                    if (!isNaN(TimingSplit[TimingValue])) TimingSplit[TimingValue] = parseFloat(TimingSplit[TimingValue]);
                }
                result[reading].push(TimingSplit);
                break;
        }
    }
    return result;
}

class ManiaDifficultyCalculator {
    constructor(overallDifficulty, notes) {
        this.overallDifficulty = overallDifficulty;
        this.notes = notes;
        this.difficultyMultiplier = 0.012; // Lowered multiplier to bring results closer to expected values
    }

    calculate() {
        const timestamps = Object.keys(this.notes);
        if (timestamps.length === 0) {
            return {
                starRating: 0,
                greatHitWindow: this.getHitWindow300(),
                maxCombo: 0
            };
        }

        const greatHitWindow = this.getHitWindow300();
        const maxCombo = this.calculateMaxCombo();
        const strainSkill = this.calculateStrainSkill();

        // Calculate star rating with the adjusted multiplier
        const starRating = strainSkill * this.difficultyMultiplier;

        return {
            starRating: starRating,
            greatHitWindow: greatHitWindow,
            maxCombo: maxCombo
        };
    }

    getHitWindow300() {
        // Calculate the base hit window for a "Great" hit based on overall difficulty
        let odAdjusted = Math.min(10.0, Math.max(0, 10.0 - this.overallDifficulty));
        return Math.round(34 + 3 * odAdjusted);
    }

    calculateMaxCombo() {
        // Sum all notes across each timestamp to get the maximum possible combo
        let comboCount = 0;
        for (const timestamp in this.notes) {
            comboCount += this.notes[timestamp].length;
        }
        return comboCount;
    }

    calculateStrainSkill() {
        let strain = 0;
        const timestamps = Object.keys(this.notes).map(Number).sort((a, b) => a - b);

        for (let i = 1; i < timestamps.length; i++) {
            const timeGap = timestamps[i] - timestamps[i - 1];
            const notesAtTime = this.notes[timestamps[i]].length;
            const notesAtPreviousTime = this.notes[timestamps[i - 1]].length;

            // Scale down the density and simultaneous factors
            const densityFactor = 1 / Math.max(1, timeGap / 300); // Reduced density effect by using 300ms
            const simultaneousFactor = Math.sqrt(notesAtTime * notesAtPreviousTime); // Use sqrt to soften simultaneous hits impact

            // Calculate strain for this gap with a smaller weight
            strain += (notesAtTime + notesAtPreviousTime) * densityFactor * simultaneousFactor * this.overallDifficulty * 0.03;
        }
        return strain;
    }
}

function loadOsu(url, mapInfo) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
        if (this.status == 200) {
            var uInt8Array = new Uint8Array(this.response);
            var i = uInt8Array.length;
            var binaryString = new Array(i);
            while (i--)
            {
              binaryString[i] = String.fromCharCode(uInt8Array[i]);
            }
            var data = binaryString.join('');

            var base64 = window.btoa(data);
            loadPack(base64, true, mapInfo, url);
        }
    };

    xhr.send();
}

try {
    if (localStorage.getItem("favourites") && instantRequests) {
        for (var favourite of localStorage.getItem("favourites").split(",")) {
            loadOsu(favourite);
        }
    }
}catch(e){}

var audio = new Audio();
document.onkeydown = async function(e) {
    try {
        if (e.key == "o") {
            if (playing) return;
            if (document.getElementById("picker").style.display != "block") return;
            const [packHandle] = await window.showOpenFilePicker({types: [{description: "Osu! Chart Package", accept: {"osu/*": [".osz"]}}]});
            const pack = await packHandle.getFile();
            console.log(pack);
            loadPack(pack);
        }
    } catch (e) {
        document.getElementById('songInput').click();
    }
};

document.getElementById('songInput').addEventListener('change', async function(e) {
    try {
        const fileInput = e.target;
        const file = fileInput.files[0]; // Get the selected file

        if (file) {
            console.log(file); // Log or process the file
            loadPack(file);   // Assuming you want to load the pack after selection
        }

        // Clear the file input after selection
        fileInput.value = '';
    } catch (e) {
        alert("ERROR IN OSU PORTING - " + e.toString());
    }
});

function loadPack(pack, base64=false, mapInfo=undefined, url=undefined) {
    new JSZip().loadAsync(pack, {"base64": base64}).then(async function(zip) {
        var osuCharts = [];
        for (var chart of Object.keys(zip.files)) { if (chart.endsWith(".osu")) osuCharts.push(chart); }
        var msg = "Please type the index of the chart you want to play:\n\n";
        for (var chartName of osuCharts) {
            if (mapInfo && mapInfo[chartName]) {
                mapInfo = mapInfo[chartName];
            }
            maniaConversion(parse(await zip.file(chartName).async("text")), chartName, zip, mapInfo, url);
        }
    });
}

function addChart(level, url) {
    var index = document.getElementById("picker").childElementCount;
    var levelSpan = document.createElement("span");
    levelSpan.className = "level";
    levelSpan.style = "top: " + index * 105 + "px;";
    document.getElementById("picker").appendChild(levelSpan);
    var cover = document.createElement("img");
    cover.src = level.cover;
    levelSpan.appendChild(cover);
    var title = document.createElement("h1");
    title.innerHTML = level.name;
    levelSpan.appendChild(title);
    var artist = document.createElement("p");
    //artist.innerHTML = "Song by: "+level.artist;
    artist.innerHTML = level.artist;
    artist.className = "artist";
    levelSpan.appendChild(artist);
    var details = document.createElement("span");
    details.className = "details";
    levelSpan.appendChild(details);
    var playButton = document.createElement("a");
    playButton.className = "button";
    playButton.style.bottom = "8%";
    
    //playButton.href = "javascript:start(" + JSON.stringify(level) + ")";
    playButton.onclick = () => {
      start(JSON.stringify(level));  
    };
    var playText = document.createTextNode("PLAY");
    playButton.appendChild(playText);
    details.appendChild(playButton);
    var author = document.createElement("p");
    author.innerHTML = "AUTHOR:<br>"+level.author;
    author.className = "author";
    details.appendChild(author);

    var difficulty = document.createElement("p");
    difficulty.className = "difficulty";
    details.appendChild(difficulty);
    if (level.difficulty) {
        difficulty.innerHTML = level.difficulty+" stars";
    }

    var notecount = 0;
    for (var tick in level.notes) {
        notecount += level.notes[tick].length;
    }

    var notes = document.createElement("p");
    notes.innerHTML = "NOTES:<br>"+notecount;
    notes.className = "notes";
    details.appendChild(notes);
    customLevels.push(level);
    addTime(level, details, notecount, difficulty);
    if (url) {
        var favourite = document.createElement("a");
        favourite.href = "#";
        favourite.className = "favourite";
        var star = document.createElement("img");
        star.src = "star_off.svg";
        try {
            if (!localStorage.getItem("favourites")) localStorage.setItem("favourites", "");
            star.src = localStorage.getItem("favourites").split(",").includes(url)?"star_on.svg":"star_off.svg";
        }catch(e){}
        favourite.appendChild(star);
        details.appendChild(favourite);
        favourite.addEventListener("click", (function(url, star) {
            return function(event) {
                event.preventDefault();
                addFavourite(url, event.target, star);
            };
        })(url, star));
    }
}

window.addEventListener("dragover", (e) => {
  e.preventDefault();
});
window.addEventListener("drop", (e) => {
  loadPack(e.dataTransfer.items[0].getAsFile());
  e.preventDefault();
});

function addFavourite(url, favourite, star) {
    try {
        var urls = localStorage.getItem("favourites").split(",");
        if (urls.includes(url)) {
            star.src = "star_off.svg";
            var urlCount = urls.length;
            while (urlCount--) {
                if (urls[urlCount] == url) urls.splice(urlCount, 1);
            }
        } else {
            star.src = "star_on.svg";
            urls.push(url);
        }
        localStorage.setItem("favourites", urls.join(","));
    }catch(e){}
}

async function maniaConversion(levelDat, chartName, zip, mapInfo, url) {
    if (levelDat.General.Mode != "3") return;
    const songFileName = parse(await zip.file(chartName).async("text")).General.AudioFilename;
    const songFile = await zip.file(songFileName).async("base64");
    const audio = "data:audio/"+songFileName.substr(songFileName.length-3)+";base64,"+songFile;
    const columns = levelDat.Difficulty.CircleSize;
    var ported = {};
    for (var note of levelDat.HitObjects) {
        var column = Math.floor(note.x * columns / 512)+1;
        if (!(note.time in ported)) ported[note.time]=[];
        //ported[note.time].push({Lane: column, Speed: 0.75});
        if (note.type != "Mania") ported[note.time].push({Lane: column, Speed: 1.25});
        else ported[note.time].push({Lane: column, Speed: 1.25, holdDuration: note.holdTime});
    }
    var level = {
        name: levelDat.Metadata.Version?`${levelDat.Metadata.Title} [${levelDat.Metadata.Version}]`:chartName.slice(0, -4),
        notes: ported,
        song: audio,
        cover: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
        artist: levelDat.Metadata.Artist,
        author: levelDat.Metadata.Creator+" on Osu!",
        download: levelDat.Metadata.Download,
        lanes: levelDat.Difficulty.CircleSize
    };
    if (mapInfo && mapInfo.difficulty_rating) level.difficulty = mapInfo.difficulty_rating;
    addChart(level, url);
}
var endpoint = "https://osu.direct";
var apiRefs = {
    search: "/api/v2/search/",
    download: "/api/d/"
};

var amount = 15;

var xmlHttp = new XMLHttpRequest();

function search(query) {
    xmlHttp.open("GET", endpoint+apiRefs.search+"?mode=3&amount="+amount+"&offset="+(amount*(document.getElementById("dlPage").value-1))+'&q="'+query+'"', true); // true for asynchronous 
    xmlHttp.onload = (e) => {
        if (!(xmlHttp.readyState == 4 && xmlHttp.status == 200)) return;
        var data = JSON.parse(xmlHttp.responseText);
        document.getElementById("dlOptions").replaceChildren();
        for (var level in data) {
            var index = level;
            level = data[level];
            var levelSpan = document.createElement("span");
            levelSpan.className = "level";
            levelSpan.style = "top: " + (index * 105 + 50) + "px;";
            document.getElementById("dlOptions").appendChild(levelSpan);
            var cover = document.createElement("img");
            cover.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
            levelSpan.appendChild(cover);
            var title = document.createElement("h1");
            title.innerHTML = level.title;
            levelSpan.appendChild(title);
            var artist = document.createElement("p");
            //artist.innerHTML = "Song by: "+level.artist;
            artist.innerHTML = level.artist;
            artist.className = "artist";
            levelSpan.appendChild(artist);
            var details = document.createElement("span");
            details.className = "details";
            levelSpan.appendChild(details);
            var playButton = document.createElement("a");
            playButton.className = "button";
            playButton.style.bottom = "8%";
            var mapInfo = {};
            for (var beatmap of level.beatmaps) {
                var chartFile = `${level.artist} - ${level.title} (${level.creator}) [${beatmap.version}].osu`;
                mapInfo[chartFile] = beatmap;
                delete mapInfo[chartFile].version;
            }
            playButton.href = "javascript:loadOsu(\"" + endpoint+apiRefs.download+level.id + "\", "+JSON.stringify(mapInfo)+")";
            var playText = document.createTextNode("DOWNLOAD");
            playButton.appendChild(playText);
            details.appendChild(playButton);
            var author = document.createElement("p");
            author.innerHTML = "AUTHOR:<br>"+level.creator;
            author.className = "author";
            details.appendChild(author);

            var lowestDif = 9999999999;
            var highestDif = 0;
            var lowestNotes = 9999999999;
            var highestNotes = 0;
            var lowestTime = 9999999999;
            var highestTime = 0;

            for (var chart of level.beatmaps) {
                if (chart.difficulty_rating < lowestDif) lowestDif = chart.difficulty_rating;
                if (chart.difficulty_rating > highestDif) highestDif = chart.difficulty_rating;
                var totalNotes = chart.count_circles + chart.count_sliders;
                if (totalNotes < lowestNotes) lowestNotes = totalNotes;
                if (totalNotes > highestNotes) highestNotes = totalNotes;
                if (chart.total_length < lowestTime) lowestTime = chart.total_length;
                if (chart.total_length > highestTime) highestTime = chart.total_length;            
            }

            var difficulty = document.createElement("p");
            difficulty.innerHTML = (highestDif==lowestDif?highestDif:lowestDif+" - "+highestDif)+" stars";
            difficulty.className = "difficulty";
            details.appendChild(difficulty);

            var notes = document.createElement("p");
            notes.innerHTML = "NOTES:<br>"+(highestNotes==lowestNotes?highestNotes:lowestNotes+" - "+highestNotes);
            notes.className = "notes";
            details.appendChild(notes);

            var time = document.createElement("p");
            if (highestTime == lowestTime) {
                var totalSeconds = Math.round(highestTime);
                var hours = Math.floor(totalSeconds / 3600);
                totalSeconds %= 3600;
                var minutes = Math.floor(totalSeconds / 60);
                var seconds = totalSeconds % 60;
                if (seconds < 10) seconds = "0"+seconds;
                var finalString = hours==0?minutes+":"+seconds:hours+":"+minutes+":"+seconds;
                time.innerHTML = "Time:<br>"+finalString;
                time.className = "time";
                details.appendChild(time);
            } else {
                var totalSecondsL = Math.round(lowestTime);
                var hoursL = Math.floor(totalSecondsL / 3600);
                totalSecondsL %= 3600;
                var minutesL = Math.floor(totalSecondsL / 60);
                var secondsL = totalSecondsL % 60;
                if (secondsL < 10) secondsL = "0"+secondsL;
                var finalStringL = hoursL==0?minutesL+":"+secondsL:hoursL+":"+minutesL+":"+secondsL;

                var totalSecondsH = Math.round(highestTime);
                var hoursH = Math.floor(totalSecondsH / 3600);
                totalSecondsH %= 3600;
                var minutesH = Math.floor(totalSecondsH / 60);
                var secondsH = totalSecondsH % 60;
                if (secondsH < 10) secondsH = "0"+secondsH;
                var finalStringH = hoursH==0?minutesH+":"+secondsH:hoursH+":"+minutesH+":"+secondsH;

                time.innerHTML = "Time:<br>"+finalStringL+" - "+finalStringH;
                time.className = "time";
                details.appendChild(time);
            }
        }
    };
    xmlHttp.send(null);
}
    
if (instantRequests) search("");

document.getElementById("dlSearch").onkeydown = (e) => {
    if (e.key == "Enter") {
        document.getElementById("dlPage").value = 1;
        search(document.getElementById("dlSearch").value);
    }
};

document.getElementById("dlPage").onkeydown = (e) => {
    if (e.key == "Enter") {
        if (document.getElementById("dlPage").value < 1) document.getElementById("dlPage").value = 1;
        document.getElementById("dlPage").value = Math.floor(document.getElementById("dlPage").value);
        search(document.getElementById("dlSearch").value);
    }
};
//document.write(`<script src="osumaniadownload.js"></script>`);
document.write(`<script src="https://cdn.jsdelivr.net/gh/gingerphoenix10/Mania@latest/levels.js?${Math.random()}"></script>`);

const $ = id => document.getElementById(id);

const audio = $("audio");
const cover = $("cover");
const title = $("trackTitle");
const artist = $("trackArtist");

const playBtn = $("playPauseBtn");
const nextBtn = $("nextBtn");
const prevBtn = $("prevBtn");

const progress = $("progress");
const progressBox = $("progressContainer");

const playlist = $("playlistList");

const currentTimeEl = $("currentTime");
const durationEl = $("duration");

const volume = $("volume");
const muteBtn = $("muteBtn");

const shuffleBtn = $("shuffleBtn");
const repeatBtn = $("repeatBtn");

const fileInput = $("fileInput");
const search = $("searchSong");

let index = 0;
let playing = false;
let shuffle = false;
let repeat = "off";
let lastVolume = volume.value;

// ================= INIT =================
function init(){
    buildPlaylist();
    loadTrack(index);
    audio.volume = 1; // ensure initial audible volume
}

// ================= PLAYLIST =================
function buildPlaylist(){
    playlist.innerHTML = "";

    TRACKS.forEach((t,i)=>{
        const li = document.createElement("li");
        li.dataset.i = i;

        li.innerHTML = `
            <div class="meta">
                <strong>${t.title}</strong>
                <div>${t.artist}</div>
            </div>
        `;

        playlist.appendChild(li);

        li.onclick = ()=>{
            loadTrack(i);
            play();
        };
    });
}

// ================= LOAD TRACK =================
function loadTrack(i){
    index = i;
    const t = TRACKS[i];

    audio.src = t.src;
    cover.src = t.cover;
    title.textContent = t.title;
    artist.textContent = t.artist;

    audio.volume = 1; // ensure audible
    audio.muted = false;

    audio.load();
}

// ================= PLAY / PAUSE =================
function play(){
    audio.play().catch(()=>{
        console.log("User interaction required to play audio.");
    });
    startVisualizer();
    playing = true;
    playBtn.textContent="⏸";
}

function pause(){
    audio.pause();
    playing = false;
    playBtn.textContent="▶";
}

playBtn.onclick = () => playing ? pause() : play();

// ================= NEXT / PREV =================
function nextTrack(){
    if(shuffle){
        index = Math.floor(Math.random()*TRACKS.length);
    } else{
        index = (index+1)%TRACKS.length;
    }
    loadTrack(index);
    play();
}

function prevTrack(){
    index=(index-1+TRACKS.length)%TRACKS.length;
    loadTrack(index);
    play();
}

nextBtn.onclick = nextTrack;
prevBtn.onclick = prevTrack();

// ================= KEYBOARD CONTROLS =================
document.addEventListener("keydown", (e)=>{

    if(e.code === "Space"){
        e.preventDefault();
        playing ? pause() : play();
    }

    if(e.code === "ArrowRight") nextTrack();
    if(e.code === "ArrowLeft") prevTrack();

    if(e.code === "ArrowUp"){
        audio.volume = Math.min(audio.volume + 0.1, 1);
        volume.value = audio.volume;
    }

    if(e.code === "ArrowDown"){
        audio.volume = Math.max(audio.volume - 0.1, 0);
        volume.value = audio.volume;
    }

});

// ================= AUDIO EVENTS =================
audio.ontimeupdate = ()=>{
    let p = (audio.currentTime / audio.duration)*100 || 0;
    progress.style.width = p+"%";
    currentTimeEl.textContent = format(audio.currentTime);
};

audio.onloadedmetadata = ()=>{
    durationEl.textContent = format(audio.duration);
};

function format(sec){
    if(!sec) return "0:00";
    let m = Math.floor(sec/60);
    let s = Math.floor(sec%60).toString().padStart(2,"0");
    return `${m}:${s}`;
}

// ================= PROGRESS =================
progressBox.onclick = e => {
    const rect = progressBox.getBoundingClientRect();
    const pct = (e.clientX - rect.left)/rect.width;
    audio.currentTime = pct*audio.duration;
};

// ================= VOLUME =================
volume.oninput = ()=> audio.volume = volume.value;

muteBtn.onclick = ()=>{
    if(audio.volume>0){
        lastVolume = audio.volume;
        audio.volume = 0;
        volume.value = 0;
    } else{
        audio.volume = lastVolume;
        volume.value = lastVolume;
    }
};

// ================= SEARCH =================
search.addEventListener("input", () => {
    const value = search.value.toLowerCase();

    [...playlist.children].forEach(li => {
        const i = li.dataset.i;
        const track = TRACKS[i];
        const text = (track.title + " " + track.artist).toLowerCase();
        li.style.display = text.includes(value) ? "flex" : "none";
    });
});

// ================= VISUALIZER =================

const canvas = $("visualizer");
const ctx = canvas.getContext("2d");

function resizeCanvas(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let audioCtx;
let analyser;
let source;

function startVisualizer(){

    if(!audioCtx){
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();

        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);

        analyser.fftSize = 256;
    }

    audioCtx.resume();
    drawVisualizer();
}

const bufferLength = 128;
const dataArray = new Uint8Array(bufferLength);

function drawVisualizer(){
    requestAnimationFrame(drawVisualizer);

    analyser.getByteTimeDomainData(dataArray);

    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.beginPath();

    let sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for(let i=0;i<bufferLength;i++){
        let v = dataArray[i]/128.0;
        let y = v*(canvas.height/2);

        if(i===0){
            ctx.moveTo(x,y);
        }else{
            ctx.lineTo(x,y);
        }

        x+=sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.strokeStyle="#22c55e";
    ctx.lineWidth=2;
    ctx.stroke();
}

// ================= START =================
init();
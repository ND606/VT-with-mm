//Initialization
console.log("20")

const FILE = 0;
const YOUTUBE = 1;
const TWITCH = 2;

var mode = FILE;

var isDriveVideo = false;
var driveID = "";
var driveUser = 0;
const driveAPIKey = "AIzaSyCv76of8z_m0jnOflw0rFQ50gphUBFvwcw";

var framerate = 60;

var currentStartTime = 0.5 / framerate;
var currentEndTime = 0.5 / framerate;

var player1SeekCalls = 0;
var player2SeekCalls = 0;

document.getElementById('yt_player1').style.display = "none";
document.getElementById('yt_player2').style.display = "none";
document.getElementById('twitch_player1').style.display = "none";
document.getElementById('twitch_player2').style.display = "none";
document.getElementById('browse').style.display = "none";
document.getElementById('60frameTimeParagraph').style.display = "none";
document.getElementById('yt_info').style.display = "none";
document.getElementById('twitch_info').style.display = "none";

//initialize for file mode
var file_player1 = document.getElementById('file_player1');
var file_player2 = document.getElementById('file_player2');

var file_updateInterval;

//for testing
//file_source1.setAttribute('src', 'https://video.twimg.com/dm_video/1452366978186821633/vid/1280x720/YFuM5KvsQsxVMKO58CrwW_d-dGhTxgcnXzWNGbeVsbY.mp4?tag=1');
//file_source2.setAttribute('src', 'https://video.twimg.com/dm_video/1452366978186821633/vid/1280x720/YFuM5KvsQsxVMKO58CrwW_d-dGhTxgcnXzWNGbeVsbY.mp4?tag=1');

//initialization for yt mode
var yt_player1;
var yt_player2;

function onYouTubeIframeAPIReady() {
    yt_player1 = new YT.Player('yt_player1');
    yt_player2 = new YT.Player('yt_player2');
}

var yt_settingStartToEnd = false;
var yt_newVideo = false;

var yt_updateInterval;

//initialization for twitch mode
var twitch_options = {
    width: 400,
    height: 400,
    video: "0",
    parent: ["jsfiddle.net", "vidtimer.com", "www.vidtimer.com", "xiivler.github.io"],
    time: 10
};
var twitch_player1 = new Twitch.Player("twitch_player1", twitch_options);
var twitch_player2 = new Twitch.Player("twitch_player2", twitch_options);

var twitch_quality = "auto";

var twitch_initialTime = 0;

var twitch_pausePlayer1 = true;
var twitch_pausePlayer2 = true;

var twitch_enableFrameAdvancePlayer1 = true;
var twitch_enableFrameAdvancePlayer2 = true;

//Getting the video
function getVideoURL() {
    parseURL(document.getElementById('URL').value);
}

function parseURL(url) {
    isDriveVideo = false;
    driveID = "";
    driveUser = 0;
    if (url.match("youtube\.com|youtu\.be"))
        yt_loadVideo(url);
    else if (url.match("twitch.tv\/video"))
        twitch_loadVideo(url);
    else {
        let srcUrl = url.replace('twitter.com', 'vxtwitter.com/dir');
        let regExp = /drive\.google\.com\/file\/d\/(.*)\//;
    		let match = srcUrl.match(regExp);
    		if (match) {
          driveID = match[1];
    			srcUrl = "https://drive.google.com/uc?export=download&id=" + driveID;
          isDriveVideo = true;
         }
        file_loadVideo(srcUrl);
    }
}

var uploadVideo = function(event) {
    isDriveVideo = false;
    var file = this.files[0];
    file_loadVideo(URL.createObjectURL(file));
}

document.getElementById('browse').addEventListener('change', uploadVideo, false);

function file_loadVideo(url) {
    file_player1.setAttribute('src', url);
    file_player2.setAttribute('src', url);
    currentStartTime = 0.5 / framerate;
    currentEndTime = 0.5 / framerate;
    calculate();

    player1SeekCalls = 0;
    player2SeekCalls = 0;

    clearInterval(file_updateInterval);
    file_updateInterval = setInterval(function() {
        if (currentEndTime < currentStartTime)
            file_setEndToStart();
    }, 500);

    if (mode != FILE) {
        document.getElementById('file_player1').style.display = "block";
        document.getElementById('file_player2').style.display = "block";
        document.getElementById('file_info').style.display = "block";

        if (mode == YOUTUBE) {
            document.getElementById('yt_player1').style.display = "none";
            document.getElementById('yt_player2').style.display = "none";
            document.getElementById('yt_info').style.display = "none";
            yt_player1.cueVideoById("0");
            yt_player2.cueVideoById("0");
            clearInterval(yt_updateInterval);
        } else if (mode == TWITCH) {
            //document.getElementById('FPSLabel').innerHTML = "<code>" + framerate + " FPS (ss:ff)</code>";
            //document.getElementById('60FPSLabel').innerHTML = "<code>60 FPS (ss:ff)</code>";
            document.getElementById('twitch_player1').style.display = "none";
            document.getElementById('twitch_player2').style.display = "none";
            document.getElementById('twitch_info').style.display = "none";
            twitch_player1.setVideo();
            twitch_player2.setVideo();
        }

        mode = FILE;
    }
}

function onFileLoadError() {
  //console.log("error!");
  if (isDriveVideo) {
    //console.log("error loading drive video");
    if (driveUser < 9) {
      driveUser++;
      let srcUrl = "https://drive.google.com/u/" + driveUser + "/uc?export=download&id=" + driveID;
      file_player1.setAttribute('src', srcUrl);
      file_player2.setAttribute('src', srcUrl);
    }
    else if (driveUser == 9) {
      //unless there are more than 10 users, the file is large
      let srcUrl = "https://www.googleapis.com/drive/v3/files/" + driveID + "?alt=media&key=" + driveAPIKey;
      file_player1.setAttribute('src', srcUrl);
      file_player2.setAttribute('src', srcUrl);
    }
  }
}

file_player1.onerror = onFileLoadError;

function yt_loadVideo(url) {
    let regExp = /(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*)/;
    let regExpTime = /(\?|\&)t=([0-9]+)/;
    let match = url.match(regExp);
    if (match && match[2].length == 11) {
        let start = 0;
        let timeData = url.match(regExpTime);
        if (timeData)
            start = parseInt(timeData[2]) + 0.5 / framerate;
        if (start < 0.5 / framerate)
            start = 0.5 / framerate;
        yt_player1.cueVideoById(match[2], start);
        yt_player2.cueVideoById(match[2], start);
        yt_newVideo = true;
        currentStartTime = start;
        currentEndTime = start;

        if (mode != YOUTUBE) {
            clearInterval(yt_updateInterval);

            document.getElementById('yt_player1').style.display = "block";
            document.getElementById('yt_player2').style.display = "block";
            document.getElementById('yt_info').style.display = "block";

            if (mode == FILE) {
                document.getElementById('file_player1').style.display = "none";
                document.getElementById('file_player2').style.display = "none";
                document.getElementById('file_info').style.display = "none";
                file_player1.setAttribute('src', "");
                file_player2.setAttribute('src', "");
                clearInterval(file_updateInterval);
            } else if (mode == TWITCH) {
                //document.getElementById('FPSLabel').innerHTML = "<code>" + framerate + " FPS (ss:ff)</code>";
                //document.getElementById('60FPSLabel').innerHTML = "<code>60 FPS (ss:ff)</code>";      
                document.getElementById('twitch_player1').style.display = "none";
                document.getElementById('twitch_player2').style.display = "none";
                document.getElementById('twitch_info').style.display = "none";
                twitch_player1.setVideo();
                twitch_player2.setVideo();
            }

            yt_updateInterval = setInterval(yt_update, 100);

            mode = YOUTUBE;
        }
    }
}

function twitch_loadVideo(url) {
    twitch_initialTime = 0;
    let id = 0;
    let matcharray = url.match('twitch.tv\/videos\/([0-9]*)');
    if (matcharray !== null)
        id = matcharray[1];
    let timestamp = url.match('t=(([0-9]*)h)?(([0-9]*)m)?(([0-9]*)s)?');
    if (timestamp !== null) {
        if (timestamp[2] !== undefined)
            twitch_initialTime += (timestamp[2] * 3600);
        if (timestamp[4] !== undefined)
            twitch_initialTime += (timestamp[4] * 60);
        if (timestamp[6] !== undefined)
            twitch_initialTime += (timestamp[6] * 1);
    }
    twitch_player1.setVideo(id, 0);
    twitch_player2.setVideo(id, 0);
    twitch_player1.seek(twitch_initialTime);
    twitch_player2.seek(twitch_initialTime);
    twitch_pausePlayer1 = true;
    twitch_pausePlayer2 = true;

    player1SeekCalls = 0;
    player2SeekCalls = 0;

    if (mode != TWITCH) {
        document.getElementById('twitch_player1').style.display = "block";
        document.getElementById('twitch_player2').style.display = "block";
        document.getElementById('twitch_info').style.display = "block";

        //document.getElementById('FPSLabel').innerHTML = "<code>" + framerate + " FPS (ss:ff) ± 2f</code>";
        //document.getElementById('60FPSLabel').innerHTML = "<code>60 FPS (ss:ff) ± 2f</code>";

        if (mode == FILE) {
            document.getElementById('file_player1').style.display = "none";
            document.getElementById('file_player2').style.display = "none";
            document.getElementById('file_info').style.display = "none";
            file_player1.setAttribute('src', "");
            file_player2.setAttribute('src', "");
            clearInterval(file_updateInterval);
        } else if (mode == YOUTUBE) {
            document.getElementById('yt_player1').style.display = "none";
            document.getElementById('yt_player2').style.display = "none";
            document.getElementById('yt_info').style.display = "none";
            yt_player1.cueVideoById("0");
            yt_player2.cueVideoById("0");
            clearInterval(yt_updateInterval);
        }

        mode = TWITCH;
    }
}


//changes from URL to file and vice versa
function changeVideoType() {
    if (document.getElementById('useURL').checked) {
        document.getElementById('URLParagraph').style.display = "block";
        document.getElementById('browse').style.display = "none";
    } else {
        document.getElementById('URLParagraph').style.display = "none";
        document.getElementById('browse').style.display = "block";
    }
}



//Changing video FPS
function changeFPS() {
    if (document.getElementById('30FPS').checked) {
        framerate = 30;
        document.getElementById('60frameTimeParagraph').style.display = "block";
    } else {
        framerate = 60;
        document.getElementById('60frameTimeParagraph').style.display = "none";
    }
    document.getElementById('FPSLabel').innerHTML = "<code>" + framerate + " FPS (ss:ff)</code>";
    if (mode == FILE)
        file_changeFPS();
    else if (mode == YOUTUBE)
        yt_changeFPS()
    else if (mode == TWITCH)
        twitch_changeFPS()
    calculate();
}

function file_changeFPS() {
    currentStartTime = frameFloor(file_player1.currentTime);
    file_player1.currentTime = currentStartTime;
    currentEndTime = frameFloor(file_player2.currentTime);
    file_player2.currentTime = currentEndTime;
}

function yt_changeFPS() {
    currentStartTime = frameFloor(yt_player1.getCurrentTime());
    yt_player1.seekTo(currentStartTime, true);
    currentEndTime = frameFloor(yt_player2.getCurrentTime());
    yt_player2.seekTo(currentEndTime, true);
}

function twitch_changeFPS() {
    //document.getElementById('FPSLabel').innerHTML = "<code>" + framerate + " FPS (ss:ff) ± 2f</code>";
    currentStartTime = frameFloor(twitch_player1.getCurrentTime());
    twitch_player1.seek(currentStartTime);
    currentEndTime = frameFloor(twitch_player2.getCurrentTime());
    twitch_player2.seek(currentEndTime);
}



//Frame and second advance buttons

//false for player1, true for player2
function frameAdvance(isPlayer2, frames) {
    secondAdvance(isPlayer2, frames / framerate);
}

function secondAdvance(isPlayer2, seconds) {
    if (mode == FILE)
        file_secondAdvance(isPlayer2, seconds);
    else if (mode == YOUTUBE)
        yt_secondAdvance(isPlayer2, seconds)
    else if (mode == TWITCH)
        twitch_secondAdvance(isPlayer2, seconds)
}

function file_secondAdvance(isPlayer2, seconds) {
    if (isPlayer2) {
        if (!file_player2.paused)
            currentEndTime = file_player2.currentTime;
        currentEndTime += seconds;
        if (currentEndTime < 0)
            currentEndTime = 0.5 / framerate;
        else if (currentEndTime > file_player2.duration)
            currentEndTime = frameFloor(file_player2.duration);
        file_player2.currentTime = currentEndTime;
        player2SeekCalls++;
    } else {
        if (!file_player1.paused)
            currentStartTime = file_player1.currentTime;
        currentStartTime += seconds;
        if (currentStartTime < 0)
            currentStartTime = 0.5 / framerate;
        else if (currentStartTime > file_player1.duration)
            currentStartTime = frameFloor(file_player1.duration);
        file_player1.currentTime = currentStartTime;
        player1SeekCalls++;
    }
    calculate();
}

function yt_secondAdvance(isPlayer2, seconds) {
    if (isPlayer2) {
        currentEndTime = yt_player2.getCurrentTime();
        currentEndTime += seconds;
        if (currentEndTime < 0)
            currentEndTime = 0.5 / framerate;
        yt_player2.seekTo(currentEndTime, true);
    } else {
        currentStartTime = yt_player1.getCurrentTime();
        currentStartTime += seconds;
        if (currentStartTime < 0)
            currentStartTime = 0.5 / framerate;
        yt_player1.seekTo(currentStartTime, true);
    }
    yt_update();
}

function twitch_secondAdvance(isPlayer2, seconds) {
    if (isPlayer2 && twitch_enableFrameAdvancePlayer2) {
        currentEndTime += seconds;
        if (currentEndTime < 0)
            currentEndTime = 0.5 / framerate;
        twitch_player2.seek(currentEndTime);
        player2SeekCalls++;
    } else if (!isPlayer2 && twitch_enableFrameAdvancePlayer1) {
        currentStartTime += seconds;
        if (currentStartTime < 0)
            currentStartTime = 0.5 / framerate;
        twitch_player1.seek(currentStartTime);
        player1SeekCalls++;
    }
    calculate();
    if (currentEndTime < currentStartTime)
        twitch_setEndToStart();
}

// minuteAdvance
function minuteAdvance(isPlayer2, minutes) {
    // 分を秒に変換してsecondAdvanceに渡す
    secondAdvance(isPlayer2, minutes * 60);
}

//Set start to end and end to start
function setStartToEnd() {
    if (mode == FILE)
        file_setStartToEnd();
    else if (mode == YOUTUBE)
        yt_setStartToEnd()
    else if (mode == TWITCH)
        twitch_setStartToEnd()
}

function file_setStartToEnd() {
    currentStartTime = currentEndTime
    file_player1.currentTime = currentStartTime;
    calculate();
}

function file_setEndToStart() {
    currentEndTime = currentStartTime
    file_player2.currentTime = currentEndTime;
    calculate();
}

function yt_setStartToEnd() {
    yt_player1.seekTo(currentEndTime, true);
    if (yt_player1.getPlayerState() == YT.PlayerState.CUED)
        yt_player1.pauseVideo();
    currentStartTime = currentEndTime;
    calculate();
    yt_settingStartToEnd = true;
    setTimeout(function() {
        yt_settingStartToEnd = false;
    }, 500);
}

function twitch_setStartToEnd() {
    currentStartTime = currentEndTime;
    twitch_player1.seek(currentStartTime);
    player1SeekCalls++;
    calculate();
}

function twitch_setEndToStart() {
    currentEndTime = currentStartTime;
    twitch_player2.seek(currentEndTime);
    //player2SeekCalls++;
    calculate();
}

//Calculate times
function calculate() {
    // get times in frames
    let rawStartFrames = Math.floor(currentStartTime * framerate);
    let rawEndFrames = Math.floor(currentEndTime * framerate);
    let rawFrames = rawEndFrames - rawStartFrames;

    let startSeconds = Math.floor(rawStartFrames / framerate);
    let startFrames = rawStartFrames % framerate;

    let startFrameTime = String(startSeconds).padStart(2, '0') + ':' + String(startFrames).padStart(2, '0');
    document.getElementById('startFrameTime').value = startFrameTime;

    let endSeconds = Math.floor(rawEndFrames / framerate);
    let endFrames = rawEndFrames % framerate;

    let endFrameTime = String(endSeconds).padStart(2, '0') + ':' + String(endFrames).padStart(2, '0');
    document.getElementById('endFrameTime').value = endFrameTime;

    let seconds = Math.floor(rawFrames / framerate);
    let frames = rawFrames % framerate;

    let frameTime = String(seconds).padStart(2, '0') + ':' + String(frames).padStart(2, '0');
    document.getElementById('frameTime').value = frameTime;

    if (framerate != 60) {
        let frames60FPS = Math.round(frames / framerate * 60);
        let frameTime60FPS = String(seconds).padStart(2, '0') + ':' + String(frames60FPS).padStart(2, '0');
        document.getElementById('frameTime60FPS').value = frameTime60FPS;
    }

    let hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    let minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    let milliseconds = Math.round(frames / framerate * 1000);

    // Format time based on conditions
    let msTime = '';

    if (hours > 0) {
        msTime = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    } else if (minutes > 0) {
        // Ensure seconds are always two digits if minutes exist
        msTime = `${minutes}:${String(seconds).padStart(2, '0')}`;
    } else {
        // Show seconds only if there are no minutes, and add milliseconds if necessary
        msTime = String(seconds);  // No padding for seconds
    }

    // Add milliseconds if needed
    if (showMilliseconds) {
        msTime += `.${String(milliseconds).padStart(3, '0')}`;
    }

    // Handle the case where it's less than 1 second and there are no minutes (e.g., 0.067)
    if (minutes === 0 && seconds < 1) {
        msTime = msTime.replace(/^00\./, '0.');  // Replace "00." with "0." for cases like 00.067
    } else if (minutes === 0) {
        msTime = msTime.replace(/^0/, '');  // Remove leading zero from seconds for cases like 00.350
    }

    document.getElementById('msTime').value = msTime;

    // Default Mod note
    let modNoteDefault = `Mod note: Retimed to ${msTime}`;
    document.getElementById('modNote').value = modNoteDefault;
}


// Function to generate the mod note based on the current hh:mm:ss.ms time
function generateModNote() {
    // Get the current value of the hh:mm:ss.ms time
    let msTime = document.getElementById('msTime').value;

    // Split the time into components (hours, minutes, seconds, milliseconds)
    let timeParts = msTime.split(':');

    // If there are hours, leave them as is, but remove leading zeros from minutes and seconds
    if (timeParts.length === 3) {
        // Format hours, minutes, and seconds
        let hours = timeParts[0].replace(/^0+/, ''); // Remove leading zeros from hours if any
        let minutes = timeParts[1].replace(/^0+/, ''); // Remove leading zeros from minutes
        let seconds = timeParts[2]; // Seconds already include milliseconds

        // Rebuild the formatted time
        msTime = `${hours}:${minutes}:${seconds}`;
    } else if (timeParts.length === 2) {
        // Format minutes and seconds
        let minutes = timeParts[0].replace(/^0+/, ''); // Remove leading zeros from minutes
        let seconds = timeParts[1]; // Seconds already include milliseconds

        // Rebuild the formatted time
        msTime = `${minutes}:${seconds}`;
    }

    // Create the Mod note text
    let modNoteText = `Mod note: Retimed to ${msTime}`;

    // Set the Mod note text into the modNote input field
    document.getElementById('modNote').value = modNoteText;
}


//File mode specific
file_player1.addEventListener('seeked', function() {
    if (player1SeekCalls <= 0) {
        currentStartTime = frameFloor(file_player1.currentTime);
        file_player1.currentTime = currentStartTime;
        player1SeekCalls = 1;
        calculate();
    } else
        player1SeekCalls--;
});

file_player2.addEventListener('seeked', function() {
    if (player2SeekCalls <= 0) {
        currentEndTime = frameFloor(file_player2.currentTime);
        file_player2.currentTime = currentEndTime;
        player2SeekCalls = 1;
        calculate();
    } else
        player2SeekCalls--;
});

file_player1.addEventListener('pause', function() {
    currentStartTime = frameFloor(file_player1.currentTime);
    file_player1.currentTime = currentStartTime;
    calculate();
});

file_player2.addEventListener('pause', function() {
    currentEndTime = frameFloor(file_player2.currentTime);
    file_player2.currentTime = currentEndTime;
    calculate();
});

window.addEventListener('keydown', function(evt) {
    if (mode != FILE)
        return;
    let isplayer1 = (document.activeElement.id == 'file_player1');
    let isPlayer2 = (document.activeElement.id == 'file_player2');
    if (!(isplayer1 || isPlayer2))
        return;
    if (evt.key == ',')
        frameAdvance(isPlayer2, -1);
    else if (evt.key == ".")
        frameAdvance(isPlayer2, 1);
    else if (evt.key == "<")
        frameAdvance(isPlayer2, -5);
    else if (evt.key == ">")
        frameAdvance(isPlayer2, 5);
    else if (evt.keyCode === 37) {
        if (evt.shiftKey)
            secondAdvance(isPlayer2, -5);
        else
            secondAdvance(isPlayer2, -1)
    } else if (evt.keyCode === 39)
        if (evt.shiftKey)
            secondAdvance(isPlayer2, 5);
        else
            secondAdvance(isPlayer2, 1)
});



//yt mode specific
function yt_update() {

    //if a new video is loaded, make sure it starts at the desired time
    if (yt_newVideo) {
        yt_player1.seekTo(currentStartTime);
        yt_player2.seekTo(currentEndTime);
        if (yt_player1.getCurrentTime() == currentStartTime && yt_player2.getCurrentTime() == currentEndTime) {
            yt_player1.pauseVideo();
            yt_player2.pauseVideo();
            yt_newVideo = false;
            calculate();
            return;
        }
    }
    //don't adjust for a cooldown period after setting the start frame to the end frame
    if (yt_settingStartToEnd)
        return;

    //adjustment code
    if (yt_player1.getPlayerState() == YT.PlayerState.PAUSED && currentStartTime != yt_player1.getCurrentTime()) {
        //check whether the player was advanced to a good time
        let diff = Math.abs(yt_player1.getCurrentTime() - currentStartTime) * framerate % 1;
        if (diff > 0.5)
            diff = 1 - diff;
        if (diff < 0.001)
            currentStartTime = yt_player1.getCurrentTime();
        else {
            if (yt_player1.getCurrentTime() < 1 / framerate)
                currentStartTime = 0.5 / framerate;
            else
                currentStartTime = frameFloor(yt_player1.getCurrentTime());
            yt_player1.seekTo(currentStartTime, true);
        }
        calculate();
    }

    //set end time to start time if end time is before start time
    if (yt_player2.getCurrentTime() < currentStartTime) {
        yt_player2.seekTo(currentStartTime, true);
        if (yt_player2.getPlayerState() == YT.PlayerState.CUED)
            yt_player2.pauseVideo();
        currentEndTime = currentStartTime;
        calculate();
    } else if (yt_player2.getPlayerState() == YT.PlayerState.PAUSED && currentEndTime != yt_player2.getCurrentTime()) {
        if (yt_player2.getCurrentTime() < 1 / framerate)
            currentEndTime = 0.5 / framerate;
        //check whether the player was advanced to a good time
        let diff = Math.abs(yt_player2.getCurrentTime() - currentEndTime) * framerate % 1;
        if (diff > 0.5)
            diff = 1 - diff;
        if (diff < 0.001)
            currentEndTime = yt_player2.getCurrentTime();
        else {
            let adjustedTime = frameFloor(yt_player2.getCurrentTime());
            yt_player2.seekTo(adjustedTime, true);
            currentEndTime = adjustedTime;
        }
        calculate();
    }
}



//Twitch mode specific
twitch_player1.addEventListener(Twitch.Player.READY, function() {
    twitch_player1.setQuality("720p60");
    setTimeout(function() {
        twitch_quality = twitch_player1.getQuality()
    }, 100);
    twitch_player1.seek(twitch_initialTime);
});

twitch_player2.addEventListener(Twitch.Player.READY, function() {
    twitch_player2.setQuality("720p60");
    twitch_player2.seek(twitch_initialTime);
});

twitch_player1.addEventListener(Twitch.Player.SEEK, function() {
    if (player1SeekCalls == 0) {
        twitch_player1.play();
        if (twitch_enableFrameAdvancePlayer1) {
            twitch_pausePlayer1 = true;
        }
    } else
        player1SeekCalls--;
});

twitch_player2.addEventListener(Twitch.Player.SEEK, function() {
    if (player2SeekCalls == 0) {
        twitch_player2.play();
        if (twitch_enableFrameAdvancePlayer2)
            twitch_pausePlayer2 = true;
    } else
        player2SeekCalls--;
});

twitch_player1.addEventListener(Twitch.Player.PLAY, function() {
    if (twitch_pausePlayer1) {
        twitch_player1.pause();
        twitch_pausePlayer1 = false;
    }
});

twitch_player2.addEventListener(Twitch.Player.PLAY, function() {
    if (twitch_pausePlayer2) {
        twitch_player2.pause();
        twitch_pausePlayer2 = false;
    }
});

twitch_player1.addEventListener(Twitch.Player.PAUSE, function() {
    twitch_enableFrameAdvancePlayer1 = false;
    setTimeout(function() {
        twitch_enableFrameAdvancePlayer1 = true;
        if (twitch_player1.isPaused()) {
            currentStartTime = frameFloor(twitch_player1.getCurrentTime());
            twitch_player1.seek(currentStartTime);
            player1SeekCalls++;
            calculate();
            if (currentEndTime < currentStartTime)
                twitch_setEndToStart();
        }
    }, 1000);
});

twitch_player2.addEventListener(Twitch.Player.PAUSE, function() {
    twitch_enableFrameAdvancePlayer2 = false;
    setTimeout(function() {
        twitch_enableFrameAdvancePlayer2 = true;
        if (twitch_player2.isPaused()) {
            currentEndTime = frameFloor(twitch_player2.getCurrentTime());
            twitch_player2.seek(currentEndTime);
            player2SeekCalls++;
            calculate();
            if (currentEndTime < currentStartTime)
                twitch_setEndToStart();
        }
    }, 1000);
});



//General function
function frameFloor(time) {
    return (Math.floor(time * framerate) + 0.5) / framerate;
}

// Function to generate the mod note based on the current hh:mm:ss.ms time
function generateModNote() {
    // Get the current value of the hh:mm:ss.ms time
    let msTime = document.getElementById('msTime').value;

    // Create the Mod note text
    let modNoteText = `Mod note: Retimed to ${msTime}`;

    // Set the Mod note text into the modNote input field
    document.getElementById('modNote').value = modNoteText;
}

let showMilliseconds = true; // ミリ秒の表示状態

function toggleMilliseconds() {
    // フラグを反転
    showMilliseconds = !showMilliseconds;

    // msTimeの値を取得
    let msTime = document.getElementById('msTime').value;

    // 現在のMod noteフィールドの値を取得
    let modNoteField = document.getElementById('modNote').value;

    // ミリ秒表示の切り替え
    if (!showMilliseconds) {
        // ミリ秒部分を削除
        modNoteField = modNoteField.replace(/\.\d{3}/, '');
        document.getElementById('msToggleButton').innerText = "ms off"; // ボタンラベルを "ms off" に変更
        document.getElementById('msToggleButton').style.color = "white"; // ボタンの文字色を白に変更
    } else {
        // msTimeからミリ秒部分を取得して再度表示
        let msPart = msTime.match(/\.\d{3}/);
        if (msPart && !modNoteField.match(/\.\d{3}/)) {
            // ミリ秒部分を追加
            modNoteField = `${modNoteField}${msPart[0]}`;
        }
        document.getElementById('msToggleButton').innerText = "ms on"; // ボタンラベルを "ms on" に変更
        document.getElementById('msToggleButton').style.color = "black"; // ボタンの文字色を黒に変更
    }

    // Mod note フィールドに反映
    document.getElementById('modNote').value = modNoteField;
}


function copyModNote() {
    // Get the modNote input field
    let modNoteField = document.getElementById('modNote');

    // Select the text field
    modNoteField.select();
    modNoteField.setSelectionRange(0, 99999); // For mobile devices

    // Copy the text inside the text field
    navigator.clipboard.writeText(modNoteField.value).then(function() {
        console.log('Mod note copied to clipboard');
    }).catch(function(err) {
        console.error('Failed to copy text: ', err);
    });
}

//Get video URL from parameter (for integration with Twitch Frame Timer)
(function getURLFromParameter() {
    let query = window.location.search.substring(1);
    let param = query.split("url=")[1];

    if (param !== undefined) {
        document.getElementById('URL').value = param;
        parseURL(param);
    }
})();

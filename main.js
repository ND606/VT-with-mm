//Initialization
console.log("20");

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

// Getting the video URL
function getVideoURL() {
    parseURL(document.getElementById('URL').value);
}

// URLを解析して、それぞれの動画プラットフォームの処理を分岐する
function parseURL(url) {
    isDriveVideo = false;
    driveID = "";
    driveUser = 0;

    if (url.match("youtube\.com|youtu\.be")) {
        yt_loadVideo(url);
    } else if (url.match("twitch.tv\/video")) {
        twitch_loadVideo(url);
    } else if (url.match("bilibili.com")) {
        // Bilibili動画の場合の処理
        embedBilibiliVideos(url);
    } else {
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
            document.getElementById('twitch_player1').style.display = "none";
            document.getElementById('twitch_player2').style.display = "none";
            document.getElementById('twitch_info').style.display = "none";
            twitch_player1.setVideo();
            twitch_player2.setVideo();
        }

        mode = FILE;
    }
}

// Bilibiliの動画を埋め込む
function embedBilibiliVideos(url) {
    const bvid = extractBvidFromUrl(url);
    if (!bvid) {
        console.error("Bilibiliの動画IDが抽出できませんでした");
        return;
    }

    // Start FrameにBilibiliの動画を埋め込む
    const startFrameIframe = `<iframe src="https://player.bilibili.com/player.html?bvid=${bvid}" 
                              scrolling="no" border="0" frameborder="no" framespacing="0" 
                              allowfullscreen="true" width="480" height="270"></iframe>`;
    document.getElementById("file_player1").style.display = "none"; // Bilibiliの場合はfile playerを非表示
    document.getElementById("yt_player1").style.display = "none"; // YouTube playerを非表示
    document.getElementById("twitch_player1").style.display = "none"; // Twitch playerを非表示
    document.getElementById("yt_player1").outerHTML = startFrameIframe; // Bilibili用iframeを既存枠に挿入

    // End Frameに同じBilibiliの動画を埋め込む
    const endFrameIframe = `<iframe src="https://player.bilibili.com/player.html?bvid=${bvid}" 
                            scrolling="no" border="0" frameborder="no" framespacing="0" 
                            allowfullscreen="true" width="480" height="270"></iframe>`;
    document.getElementById("file_player2").style.display = "none";
    document.getElementById("yt_player2").style.display = "none";
    document.getElementById("twitch_player2").style.display = "none";
    document.getElementById("yt_player2").outerHTML = endFrameIframe; // End FrameにBilibili用iframeを挿入
}

// URLからBilibiliの動画IDを抽出する関数
function extractBvidFromUrl(url) {
    const match = url.match(/\/video\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

function onFileLoadError() {
    if (isDriveVideo) {
        if (driveUser < 9) {
            driveUser++;
            let srcUrl = "https://drive.google.com/u/" + driveUser + "/uc?export=download&id=" + driveID;
            file_player1.setAttribute('src', srcUrl);
            file_player2.setAttribute('src', srcUrl);
        } else if (driveUser == 9) {
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
        if (timeData) {
            start = parseInt(timeData[2]) + 0.5 / framerate;
        }
        if (start < 0.5 / framerate) start = 0.5 / framerate;
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
    if (matcharray !== null) id = matcharray[1];
    let timestamp = url.match('t=(([0-9]*)h)?(([0-9]*)m)?(([0-9]*)s)?');
    if (timestamp !== null) {
        if (timestamp[2] !== undefined) twitch_initialTime += timestamp[2] * 3600;
        if (timestamp[4] !== undefined) twitch_initialTime += timestamp[4] * 60;
        if (timestamp[6] !== undefined) twitch_initialTime += timestamp[6] * 1;
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

// Frame and second advance functions remain unchanged

// Calculate times function remains unchanged


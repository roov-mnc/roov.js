![npm](https://img.shields.io/npm/v/roov) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/roov) [![Build Status](https://travis-ci.org/roov-mnc/roov.js.svg?branch=master)](https://travis-ci.org/roov-mnc/roov.js)

# ROOV.js

### Description
roov.js is a simple audio library for browser. It extends the HTML5 audio to support HLS/m3u8 and provide easy to use API. Currently being implemented on https://roov.id

### Overview
- small library(~50k)
- pure javascript with one dependency(HLS.js)
- expressive api
- expose native api
- play wide range of audio type(m3u8/hls, aac, mp3, mpeg, etc)
- adaptive bit rate(HLS)
- seek
- fast forward
- rewind
- common use events(onLoaded,onPlaying,onBuffering,onFinish,onTimeUpdate, getBufferLength,onTotalPlayTime)
- easily get buffer length
- easy to extend

### Quick start
- install with npm ``` npm install roov ```
- install with yarn ``` yarn add roov ```

in the browser: 
```

<script src="/path/to/roov.js"></script>
<script>
    var sound = new roov.audio({
      src: 'sound.mp3'
    });
</script>


```

As a dependency:
```
import {Audio} from 'roov';

```

```
const {Audio} = require('roov');
```

#### Examples

```
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<title>ROOV JS</title>
		<script src="dist/index.js"></script>
		<script type="text/javascript">
				const eventAt5Second = () => {
					document.getElementById("5s").innerHTML = "triggered";
				}
				var isEventAt5SecondTriggered = false
				const audio = new roov.audio({
					onLoaded: () => {
						document.getElementById("duration").innerHTML = audio.duration();
						document.getElementById("current").innerHTML = audio.current();
					},
					onTimeUpdate: () => {
						document.getElementById("currentTime").innerHTML = audio.currentTime();
						if (!isEventAt5SecondTriggered && audio.currentTime() > 5) {
							eventAt5Second()
							isEventAt5SecondTriggered = true
						}
					},
					onPlaying: () => {
						document.getElementById("state").innerHTML = "playing";
					},
					onBuffering: () => {
						document.getElementById("state").innerHTML = "buffering";
					},
					onFinish: () => {
						document.getElementById("state").innerHTML = "finish";
					},
					getBufferLength: (played,bufferLength) => {
						document.getElementById("buffer").innerHTML = played+" / "+bufferLength;
					}
				});

			function seek(event) {
			  	if (event.which == 13 || event.keyCode == 13) {
						audio.seek(event.target.value)
			      return false;
			  	}
			  	return true;
			}

			function loop() {
				audio.loop()
				document.getElementById("loop").innerHTML = audio.native().loop;
			}

			function muted() {
				audio.muted()
				document.getElementById("muted").innerHTML = audio.native().muted;
			}
		</script>
	</head>
	<body>
		<h4>Common radio streaming</h4>
		<div>
			<button
				onclick="audio.play('http://rfcmedia.streamguys1.com/MusicPulse.mp3')"
			>
				Today hits
			</button>
		</div>

		<h4>HLS radio streaming</h4>
		<div>
			<button
				onclick="audio.play('https://cogecomedia.leanstream.co/cogecomedia/CKBEFM.stream/playlist.m3u8')"
			>
				ESPANA(HLS)
			</button>
		</div>

		<h4>Play AUDIO</h4>
		<div>
			<button
				onclick="audio.play('https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/80s_vibe.mp3')"
			>
				80 vibes
			</button>
			<button
				onclick="audio.play('https://raw.githubusercontent.com/goldfire/howler.js/master/examples/player/audio/rave_digger.mp3')"
			>
				Rave digger
			</button>
		</div>

		<h4>Control</h4>
		<button onclick="audio.pause()">PAUSE</button>
		<button onclick="audio.play()">PLAY</button>
		<button onclick="audio.stop()">STOP</button>
		<button onclick="audio.unload()">UNLOAD</button>
		<button onclick="audio.restart()">RESTART</button>
		<br /><br />
		<div>seek : <input type="number"  onkeypress="seek(event)" /></div>
		<br /><br />
		<button onclick="audio.forward(5)">FORWARD 5s</button>
		<button onclick="audio.rewind(5)">REWIND 5s</button>
		<button onclick="loop()">LOOP</button>
		<button onclick="muted()">MUTED</button>
		<button onclick="audio.volume(0.5)">HALF VOLUME</button>
		<button onclick="audio.volume(1)">FULL VOLUME</button>

		<h4>Stats</h4>
		<p>current playing : <span id="current"></span></p>
		<p>current time : <span id="currentTime"></span></p>
		<p>played / downloaded : <span id="buffer"></span></p>
		<p>state : <span id="state"></span></p>
		<p>duration : <span id="duration"></span></p>
		<p>loop : <span id="loop">false</span></p>
		<p>muted : <span id="muted">false</span></p>
		<p>event 5s : <span id="5s">not triggered</span></p>
	</body>
</html>

```

### API

#### Options
##### src string
the source of the audio, wether it stream or file.

##### onLoaded function
fires when audio is loaded/ready to play

##### onTimeUpdateLoaded function
fires when time is being updated, usefull to execute something at x time.

##### onBuffering function
fires when audio is on buffering state

##### onPlaying function
fires when audio is on playing state

##### loop bool
loop option 

##### onFinish function
fires when audio is on finishing

##### getBufferLength function
use this to get buffered rail

##### muted bool
mute option  

---

#### Method
##### play(src)
play given src audio or resume play

##### pause()
pause the audio

##### stop()
stop and reset audio time

##### restart()
reset audio time

##### unload()
gracefully stop audio and remove attribute(todo: remove all eventlistener)

##### isHLS() bool
check wether current src is hls

##### native() obj
return native/HTML5 audio object

##### duration() string
get duration of audio

##### isPlaying() bool
get playing state

##### current() string
get current src

##### currentTime() string
get current time of track

##### seek(time) 
seek to current time

##### loop() 
toggle loop

##### muted() 
toggle muted

##### forward(time) 
fast forward x time

##### volume(v) 
set the volume of audio(range 0 - 1)

##### rewind(time) 
rewind x time


### LICENSE
License
Copyright (c) 2020 ROOV.

Released under the MIT License.


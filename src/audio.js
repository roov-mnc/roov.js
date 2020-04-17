const hls = require("hls.js/dist/hls.light");

export default class audio {
	constructor(config) {
		const {
			src = "",
			limit = 0,
			onLoaded = null,
			onTimeUpdate = null,
			onBuffering = null,
			onPlaying = null,
			loop = false,
			onFinish = null,
			getBufferLength = null,
		} = { ...config };
		this._audio = new Audio(src);
		this._hls = null;
		this._audio.loop = loop;
		if (onLoaded) {
			this._audio.addEventListener("canplay", onLoaded);
		}
		if (onPlaying) {
			this._audio.addEventListener("playing", onPlaying);
		}
		if (onBuffering) {
			this._audio.addEventListener("waiting", onBuffering);
		}
		if (onFinish) {
			this._audio.addEventListener("ended", onFinish);
		}
		this._audio.addEventListener("timeupdate", (e) => {
			if (onTimeUpdate) {
				onTimeUpdate();
			}
			if (getBufferLength) {
				const buffered = this._audio.buffered;
				const duration = this._audio.duration;
				if (buffered.length > 0) {
					
						for (var i = 0; i < buffered.length; i++) {
							if (buffered.start(buffered.length - 1 - i) < this._audio.currentTime) {
								let bufferLength =
									(buffered.end(buffered.length - 1 - i) / duration) * 100;
								let played = (this._audio.currentTime / duration) * 100;
								getBufferLength(played, bufferLength);				
								break;
							}
						}
					
				}
				
			}
		});
	}

	play(src) {
		if (this.isPlaying() && !src) {
			return;
		}

		if (!this._audio.src && !src) {
			throw new Error("empty src");
		}

		if (src) {
			if (this._hls) {
				this._hls.detachMedia();
				this._hls.stopLoad();
				this._hls.destroy();
				this._hls = null;
			}
			this._audio.src = src;
		}

		var promise;

		if (hls.isSupported() && this.isHLS()) {
			this._hls = new hls();
			this._hls.loadSource(src);
			this._hls.attachMedia(this._audio);
			this._hls.on(hls.Events.MANIFEST_PARSED, () => {
				promise = this._audio.play();
			});
		} else if (this._audio.canPlayType("application/vnd.apple.mpegurl")) {
			// native safari
			this._audio.addEventListener("loadedmetadata", () => {
				promise = this._audio.play();
			});
		} else {
			promise = this._audio.play();
		}

		if (promise !== undefined) {
			promise
				.then((_) => {})
				.catch((error) => {
					throw error;
				});
		}
	}

	pause() {
		this._audio.pause();
	}

	stop() {
		this._audio.pause();
		this._audio.currentTime = 0;
	}

	restart() {
		this._audio.pause();
		this._audio.currentTime = 0;
		this._audio.play();
	}

	unload() {
		this._audio.pause();
		this._audio.removeAttribute("src");
		this._audio.load();
	}

	isHLS() {
		return this._audio.src.split(".").pop() === "m3u8";
	}

	native() {
		return this._audio;
	}

	duration() {
		return this._hls ? "Infinity" : this._audio.duration;
	}

	isPlaying() {
		return !this._audio.paused;
	}

	current() {
		return this._audio.src;
	}

	currentTime() {
		return this._audio.currentTime;
	}

	seek(time) {
		this._audio.currentTime = time
	}

	loop() {
		this._audio.loop = !this._audio.loop
	}

	forward(time) {
		this._audio.currentTime += time
	}

	rewind(time) {
		this._audio.currentTime -= time
	}
}

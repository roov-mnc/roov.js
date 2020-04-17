const hls = require("hls.js/dist/hls.light");

export default class audio {
	constructor(config) {
		const { src = "", limit = 0, onLoaded = null } = { ...config };
		this._audio = new Audio(src);
		this._hls = null;
		if (onLoaded) {
			this._audio.addEventListener("canplay", onLoaded);
		}
	}

	play(src) {
		if (this.isPlaying() && !src) {
			return 
		}
		
		if (!this._audio.src && !src) {
			throw new Error("empty src");
		}

		if (src) {
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
			if (this._hls) {
				this._hls.destroy();
				this._hls = null;
			}
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
		return this._hls || this._audio.src.split(".").pop() === "m3u8";
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
}

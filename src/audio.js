import hls from "hls.js/dist/hls.light";

export default class audio {
	constructor(config) {
		// init audio
		this.initializeAudio(config);

		// init ads
		this.initializeAds(config);

		// setup event
		this.setupEvent(config);
	}

	initializeAudio({ src = "", loop = false, muted = false, id }) {
		if (id) {
			this._audio = document.getElementById(id);
		} else {
			this._audio = document.createElement("video");
		}
		this.src = src;
		this._audio.setAttribute("playsinline", "");
		this._audio.src = src;
		this._audio.loop = loop;
	}

	initializeAds({ withAds = false, adElement = "ad-container", adsURL }) {
		if (typeof google === "undefined") {
			return;
		}
		this._withAds = withAds;
		this._adElement = adElement;
		this._adsURL = adsURL;
		this._adsLoaded = false;
		if (withAds) {
			this.initializeIMA();
		}
	}

	setupEvent({
		onloaderror,
		onPlay,
		onLoaded,
		onPlaying,
		onBuffering,
		onFinish,
		onTimeUpdate,
		getBufferLength,
	}) {
		this.onloaderror = onloaderror;
		this._onPlay = onPlay;

		if (onPlay || this._withAds) {
			this._onPlay = onPlay;
			this._audio.addEventListener("play", (e) => {
				if (this._onPlay) {
					this._onPlay();
				}
				if (this._withAds) {
					this.loadAds(e);
				}
			});
		}

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
			this._onFinish = onFinish;
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
						if (
							buffered.start(buffered.length - 1 - i) < this._audio.currentTime
						) {
							let bufferLength =
								(buffered.end(buffered.length - 1 - i) / duration) * 100;
							let played = (this._audio.currentTime / duration) * 100;
							if (this._hls) {
								getBufferLength(0, 0);
							} else {
								getBufferLength(played, bufferLength);
							}
							break;
						}
					}
				}
			}
		});
	}

	initializeIMA() {
		console.log("initializing IMA");
		if (this._adsManager) {
			return;
		}

		this._adContainer = document.getElementById(this._adElement);
		this._adDisplayContainer = new google.ima.AdDisplayContainer(
			this._adContainer,
			this._audio,
		);
		this._adsLoader = new google.ima.AdsLoader(this._adDisplayContainer);

		this._audio.addEventListener("ended", () => {
			this._adsLoader.contentComplete();
		});

		this._adsLoader.addEventListener(
			google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
			(e) => {
				this.onAdsManagerLoaded(e);
			},
			false,
		);
		this._adsLoader.addEventListener(
			google.ima.AdErrorEvent.Type.AD_ERROR,
			(e) => this.onAdError(e),
			false,
		);

		var adsRequest = new google.ima.AdsRequest();
		adsRequest.adTagUrl = this._adsURL;

		adsRequest.linearAdSlotWidth = this._audio.clientWidth;
		adsRequest.linearAdSlotHeight = this._audio.clientHeight;
		adsRequest.nonLinearAdSlotWidth = this._audio.clientWidth;
		adsRequest.nonLinearAdSlotHeight = this._audio.clientHeight / 3;

		this._adsLoader.requestAds(adsRequest);
	}

	onAdsManagerLoaded(adsManagerLoadedEvent) {
		console.log("ads manager loaded");
		this._adsManager = adsManagerLoadedEvent.getAdsManager(this._audio);
		this._adsManager.addEventListener(
			google.ima.AdErrorEvent.Type.AD_ERROR,
			(e) => this.onAdError(e),
		);
		this._adsManager.addEventListener(
			google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
			() => {
				this.pause();
			},
		);

		this._adsManager.addEventListener(google.ima.AdEvent.Type.STARTED, () => {
			this.adsPlaying = true;
		});

		this._adsManager.addEventListener(google.ima.AdEvent.Type.COMPLETE, () => {
			this.adsPlaying = false;
			this._audio.src = this.src;
			this._playPromise = this._audio.play();
			this._playPromise.then(_ => {
			      this._audio.play()
			    })
			    .catch(error => {
			      // console.log("error during play", error)
			      this._audio.play()
			    });
		});
	}

	onAdError(adErrorEvent) {
		// Handle the error logging.
		console.log("error occured", adErrorEvent.getError());
		if (this._adsManager) {
			this._adsManager.destroy();
		}
	}

	loadAds(event) {
		if (this._adsLoaded) {
			return false;
		}

		this._adsLoaded = true;
		if (this._adDisplayContainer) {
			if (event) {
				event.preventDefault();
				this._audio.pause();
			}

			this._adDisplayContainer.initialize();
			var width = this._audio.clientWidth;
			var height = this._audio.clientHeight;
			try {
				this._adsManager.init(width, height, google.ima.ViewMode.NORMAL);
				this._adsManager.start();
			} catch (adError) {
				console.log("AdsManager could not be started", adError);
				this._adsManager = {};
				this._audio.play();
			}
		}
	}

	browserPlay() {
		// console.log("browserPlay")
		if (this._playPromise === undefined) {
			if (this._withAds) {
				try {
					this.loadAds();
				} catch (err) {
					// console.log("error occured", err);
					this._playPromise = this._audio.play();
				}
			} else {
				this._playPromise = this._audio.play();
			}
		} else {
			this._playPromise = this._audio.play();
		}
	}

	play(src) {
		if (this.adsPlaying) {
			if (this._adsManager) {
				if (Object.keys(this._adsManager).length != 0) {
					this._adsManager.resume();
				}
			}
			console.log("resume ads");
			return;
		}
		if (this.isPlaying() && !src) {
			console.error("can't play audio that already play");
			return;
		}

		if (!this._audio.src && !src) {
			console.error("empty src");
		}

		if (src) {
			this.src = src;
			if (this._hls) {
				this._hls.detachMedia();
				this._hls.stopLoad();
				this._hls.destroy();
				this._hls = null;
			}
			this._audio.src = src;
		}

		if (hls.isSupported() && this.isHLS()) {
			this._hls = new hls();
			this._hls.loadSource(src);
			this._hls.attachMedia(this._audio);
			this._hls.on(hls.Events.MANIFEST_PARSED, () => {
				this.browserPlay();
			});
			this._hls.on(hls.Events.ERROR, (event, data) => {
				if (this.onloaderror) {
					this.onloaderror(data.type);
				}
			});

			// return
		} else if (this._audio.canPlayType("application/vnd.apple.mpegurl")) {
			// native safari
			this._audio.addEventListener("loadedmetadata", () => {
				this.browserPlay();
			});

			// return
		}

		this.browserPlay();
	}

	pause() {
		this._audio.pause();
		if (this._playPromise !== undefined) {
			this._playPromise
				.then((_) => {
					this._audio.pause();
				})
				.catch((error) => {
					this._audio.pause();
				});
		} 

		// console.log("pause clicked")

		if (this._adsManager) {
			if (Object.keys(this._adsManager).length != 0) {
				this._adsManager.pause();
			}
		}

		try {
				this._audio.pause();
			} catch (err) {
				this._audio.pause();
			}
		
	}

	stop() {
		this.pause();
		this._audio.currentTime = 0;
	}

	restart() {
		this.pause();
		this._audio.currentTime = 0;
		this._audio.play();
	}

	unload() {
		this.pause();
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
		this._audio.currentTime = time;
	}

	loop() {
		this._audio.loop = !this._audio.loop;
	}

	muted() {
		if (this._audio.volume != 0) {
			this.volume(0);
		} else {
			this.volume(1);
		}
	}

	forward(time) {
		this._audio.currentTime += time;
	}

	volume(v) {
		if (this._adsManager) {
			if (Object.keys(this._adsManager).length != 0) {
				this._adsManager.setVolume(v);
			}
		}
		this._audio.volume = v;
	}

	rewind(time) {
		this._audio.currentTime -= time;
	}
}

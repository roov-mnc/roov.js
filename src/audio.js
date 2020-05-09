import hls from "hls.js/dist/hls.light";

export default class audio {
	constructor(config) {
		const {
			src = "",
			onLoaded = null,
			onTimeUpdate = null,
			onBuffering = null,
			onPlaying = null,
			onPlay = null,
			loop = false,
			onFinish = null,
			getBufferLength = null,
			crossorigin = "",
			muted = false,
			onloaderror = null,
			withAds = false,
			adElement = "ad-container",
			adsURL = "",
			playerId = "",
			onAdStart = () => console.log("ad start"),
			onAdFinish = () => console.log("ad end"),
		} = { ...config };
		// this._audio = new Audio(src);
		this.onAdStart = onAdStart
		this.onAdFinish = onAdFinish
		this._audio = document.createElement("video");
		if (withAds) {
			this._withAds = true;
		}
		if (src) {
			this._audio.src = src;
		}
		this._hls = null;
		// ads
		this._adsLoaded = false;
		this._adContainer = null;
		this._adElement = adElement;
		this._adDisplayContainer;
		this._adsLoader;
		this._adsURL = adsURL;
		this._adsManager;

		// audio property
		this._audio.loop = loop;
		this._audio.muted = muted;
		this.onloaderror = onloaderror;
		if (crossorigin) {
			this._audio.crossorigin = crossorigin;
		}
		if (onPlay || withAds) {
			this._onPlay = onPlay
			this._audio.addEventListener("play", (e) => {
				if (this._onPlay) {
					this._onPlay();
				}
				if (withAds) {
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
		// if (this.initializedIMA) {
		// 	return
		// }
		console.log("initializing IMA");
		this._adContainer = document.getElementById(this._adElement);
		this._adDisplayContainer = new google.ima.AdDisplayContainer(
			this._adContainer,
			this._audio,
		);
		this._adsLoader = new google.ima.AdsLoader(this._adDisplayContainer);
		this._audio.addEventListener("ended", () => {
			if (this._onFinish) {
				this._onFinish();
			}
			this._adsLoader.contentComplete();
		});

		this._adsLoader.addEventListener(
			google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
			(e) => this.onAdsManagerLoaded(e),
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

		// Pass the request to the adsLoader to request ads
		this._adsLoader.requestAds(adsRequest);
		// this.initializedIMA = true;
	}

	onAdsManagerLoaded(adsManagerLoadedEvent) {
		// Instantiate the AdsManager from the adsLoader response and pass it the video element
		this._adsManager = adsManagerLoadedEvent.getAdsManager(this._audio);
		this.onAdStart()
		this._adsManager.addEventListener(
			google.ima.AdErrorEvent.Type.AD_ERROR,
			(e) => onAdError(e),
		);
		this._adsManager.addEventListener(
			google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
			() => {
				// console.log("pause requested")
				this.pause()
			},
		);
		this._adsManager.addEventListener(
			google.ima.AdEvent.Type.CONTENT_PAUSE_REQUESTED,
			() => {
				// console.log("pause requested")
				this.pause()
			},
		);
		this._adsManager.addEventListener(
			google.ima.AdEvent.Type.COMPLETE,
			() => {
				this._audio.play()
				this._adsComplete = true
				this.onAdFinish()
			},
		);

		this._audio.play();
		
	}

	onAdError(adErrorEvent) {
		// Handle the error logging.
		console.log(adErrorEvent.getError());
		if (this._adsManager) {
			this._adsManager.destroy();
		}
	}

	loadAds(event) {
		// Prevent this function from running on if there are already ads loaded
		if (this._adsLoaded) {
			return;
		}
		this._adsLoaded = true;

		// Prevent triggering immediate playback when ads are loading
		if (event) {	
			event.preventDefault();
		} else {

		}

		console.log("loading ads");
		this._audio.load();
		this._adDisplayContainer.initialize();

		var width = this._audio.clientWidth;
		var height = this._audio.clientHeight;
		try {
			this._adsManager.init(width, height, google.ima.ViewMode.NORMAL);
			this._adsManager.start();
		} catch (adError) {
			// Play the video without ads, if an error occurs
			console.log("AdsManager could not be started");
			this._audio.play();
		}
	}

	play(src) {
		if (this._adsManager && !this._adsComplete) {
			this._adsManager.resume()
			return
		}
		
		if (this.isPlaying() && !src) {
			throw new Error("can't play audio that already play");
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
			this._adsManager;
			this._audio.src = src;
		} else {
			if (!this._adsComplete) {
				if (this._adsManager) {
				this._adsManager.resume()
			}	
			}
			
		}

		var promise;

		if (hls.isSupported() && this.isHLS()) {
			this._hls = new hls();
			this._hls.loadSource(src);
			this._hls.attachMedia(this._audio);
			this._hls.on(hls.Events.MANIFEST_PARSED, () => {
				if (this._withAds && !this._adsComplete) {
					this.initializeIMA();
				} else {
					promise = this._audio.play();
				}
			});
			this._hls.on(hls.Events.ERROR, (event, data) => {
				if (this.onloaderror) {
					this.onloaderror(data.type);
				}
			});
		} else if (this._audio.canPlayType("application/vnd.apple.mpegurl")) {
			// native safari
			this._audio.addEventListener("loadedmetadata", () => {
				if (this._withAds && !this._adsComplete) {
					this.initializeIMA();
				} else {
					// this._audio.play();
					promise = this._audio.play();
				}
			});
		}

		if (this._withAds && !this._adsComplete) {
			this.initializeIMA();
		} else {
			promise = this._audio.play();
		}

		if (promise !== undefined) {
			promise
				.then((_) => {})
				.catch((error) => {
					throw new Error(error);
					if (this.onloaderror) {
						this.onloaderror(error);
					}
				});
		}
	}

	pause() {
		this._audio.pause();
		if (this._adsManager) {
			this._adsManager.pause()
		}
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
		this._audio.currentTime = time;
	}

	loop() {
		this._audio.loop = !this._audio.loop;
	}

	muted() {
		this._audio.muted = !this._audio.muted;
	}

	forward(time) {
		this._audio.currentTime += time;
	}

	volume(v) {
		this._audio.volume = v;
	}

	rewind(time) {
		this._audio.currentTime -= time;
	}
}

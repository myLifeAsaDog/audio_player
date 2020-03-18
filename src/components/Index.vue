<template>
  <main role="main">
    <visualizer ref="visualizer" :analyser-node="analyserNode" />
    <time-count
      :current="elapsedTime"
      :duration="decodedAudioBuffer.duration"
    />
    <time-meter
      :min="0"
      :max="decodedAudioBuffer.duration"
      :value="elapsedTime"
    />
    <section class="controlPanel">
      <div>
        <p class="repeatBtn">REPEAT</p>
        <p class="toolsBtn">TOOLS</p>
        <input class="fileUploadBtn" type="file" accept="audio/*" @change="handleFileChange" />
      </div>
      <button :class="buttonClass" class="button" type="button"
        @click="handleCickResumeAndSuspend">
        <span>{{ buttonLabel }}</span></button>
      <div class="volumeGuage">
        <label class="volumeLabel" for="volume">volume</label>
        <input
          type="range" name="volume" min="0" max="1" step="0.1"
          :value="gainNode.gain.value"
          @change="handleVolume"
        />
      </div>
    </section>
    <aside>
      <label for="pan">pan</label>
      <input
        type="range" name="pan" min="-1" max="1" step="0.1"
        :value="panNode.pan.value"
        @change="handlePan"
      />
      <span>{{ Math.floor(panNode.pan.value * 100) }}</span>
    </aside>
  </main>
</template>

<script>
import Visualizer from './Visualizer'
import TimeCount from './TimeCount'
import TimeMeter from './TimeMeter'

const DEFAULT_VOLUME = 0.3
const DEFAULT_PAN = 0
const DEFAULT_PLAYBACK_RATE = 1.0
const ANALYSER_FFT_SIZE = 64

export default {
  name: 'index',
  components: { Visualizer, TimeCount, TimeMeter },
  computed: {
    buttonClass () {
      return this.isPlaying ? 'pauseBtn' : 'playBtn'
    }
  },
  data () {
    return {
      audioContext: null,
      source: null,
      decodedAudioBuffer: {
        sampleRate: 0,
        duration: 0,
        numberOfChannels: 0
      },
      elapsedTime: 0,
      offsetTme: 0,
      gainNode: null,
      panNode: null,
      analyserNode: null,
      isPlaying: false,
      currentTimeId: null
    }
  },
  created () {
    this.initialize()
  },
  methods: {
    initialize () {
      this.audioContext = new AudioContext()
      this.audioContext.suspend()
      this.createGain()
      this.createPan()
      this.createAnalyser()
    },
    createGain () {
      this.gainNode = this.audioContext.createGain()
      this.gainNode.gain.value = DEFAULT_VOLUME
      this.gainNode.connect(this.audioContext.destination)
    },
    createPan () {
      this.panNode = this.audioContext.createStereoPanner()
      this.panNode.pan.value = DEFAULT_PAN
      this.panNode.connect(this.audioContext.destination)
    },
    createAnalyser () {
      this.analyserNode = this.audioContext.createAnalyser()
      this.analyserNode.fftSize = ANALYSER_FFT_SIZE
      this.analyserNode.connect(this.audioContext.destination)
    },
    getCurrentTime () {
      /** リピート再生対応用 */
      if (this.elapsedTime > this.decodedAudioBuffer.duration) {
        this.offsetTme = this.offsetTme + this.decodedAudioBuffer.duration
      }
      this.elapsedTime =
        Math.ceil(this.audioContext.currentTime - this.offsetTme)
      this.currentTimeId = requestAnimationFrame(this.getCurrentTime)
    },
    async loadAudio (audioBuffer) {
      this.decodedAudioBuffer =
        await this.audioContext.decodeAudioData(audioBuffer)
      this.source = this.audioContext.createBufferSource()
      this.source.buffer = this.decodedAudioBuffer
      this.source.loop = true
      this.source.loopEnd = this.decodedAudioBuffer.duration
      this.source.playbackRate.value = DEFAULT_PLAYBACK_RATE
      this.source
        .connect(this.gainNode)
        .connect(this.panNode)
        .connect(this.analyserNode)
        .connect(this.audioContext.destination)
      this.source.start()
      this.audioContext.resume()

      this.getCurrentTime()
      this.offsetTme = this.audioContext.currentTime

      this.$refs.visualizer.renderCanvas()
      this.isPlaying = true
    },
    handleVolume (e) {
      this.gainNode.gain.value = e.target.value
    },
    handlePan (e) {
      this.panNode.pan.value = e.target.value
    },
    handleCickResumeAndSuspend () {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
        this.isPlaying = true
      } else {
        this.audioContext.suspend()
        this.isPlaying = false
      }
    },
    handleFileChange (e) {
      const fileReader = new FileReader()
      fileReader.readAsArrayBuffer(e.target.files[0])

      fileReader.onload = () => {
        if (this.source) {
          this.source.stop()
          cancelAnimationFrame(this.currentTimeId)
          this.$refs.visualizer.stopRender()
        }
        const arrayBuffer = fileReader.result
        this.loadAudio(arrayBuffer)
      }
    }
  }
}
</script>

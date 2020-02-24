<template>
  <main role="main">
    <canvas ref="visualizer" width="230" height="100"></canvas>
    <TimeCount :current="elapsedTime" :duration="decodedAudioBuffer.duration" />
    <button type="button"
      @click="handleCickResumeAndSuspend">{{ buttonLabel }}</button>
    <p>
      <input
        type="file" accept="audio/*"
        @change="handleFileChange"
      />
    </p>
    <div>
      <label for="volume">volume</label>
      <input
        type="range" name="volume" min="0" max="1" step="0.1"
        :value="gainNode.gain.value"
        @change="handleVolume"
      />
      <span>{{ Math.floor(gainNode.gain.value * 100) }}/100</span>
    </div>
    <div>
      <label for="pan">pan</label>
      <input
        type="range" name="pan" min="-1" max="1" step="0.1"
        :value="panNode.pan.value"
        @change="handlePan"
      />
      <span>{{ Math.floor(panNode.pan.value * 100) }}</span>
    </div>
  </main>
</template>

<script>
import TimeCount from './TimeCount'

const DEFAULT_VOLUME = 0.3
const DEFAULT_PAN = 0
const DEFAULT_PLAYBACK_RATE = 1.0
const ANALYSER_FFT_SIZE = 64
const VISUALIZER_SIZE = 21 /** num. of visualizer bar  */

export default {
  name: 'index',
  components: { TimeCount },
  computed: {
    visualizerSize () {
      return VISUALIZER_SIZE
    },
    buttonLabel () {
      return this.isPlaying ? 'PAUSE' : 'PLAY'
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
      canvasContext: null,
      isPlaying: false,
      currentTimeId: null,
      visualizerId: null
    }
  },
  created () {
    this.initialize()
  },
  mounted () {
    this.canvasContext = this.$refs.visualizer.getContext('2d')
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
      console.log(this.audioContext)
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

      this.renderCanvas()
      this.isPlaying = true
    },
    renderCanvas () {
      const spectrums = new Uint8Array(this.analyserNode.frequencyBinCount)
      this.analyserNode.getByteFrequencyData(spectrums)

      const clientHeight = this.$refs.visualizer.height
      const clientWidth = this.$refs.visualizer.width
      this.canvasContext.clearRect(0, 0, clientWidth, clientHeight)
      this.canvasContext.fillStyle = '#2e8b57'

      for (let i = 0; i < VISUALIZER_SIZE; i++) {
        const barHeight = spectrums[i] / 3
        this.canvasContext.fillRect(i * 11, clientHeight - barHeight, 10, barHeight)
      }

      this.visualizerId = requestAnimationFrame(this.renderCanvas)
    },
    handleVolume (e) {
      this.gainNode.gain.value = e.target.value
    },
    handlePan (e) {
      this.panNode.pan.value = e.target.value
    },
    handleCickResumeAndSuspend () {
      console.log(this.source)
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
          cancelAnimationFrame(this.visualizerId)
        }
        const arrayBuffer = fileReader.result
        this.loadAudio(arrayBuffer)
      }
    }
  }
}
</script>
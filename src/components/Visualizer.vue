<template>
  <canvas width="230" height="100"></canvas>
</template>
<script>
const VISUALIZER_SIZE = 21 /** num. of visualizer bar  */

export default {
  name: 'visualizer',
  props: { analyserNode: AnalyserNode },
  data () {
    return {
      visualizerId: null,
      canvasContext: null
    }
  },
  mounted () {
    this.canvasContext = this.$el.getContext('2d')
  },
  methods: {
    renderCanvas () {
      const spectrums = new Uint8Array(this.analyserNode.frequencyBinCount)
      this.analyserNode.getByteFrequencyData(spectrums)

      const clientHeight = this.$el.height
      const clientWidth = this.$el.width
      this.canvasContext.clearRect(0, 0, clientWidth, clientHeight)
      this.canvasContext.fillStyle = '#2e8b57'

      for (let i = 0; i < VISUALIZER_SIZE; i++) {
        const barHeight = spectrums[i] / 2.56
        this.canvasContext.fillRect(i * 11, clientHeight - barHeight, 10, barHeight)
      }

      this.visualizerId = requestAnimationFrame(this.renderCanvas)
    },
    stopRender () {
      cancelAnimationFrame(this.visualizerId)
    }
  }
}
</script>

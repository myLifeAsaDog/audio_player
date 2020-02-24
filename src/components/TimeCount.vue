<template>
  <section class="time-display">
    <p>{{ elapsedTime.min|zeroPadding }}:{{ elapsedTime.sec|zeroPadding }} / {{ durationTime.min|zeroPadding }}:{{ durationTime.sec|zeroPadding }}</p>
  </section>
</template>

<script>
import { getTimeFromSeconds } from '../utils/getTimeFromSeconds'

export default {
  name: 'time-count',
  props: {
    current: Number,
    duration: Number
  },
  computed: {
    elapsedTime () {
      return getTimeFromSeconds(this.current)
    },
    durationTime () {
      return getTimeFromSeconds(this.duration)
    }
  },
  filters: {
    zeroPadding (value) {
      return ('00' + value).slice(-2)
    }
  }
}
</script>

<template>
  <div class="time-meter">
    <div class="time-bar" :style="meterWidth"></div>
  </div>
</template>
<script>
export default {
  name: 'time-meter',
  props: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    value: { type: Number, required: true }
  },
  computed: {
    meterWidth () {
      return {
        width: `${Math.floor((this.value / this.max) * 100)}%`
      }
    }
  }
}
</script>

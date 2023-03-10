<template>
    <!-- <svg ref="container" width="5000" height="5000" >
        <text v-for="i in 4" :y="i*100">AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc</text>
    </svg> -->
    <!-- <svg ref="container" width="5000" height="5000" >
        <text v-for="i in 40" :x="i%10 * 270" :y="50+(i/10)*100">AaBbCc</text>
    </svg> -->
    <div ref="container" style="position:fixed" width="5000" height="5000" >
        <p v-for="i in 40" :style="{left:i%10 * 1270 +'px', top:(i/10)*300 +'px'}">AaBbCc</p>
    </div>
</template>

<script setup>
import createPanZoom from 'panzoom';
import { ref, onMounted } from 'vue';
/* ---------------- props ------------------- */
/* ---------------- data -------------------- */
/* ---------------- refs -------------------- */
const container = ref(null);
/* ---------------- computed ---------------- */
/* ---------------- functions --------------- */
/* ---------------- watchers ---------------- */


const panzoomOptions = {
  smoothScroll: false,
  zoomDoubleClickSpeed: 1,
  // disable keyboard events
  filterKey: function(/* e, dx, dy, dz */) {
    // don't let panzoom handle this event:
    return true;
  },
  enableTextSelection: true,
}

let panzoom;
onMounted(() => {    
    panzoom  = createPanZoom(container.value, panzoomOptions);
})
</script>

<style>
svg {
    position: fixed;
}
svg text {
    fill: white;
    font-size: 55pt;
    text-rendering: optimizeSpeed;
}
p {
    font-size: 255pt;
    position:fixed;
    text-rendering: optimizeSpeed;
}
</style>
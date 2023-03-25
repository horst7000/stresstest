<template>
    <!-- <svg ref="container" width="5000" height="5000" >
        <text v-for="i in 4" :y="i*100">AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc AaBbCc</text>
    </svg> -->
    <!-- <svg ref="container" width="5000" height="5000" >
        <text v-for="i in 40" :x="i%10 * 270" :y="50+(i/10)*100">AaBbCc</text>
    </svg> -->
    <div ref="container" style="position:fixed" >
        <div>
            <div v-for="i in count" 
                :style="{
                    position: 'fixed',
                    background: '#3678bf',
                    width:  elWidth+'px',
                    left: (i-1)%split * (elWidth+elSpace) +'px',
                    top: ((i-1)/split)*elHeight +'px',
                    borderRadius:  '14px',
                    padding: '10px',
                    boxShadow: `#00000040 14px 14px 4px`,
                }">

                <!-- small rect -->
                <div
                :style="{
                    background: '#121324',
                    width: '14px',
                    height: '14px',
                    float: 'right',
                    borderRadius: '4px',
                }"></div>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit.<br/><br/> Maxime fuga explicabo soluta commodi accusantium ducimus, natus <br/><br/> <br/><br/> minima enim dolorum beatae iste. Ab ad possimus libero omnis odio nam quasi earum!</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import createPanZoom from 'panzoom';
import { ref, onMounted } from 'vue';
import fastdom from 'fastdom';

/* ---------------- props ------------------- */
/* ---------------- data -------------------- */
/* ---------------- refs -------------------- */
const container = ref(null);
const count     = 200;
const elWidth   = 1080;
const elSpace   = elWidth*0.4;
const elHeight  = 2080;
const split     = Math.round(Math.sqrt(count*elHeight/(elWidth+elSpace)));
/* ---------------- computed ---------------- */
/* ---------------- functions --------------- */
let scl = 0.05;
let tt = 0;
function transformABit(t) {
  tt++;
  scl += 0.002*Math.sin(tt/20);
  fastdom.mutate(() => {
    if(container.value)
    container.value.style.transform = "scale("+scl+")";
  })
  window.requestAnimationFrame(transformABit);
}
  
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
    // window.requestAnimationFrame(transformABit);
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
    font-size: 55pt;
    text-rendering: optimizeSpeed;
    user-select: none;
    margin: 0;
}
</style>
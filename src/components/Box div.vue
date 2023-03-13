<template>
  <!-- (DEBUG) GRID -->
  <div
    v-if="box.id.includes(':')"
    :data-key="box.id"
    :style="{
      position: 'fixed',
      border: 24*box.scale+'px solid #00ffff11',
      width: box.width * box.scale +'px',
      height: box.width * box.scale +'px',
      left: box.x +'px',
      top: box.y +'px'
    }"/>
  <div v-for="i in 36"
    v-if="box.id.includes(':')"
    :data-key="box.id"
    :style="{
      position: 'fixed',
      border: 4*box.scale+'px solid #00ffff11',
      width:  box.width * box.scale / 6 +'px',
      height:  box.width * box.scale / 6 +'px',
      left:  box.x + (i-1)%6 * box.width * box.scale / 6 +'px',
      top: box.y + Math.floor((i-1)/6) * box.width * box.scale / 6 +'px'
    }"/>
    <!-- (END DEBUG) -->

  <div
    v-if="!box.id.includes(':')"
    :data-key="box.id"
    :style="{
      position: 'fixed',
      background: '#3678bf',
      width:  0.8*box.width * box.scale +'px',
      left:  box.x +'px',
      top: box.y +'px',
      borderRadius:  140 * box.scale +'px',
      fontSize: 140*box.scale+'pt',
      zIndex: Math.round(1/box.scale),
      padding: 105*box.scale+'px',
      transition: 'opacity 0.1s',
      animation: animation,
      boxShadow: `#00000040 ${150 * box.scale}px ${150 * box.scale}px 4px`,
      opacity: box.opacity,
    }">
    <!-- @click="() => deleteBox(box.id)" -->

    <!-- small rect -->
    <div
      :style="{
        right: 20*box.scale +'px',
        top: 20*box.scale +'px',
        background: '#121324',
        width: 120*box.scale +'px',
        height: 120*box.scale +'px',
        float: 'right',
        borderRadius: 15*box.scale+'px',
      }"
      @click="() => deleteBox(box.id)"
      @touchstart="() => deleteBox(box.id)"></div>
    <p
      ref="contentEl"
      :style="{
        margin: 0,
        cursor:  'default',
        userSelect:  'none',
        textRendering: 'optimizeSpeed',
      }"
      spellcheck="false"
      contenteditable="true"
      :innerText="box.text"
      @input="saveContentDelayed"
      v-once
      @blur="() => $emit('resumePanzoom')"
      @mousedown="holdFocusBack"></p>
  </div>
</template>

<script setup>
import { onMounted, onUpdated, ref, watch } from 'vue';
import { deleteBox, updateBox } from '../firebase'

/* ---------------- props ------------------- */
const props = defineProps({
  box : Object,
  panzoom : Object,
})

const emit = defineEmits(["pausePanzoom", "resumePanzoom"])

/* ---------------- data -------------------- */
const SAVE_DELAY    = 700;


/* ---------------- refs -------------------- */
const contentEl = ref(null);
const animation = ref('pop 0.6s ease')


/* ---------------- computed ---------------- */
/* ---------------- functions --------------- */
let saveContentTimer;
let localText;
function saveContentDelayed() {
  clearTimeout(saveContentTimer);
  saveContentTimer = setTimeout(() => {
    saveContent();
  }, SAVE_DELAY);
}
function saveContent() {
  if(contentEl.value.innerText.length == 0) {
    contentEl.value.innerText = "\n";
  }
  localText = contentEl.value.innerText;
  updateBox(props.box.id, {text : contentEl.value.innerText})
}

/* Click and immediately drag should not activate focus. If element is already focused
 * the event is needed to move textcursor. Therefore watch the status at mousdown.
 */
function holdFocusBack(e) {
  document.activeElement == contentEl.value ? null : e.preventDefault()
}

/* ---------------- watchers ---------------- */
watch(() => props.box.text, () => {
  // only change innerText if external change happened (prop changed)
  // otherwise cursor jumps to text begin
  if(localText != props.box.text) {
    contentEl.value.innerText = props.box.text;
  }
})


onMounted(() => {
  // !props.box.id.includes(':') && console.log("box mounted");
  setTimeout(() => animation.value = 'none', 600);
})

</script>

<style>
@keyframes pop {
  from{
    opacity: 0;
    transform: scale(0.5);
  }
  30% {
    /* opacity: 0.7; */
    transform: scale(1.05);
  }
  60% {
    /* opacity: 1; */
    transform: scale(0.97);
  }
  to {
    /* opacity: 1; */
    transform: scale(1);
  }
}
</style>
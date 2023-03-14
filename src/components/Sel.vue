<template>
    <div
    v-if="dim.w > 0"
    :style="{
      position: 'fixed',
      border: '1px solid white',
      width: dim.w +'px',
      height: dim.h +'px',
      left: dim.x-1 +'px',
      top: dim.y-1 +'px',
      zIndex: 1,
      pointerEvents: 'none',
    }">
      <div
        v-if="dim.w > 0"
        :style="{
        background: '#0d1316',
        width:  '60px',
        height: '150px',
        borderRadius: '15px',
        float: 'right',
        marginRight: '-65px',
        zIndex: 1,
        pointerEvents: 'auto',
      }">
      <button
        style="width: 48px; height: 48px; margin: 5px; padding: 3px;"
        @click="delBoxes"
        @touchstart="delBoxes">
        <img src="../assets/delete.svg">
      </button>
      <button
        style="width: 48px; height: 48px; margin: 5px; padding: 7px;">
        <img style="width: 28px; height: 28px; border-radius: 20px; background: #3678bf; border: 2px solid white;"/>
      </button>
      
      </div>
    </div>
</template>

<script setup>
import { deleteBox, updateBox } from '../firebase'

/* ---------------- props ------------------- */
const props = defineProps({
    dim: Object,
    keys: Array,
})
const emit = defineEmits(['dirtied', 'reset']);
/* ---------------- data -------------------- */
/* ---------------- refs -------------------- */
/* ---------------- computed ---------------- */

/* ---------------- functions --------------- */
function delBoxes() {
    props.keys.forEach((key) => {
        deleteBox(key);
    })
    emit('reset');
}
/* ---------------- watchers ---------------- */

</script>

<style>
</style>
<template>
  <!-- (DEBUG) GRID -->
  <rect
    v-if="box.id.includes(':')"
    :data-key="box.id"
    style="fill: none;stroke: aqua;stroke-width: 1;"
    :width="box.width * box.scale"
    :height="box.width * box.scale"
    :x="box.x"
    :y="box.y"/>
  <rect v-for="i in 36"
    v-if="box.id.includes(':')"
    :data-key="box.id"
    style="fill: none;stroke: aqua;stroke-width: 1;stroke-opacity: 0.2;"
    :width="box.width * box.scale / 6"
    :height="box.width * box.scale / 6"
    :x="box.x + (i-1)%6 * box.width * box.scale / 6"
    :y="box.y + Math.floor((i-1)/6) * box.width * box.scale / 6"/>
    <!-- (END DEBUG) -->

  <rect
    v-if="!box.id.includes(':')"
    :data-key="box.id"
    style="fill:black;fill-opacity:0.22;"
    :width="0.7 * box.width * box.scale"
    :height="0.7 * box.height * box.scale"
    :x="180*box.scale + box.x"
    :y="180*box.scale + box.y"
    :ry="190 * box.scale"/>

  <rect
    v-if="!box.id.includes(':')"
    :data-key="box.id"
    style="fill:#3678bf;"
    :width="0.7*box.width * box.scale"
    :height="0.7*box.height * box.scale"
    :x="box.x"
    :y="box.y"
    :ry="190 * box.scale"
    @contextmenu="() => deleteBox(box.id)"/>
  <text
    v-if="!box.id.includes(':')"
    style="fill:#ffffff;"
    :style="{fontSize: 200*box.scale+'pt'}"
    cursor= "default"
    word-wrap= "break-word"
    user-select= "none"
    :x="80*box.scale+box.x"
    :y="330*box.scale+box.y"
    text-rendering="optimizeSpeed">{{box.text}}</text>
</template>

<script setup>
import { onUpdated } from 'vue';
import { deleteBox } from '../firebase'

/* ---------------- props ------------------- */
const props = defineProps({
  box : Object,
})
onUpdated(() => {
  console.log("updated ");
})

/* ---------------- data -------------------- */
/* ---------------- refs -------------------- */
/* ---------------- computed ---------------- */
/* ---------------- functions --------------- */
/* ---------------- watchers ---------------- */
</script>

<style>
</style>
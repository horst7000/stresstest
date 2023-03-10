<template>
  <p
    style="position: fixed; left: 55%; background: #242424; z-index: 1; margin: 0;"
    @click="() => showGrid = !showGrid"
    @touchstart="() => showGrid = !showGrid">
    {{ posChunk }} {{ Math.floor(posDecX*100)/100 }} {{ Math.floor(posDecY*100)/100 }} {{ Object.keys(renderedBoxes).length }}
  </p>
  <button
    style="position: fixed; width: 40px; height: 40px; z-index: 1;"
    @click="goToStart"
    @touchstart="goToStart">
  </button>
  <div
    ref="container"
    style="position: fixed; will-change: transform; width: 100%; height: 100%;"
    @dblclick="createNewBox"
    @touchstart="createBoxAtDoubleTap">
    
    <Box v-for="b, key in renderedBoxes" :box="b" :panzoom="panzoom" :key="key"></Box>
    <!-- TODO panzoom pause/resume enums -->
  
  </div>
  </template>
  
  <script setup>
  import createPanZoom from 'panzoom';
  import { useCollection } from 'vuefire';
  import { boxesCollection, createBox } from '../firebase';
  import { onMounted, onUnmounted, ref, watchEffect } from 'vue';
  import { chunkPlusDelta, chunkZoomOutAtZero, chunkDeltaToZero, chunkZoomInAtZero } from '../utils/chunkArithmetic';
  import fastdom from 'fastdom';
  import Box from './Box div.vue';
  
  const FACTOR      = 6;  // in [3, 6]
  const MID_SYMBOL  = "f"
  const searchDepth = 3;

  const container = ref(null);
  const touched   = ref(false);
  const moving    = ref(false);
  const chunkLength = ref(3e3);
  const chunkGraph = ref({});
  const boxes     = useCollection(boxesCollection);
  const renderedBoxes = ref({});
  const windowSize  = ref({w: 1, h: 1});
  const showGrid = ref(false);

  // pos:
  const posChunkDefault = "1:"+MID_SYMBOL
  const posDecXDefault = 0.5
  const posDecYDefault = 0.3
  const posChunk  = ref(posChunkDefault);
  const posDecX   = ref(posDecXDefault);
  const posDecY   = ref(posDecYDefault);
  const posScale  = ref(1);

  /* ---------------- computed ---------------- */  
  /* ---------------- functions --------------- */  
  function offsetUpdate() {
    let { x, y, scale } = panzoom.getTransform();
    if(x!=0 || y!=0 || scale != 1) {
      resetPanzoom(x,y,scale);
      updatePos(-x,-y,scale);
    }
  }
  
  function resetPanzoom(x,y,scale) {  
    panzoom.moveTo(0,0);
    panzoom.zoomTo(0,0,1/scale);
    fastdom.mutate(() => container.value.style.transform = "matrix(1,0,0,1,0,0)");
  }
  
  function updatePos(dx,dy,scaleFactor) {      
    let pScale = posScale.value;
    let pDecX  = posDecX.value;
    let pDecY  = posDecY.value;
    let pChunk = posChunk.value;
    
    // zoom
    pScale *= scaleFactor;
    if(pScale < 1/FACTOR) {
      let delta = chunkDeltaToZero(pChunk);
      pDecX += delta.dx;
      pDecY += delta.dy;
      pChunk = chunkZoomOutAtZero(pChunk);
      pScale *= FACTOR;
      pDecX /= FACTOR;
      pDecY /= FACTOR;
    } else if (pScale > 1) {
      pScale /= FACTOR;
      pDecX *= FACTOR;
      pDecY *= FACTOR;
      pChunk = chunkZoomInAtZero(pChunk);
    }
    pDecX += dx/(pScale*chunkLength.value);
    pDecY += dy/(pScale*chunkLength.value);
  
    // pan
    let dxInt = 0;
    let dyInt = 0;
    if(pDecX > 1 || pDecX < 0 ) {
      dxInt = Math.floor(pDecX);
      pDecX -= dxInt;
    }
    if(pDecY > 1 || pDecY < 0) {
      dyInt = Math.floor(pDecY);
      pDecY -= dyInt;
    }
    if(dxInt || dyInt) {
      pChunk = chunkPlusDelta(pChunk, dxInt, dyInt);
    }
  
    posScale.value  = pScale;
    posDecX.value   = pDecX;
    posDecY.value   = pDecY;
    posChunk.value  = pChunk;
  }

  function goToStart() {
    console.log("btn");
    posChunk.value = posChunkDefault
    posDecX.value  = posDecXDefault
    posDecY.value  = posDecYDefault
    posScale.value = 1;
  }

  function posAtXYAndDepth(screenX, screenY, depth) {
    // only for positive depth (zoom in)
    if(depth < 0) console.warn("posAtXYAndDepth: only for positive depth (zoom in)")
    depth = Math.abs(depth);

    let chunk = posChunk.value;
    for(let i = 0; i < depth; i++) chunk = chunkZoomInAtZero(chunk);
    let scaledChunkLength = chunkLength.value * posScale.value / Math.pow(FACTOR, depth)
    let decX = posDecX.value * Math.pow(FACTOR, depth) + screenX / scaledChunkLength;
    let decY = posDecY.value * Math.pow(FACTOR, depth) + screenY / scaledChunkLength;
    chunk = chunkPlusDelta(chunk, Math.floor(decX), Math.floor(decY))
    decX = Math.round((decX % 1)*100)/100;
    decY = Math.round((decY % 1)*100)/100;
    return { decX, decY, chunk }
  }

  function createNewBox(e) {
    console.log(e);
    const { decX, decY, chunk } = posAtXYAndDepth(e.clientX, e.clientY, 1)
    console.log(decX, decY, chunk);
    createBox({
      x: decX-0.1,
      y: decY-0.1,
      chunk: chunk,
      scale: 1/(posScale.value*2),
      text:  'some text'
    })
  }

  let lastTouch;
  function createBoxAtDoubleTap(e) {
    if(e.touches.length > 1) {
      lastTouch = null;
      return;
    } 
    
    if(lastTouch && Math.abs(lastTouch.clientX - e.touches[0].clientX) + Math.abs(lastTouch.clientY - e.touches[0].clientY) < 10) {
      e.target.addEventListener('touchend', handleTouchEnd);
    }
    setTimeout(() => {
      e.target.removeEventListener('touchend', handleTouchEnd);
      lastTouch = null
    }, 500);
    lastTouch = e.touches[0];
    
    function handleTouchEnd() {
      lastTouch && createNewBox(lastTouch);
      lastTouch = null
    }
  }

  function addBoxesFromChunksDeep(chunk, chunkPosX, chunkPosY, depth) {
    if(!chunkGraph.value[chunk] || depth > searchDepth) return;
    
    let scaledChunkLength = chunkLength.value * posScale.value / Math.pow(FACTOR, depth);

    chunkGraph.value[chunk].indices.forEach(boxIndex => {
      const box = boxes.value[boxIndex];
      renderedBoxes.value[box.id] = {
        id:     box.id,
        x:      chunkPosX + scaledChunkLength * box.x,
        y:      chunkPosY + scaledChunkLength * box.y,
        width:  chunkLength.value,
        height: 0.5*chunkLength.value,
        scale:  box.scale * posScale.value / Math.pow(FACTOR, depth),
        chunk:  box.chunk,
        text:   box.text,
      };
    })

    scaledChunkLength /= FACTOR;
    Object.keys(chunkGraph.value[chunk].chunks).forEach(c => {
      const delta = chunkDeltaToZero(c);
      addBoxesFromChunksDeep(c, chunkPosX + delta.dx * scaledChunkLength, chunkPosY + delta.dy * scaledChunkLength, depth+1)
    });
  }

  // update Chunk Graph
  watchEffect(() => {
    console.log("chunk graph reset");
    chunkGraph.value = {}; // reset

    for (let i = 0; i < boxes.value.length; i++) {
      const b         = boxes.value[i];      
      chunkGraph.value[b.chunk]  = chunkGraph.value[b.chunk] || { indices: [], chunks: {} }
      chunkGraph.value[b.chunk].indices.push(i);
      
      let currentChunk = b.chunk;
      for(let z = 0; z <= searchDepth; z++) {
        let parentChunk = chunkZoomOutAtZero(currentChunk);
        chunkGraph.value[parentChunk] = chunkGraph.value[parentChunk] || { indices: [], chunks: {} }
        chunkGraph.value[parentChunk].chunks[currentChunk] = true;
        currentChunk = parentChunk;
      }
    }
  })

  // update renderedBoxes
  watchEffect(() => {
    const scaledChunkLength = chunkLength.value * posScale.value;
    const chunksX = Math.ceil( (windowSize.value.w)/scaledChunkLength + posDecX.value );
    const chunksY = Math.ceil( (windowSize.value.h)/scaledChunkLength + posDecY.value );
    
    renderedBoxes.value = {};

    let largeChunk = chunkPlusDelta(posChunk.value,-1,-1);
    for (let j = -1; j < chunksY+1; j++) {
      for (let i = -1; i < chunksX+1; i++) {
        addBoxesFromChunksDeep(
          largeChunk,
          scaledChunkLength * (-posDecX.value + i),
          scaledChunkLength * (-posDecY.value + j),
          0
        );
        // (DEBUG)
        if(showGrid.value) renderedBoxes.value[largeChunk] = {
          id:      largeChunk,
          x:       -scaledChunkLength * (posDecX.value - i), 
          y:       -scaledChunkLength * (posDecY.value - j),
          width:   chunkLength.value,
          height:  chunkLength.value,
          scale:   posScale.value,
          chunk:   largeChunk,
        }; // (END DEBUG)
        largeChunk = chunkPlusDelta(largeChunk,1,0);
      }
      largeChunk = chunkPlusDelta(largeChunk,-chunksX-2,1);
    }
  });



  const panzoomOptions = {
    smoothScroll: false,
    zoomDoubleClickSpeed: 1,
    // disable keyboard events
    filterKey: function(/* e, dx, dy, dz */) {
      // don't let panzoom handle this event:
      return true;
    },
    enableTextSelection: true,
    onTouch: (e) => {
      touched.value = true;
      return true;
    }
  }
  
  let timer;
  function onTransform() {
    clearTimeout(timer);
    timer = setTimeout(offsetUpdate, 100)
  }

  let panzoom;
  onMounted(() => {
    panzoom  = createPanZoom(container.value, panzoomOptions);
    panzoom.on('transform', onTransform);
    container.value.panzoom = panzoom;  
    
    windowSize.value.w = window.innerWidth;
    windowSize.value.h = window.innerHeight;
    window.addEventListener('resize', () => {
      windowSize.value.w = window.innerWidth;
      windowSize.value.h = window.innerHeight;
    })
  });
  
  onUnmounted(() => {
    panzoom.dispose();
  })

  </script>
  
  <style scoped>
   @media screen and (max-width: 600px) {
    svg rect {
      shape-rendering: optimizeSpeed;
    }
  }
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
    user-select: none;
    -moz-user-select: none;
  }
  /* .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.vue:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
  } */
  </style>
  
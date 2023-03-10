<template>
  <p style="position: absolute; left: 55%; background: #242424; z-index: 999; margin: 0;">
    {{ posChunk }} {{ Math.floor(posDecX*100)/100 }} {{ Math.floor(posDecY*100)/100 }} {{ Object.keys(renderedBoxes).length }}
  </p>
  <svg
    ref="container"
    style="position: fixed; will-change: transform;" :width="sideLength" :height="sideLength"
    @dblclick="createNewBox"
    @touchstart="createBoxAtDoubleTap">
    
    <Box v-for="b, key in renderedBoxes" :box="b" :key="key"></Box>
  
  </svg>
  </template>
  
  <script setup>
  import createPanZoom from 'panzoom';
  import { useCollection } from 'vuefire';
  import { boxesCollection, createBox } from '../firebase';
  import { onMounted, onUnmounted, ref, watch, watchEffect } from 'vue';
  import { chunkPlusDelta, chunkZoomOutAtZero, chunkDeltaToZero, chunkZoomInAtZero } from '../utils/chunkArithmetic';
  import fastdom from 'fastdom';
  import Box from './Box.vue';
  
  const FACTOR      = 6;  // in [3, 6]
  const MID_SYMBOL  = "f"
  const searchDepth = 3;
  const container = ref(null);
  const touched   = ref(false);
  const moving    = ref(false);
  const sideLength  = ref(6e3);
  const chunkLength = ref(3e3);
  const chunkGraph = ref({});
  const origin    = ref(sideLength.value/3);
  const boxes     = useCollection(boxesCollection);
  const renderedBoxes = ref({});
  const windowSize  = ref({w: 1, h: 1});
  // pos:
  const posChunk  = ref("1:"+MID_SYMBOL);
  const posDecX   = ref(0.5);
  const posDecY   = ref(0.3);
  const posScale  = ref(1);

  /* ---------------- computed ---------------- */  
  /* ---------------- functions --------------- */  
  function offUpdate() {
    const or = origin.value;
    let { x, y, scale } = panzoom.getTransform();
    if(x!=-or || y!=-or || scale != 1) {
      updateElements(x,y,scale);
      updatePos(-x-or*scale,-y-or*scale,scale);
    }
  }
  
  function updateElements(x,y,scale) {  
    if(!container) return;
    const or = origin.value;
    panzoom.moveTo(-or,-or);
    panzoom.zoomTo(-or,-or,1/scale);
    fastdom.mutate(() => container.value.style.transform = "matrix(1,0,0,1,"+-or+","+-or+")");    
    for (let i = 0; i < container.value.children.length; i++) {
      const element = container.value.children[i];
      if(element.tagName == 'text') {
        // fastdom.measure(() => {
          const elX = parseFloat(element.getAttribute('x'));
          const elY = parseFloat(element.getAttribute('y'));
          const elFs = parseFloat(element.style.fontSize);
          // fastdom.mutate(() => {
            element.setAttribute('x', elX * scale + x+or);
            element.setAttribute('y', elY * scale + y+or);
            element.style.fontSize = elFs * scale + 'pt';
        //   })
        // })
      } else {
        // fastdom.measure(() => {
          const elX = parseFloat(element.getAttribute('x'));
          const elY = parseFloat(element.getAttribute('y'));
          const elW = parseFloat(element.getAttribute('width'));
          const elH = parseFloat(element.getAttribute('height'));
          const elRy = parseFloat(element.getAttribute('ry') || 0);
          // fastdom.mutate(() => {
            element.setAttribute('x', elX * scale + x+or);
            element.setAttribute('y', elY * scale + y+or);
            element.setAttribute('width', elW * scale);
            element.setAttribute('height', elH * scale);
            element.setAttribute('ry', elRy * scale);
        //   })
        // })
      }
      validateSizeAndPos(element);
    }
  }
  
  function validateSizeAndPos(element) {
    const maxWidth = 2.5e3;
    const minWidth = 1;
    if(element.tagName == 'text') {
    } else {
      fastdom.measure(() => {
        const elX = parseFloat(element.getAttribute('x'));
        const elY = parseFloat(element.getAttribute('y'));
        const elW = parseFloat(element.getAttribute('width'))
        if(elW > maxWidth || elW < minWidth ||
          elX < 0 || elX > sideLength.value ||
          elY < 0 || elY > sideLength.value) {
            fastdom.mutate(() => delete renderedBoxes.value[element.dataset.key]);
        }
      });
    }
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
    decX = Math.round((decX % 1)*100)/100 - 0.1;
    decY = Math.round((decY % 1)*100)/100 - 0.1;
    return { decX, decY, chunk }
  }

  function createNewBox(e) {
    const { decX, decY, chunk } = posAtXYAndDepth(e.clientX, e.clientY, 1)
    createBox({
      x: decX,
      y: decY,
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
    }
  }

  function addBoxesFromChunksDeep(chunk, chunkPosX, chunkPosY, depth) {
    if(!chunkGraph.value[chunk] || depth > searchDepth) return;
    
    let scaledChunkLength = chunkLength.value * posScale.value / Math.pow(FACTOR, depth);

    chunkGraph.value[chunk].indices.forEach(boxIndex => {
      const box = boxes.value[boxIndex];
      renderedBoxes.value[box.id] = renderedBoxes.value[box.id] || {
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
    chunkGraph.value = {}; // reset
    renderedBoxes.value = {}; // reset

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
    
    renderedBoxes.value = {}; // (DEBUG) FORCE UPDATE OF BOXES

    const or       = origin.value;
    let largeChunk = posChunk.value;
    for (let j = 0; j < chunksY; j++) {
      for (let i = 0; i < chunksX; i++) {
        addBoxesFromChunksDeep(
          largeChunk,
          or + scaledChunkLength * (-posDecX.value + i),
          or + scaledChunkLength * (-posDecY.value + j),
          0
        );
        // (DEBUG)
        renderedBoxes.value[largeChunk] = renderedBoxes.value[largeChunk] || {
          id:      largeChunk,
          x:       or - scaledChunkLength * (posDecX.value - i), 
          y:       or - scaledChunkLength * (posDecY.value - j),
          width:   chunkLength.value,
          height:  chunkLength.value,
          scale:   posScale.value,
          chunk:   largeChunk,
        }; // (END DEBUG)
        largeChunk = chunkPlusDelta(largeChunk,1,0);
      }
      largeChunk = chunkPlusDelta(largeChunk,-chunksX,1);
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
    timer = setTimeout(offUpdate, 140)
  }

  let panzoom;
  onMounted(() => {
    panzoom  = createPanZoom(container.value, panzoomOptions);
    panzoom.moveTo(-origin.value,-origin.value);
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
  
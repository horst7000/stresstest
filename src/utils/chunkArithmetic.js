const FACTOR = 6;             // at least 3
const BASE   = FACTOR*FACTOR;
const EXPAND_POS = "f";       // can not be at edge

function charToNumber(c) {
    let n = c.charCodeAt() - 87;
    return n < 0 ? n + 39 : n
}

export function chunkPlusDelta(chunk, deltaChunksX, deltaChunksY) {
    let chunksplit  = chunk.split(":");
    let expanded    = parseInt(chunksplit[0]);
    let expandedStr = "";
    let chunkarr    = chunksplit[1].split("");
    let carryX      = 0; // addition
    let borrowX     = 0; // substraction
    let carryY      = 0; // addition
    let borrowY     = 0; // substraction
    let pos         = chunkarr.length-1;
    while(deltaChunksX || deltaChunksY || borrowX || borrowY || carryX || carryY) {        
        let posNumber = charToNumber(pos >= 0 ? chunkarr[pos] : EXPAND_POS);
        let posX = posNumber % FACTOR;
        let posY = Math.floor(posNumber / FACTOR)
        let newX = posX + deltaChunksX + carryX - borrowX
        let newY = posY + deltaChunksY + carryY - borrowY
        deltaChunksX = 0;
        deltaChunksY = 0;

        if(newX < 0) {
            borrowX = -Math.floor(newX / FACTOR)
            newX += borrowX * FACTOR
        } else {
            borrowX = 0
        }

        if(newX >= FACTOR) {
            carryX = Math.floor(newX / FACTOR)
            newX -= carryX * FACTOR
        } else {
            carryX = 0
        }

        if(newY < 0) {
            borrowY = -Math.floor(newY / FACTOR)
            newY += borrowY * FACTOR
        } else {
            borrowY = 0
        }

        if(newY >= FACTOR) {
            carryY = Math.floor(newY / FACTOR)
            newY -= carryY * FACTOR
        } else {
            carryY = 0
        }

        // save digit
        if(pos >= 0) {
            chunkarr[pos] = (newY * FACTOR + newX).toString(BASE);
            pos--;
        } else {
            expandedStr = (newY * FACTOR + newX).toString(BASE) + expandedStr;      
            expanded++;
        }

    }

    // reduce
    return chunkReduced(expanded, expandedStr + chunkarr.join(""));
}

function chunkReduced(expanded, chunkTail) {
    while(chunkTail[0] == EXPAND_POS && chunkTail.length >= 2 && expanded > 0) {
        chunkTail = chunkTail.slice(1);
        expanded--;
    }
    return expanded.toString() + ":" + chunkTail;
}

export function chunkZoomInAtZero(chunk) {
    let chunksplit  = chunk.split(":");
    let expanded    = parseInt(chunksplit[0]);
    return chunkReduced(expanded, chunksplit[1] + "0");
}

export function chunkZoomOutAtZero(chunk) {
    let chunksplit  = chunk.split(":");
    let expanded    = parseInt(chunksplit[0]);
    if(chunksplit[1].length > 1) {
        return expanded + ":" + chunksplit[1].slice(0,-1);
    } else {
        return (expanded+1) + ":" + EXPAND_POS + chunksplit[1].slice(0,-1);
    }
}

export function chunkDeltaToZero(chunk) {
    let posNumber = charToNumber(chunk[chunk.length-1]);
    let dx = posNumber % FACTOR;
    let dy = Math.floor(posNumber / FACTOR);
    return { dx , dy };
}
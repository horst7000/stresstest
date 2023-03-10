function comp(a, b) {
  return b.level-a.level || (a.chunk > b.chunk ? 1 : (a.chunk < b.chunk ? -1 : 0))
}
function compGreater(a, b) {
  return comp(a,b) >= 1
}
function compGreaterEq(a, b) {
  return comp(a,b) >= 0
}

/**
 * Binary search. https://stackoverflow.com/a/41956372
 * Return first index i such that comp(array[i]) is true (that is comp(array[i - 1]) is false).
 */
function searchChunkIndex(boxes, _comp) {
  let lo = -1, hi = boxes.length;
  while (1 + lo < hi) {
    const mi = lo + ((hi - lo) >>> 1);
    if (_comp(boxes[mi])) {
      hi = mi;
    } else {
      lo = mi;
    }
  }
  return hi;
}

function getLevel(chunk) {
  let s = chunk.split(':');
  return 1 + parseInt(s[0]) - s[1].length;
}

// e.g. chunk = 11,   [10,12,12,14]  ->  12 >= 11  ->  i=1
export function firstIndexChunkGreaterEq(goal, boxes) {
  // first index where c >= goal
  return searchChunkIndex(boxes, c => compGreaterEq(c, {chunk: goal, level: getLevel(goal)}))
}

// e.g. chunk = 11,   [10,12,12,14]  ->  12 > 11  ->  i=1
//  or  chunk = 12,   [10,12,12,14]  ->  14 > 12  ->  i=3
export function lastIndexChunkSmallerEq(goal, boxes)  {
  // 1 index before c > goal
  return searchChunkIndex(boxes, c => compGreater(c, {chunk: goal, level: getLevel(goal)})) - 1
}
# What was tested

Idea was to find out what breaks performance when using [panzoom](https://github.com/anvaka/panzoom) with many objects and how to fix the issues.

## Main issues were big texts.

SVG+text vs. div+p was tested. Both performed bad, when using much big text. Small text and divs/rects without text didn't break the performance too heavily.

On firefox (tested 111.0.1) multiple different font sizes are a problem when css-transforming the common parent div. At a test with 10 texts stutters while zooming in and out are already clearly recognisable.

## Solution

Solution was using a chunk system which unloads text which is not on screen. Especially when zoomed in text got displayed bigger. But at the same time much of the initial displayed text was not on screen anymore, so could be unloaded.

Chunking system in combination with absolute positioned divs showed best performance.

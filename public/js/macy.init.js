// Find if mobile width or desktop docWidth
if (window.innerWidth > 768) {
   var margin = 35;
} else {
   var margin = 15;
}

var masonry = new Macy({
   container: ".masonryContainer",
   trueOrder: false,
   waitForImages: true,
   useOwnImageLoader: false,
   debug: true,
   mobileFirst: false,
   margin: margin,
   columns: 4,
   breakAt: {
      992: 3,
      768: 2,
      595: 2
   }
});

masonry.runOnImageLoad(function () {
   masonry.recalculate(true);
}, true);

function adjust() {
   masonry.recalculate(true);
}

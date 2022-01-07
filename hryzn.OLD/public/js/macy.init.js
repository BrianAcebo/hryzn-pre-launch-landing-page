// Find if mobile width or desktop docWidth
if (window.innerWidth > 768) {
   var margin = 15;
} else {
   var margin = 18;
}

var masCon = document.getElementById("masonryContainer").offsetWidth;

if (masCon > 992) {
   var columns = 4;
} else {
   var columns = 3;
}

var masonry = new Macy({
   container: ".masonryContainer",
   trueOrder: true,
   waitForImages: true,
   useOwnImageLoader: false,
   debug: true,
   mobileFirst: false,
   margin: margin,
   columns: columns,
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

var app = document.getElementById('typewriter');

var typewriter = new Typewriter(app, {
   loop: true
});

typewriter.typeString('Topics.')
   .pauseFor(1500)
   .deleteAll()
   .typeString('Content.')
   .pauseFor(1500)
   .deleteAll()
   .typeString('Ideas.')
   .pauseFor(1500)
   .deleteAll()
   .start();

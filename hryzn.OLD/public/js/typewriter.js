var app = document.getElementById('typewriter');

var typewriter = new Typewriter(app, {
   loop: true
});

typewriter.typeString('Creativity')
   .pauseFor(1500)
   .deleteAll()
   .typeString('Discovery')
   .pauseFor(1500)
   .deleteAll()
   .typeString('Information')
   .pauseFor(1500)
   .deleteAll()
   .typeString('Ideas')
   .pauseFor(1500)
   .deleteAll()
   .start();

// Takes two arguments: user's input and array of possible titles
function autocomplete(inp, arr) {

   var currentFocus;

   inp.addEventListener("input", function(e) {
      // Grab current value and close out previous array
      var a, b, i, val = this.value;
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;

      // Create div and append each possible array item
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      this.parentNode.appendChild(a);

      // Check through each array item
      for (i = 0; i < arr.length; i++) {
         if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
            b = document.createElement("DIV");
            b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
            b.innerHTML += arr[i].substr(val.length);
            b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
            b.addEventListener("click", function(e) {
               inp.value = this.getElementsByTagName("input")[0].value;
               closeAllLists();
               document.getElementById("searchForm").submit();
            });
            a.appendChild(b);
         }
      }
   });

   // Check for keyboard clicks
   inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");

      if (e.keyCode == 40) {
         // Arrow DOWN
         currentFocus++;
         addActive(x);
      } else if (e.keyCode == 38) {
         // Arrow UP
         currentFocus--;
         addActive(x);
      } else if (e.keyCode == 13) {
         // ENTER
         e.preventDefault();
         if (currentFocus > -1) {
            if (x) x[currentFocus].click();
         }
      }
   });

   // Add 'active' to array item
   function addActive(x) {
      if (!x) return false;
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = (x.length - 1);
      x[currentFocus].classList.add("autocomplete-active");
   }

   // Remove 'active' to array item
   function removeActive(x) {
      for (var i = 0; i < x.length; i++) {
         x[i].classList.remove("autocomplete-active");
      }
   }

   // Close all array items
   function closeAllLists(elmnt) {
      var x = document.getElementsByClassName("autocomplete-items");
      for (var i = 0; i < x.length; i++) {
         if (elmnt != x[i] && elmnt != inp) {
            x[i].parentNode.removeChild(x[i]);
         }
      }
   }

   // Close autocomplete when outside is clicked
   document.addEventListener("click", function (e) {
      closeAllLists(e.target);
   });
}


// All Project Titles (August 14th, 2020)
var project_titles_and_profile_usernames = [
   'Why you haven\'t done what you want to do',
   'The Benefits of Coffee',
   'Travel to Bali on a Budget',
   '5 Easy Ways To Grow A Local Business',
   'The Power Of Content Marketing',
   'Homemade Cake',
   'Mindset & Maturity',
   'Success Is An Opinion',
   'Butterflies ',
   'Motivation Of Choices',
   'Risk & Reward',
   'Mind & Body Connection',
   'The Idea Of Money',
   'Freestyle Bars',
   'Garlic & Herb Chicken',
   'Pasta & Sicilian Sauce',
   'Build Lean Strength',
   'At Home Cardio',
   'For A Moment by Melina',
   '5 Dream NBA Finals Matchups That Could of Been Great ',
   'Love ',
   'Find Your Voice.',
   'Butterflies,butterflies, butterflies! ',
   'whipped chocolate ganache ',
   'Late Shift and The Complex Interactive Game Review ',
   'How to take a punch to the face',
   'Anime Rap Battle Ep. 1: DBZ Shernon vs. Kurama(Jinchuuriki) ',
   'Thoughts on Anime Fighting Games and Why I Want to See Anime Fan Games    ',
   'Anime Rap Battle Episode 2: Fifth-Hokage Tsunade VS. Elegant Android 18 #Naruto #DBZ ',
   'Do You Like Ramen Freestyle Song!!',
   'Superhero Quotes That I Made UP',
   'Villain Quotes that I Made Up! ',
   'Anime Rap Battle Episode 3: Family Fusion Fight to the FULLEST!!! Gotenks vs. Gogeta!!',
   'Top 5 French Fry Styles and Shapes!! 🍟 #List #Fries ',
   '10th Blog Post on the @Hryzn Website!! 😃 #Platform #Content',
   'Be found with microposts',
   '"I Thought the Place was Mysterious but Actually Magical." :) ',
   'Seeking Answers',
   '#nugofknowledge',
   // End of projects
   'JustoR56',
   'alesandis',
   'Alex_yyys',
   'AshlynnAnn',
   'kaylee',
   'Angel L',
   'jenellenicole22 ',
   'jenellenicole19',
   'JJstew',
   'yuliper',
   'andreamead',
   'tessconforti',
   'williambream',
   'ayeeejames',
   'RecipesQuick&Easy123',
   'gabbyroa',
   'Alejandro',
   'clairfrain',
   'tessconfori',
   'Jamescrapy',
   'SabrinaStabs',
   'hryzn',
   'Eliwilkie',
   'BAW55',
   'Babygoose',
   'tessbuccarelli',
   'lucymurguia',
   'Noreana',
   'reinaldo',
   'Juanfe',
   'kandycejewel',
   'Danisua2610 ',
   'peggyoneill',
   'wendychuy',
   'emmaberken',
   'kateberkkk',
   'sydneyelisa',
   'aquamadds',
   'ctrolaltdel',
   'CandyBean',
   'QueenKK',
   'danaclark66',
   'jenellenicole23',
   'Finkrat',
   'Screen83',
   'zoely',
   'TheBlueOrange',
   'writtensuccess1',
   'Captain Crunk',
   'MalcolmWilkie',
   'ktpizzle',
   'timefather',
   'Williamchink',
   'melinaa_belenn_',
   'brianacebo',
   'dummyuser',
   'supersimpleathomeworkouts',
   'Jasonalike',
   'Poonam Garg',
   'Noreth',
   'IzzdaKid',
   'labedroomSmiff',
   'jjking0998',
   'lildyk3',
   'stefandumi',
   'asvpcartierr',
   'ppalacios95',
   'useruser123',
   'aitanadelrio',
   'ddadaadasdasd',
   'Toothfl',
   'yoBrye'
]

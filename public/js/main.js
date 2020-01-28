$(document).ready(function() {

   $window = $(window);
   $body = $("body");


   // Open & close mobile nav overlay on landing page
   var $nav = $('#landingNav');
   var $navClose = $('#landingNavClose');
   var $navOpen = $('#landingNavOpen');

   $navOpen.click(function() {
      $nav.css({ "height": "100%" });
   });

   $navClose.click(function() {
      $nav.css({ "height": "0" });
   });
   /**********/


   // Remove loader after 4 seconds
   var $rand_loader = $('.loader_text-' + Math.floor(Math.random() * 6));

   $rand_loader.css({ "display": "block" });

   setTimeout(function() {
      $('.loader_overlay').remove();
   }, 3500);
   /**********/


   // Find first character of name
   var $firstChar = $('#firstChar');
   var $text = $firstChar.text();
   var str = $text.substring(0, 1);
   $('.first_char').html(str);
   /**********/


   // Remove error message on click
   $(".error__exit").click(function() {
      $(this).parent().remove();
   });
   /**********/


   // Go back when clicked
   $(".go-back").click(function() {
      window.history.back();
   });
   /**********/


   // Add shadow to nav on scroll
   $topNav = $('.topnav');
   $flash_1 = $('.success__msg');
   $flash_2 = $('.error__msg-4');

   $window.scroll(function() {
      if($window.scrollTop() >= 50){
         $topNav.addClass('shadow');
         $flash_1.addClass('changeTop');
         $flash_2.addClass('changeTop');
		} else {
         $topNav.removeClass('shadow');
         $flash_1.removeClass('changeTop');
         $flash_2.removeClass('changeTop');
		}
   });
   /**********/


   // Modal pop up
   var $modal = $(".popModal");
   var $modalBtn = $(".modalBtn");
   var $closeBtn = $(".closeModal");

   $modalBtn.each(function() {
      $(this).click(function() {
         $modal.css({ "display": "block" });
      });
   });

   $closeBtn.click(function() {
      $modal.css({ "display": "none" });
   });

   // Modal pop up for sign up
   var $modalSignUp = $(".signUpModal");
   var $noScroll = $("div").hasClass("guestScroll");
   var $guestScroll = $(".guestScroll");

   if($noScroll) {

      $window.on('scroll touchmove mousewheel', function(e) {
         if($window.innerWidth > 768) {
            // Stop scrolling and ask for sign up on desktops
            if($window.scrollTop() >= 300) {
               $modalSignUp.css({ "display": "block" });
               $body.css({ "overflow": "hidden" });
               $guestScroll.css({ "filter": " blur(10px)" });

               e.preventDefault();
               e.stopPropagation();
               return false;
      		}
         } else {
            // Stop scrolling and ask for sign up on mobile
            if($window.scrollTop() >= 500) {
               $modalSignUp.css({ "display": "block" });
               $body.css({ "overflow": "hidden" });
               $guestScroll.css({ "filter": " blur(10px)" });

               e.preventDefault();
               e.stopPropagation();
               return false;
      		}
         }
      })

   }
   /**********/


   // Add hidden input for search admin invite
   var addInput = $('.add-input').children();
   $('.addInput').append(addInput);
   /**********/


   // If public project or private project is checked in create project
   var $isPublic = $('#isPublicCheck');
   var $isPrivate = $('#isPrivateCheck');
   var $checkbox = $('#checkbox');
   var $changeText = $('#changeText');

   $isPublic.click(function() {
      $isPublic.attr("checked", "checked");
      $isPublic.addClass("checked");
      $isPrivate.removeClass("checked");
      $isPrivate.removeAttr("checked");
      $checkbox.attr("value", "false");
      $changeText.html("A public project can be viewed by anyone");
   });

   $isPrivate.click(function() {
      $isPrivate.attr("checked", "checked");
      $isPrivate.addClass("checked");
      $isPublic.removeClass("checked");
      $isPublic.removeAttr("checked");
      $checkbox.attr("value", "true");
      $changeText.html("A private project can only be seen by you or people you invite");
   });
   /***********/


   // Open settings nav on click
   var $settingsOpen = $('#settingsBtn');
   var $settingsClose = $('#settingsClose');
   var $sideNav = $('#profileSideNav');

   $settingsOpen.click(function() {
      if($window.width() <= 768) {
         $sideNav.css({ "width": "100%", "box-shadow": "0 2px 4px 0 rgba(0,0,0,0.2)" });
      } else {
         $sideNav.css({ "width": "350" });
      }
   });

   $settingsClose.click(function() {
      $sideNav.css({ "width": "0" });
   });
   /**********/

   // Add images to array in settings
   var $settingsSubmit = $("#settingsSubmit");
   var $settingsForm = $("#settingsForm");
   var $input = $('#img_indices');

   $settingsForm.submit(function(e){
      var $profImg = $('#profileImage').val();
      var $bgImg = $('#backgroundImage').val();

      if($profImg && $bgImg) {
         $input.attr("value", "3");
      } else if ($profImg) {
         $input.attr("value", "2");
      } else {
         $input.attr("value", "1");
      }
   });
   /**********/


   // Show / Hide own and saved projects
   var $ownProfile = $(".masonryContainer").hasClass('ownProfile');
   var $savedBtn = $(".saved_btn");
   var $ownBtn = $(".own_btn");
   var $ownProject = $(".ownProject");
   var $savedProject = $(".savedProject");

   setTimeout(function() {
      $savedProject.css({ "display": "none" });
   }, 3500);


   if ($ownProfile) {
      $savedBtn.click(function() {
         $ownProject.css({ "display": "none" });
         $savedProject.css({ "display": "block" });
      });

      $ownBtn.click(function() {
         $savedProject.css({ "display": "none" });
         $ownProject.css({ "display": "block" });
      });
   }
   /**********/

});

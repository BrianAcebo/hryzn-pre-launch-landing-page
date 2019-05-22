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
   var rand_loader = $('.loader__text-' + Math.floor(Math.random() * 6));

   rand_loader.css({ "display": "block" });

   setTimeout(function() {
      $('.loader__overlay').remove();
   }, 3500);

   /**********/

   // Find first character of username
   var $firstChar = $('#firstChar');
   var $text = $firstChar.text();
   var str = $text.substring(0, 1);
   $firstChar.html(str);

   /**********/

   // Remove error message on click
   $(".error__exit").click(function() {
      $(this).parent().remove();
   });

   /**********/

   /**********/

   // Go back when clicked
   $(".go-back").click(function() {
      window.history.back();
   });

   /**********/

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

   if($noScroll) {

      $window.on('scroll touchmove mousewheel', function() {
         if($window.scrollTop() >= 250) {
            $modalSignUp.css({ "display": "block" });
            $body.css({ "overflow": "hidden" });

            $body.preventDefault();
            $body.stopPropagation();
            return false;
   		}
      })

   }

   /**********/
   // Edit Project

   var list_starting_count = 0;
   var list_count = $('.list-id').length;
   var total_list_amount = [1,2,3,4,5];
   var alreadyExists = [];

   $('.listItemCatch').each(function() {
      ++list_starting_count;
      $(this).attr('id', list_starting_count);
      $(this).children('.list_items').each(function() {
         $(this).attr('name', 'list_items_' + list_starting_count + '[]');
      });
      // $(this).closest('.edit-project__list-container').children('.input-list-title').attr('name', 'list_title_' + list_starting_count);
   });

   $('.listAddBtn').each(function() {
      $(this).click(function() {
         var toAdd = $(this).prev().val();
         $(this).closest('.container').children('.list-items').append('<div class="list-item__self"><li>' + toAdd + '</li><span class="close">&#10005;<span></div>');
         var list_order_number_for_input = $(this).closest('.edit-project__list-container').children('.listItemCatch').attr('id');
         $(this).closest('.edit-project__list-container').children('.listItemCatch').append('<input id="' + toAdd + '"type="hidden" name="list_items_' + list_order_number_for_input +'[]" value="' + toAdd + '"/>');
      });
   });

   $('#newList').click(function() {
      if(list_count < 5) {
         ++list_count;

         $('#listCount').val(list_count);

         var newList = '<div class="edit-project__list-container list_id"><label for="list_title" class="form__label" style="margin-top: 25px;">Make a List</label><input class="form__input" type="text" placeholder="Enter a title" name="list_title_' + list_count + '" value=""/><div class="listItemCatch"></div><div class="container"><div name="List" class="list-items__container"><input id="listItemInput" class="form__input" type="text" placeholder="Enter an item" name="listItem" value=""/><div class="listAddBtn"><img src="/icons/add-white.png" class="mobile-nav__icon"/></div></div><br/><ol class="list-items"></ol></div></div>';

         $(newList).insertBefore('#newList');
         $('.listAddBtn').each(function() {
            $(this).click(function() {
               var toAdd = $(this).prev().val();
               $(this).closest('.container').children('.list-items').append('<div class="list-item__self"><li>' + toAdd + '</li><span class="close">&#10005;<span></div>');
               $(this).closest('.edit-project__list-container').children('.listItemCatch').append('<input id="' + toAdd + '"type="hidden" name="list_items_' + list_count +'[]" value="' + toAdd + '"/>');
            });
         });
      } else {
         $('#newList').text('Sorry, the maximum amount of lists is 5');
      }
   });

   $(document).on('dblclick','.list-item__self', function() {
      var item = $(this).children().first().text();
      $(this).remove();
      $('.listItemCatch').find('input[value="' + item + '"]').remove();
   });

   $(document).on('click','.close', function() {
      var item = $(this).prev().text();
      $('.listItemCatch').find('input[value="' + item + '"]').remove();
      $(this).parent().remove();
   });

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

});

$(document).ready(function() {

   $window = $(window);
   $body = $("body");
   var doc = document.documentElement;
   doc.setAttribute('data-useragent', navigator.userAgent);

   // Smoothscroll Duration
   var cfg = { scrollDuration : 800 };


   // Welcome Page Preloader
   $("html").addClass('cl-preload');

   $window.on('load', function() {
      $("#loader").fadeOut("slow", function() {
         $("#preloader").delay(300).fadeOut("slow");
      });

      $("html").removeClass('cl-preload');
      $("html").addClass('cl-loaded');
   });
   /**********/


   // Smooth Scrolling
   $('.smoothscroll').on('click', function(e) {
      var target = $(this).attr('href');
      var $target = $(target);

      e.preventDefault();
      e.stopPropagation();

      $('html, body').stop().animate({
         'scrollTop': $target.offset().top
      }, cfg.scrollDuration, 'swing').promise().done(function() {
         // check if menu is open
         if ($('body').hasClass('menu-is-open')) {
            $('.hamburger_menu').trigger('click');
         }
         window.location.hash = target;
      });
   });
   /**********/


   // Placeholder plugins
   $('input, textarea, select').placeholder();
   /**********/


   // Animate On Scroll
   AOS.init( {
      offset: 200,
      duration: 600,
      easing: 'ease-in-sine',
      delay: 300,
      once: true,
      disable: 'mobile'
   });
   /**********/


   // Nav dropdown menu
   var $dropNav = $('.dropNav');
   var $dropBtn = $('.dropBtn');
   var $post_container = $('.post_container');
   var $mainBody = $('#mainBody');
   var $createIcon = $(".create-icon");

   $dropBtn.each(function() {
      $(this).click(function() {
         $dropNav.toggleClass('showDrop');
      });
   });

   $createIcon.each(function() {
      $(this).click(function() {
         $post_container.toggleClass('showPostBtns');
         $mainBody.toggleClass('bodyBlur');
      });
   });

   $mainBody.on('click', function(e){
      if($mainBody.hasClass('bodyBlur')) {
         e.preventDefault();
         e.stopPropagation();
      }
      $dropNav.removeClass('showDrop');
      $post_container.removeClass('showPostBtns');
      $mainBody.removeClass('bodyBlur');
   });
   /**********/


   // Stats on project dropdown
   var $statsNav = $('.statsNav');
   var $statsBtn = $('.statsBtn');

   $statsBtn.each(function() {
      $(this).click(function() {
         $statsNav.toggleClass('showStats')
      });
   });
   /**********/


   // Logged In Loader
   var $rand_loader = $('.loader_text-' + Math.floor(Math.random() * 6));

   $rand_loader.css({ "display": "block" });

   $window.on('load', function() {
      $(".loader_wrapper").delay(300).fadeOut("slow", function() {
         $('.loader_overlay').delay(300).fadeOut("slow");
      });
   });

   $window.on('load', function() {
      $(".projects_loader").delay(300).fadeOut("slow", function() {
         $('.loader_overlay').delay(300).fadeOut("slow");
      });
   });
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

   // Go back when swiped
   // var $drag = $('#drag');
   // var startingMousePos = { x: -1, y: -1 };
   // var endingMousePos = { x: -1, y: -1 };
   //
   // var $windowWidth = $window.width();
   // var $forty = $windowWidth * (40 / 100);
   //
   // $drag.on('mousedown', function (evt) {
   //
   //    startingMousePos.x = event.pageX;
   //    startingMousePos.y = event.pageY;
   //
   //    console.log(startingMousePos);
   //
   //    $body.on('mouseup', function (evt) {
   //
   //       endingMousePos.x = event.pageX;
   //       endingMousePos.y = event.pageY;
   //
   //       if ((endingMousePos.x - startingMousePos.x) > $forty) {
   //          window.history.back();
   //       }
   //
   //    });
   // });
   /**********/


   // Add effects to nav on scroll
   var $topNav = $('.topnav');
   var $flash_1 = $('.success__msg');
   var $flash_2 = $('.error__msg-4');
   var $drop_nav = $('.drop_nav');
   var $menuTrigger = $('.hamburger_menu');
   var $nav_social = $('.nav_social');
   var $postBtns = $('.post_container');

   $window.scroll(function() {
      if($window.scrollTop() >= 50){
         $menuTrigger.addClass('opaque');
         $topNav.addClass('shadow');
         $flash_1.addClass('changeTop');
         $flash_2.addClass('changeTop');
         $drop_nav.addClass('dropNavTop');
         $nav_social.addClass('dis-none');
         $postBtns.addClass('postBtnsTop');
		} else {
         $menuTrigger.removeClass('opaque');
         $topNav.removeClass('shadow');
         $flash_1.removeClass('changeTop');
         $flash_2.removeClass('changeTop');
         $drop_nav.removeClass('dropNavTop');
         $nav_social.removeClass('dis-none');
         $postBtns.removeClass('postBtnsTop');
		}
   });
   /**********/


   // Open - Close Side Menu
   var menuTrigger = $('.hamburger_menu');
   var nav = $('.side_nav');
   var closeButton = nav.find('.side_nav__close');
   var siteBody = $('body');
   var mainContents = $('section, footer');

  menuTrigger.on('click', function(e){
      e.preventDefault();
      siteBody.toggleClass('menu-is-open');
  });

  closeButton.on('click', function(e){
      e.preventDefault();
      menuTrigger.trigger('click');
  });

  siteBody.on('click', function(e){
      if( !$(e.target).is('.side_nav, .side_nav__content, .side_nav__list, .side_nav__list li, .hamburger_menu, .hamburger_menu span') ) {
         siteBody.removeClass('menu-is-open');
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

   // Modal pop up for project meta
   var $modalMeta = $(".popModalMeta");
   var $modalBtnMeta = $(".modalBtnMeta");
   var $closeBtnMeta = $(".closeModalMeta");

   $modalBtnMeta.each(function() {
      $(this).click(function() {
         $modalMeta.css({ "width": "100%" });
      });
   });

   $closeBtnMeta.click(function() {
      $modalMeta.css({ "width": "0" });
   });

   // Modal pop up for sign up
   var $modalSignUp = $(".signUpModal");
   var $noScroll = $("div").hasClass("guestScroll");
   var $guestScroll = $(".guestScroll");

   if($noScroll) {

      $window.on('scroll touchmove mousewheel', function(e) {
         if($window.innerWidth > 768) {
            // Stop scrolling and ask for sign up on desktops
            if($window.scrollTop() >= 1000) {
               $modalSignUp.css({ "display": "block" });
               $body.css({ "overflow": "hidden" });
               $guestScroll.css({ "filter": " blur(10px)" });

               e.preventDefault();
               e.stopPropagation();
               return false;
      		}
         } else {
            // Stop scrolling and ask for sign up on mobile
            if($window.scrollTop() >= 750) {
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

   // Modal pop up for micro post
   var $modalMicro = $(".microPostModal");
   var $modalBtnMicro = $(".micro_post_btn");
   var $closeBtnMicro = $(".closeModal");

   $modalBtnMicro.each(function() {
      $(this).click(function() {
         $modalMicro.css({ "display": "block" });
      });
   });

   $closeBtnMicro.click(function() {
      $modalMicro.css({ "display": "none" });
   });

   // Modal pop up for groups
   var $modalGroup= $(".groupModal");
   var $modalBtnGroup = $(".create_group_btn");
   var $closeBtnGroup = $(".closeModal");
   var $body = $("body");

   $modalBtnGroup.each(function() {
      $(this).click(function() {
         $modalGroup.css({ "display": "block" });
      });
   });

   $closeBtnGroup.click(function() {
      $modalGroup.css({ "display": "none" });
   });

   if ($modalGroup.hasClass('groupError')) {
      $modalGroup.css({ "display": "block" });
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
      $changeText.html("A private project can only be seen by you");
   });

   // Default check on load
   if ($isPrivate.hasClass('checked')) {
      $checkbox.attr("value", "true");
   } else {
      $checkbox.attr("value", "false");
   }

   // Save as draft
   $(".draft_btn").click(function() {
      $isPrivate.attr("checked", "checked");
      $isPrivate.addClass("checked");
      $isPublic.removeClass("checked");
      $isPublic.removeAttr("checked");
      $checkbox.attr("value", "true");
      $changeText.html("A private project can only be seen by you");
   });
   /**********/


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
   var $repostBtn = $(".repost_btn");
   var $ownProject = $(".ownProject");
   var $savedProject = $(".savedProject");
   var $repostedProject = $(".repostedProject");

   $savedProject.css({ "display": "none" });
   $repostedProject.css({ "display": "none" });


   if ($ownProfile) {
      $savedBtn.click(function() {
         $ownProject.css({ "display": "none" });
         $repostedProject.css({ "display": "none" });
         $savedProject.css({ "display": "block" });
      });

      $ownBtn.click(function() {
         $savedProject.css({ "display": "none" });
         $repostedProject.css({ "display": "none" });
         $ownProject.css({ "display": "block" });
      });

      $repostBtn.click(function() {
         $savedProject.css({ "display": "none" });
         $ownProject.css({ "display": "none" });
         $repostedProject.css({ "display": "block" });
      });
   }
   /**********/


   // Remove comments
   var $commentUsername = $(".comment_username");
   var $currentUser = $("#current_user").text();
   var $projAdmins = $("#current_admin").text();
   var $projectId = $("#current_project").text();

   $commentUsername.each(function() {

      var $commentId = $(this).next().text();
      var $username = $(this).text();

      if ($currentUser === $projAdmins) {
         $(this).parent().append('<form method="post" class="" action="/p/details/uncomment/' + $projectId + '"><input type="hidden" name="comment_id" value="' + $commentId + '"><input type="hidden" name="project_id" value="' + $projectId + '"><button class="project_action_btn" name="submit" type="submit"><img src="/icons/delete-ticket-item.png" class="main-topnav__icon" /></button></form>');
      } else if ($username === $currentUser) {
         $(this).parent().append('<form method="post" class="" action="/p/details/uncomment/' + $projectId + '"><input type="hidden" name="comment_id" value="' + $commentId + '"><input type="hidden" name="project_id" value="' + $projectId + '"><button class="project_action_btn" name="submit" type="submit"><img src="/icons/delete-ticket-item.png" class="main-topnav__icon" /></button></form>');
      }

   });
   /**********/


   // Open related projects nav on click
   var $relatedOpen = $('.relatedBtn');
   var $relatedClose = $('#relatedClose');
   var $relatedNav = $('#relatedSideNav');

   $relatedOpen.each(function() {
      $(this).click(function() {
         if($window.width() <= 768) {
            $relatedNav.css({ "width": "100%", "box-shadow": "0 2px 4px 0 rgba(0,0,0,0.2)" });
            $relatedClose.css({ "position": "fixed" });
         } else {
            $relatedNav.css({ "width": "350" });
         }
      });
   });

   $relatedClose.click(function() {
      $relatedClose.css({ "position": "absolute" });
      $relatedNav.css({ "width": "0" });
   });
   /**********/

   // Add loader for create project / micropost
   var $projectLoader = $('.loader_project');
   var $projectSub = $('.project_submit');

   $projectSub.click(function() {
      $projectLoader.css({ "display": "flex" });
   });

   var $microLoader = $('.loader_micro');
   var $microSub = $('#microSubmit');

   $microSub.click(function() {
      $microLoader.css({ "display": "flex" });
   });
   /**********/

   // Enlargen Micropost
   var $micropost = $('.micropost .micropost_card');
   var $mainBody = $('main');
   $micropost.each(function() {
      $(this).click(function() {
         $(this).parent().toggleClass('enlarge');
      });
   });
   /**********/


   // Kick out user in group
   var $group_user_container = $('.group_user_container');
   var $group_user = $('.group_user_container .group_user');
   var $group_project = $('.group_project');
   var $btnCon = $('.create_group_btn_container');
   var $topRes = $('.top_results_underline');
   var $masCon = $('.masonryContainer');
   var $kickBtn = $('#userKickBtn');
   var $projRemBtn = $('#projRemBtn');
   var $sideNav = $('#profileSideNav');
   var $tagId = $('#tagId').text();

   var $userLink;

   $kickBtn.click(function() {
      $sideNav.css({ "width": "0" });
      $btnCon.toggleClass('bodyBlur');
      $topRes.toggleClass('bodyBlur');
      $masCon.toggleClass('bodyBlur');

      $group_user.each(function() {
         $userLink = $(this).attr('href');
         $(this).attr('href', '/groups/' + $tagId + '/kick' + $userLink);
      });

   });

   $projRemBtn.click(function() {
      $sideNav.css({ "width": "0" });
      $btnCon.toggleClass('bodyBlur');
      $topRes.toggleClass('bodyBlur');
      $group_user_container.toggleClass('bodyBlur');

      $group_project.each(function() {
         $projLink = $(this).attr('value');
         $(this).attr('href', '/groups/' + $tagId + '/remove/' + $projLink);
      });

   });
   /**********/

});

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

   // If loader stuck past 12 secs
   setTimeout(function() {
      $("#loader").fadeOut("slow", function() {
         $("#preloader").delay(300).fadeOut("slow");
      });

      $("html").removeClass('cl-preload');
      $("html").addClass('cl-loaded');
   }, 12000);
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


   // Date of birth for create account
   $('.date-field').autotab('number');
   /**********/


   // Nav dropdown menu
   var $dropNav = $('.dropNav');
   var $dropBtn = $('.dropBtn');
   var $post_container = $('.post_container');

   if ($('#mainBody').attr('id') === 'mainBody' ) {
     var $mainBody = $('#mainBody');
   } else {
     var $mainBody = $('#mainBodyIndex');
   }
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


   // Open / Close Mobile Topnav
   var $mobileTopNav = $('.topnav.mobile_topnav');
   var $mobileTopNavBtn = $('.topnav.mobile_topnav .search-container button');
   var $mobileTopNavClose = $('.topnav.mobile_topnav .close_icon');
   var $windowWidth = $window.width();

   if ($windowWidth <= 992) {
      $mobileTopNavBtn.attr("type", "button");
   }

   $mobileTopNavBtn.click(function() {

      if($(this).hasClass('open_btn')) {
         $(this).attr("type", "submit");
      } else {
         $(this).addClass('open_btn');
         $mobileTopNav.addClass('open_search');
      }

   });

   $mobileTopNavClose.click(function() {
      $mobileTopNavBtn.attr("type", "button");
      $mobileTopNavBtn.removeClass('open_btn');
      $mobileTopNav.removeClass('open_search');
   });
   /***********/


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

   var $dont_show_loader = $('.success__msg');

   if($dont_show_loader) {
      $('.loader_overlay').css({"display": "none"});
   }

   $window.on('load', function() {
      var $dont_show_loader = $('.success__msg');

      $(".loader_wrapper").delay(300).fadeOut("slow", function() {
         $('.loader_overlay').delay(300).fadeOut("slow");
      });

      $(".projects_loader").delay(300).fadeOut("slow", function() {
         $('.loader_overlay').delay(300).fadeOut("slow");
      });
   });

   // If loader stuck past 12 secs
   setTimeout(function() {
      $(".loader_wrapper").delay(300).fadeOut("slow", function() {
         $('.loader_overlay').delay(300).fadeOut("slow");
      });

      $(".projects_loader").delay(300).fadeOut("slow", function() {
         $('.loader_overlay').delay(300).fadeOut("slow");
      });
   }, 12000);
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
   var $drop_nav = $('.drop_nav');
   var $menuTrigger = $('.hamburger_menu');
   var $nav_social = $('.nav_social');
   var $landing_search = $('.search-container.desktop_search');
   var $postBtns = $('.post_container');
   var $hryzn_logo_project = $('.guest_project .topnav__logo');

   $window.scroll(function() {
      if($window.scrollTop() >= 50){
         $menuTrigger.addClass('opaque');
         $hryzn_logo_project.css({ "color": "#31375A" });
         $topNav.addClass('shadow');
         $drop_nav.addClass('dropNavTop');
         $nav_social.addClass('dis-none');
         $landing_search.addClass('dis-none');
         $postBtns.addClass('postBtnsTop');
         if ($window.width() > 992) {
            $('.success__msg').css({ "top": "75px" });
         }
		} else {
         $menuTrigger.removeClass('opaque');
         if ($window.width() < 992) {
            $hryzn_logo_project.css({ "color": "#fff" });
         }
         $topNav.removeClass('shadow');
         $drop_nav.removeClass('dropNavTop');
         $nav_social.removeClass('dis-none');
         $landing_search.removeClass('dis-none');
         $postBtns.removeClass('postBtnsTop');
		}
   });
   /**********/


   // Show / Hide Icon Bar On Scroll Up Or Down
   var $current_position = $(window).scrollTop();
   var $starting_top = $(window).scrollTop();
   var $icon_bar = $('.icon-bar');
   var $icon_bar_a = $('.icon-bar a');
   var $icon_bar_btn = $('.icon-bar button');
   var $icon_bar_a_i = $('.icon-bar a i');
   var $i_amounts = $('.icon-bar .i_amounts');

   $(window).scroll(function() {
      var $scroll = $(window).scrollTop();

      if ($(window).scrollTop() >= 50) {

         if($scroll > $current_position) {

            // User is scrolling downwards
            $icon_bar.css({ "display": "none" });

         } else {

            // User is scrolling upwards
            $icon_bar.css({ "display": "flex" });
            $icon_bar_a.css({ "background": "#fff", "color": "#333", "justify-content": "center", "width": "35px"});
            $icon_bar_btn.css({ "margin": "25px 0", "box-shadow": "rgba(0,0,0,.1) 0 2px 10px 1px" });
            $i_amounts.css({ "display": "none"});
            $icon_bar_a_i.css({ "margin-left": "0"});

         }

         $current_position = $scroll;

      } else {

         // Icon bar moved is at top
         if($window.width() <= 992) {

            // Icon bar for mobile
            $icon_bar_a_i.css({ "margin-left": "0"});
            $icon_bar_a.css({ "background": "transparent", "color": "#fff", "justify-content": "flex-end", "width": "auto" });
            $icon_bar_btn.css({ "margin": "10px 0", "box-shadow": "none" });
         } else {

            // Icon bar for desktop
            $icon_bar_a_i.css({ "margin-left": "15px"});
            $icon_bar_a.css({ "background": "transparent", "color": "#333", "justify-content": "center", "width": "auto" });
            $icon_bar_btn.css({ "margin": "35px 0", "box-shadow": "none" });
         }

         // Only show amounts when icon-bar at top
         $i_amounts.css({ "display": "block"});
         $icon_bar_a_i.css({ "margin-left": "15px"});
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
      if( !$(e.target).is('.side_nav, .side_nav__content, .side_nav__list, .side_nav__list li, .hamburger_menu, .hamburger_menu span, .mobile_search .landing-nav_search') ) {
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
   var $micropost_pop_wrapper = $(".micropostPop_wrapper");
   var $profile_page = $(".profile_page");
   var $explore_main = $(".explore_main");

   if($noScroll) {

      $window.on('scroll touchmove mousewheel', function(e) {
         if($window.innerWidth > 768) {
            // Stop scrolling and ask for sign up on desktops
            if($window.scrollTop() >= 800) {
               $modalSignUp.css({ "display": "block" });
               $body.css({ "overflow": "hidden" });
               $guestScroll.css({ "filter": " blur(10px)" });
               $micropost_pop_wrapper.css({ "filter": " blur(10px)" });
               $profile_page.css({ "filter": " blur(10px)" });
               $explore_main.css({ "filter": " blur(10px)" });

               e.preventDefault();
               e.stopPropagation();
               return false;
      		}
         } else {
            // Stop scrolling and ask for sign up on mobile
            if($window.scrollTop() >= 650) {
               $modalSignUp.css({ "display": "block" });
               $body.css({ "overflow": "hidden" });
               $guestScroll.css({ "filter": " blur(10px)" });
               $micropost_pop_wrapper.css({ "filter": " blur(10px)" });
               $profile_page.css({ "filter": " blur(10px)" });
               $explore_main.css({ "filter": " blur(10px)" });

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


   // Tabs for micropost
   var $microTabLinks = $(".micro_tab_links");
   var $microTabs = $(".micro_tab_content");
   var $inputMicroAll = $(".input_is_micro");
   var $inputMicroText = $("#input_is_micro_text");
   var $inputMicroImage = $("#input_is_micro_image");
   var $inputMicroAudio = $("#input_is_micro_audio");
   var $inputMicroVideo = $("#input_is_micro_video");

   $microTabLinks.each(function() {
      $(this).click(function() {

         $microTabLinks.each(function() {
            $(this).removeClass('micro_tab_active');
         });

         $(this).addClass('micro_tab_active');

         $microTabs.each(function() {
            $(this).removeClass('micro_active');
         });

         var $microTabId = $(this).attr("id");
         $('.' + $microTabId).addClass('micro_active');

         if ($microTabId == 'micro_text') {

            $inputMicroAll.each(function() {
               $(this).attr('value', 'false');
            });
            $inputMicroText.attr('value', 'true');

         } else if ($microTabId == 'micro_image') {

            $inputMicroAll.each(function() {
               $(this).attr('value', 'false');
            });
            $inputMicroImage.attr('value', 'true');

         } else if ($microTabId == 'micro_audio') {

            $inputMicroAll.each(function() {
               $(this).attr('value', 'false');
            });
            $inputMicroAudio.attr('value', 'true');

         } else {

            $inputMicroAll.each(function() {
               $(this).attr('value', 'false');
            });
            $inputMicroVideo.attr('value', 'true');

         }
      });
   });
   /**********/


   // Modal pop up for repost
   var $modalRepost = $(".repostModal");
   var $modalBtnRepost = $(".repostModalBtn");
   var $closeBtnRepost = $(".closeModal");

   $modalBtnRepost.each(function() {
      $(this).click(function() {
         $modalRepost.css({ "display": "block" });
      });
   });

   $closeBtnRepost.click(function() {
      $modalRepost.css({ "display": "none" });
   });

   // Modal pop up for repost in details page
   var $detailsModalRepost = $(".detailsRepostModal");
   var $detailsModalBtnRepost = $(".detailsRepostModalBtn");
   var $closeBtnRepost = $(".closeModal");

   $detailsModalBtnRepost.each(function() {
      $(this).click(function() {
         $detailsModalRepost.css({ "display": "block" });

         var $modalRepostUsername = $(this).children("input[name=username]").val();
         var $modalRepostProjectId = $(this).children("input[name=project_id]").val();
         var $modalRepostProjectOwner = $(this).children("input[name=project_owner]").val();
         var $modalRepostUserReposted = $(this).children("input[name=user_reposted]").val();

         $("#repostForm #repostUsername").val($modalRepostUsername);
         $("#repostForm #repostProjectId").val($modalRepostProjectId);
         $("#repostForm #repostProjectOwner").val($modalRepostProjectOwner);
         $("#repostForm #repostUserPosted").val($modalRepostUserReposted);

         $('#repostForm').attr('action', '/p/details/micro/repost/' + $modalRepostProjectId);

         if ($modalRepostUserReposted == 'true') {
            $('#unrepostForm').attr('action', '/p/details/micro/unrepost/' + $modalRepostProjectId);

            $("#unrepostForm #unrepostUsername").val($modalRepostUsername);
            $("#unrepostForm #unrepostProjectId").val($modalRepostProjectId);
         }

      });
   });

   $closeBtnRepost.click(function() {
      $detailsModalRepost.css({ "display": "none" });
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
      $changeText.html("A private project can only be seen by you");
   });

   // Default check on load
   if ($isPrivate.hasClass('checked')) {
      $checkbox.attr("value", "true");
   } else {
      $checkbox.attr("value", "false");
   }

   // Save as draft
   $(".save_as_draft_btn").click(function() {
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
   var siteBody = $('body');

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

   siteBody.on('click', function(e){
      if( !$(e.target).is('.settings_content, .settings__header, .settings__underline, .profile__sidenav a, #settingsBtn, #settingsBtn .mobile-nav__icon, #profileSideNav, #profileSideNav p') ) {
         $sideNav.css({ "width": "0" });
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


   // Open related projects nav on click
   var $relatedOpen = $('.relatedBtn');
   var $relatedClose = $('#relatedClose');
   var $relatedNav = $('#relatedSideNav');

   $relatedOpen.each(function() {
      $(this).click(function() {
         if($window.width() <= 768) {
            $relatedNav.css({ "height": "400", "box-shadow": "rgba(0,0,0,.1) 0 2px 10px 1px", "padding-top": "25px" });
            $relatedClose.css({ "position": "fixed" });
         } else {
            $relatedNav.css({ "width": "350" });
         }
      });
   });

   $relatedClose.click(function() {
      $relatedClose.css({ "position": "absolute" });
      if($window.width() <= 768) {
         $relatedNav.css({ "height": "0", "padding-top": "0" });
      } else {
         $relatedNav.css({ "width": "0" });
      }
   });
   /**********/


   // Open project settings nav on click
   var $projectSettingsOpen = $('.projectSettingsBtn_ell');
   var $projectSettingsClose = $('#projectSettingsClose');
   var $projectSettingsNav = $('#projectSettingsNav');

   $projectSettingsOpen.each(function() {
      $(this).click(function() {
         $projectSettingsNav.css({ "height": "400", "box-shadow": "rgba(0,0,0,.1) 0 2px 10px 1px" });
      });
   });

   $projectSettingsClose.click(function() {
      $projectSettingsNav.css({ "height": "0" });
   });
   /**********/


   // Add loader for create project / micropost / edit profile
   var $projectLoader = $('.loader_project');
   var $projectSub = $('.project_submit');
   var $projectForm = $("#createProjectForm");
   var $settingsForm = $("#settingsForm");

   $projectForm.submit(function(e){
      $projectLoader.css({ "display": "flex" });
   });

   $settingsForm.submit(function(e){
      $projectLoader.css({ "display": "flex" });
   });

   var $microLoader = $('.loader_micro');
   var $microSub = $('#microSubmit');

   $microSub.click(function() {
      $microLoader.css({ "display": "flex" });
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


   // Add flash message on project details link copied
   var $copy = $('.check');
   var $linkFlashMsg = $('#flashMsg');

   $copy.click(function() {
      if($window.scrollTop() >= 50){
        if ($window.width() > 992) {
          var $linkFlash = '<div><div class="success__msg" style="top:75px"><p>Link was copied.</p><p class="error__exit">×</p></div></div>';
        } else {
          var $linkFlash = '<div><div class="success__msg"><p>Link was copied.</p><p class="error__exit">×</p></div></div>';
        }
      } else {
        var $linkFlash = '<div><div class="success__msg"><p>Link was copied.</p><p class="error__exit">×</p></div></div>';
      }

      $linkFlashMsg.append($linkFlash);
      setTimeout(function() {
        $('.success__msg').parent().remove();
        console.log('yee');
      }, 3000);
   });

   setTimeout(function() {
      $('.success__msg').remove();
      $('.error__msg-4').remove();
   }, 3000);
   /**********/


   // Phone or email verification for sign up
   var $emailDisplay = $('.verify_email_display');
   var $phoneDisplay = $('.verify_phone_display');
   var $emailDisplay_2 = $('.verify_email_display_2');
   var $phoneDisplay_2 = $('.verify_phone_display_2');
   var $emailDisplayBtn = $('#verify_email_btn');
   var $phoneDisplayBtn = $('#verify_phone_btn');

   $phoneDisplay.css({ "display": "none" });
   $emailDisplay_2.css({ "display": "none" });

   $emailDisplayBtn.click(function() {
      $phoneDisplay.css({ "display": "none" });
      $phoneDisplay_2.css({ "display": "none" });
      $emailDisplay.css({ "display": "block" });
      $emailDisplay_2.css({ "display": "block" });
   });

   $phoneDisplayBtn.click(function() {
      $emailDisplay.css({ "display": "none" });
      $emailDisplay_2.css({ "display": "none" });
      $phoneDisplay.css({ "display": "block" });
      $phoneDisplay_2.css({ "display": "block" });
   });
   /**********/


   // Original Path
   var $ogPath = window.location.pathname;
   $('.og_path').each(function() {
      $(this).val($ogPath);
   });
   /**********/


   // Open dashboard nav on click
   var $dashOpen = $('#dashBtn');
   var $dashesContainer = $('.dashOpen_container');
   var $dashClose = $('#dashClose');
   var $dashNav = $('#dashSideNav');
   var $window = $(window);

   $dashesContainer.click(function() {
      $dashNav.css({ "width": "100%", "box-shadow": "0 2px 4px 0 rgba(0,0,0,0.2)" });

      $dashesContainer.css({ "display": "none" });
      $dashClose.css({ "display": "block" });
   });

   $dashClose.click(function() {
      $dashNav.css({ "width": "0" });
      $dashesContainer.css({ "display": "block" });
      $dashClose.css({ "display": "none" });
   });
   /**********/


   // Micro post card text
   var $microP = $('.micropost_card p');

   $microP.each(function() {
      var $p_text = $(this).text().trim();
      if ($p_text.length == 0) {
         $(this).css({ "padding": "0" });
      }
   });
   /**********/

   // Change font for example in profile settings
   var $fontMainOptions =  $('.profile_font_main_option');
   var $fontSecondaryOptions =  $('.profile_font_secondary_option');
   var $fontMainExample = $('#profileMainFontExample');
   var $fontMainSelect = $('#profileMainFontSelect');
   var $fontSecondaryExample = $('#profileSecondaryFontExample');
   var $fontSecondarySelect = $('#profileSecondaryFontSelect');

   $fontMainSelect.click(function() {
      $fontMainOptions.each(function() {
         if ($(this).is(':selected')) {
            var $fontName = $(this).val();
            $fontMainExample.css({ "font-family": $fontName });
         }
      });
   });

   $fontSecondarySelect.click(function() {
      $fontSecondaryOptions.each(function() {
         if ($(this).is(':selected')) {
            var $fontName = $(this).val();
            $fontSecondaryExample.css({ "font-family": $fontName });
         }
      });
   });
   /**********/


   // Profile Collections
   var $collection = $('#selectCollection').find(":selected").text();
   var $collection_project = $(".collection_project");

   var $first_projects = $("#selectCollection").first().val();

   $collection_project.css({ "display": "none" });
   $(".edit_collection_btn").css({ "display": "none" });
   $('.' + $first_projects).css({ "display": "block" });
   $('.edit_collection_btn.' + $first_projects).css({ "display": "flex" });

   var $ownProject = $(".ownProject");
   var $savedProject = $(".savedProject");
   var $repostedProject = $(".repostedProject");

   $savedProject.css({ "display": "none" });
   $repostedProject.css({ "display": "none" });

   $("#selectCollection").on('change', function () {
      $collection = $(this).val();
      $collection_project.css({ "display": "none" });
      $('.' + $collection).css({ "display": "block" });
      $('.edit_collection_btn.' + $collection).css({ "display": "flex" });
      $savedProject.css({ "display": "none" });
      $repostedProject.css({ "display": "none" });

      console.log($collection);
   });
  /**********/

  // Check if project background color was clicked
  $("#profile_project_background_color").on('change', function () {
     $("#color_was_chosen").val('true');
  });
  /**********/

  // Index feed AJAX post
  $('.project_action_btn.btn_p_submit').each(function() {
     $(this).click(function() {

        var $action = $(this).parent().children("input[name=action]").val();
        var $projectUsername = $(this).parent().children("input[name=username]").val();
        var $projectId = $(this).parent().children("input[name=project_id]").val();
        var $projectOwner = $(this).parent().children("input[name=project_owner]").val();

        var $btnIcon = $(this).children().children();

        if ($btnIcon.hasClass('fa-heart')) {
           $btnIcon.removeClass('fa-heart');
           $btnIcon.addClass('fa-heart-o');
        } else if ($btnIcon.hasClass('fa-heart-o')) {
           $btnIcon.removeClass('fa-heart-o');
           $btnIcon.addClass('fa-heart');
        } else if ($btnIcon.hasClass('fa-bookmark')) {
           $btnIcon.removeClass('fa-bookmark');
           $btnIcon.addClass('fa-bookmark-o');
        } else {
           $btnIcon.removeClass('fa-bookmark-o');
           $btnIcon.addClass('fa-bookmark');
        }

        $.post($action, {
          username: $projectUsername,
          project_id: $projectId,
          project_owner: $projectOwner,
          ajax: true
        }, function(data, status) {

        });

     });
  });

  $("#repostForm").submit(function(e){
     e.preventDefault();
  });

  $("#unrepostForm").submit(function(e){
     e.preventDefault();
  });

  $("#repostForm .repost_submit").click(function() {

     $(".detailsRepostModal").css({ "display": "none" });

     var $repostFlashMsg = $('#flashMsg');
     var $repostFlash = '<div class="success__msg"><p>Reposted project.</p><p class="error__exit">×</p></div>';

     $repostFlashMsg.append($repostFlash);
     setTimeout(function() {
        $('.success__msg').parent().remove();
     }, 3000);

     $.post($('#repostForm').attr('action'), {
       username: $('#repostUsername').val(),
       project_id: $('#repostProjectId').val(),
       project_owner: $('#repostProjectOwner').val(),
       repost_to: $('#repostForm select').val(),
       ajax: true
     }, function(data, status) {

     });
  });

  $("#unrepostForm .unrepost_btn").click(function() {

     if ($('#unrepostForm').attr('action')) {

        $(".detailsRepostModal").css({ "display": "none" });

        var $unrepostFlashMsg = $('#flashMsg');
        var $unrepostFlash = '<div><div class="success__msg"><p>Unreposted project.</p><p class="error__exit">×</p></div></div>';

        $unrepostFlashMsg.append($unrepostFlash);
        setTimeout(function() {
           $('.success__msg').parent().remove();
        }, 3000);

        $.post($('#unrepostForm').attr('action'), {
          username: $('#unrepostUsername').val(),
          project_id: $('#unrepostProjectId').val(),
          ajax: true
        }, function(data, status) {

        });
     }
  });
  /**********/

  // Tabs for suggested index feed
  var $indexFollowingFeed = $(".following_index_feed");
  var $indexSuggestedFeed = $(".suggested_index_feed");
  var $indexFollowingBtn = $("#indexFollowingBtn");
  var $indexSuggestedBtn = $("#indexSuggestedBtn");

  $indexSuggestedBtn.click(function() {
     $indexSuggestedFeed.css({ "display": "block" });
     $indexFollowingFeed.css({ "display": "none" });
     $indexFollowingBtn.css({ "font-weight": "normal", "font-size": "12px" });
     $indexSuggestedBtn.css({ "font-weight": "bold", "font-size": "14px" });
  });

  $indexFollowingBtn.click(function() {
     $indexFollowingFeed.css({ "display": "block" });
     $indexSuggestedFeed.css({ "display": "none" });
     $indexSuggestedBtn.css({ "font-weight": "normal", "font-size": "12px" });
     $indexFollowingBtn.css({ "font-weight": "bold", "font-size": "14px" });
  });
  /**********/


  // Message Settings Btn
  var $msgSettingsBtn = $('.msg_settings_btn');
  var $searchContainer = $('.search-container');
  var $windowWidth = $window.width();

  if ($windowWidth <= 992 && $msgSettingsBtn.length >= 1) {
    $searchContainer.css({ "display": "none"});
    $msgSettingsBtn.css({ "display": "block"});
  }

  // Open settings nav on click
  var $chatSettingsOpen = $('.chatSettingsBtn');
  var $chatSettingsClose = $('#chatSettingsClose');
  var $chatSideNav = $('#chatSettingsNav');
  var $siteBody = $('body');

  $chatSettingsOpen.each(function() {
    $(this).click(function() {
      if($window.width() <= 768) {
        $chatSideNav.css({ "width": "100%", "box-shadow": "0 2px 4px 0 rgba(0,0,0,0.2)" });
      } else {
        $chatSideNav.css({ "width": "350" });
      }
    });
  });

  $chatSettingsClose.click(function() {
     $chatSideNav.css({ "width": "0" });
  });

  $siteBody.on('click', function(e){
     if( !$(e.target).is('.settings_content, .settings__header, .settings__underline, .profile__sidenav a, .chatSettingsBtn, #settingsBtn .mobile-nav__icon, #profileSideNav, #profileSideNav p') ) {
        $chatSideNav.css({ "width": "0" });
     }
  });
  /**********/


  // Modal pop up for messaging
  var $msgPop = $("#msgPop");
  var $msgModalBtn = $(".msgModalBtn");
  var $msgPopClose = $("#msgPopClose");
  var $msgContentInput = $("#msgContentInput");
  var $user_followers = $(".user_autocomplete_self");
  var $user_auto_input = $(".user_autocomplete_input");
  var $user_autocomplete = $(".user_autocomplete");

  var $msgContentProjectValue = $('#msgContentProjectValue');

  if ($msgContentProjectValue.length >= 1) {
    $msgContentInput.val($msgContentProjectValue.val());
  }

  var $all_followers = []

  $msgModalBtn.each(function() {
     $(this).click(function() {

       $msgPop.css({ "height": "275px", "box-shadow": "rgba(0,0,0,.1) 0 2px 10px 1px" });

        $("body").css({ "overflow-y": "hidden" });
        $(".following_index_feed").css({ "overflow-y": "hidden" });

        if ($(this).parents(".project_content_right").length >= 1) {
          var $msgContent = $(this).parents(".project_content_right").html().toString();

          var $indexToRemove = $msgContent.indexOf('<div class="micro_action_btns">');

          $msgContent = $msgContent.slice(0, $indexToRemove);

          $msgContent = $msgContent + '</div>';

          $msgContentInput.val($msgContent);
        }

     });
  });

  $msgPopClose.click(function() {
     $msgPop.css({ "height": "0" });
     $user_auto_input.attr('value', '');
     $user_auto_input.empty();
     $("body").css({ "overflow-y": "scroll" });
     $(".following_index_feed").css({ "overflow-y": "scroll" });
  });

  var $sendBtn = $(".user_autocomplete_btn");
  var $sendFlashMsg = $('#flashMsg');
  var $sendFlash = '<div><div class="success__msg"><p>Message was sent.</p><p class="error__exit">×</p></div></div>';

  $($sendBtn).on("click", function(e) {
    e.preventDefault();

    var $sendAction = '/messages/direct/sendpost';
    var $msgVal = $msgContentInput.val();
    var $userVal = $user_auto_input.val();

    if ($msgVal != '' && $userVal != '' ) {
      $.post($sendAction, {
        send_to_user: $userVal,
        message: $msgVal
      }, function(data, status) {

      });

      $sendFlashMsg.append($sendFlash);
      setTimeout(function() {
         $('.success__msg').parent().remove();
      }, 3000);

      $msgPop.css({ "height": "0" });
      $user_auto_input.attr('value', '');
      $user_auto_input.empty();
      $("body").css({ "overflow-y": "scroll" });
      $(".following_index_feed").css({ "overflow-y": "scroll" });
    }
  });
  /**********/


  // Double click to like message
  var $msgLinks = $('.direct_msg_wrapper a');

  var firstClickTarget = null;

  var timer = 0;
  var delay = 200;
  var prevent = false;

  $(".direct_msg_wrapper").on("click", function(e) {

    var $post_link = $(this).find('.micropost a').attr("href");

    var $chatId = $(this).find('.chat_id').val();
    var $msgId = $(this).find('.message_id').val();
    var $msgAction = "/messages/direct/like/";
    var $is_post_link = $(this).find('.msg_post_link');

    e.preventDefault();

    if (e.detail === 1) {

      timer = setTimeout(function() {
        if (!prevent) {
          $(window).attr('location', $post_link)
          console.log($post_link);
        }
        prevent = false;
      }, delay);

    } else if (e.detail === 2){

      clearTimeout(timer);
      prevent = true;

      $.post($msgAction, {
        chatId: $chatId,
        messageId: $msgId
      }, function(data, status) {

      });

      if ($is_post_link) {
        $(this).append('<i style="font-weight: bold" class="fa fa-heart msg_post_liked msg_post_liked_post_link"></i>')
      } else {
        $(this).append('<i style="font-weight: bold" class="fa fa-heart msg_post_liked"></i>')
      }

      timer = setTimeout(function() {
        prevent = false;
      }, delay);

    }

  });
  /**********/


  // // Direct Message Ajax
  // var $chatId = $("#chatId").val();
  // var $siteURL = $("#siteURL").val();
  // var $sendFlashMsg = $('#flashMsg');
  // var $sendFlash = '<div><div class="success__msg"><p>Message was sent.</p><p class="error__exit">×</p></div></div>';
  //
  // $("#sendBtn").click(function() {
  //
  //   var $msgContent = $("#msgContent").val();
  //
  //   sendMessage({
  //     username: $("#msgUsername").val(),
  //     message: $("#msgContent").val(),
  //     profileimage: $("#msgImg").val(),
  //   });
  //
  //   //getMessages()
  //
  // });
  //
  // function addMessages(message) {
  //   $('#all_msg_container').append(`<div class="direct_msg_wrapper user_own_msg"><p class="direct_msg_self">${message.message}</p><a href="/profile/${message.username}" style="align-self: flex-end"><div class="msg_user_container"><p class="direct_msg_username">${message.username}</p><div class="msg_profile_img_container"><img class="msg_profile_img" src="https://ik.imagekit.io/w07am55tja/${message.profileimage}?tr=w-100"></div></div></a></div>`)
  // }
  //
  // function getMessages() {
  //   // $.get($siteURL, (data) => {
  //   //   data.forEach(addMessages);
  //   // })
  // }
  //
  // function sendMessage(message){
  //   // $.post($siteURL, message)
  //
  //   console.log(message);
  //
  //   $sendFlashMsg.append($sendFlash);
  //   setTimeout(function() {
  //      $('.success__msg').parent().remove();
  //   }, 3000);
  // }
  /**********/


  // Ajax like comment
  var $commentLikeBtn = $(".commentLikeBtn");
  var $likeCommentFlashMsg = $('#flashMsg');
  var $likeCommentFlash = '<div><div class="success__msg"><p>Comment was liked.</p><p class="error__exit">×</p></div></div>';
  var $likeUnCommentFlash = '<div><div class="success__msg"><p>Comment like was removed.</p><p class="error__exit">×</p></div></div>';

  $commentLikeBtn.each(function() {
    $(this).click(function() {
      var $commentId = $(this).children('.likeCommentId').val();
      var $commentContentId = $(this).children('.likeCommentContentId').val();
      var $og_path = $(this).children('.og_path').val();
      var $likeCommentAction = '/p/details/comment/like/' + $commentId;
      var $likeIcon = $(this).children('i');

      $.post($likeCommentAction, {
        commentContentId: $commentContentId,
        og_path: $og_path
      }, function(data, status) {

      });

      if ($likeIcon.hasClass('commentNotLiked')) {
        $likeIcon.removeClass('fa-heart-o commentNotLiked');
        $likeIcon.addClass('fa-heart commentLiked');

        $likeCommentFlashMsg.append($likeCommentFlash);
        setTimeout(function() {
           $('.success__msg').parent().remove();
        }, 3000);
      } else {
        $likeIcon.removeClass('fa-heart commentLiked');
        $likeIcon.addClass('fa-heart-o commentNotLiked');

        $likeCommentFlashMsg.append($likeUnCommentFlash);
        setTimeout(function() {
           $('.success__msg').parent().remove();
        }, 3000);
      }

    });
  });
  /**********/


  // Reply to comment
  var $sendCommentForm = $("form#comment");
  var $commentReplyBtn = $(".commentReplyBtn");
  var $likeCommentFlashMsg = $('#flashMsg');
  var $likeCommentFlash = '<div><div class="success__msg"><p>Comment was liked.</p><p class="error__exit">×</p></div></div>';

  $commentReplyBtn.each(function() {
    $(this).click(function() {

      var $commentId = $(this).prev().children('.likeCommentId').val();
      var $commentContentId = $(this).prev().children('.likeCommentContentId').val();
      var $commentOwner = $(this).prev().children('.commentOwner').val();
      var $og_path = $(this).prev().children('.og_path').val();

      $sendCommentForm.css({ "display": "none" });
      $(this).parent().parent().append('<form id="replyComment" method="post" class="replyComment comment_form" action="/p/details/comment/reply/' + $commentId + '"><div class="replying_to_container">Replying to @' + $commentOwner + ' <i class="fa fa-times replyCancelBtn"></i></div><input type="hidden" name="og_path" value="' + $og_path + '"><input type="hidden" name="commentContentId" value="' + $commentContentId + '"><textarea type="text" name="reply" required></textarea><button class="comment_btn" name="submit" type="submit">Send Reply</button></form>')

      checkReplyCancelBtn()

    });
  });

  function checkReplyCancelBtn() {

    var $replyCancelBtn = $(".replyCancelBtn");

    $replyCancelBtn.each(function() {
      $(this).click(function() {

        $sendCommentForm.css({ "display": "flex" });
        $(this).parent().parent().remove();

      });
    });
  }


  var $viewRepliesBtn = $(".viewRepliesBtn");

  $viewRepliesBtn.each(function() {
    $(this).click(function() {

      if ($(this).hasClass('openReplies')) {

        $(this).next().css({ "display": "none" });
        $(this).removeClass('openReplies');
        $(this).text('- View Replies')

      } else {

        $(this).next().css({ "display": "flex" });
        $(this).addClass('openReplies');
        $(this).text('- Hide Replies');

      }

    });
  });
  /**********/

  // Settings nav in creator dashboard
  var $dashSettings = $("#dashSettings");
  var $dashSettingsContent = $(".dash_settings_content");

  if ($dashSettings.length >= 1) {

    $dashSettings.on('click', function(e) {
      if ($dashSettingsContent.hasClass('dash_settings_content_open')) {
        $dashSettingsContent.removeClass('dash_settings_content_open')
      } else {
        $dashSettingsContent.addClass('dash_settings_content_open')
      }
    });

    $('body').on('click', function(e) {
       if( !$(e.target).is('#dashSettings, .dash_settings_nav, .dash_settings_content .dash_settings_content a') ) {
          $dashSettingsContent.removeClass('dash_settings_content_open');
       }
    });
  }
  /**********/

  // Modal pop up for payments
  var $modalPayments = $(".paymentsModal");
  var $modalBtnPayments = $(".payments_modal_btn");
  var $stripeForm = $(".stripe_form");
  var $stripeResult = $(".stripe_result");
  var $closeBtnPayments = $(".closeModalPayments");

  $modalBtnPayments.each(function() {
     $(this).click(function() {
        $modalPayments.css({ "display": "block" });
     });
  });

  $closeBtnPayments.click(function() {
     $modalPayments.css({ "display": "none" });
     $stripeForm.removeClass('stripe_hidden');
     $stripeResult.addClass('stripe_hidden');
  });

  $("input[data-type='currency']").on({
      keyup: function() {
        $(".price_amount_err").text('');
        $("#card-errors").text('');
        $("#amount_input_err").text('');
      },
      blur: function() {
        formatCurrency($(this), "blur");
        $(this).parent().focus()
      }
  });


  function formatNumber(n) {
    // format number 1000000 to 1,234,567
    return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  }


  function formatCurrency(input, blur) {

    // appends $ to value, validates decimal side
    // and puts cursor back in right position.

    // get input value
    var input_val = input.val();

    // don't validate empty input
    if (input_val === "") { return; }

    // original length
    var original_len = input_val.length;

    // initial caret position
    var caret_pos = input.prop("selectionStart");

    // check for decimal
    if (input_val.indexOf(".") >= 0) {

      // get position of first decimal
      // this prevents multiple decimals from
      // being entered
      var decimal_pos = input_val.indexOf(".");

      // split number by decimal point
      var left_side = input_val.substring(0, decimal_pos);
      var right_side = input_val.substring(decimal_pos);

      if (input.attr('id') != 'product_price' && input.attr('id') != 'product_shipping_price' && parseInt(left_side) < 4) {

        // Subs and Tips need to be over $4
        if ($("#card-errors").length > 0) {
          $("#card-errors").text('Amount must be at least $4');
        } else {
          if (input_val < 0.01) {
            $("#amount_input_err").text('Amount must be at least $4');
          }
        }

        input_val = 4;
        input_val = '$' + input_val.toString();

      } else if (input.attr('id') == 'product_price' && parseInt(left_side) == 0 && parseInt(right_side.replace(".", "")) < 25) {

        // Products need to be over $0.25
        input.next(".price_amount_err").text('Amount must be at least $0.25');

        input_val = 0.25;
        input_val = '$' + input_val.toString();

      } else {

        // All good

        // add commas to left side of number
        left_side = formatNumber(left_side);

        // validate right side
        right_side = formatNumber(right_side);

        // On blur make sure 2 numbers after decimal
        if (blur === "blur") {
          right_side += "00";
        }

        // Limit decimal to only 2 digits
        right_side = right_side.substring(0, 2);

        // join number by .
        input_val = "$" + left_side + "." + right_side;

      }

    } else {
      // no decimal entered
      // add commas to number
      // remove all non-digits
      input_val = formatNumber(input_val);

      if (input.attr('id') == 'product_price' || input.attr('id') == 'product_shipping_price') {

        if (input.attr('id') == 'product_price') {

          if (parseInt(input_val) <= 0) {

            input.next(".price_amount_err").text('Amount must be at least $0.25');

            input_val = 0.25;
            input_val = '$' + input_val.toString();

          } else {
            input_val = "$" + input_val;

            // final formatting
            if (blur === "blur") {
              input_val += ".00";
            }
          }

        }

      } else {

        if (input_val < 4) {

          if ($("#card-errors").length > 0) {
            $("#card-errors").text('Amount must be at least $4');
          } else {
            if (input_val < 0.01) {
              $("#amount_input_err").text('Amount must be at least $4');
            }
          }

          input_val = 4;
          input_val = '$' + input_val.toString();

        } else {
          input_val = "$" + input_val;
          // final formatting
          if (blur === "blur") {
            input_val += ".00";
          }
        }

      }
    }

    // send updated string to input
    input.val(input_val);

    // put caret back in the right position
    var updated_len = input_val.length;
    caret_pos = updated_len - original_len + caret_pos;
    input[0].setSelectionRange(caret_pos, caret_pos);

    input.off('blur');
    input.blur();

    $("input[data-type='currency']").on({
        keyup: function() {
          $(".price_amount_err").text('');
          $("#card-errors").text('');
          $("#amount_input_err").text('');
        },
        blur: function() {
          formatCurrency($(this), "blur");
          $(this).parent().focus()
        }
    });
  }
  /**********/


  // Modal pop up for subscription payments
  var $modalSub = $(".subModal");
  var $modalBtnSub = $(".sub_modal_btn");
  var $stripeForm = $(".stripe_form");
  var $stripeResult = $(".stripe_result");
  var $closeBtnSub = $(".closeModalSub");
  var $subBtn = $(".creator_sub_btn");

  if ($subBtn.length > 0) {
    $subBtn.each(function() {
      $(this).parent().click(function(e) {
        e.preventDefault();
        e.stopPropagation();

        $modalSub.css({ "display": "block" });
      });
    });
  }

  $modalBtnSub.each(function() {
     $(this).click(function() {
        $modalSub.css({ "display": "block" });
     });
  });

  $closeBtnSub.click(function() {
     $modalSub.css({ "display": "none" });
     $stripeForm.removeClass('stripe_hidden');
     $stripeResult.addClass('stripe_hidden');
  });
  /**********/


  // Dashboard edit subscription price
  var $changeSubBtn = $(".monetizeChangeSub");
  var $changePriceContainer = $(".monetize_edit_price");
  var $deleteSub = $('.deleteSub');
  var $closeSubBtn = $(".sub_edit_cancel");
  var $subOptions = $(".sub_options_wrapper");
  var $changePriceBool = $("#monetize_edit_price_form #change_price");

  $changeSubBtn.click(function() {
     $changePriceContainer.css({ "display": "block" });
     $closeSubBtn.css({ "display": "block" });
     $changePriceBool.val('true');
     $changeSubBtn.css({ "display": "none" });
     $subOptions.css({ "display": "none" });
     $deleteSub.css({ "display": "none" });
  });

  $closeSubBtn.click(function() {
     $changePriceContainer.css({ "display": "none" });
     $closeSubBtn.css({ "display": "none" });
     $changePriceBool.val('false');
     $changeSubBtn.css({ "display": "block" });
     $subOptions.css({ "display": "flex" });
     $deleteSub.css({ "display": "block" });
  });
  /**********/


  // Dashboard add product
  var $addProductBtn = $(".monetizeAddProduct");
  var $addProductContainer = $(".monetize_add_product");
  var $closeProductBtn = $(".product_add_cancel");

  $addProductBtn.click(function() {
     $addProductContainer.css({ "display": "block" });
     $closeProductBtn.css({ "display": "block" });
     $addProductBtn.css({ "display": "none" });
  });

  $closeProductBtn.click(function() {
    $addProductContainer.css({ "display": "none" });
    $closeProductBtn.css({ "display": "none" });
    $addProductBtn.css({ "display": "block" });
  });
  /**********/


  // Contact form prevent spam bots
  var $honey = $("#HP_in");
  var $honeyContactForm = $("#contactForm");

  $honeyContactForm.on('submit', function(e) {

    if ($honey.val().length > 0) {
      e.preventDefault();
      e.stopPropagation();
    }

  });
  /**********/


  // File upload validation client side
  $("input[data-type='image']").change(function () {
    var fileExtension = ['jpeg', 'jpg', 'png', 'gif'];

    // ext !== '.png' && ext !== '.PNG' && ext !== '.jpg' && ext !== '.JPG' && ext !== '.gif' && ext !== '.GIF' && ext !== '.jpeg' && ext !== '.JPEG'

    if ($.inArray($(this).val().split('.').pop().toLowerCase(), fileExtension) == -1) {
      // alert("File Must End With : " + fileExtension.join(', '));

      $(this).next('.input_err_msg').text("File Must End With : " + fileExtension.join(', '));
      $(this).parents("form").on('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
      });

    } else {

      $(this).next('.input_err_msg').text("");
      $(this).parents("form").unbind('submit');

    }
  });
  /**********/


  // Show products on profile
  var $productsBtn = $(".show_products_btn");
  var $allProjects = $(".masonryItem");
  var $profileProducts = $('.profileProducts');
  var $projectsBtn = $(".show_projects_btn");

  $productsBtn.click(function() {
     $allProjects.css({ "display": "none" });
     $productsBtn.css({ "display": "none" });
     $profileProducts.css({ "display": "block" });
     $projectsBtn.css({ "display": "flex" });
  });

  $projectsBtn.click(function() {
     $allProjects.css({ "display": "block" });
     $productsBtn.css({ "display": "flex" });
     $profileProducts.css({ "display": "none" });
     $projectsBtn.css({ "display": "none" });
  });
  /**********/


  // Accordion for checkout
  var $acc = $(".checkout_acc");

  $acc.each(function() {
    $(this).click(function() {
       $(this).toggleClass('acc_active');
       $(this).next('.checkout_panel').toggleClass('panel_active');
    });
  })
  /**********/


  // Accordion Tabs for checkout
  var $currentTab = 0;
  showTab($currentTab);

  function showTab(n) {
    var $checkout_tab = $(".checkout_tab");
    $checkout_tab.eq(n).find('.checkout_tab_panel').addClass('panel_active');

    if (n == 0) {
      $("#checkoutPrev").css({ "display": "none" });
    } else {
      $("#checkoutPrev").css({ "display": "inline" });
    }

    if (n == ($checkout_tab.length - 1)) {
      $("#checkoutNext span").text('Place Order');
      $("#checkoutNext").css({ "background": "#31375A", "color": "#fff" });
      $("#checkoutNext").attr('type', 'submit');
    } else {
      $("#checkoutNext span").text('Save & Continue');
      $("#checkoutNext").css({ "background": "transparent", "color": "#31375A" });
      $("#checkoutNext").attr('type', 'button');
    }

    fixStepIndicator(n)
  }

  function nextPrev(n) {
    var $checkout_tab = $(".checkout_tab");

    if (n == 1 && !validateForm()) {
      return false;
    }

    var data = {
      fname: $("input[name=fname]").val(),
      lname: $("input[name=lname]").val(),
      email: $("input[name=email]").val(),
      phone: $("input[name=phone]").val(),
      address: $("input[name=address]").val(),
      apt: $("input[name=apt]").val(),
      city: $("input[name=city]").val(),
      state: $("input[name=state]").val(),
      postal: $("input[name=postal]").val(),
      country: $("input[name=country]").val()
    }

    if ($currentTab >= $checkout_tab.length - 1) {

      $('.checkout_tab_panel.stripe_panel').addClass('panel_active');

      $("#checkoutForm").submit();

      return false;

    } else {

      $("#checkoutForm").on('submit', function(e) {
        e.preventDefault();
      });

      $checkout_tab.eq($currentTab).find('.checkout_tab_panel').removeClass('panel_active');
      $currentTab = $currentTab + n;

      showTab($currentTab);

      $.post('/save-checkout', {
        data: data,
        ajax: true
      }, function(data, status) {

      });
    }
  }

  function validateForm() {
    var $checkout_tab = $(".checkout_tab");
    var $checkout_input = $checkout_tab.eq($currentTab).find('input');
    var $checkout_stripe_form = $checkout_tab.eq($currentTab).find('.stripe_form');

    var valid = true;

    if ($checkout_stripe_form.length >= 1) {

      if ($('#card-element').hasClass('StripeElement--empty') || $('#card-element').hasClass('StripeElement--invalid')) {
        $('#card-element').addClass('invalid');
        valid = false;
      }

      var $is_checked = $('.checkout_billing_check_checkbox').val();

      if ($is_checked == 'false') {

        var $checkout_input = $checkout_tab.eq($currentTab).find('input');

        $checkout_input.each(function() {
          if ($(this).hasClass('checkout_optional')) {
            // Do nothing
          } else {
            if ($(this).val() == '') {
              $(this).addClass('invalid');
              valid = false;
            }
          }
        });
      }

    } else {
      $checkout_input.each(function() {
        if ($(this).hasClass('checkout_optional')) {
          // Do nothing
        } else {
          if ($(this).val() == '') {
            $(this).addClass('invalid');
            valid = false;
          }
        }
      });
    }

    if (valid) {
      var $checkout_step = $(".checkout_step");
      $checkout_step.eq($currentTab).addClass('finish');
    }

    return valid;
  }

  function fixStepIndicator(n) {
    var $checkout_step = $(".checkout_step");

    $checkout_step.each(function() {
      $(this).removeClass('active');
    });

    $checkout_step.eq(n).addClass('active');
  }

  $('#checkoutPrev').click(function() {
    nextPrev(-1);
  });

  $('#checkoutNext').click(function() {
    nextPrev(1);
  });

  $('.checkout_tab').each(function() {
    $(this).find('input').each(function() {
      $(this).on('keyup', function () {
         $(this).removeClass('invalid')
      });
    });
  });
  /**********/


  // Check if billing address is same as shipping in checkout
  var $is_checked = $('.checkout_billing_check_checkbox').attr('checked');

  if ($is_checked == 'checked') {
    $('.checkout_billing_check_wrapper').css({ "display": "none" });
    $('.checkout_billing_check_checkbox').val('true');
  }

  $('.checkout_billing_check_checkbox').click(function() {

    $is_checked = $('.checkout_billing_check_checkbox').val();

    if ($is_checked == 'true') {

      $('.checkout_billing_check_checkbox').val('false');
      $('.checkout_billing_check_wrapper').css({ "display": "block" });
      $('.checkout_billing_check_wrapper').find('input').val("");

    } else {

      $('.checkout_billing_check_checkbox').val('true');
      $('.checkout_billing_check_wrapper').css({ "display": "none" });
      $('.checkout_billing_check_wrapper').find('input[name=billing_fname]').val($("input[name=fname]").val());
      $('.checkout_billing_check_wrapper').find('input[name=billing_lname]').val($("input[name=lname]").val());
      $('.checkout_billing_check_wrapper').find('input[name=billing_address]').val($("input[name=address]").val());
      $('.checkout_billing_check_wrapper').find('input[name=billing_apt]').val($("input[name=apt]").val());
      $('.checkout_billing_check_wrapper').find('input[name=billing_city]').val($("input[name=city]").val());
      $('.checkout_billing_check_wrapper').find('input[name=billing_state]').val($("input[name=state]").val());
      $('.checkout_billing_check_wrapper').find('input[name=billing_postal]').val($("input[name=postal]").val());
      $('.checkout_billing_check_wrapper').find('input[name=billing_country]').val($("input[name=country]").val());

    }
  });
  /**********/


  // Add tracking info for order
  $statusBtn = $(".order_detail_item_mark.owner_mark");
  $addTracking = $(".order_detail_add_tracking");

  $statusBtn.click(function() {
    $addTracking.toggleClass('open_tracking');
  });
  /*********/


  // Edit info for order
  var $contactBtn = $(".order_detail_edit_contact");
  var $shippingBtn = $(".order_detail_edit_shipping");
  var $billingBtn = $(".order_detail_edit_billing");
  var $openContact = $(".contact_was_clicked");
  var $openShipping = $(".shipping_was_clicked");
  var $openBilling = $(".billing_was_clicked");
  var $closeBtn = $(".closeModal");

  $contactBtn.click(function() {
    $openContact.addClass('open_edit_info');
  });

  $shippingBtn.click(function() {
    $openShipping.addClass('open_edit_info');
  });

  $billingBtn.click(function() {
    $openBilling.addClass('open_edit_info');
  });

  $closeBtn.click(function() {
    $openContact.removeClass('open_edit_info');
    $openShipping.removeClass('open_edit_info');
    $openBilling.removeClass('open_edit_info');
  });
  /*********/

});

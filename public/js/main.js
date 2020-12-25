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


   // Remove comments
   var $commentUsername = $(".comment_username");
   var $currentUser = $("#current_user").text();
   var $projAdmins = $("#current_admin").text();
   var $projectId = $("#current_project").text();

   $commentUsername.each(function() {

      var $commentId = $(this).next().next().text();
      var $username = $(this).text();

      if ($currentUser === $projAdmins) {
         if ($(this).next().hasClass('del_box')) {
            $(this).next().append('<form method="post" class="uncomment_form_btn" action="/p/details/uncomment/' + $projectId + '"><input type="hidden" name="comment_id" value="' + $commentId + '"><input type="hidden" name="project_id" value="' + $projectId + '"><button class="project_action_btn" name="submit" type="submit"><img src="/icons/delete-ticket-item.png" class="main-topnav__icon" /></button></form>')
         }
      } else if ($username === $currentUser) {
         if ($(this).next().hasClass('del_box')) {
            $(this).next().append('<form method="post" class="uncomment_form_btn" action="/p/details/uncomment/' + $projectId + '"><input type="hidden" name="comment_id" value="' + $commentId + '"><input type="hidden" name="project_id" value="' + $projectId + '"><button class="project_action_btn" name="submit" type="submit"><img src="/icons/delete-ticket-item.png" class="main-topnav__icon" /></button></form>')
         }
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
   var $flashMsg = $('#flashMsg');
   var $flash = '<div class="success__msg"><p>Link was copied.</p><p class="error__exit">×</p></div>';

   $copy.click(function() {
      $flashMsg.append($flash);
      setTimeout(function() {
         $($flashMsg).remove();
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
      if($window.width() <= 595) {
         $dashNav.css({ "width": "100%", "box-shadow": "0 2px 4px 0 rgba(0,0,0,0.2)" });
      } else {
         $dashNav.css({ "width": "250" });
      }

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

   var $flashMsg = $('#flashMsg');
   var $flash = '<div class="success__msg"><p>Reposted project.</p><p class="error__exit">×</p></div>';

   $flashMsg.append($flash);
   setTimeout(function() {
      $($flashMsg).remove();
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

      var $flashMsg = $('#flashMsg');
      var $flash = '<div class="success__msg"><p>Unreposted project.</p><p class="error__exit">×</p></div>';

      $flashMsg.append($flash);
      setTimeout(function() {
         $($flashMsg).remove();
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
   $indexFollowingBtn.css({ "font-weight": "normal", "font-size": "16px" });
   $indexSuggestedBtn.css({ "font-weight": "bold", "font-size": "18px" });
});

$indexFollowingBtn.click(function() {
   $indexFollowingFeed.css({ "display": "block" });
   $indexSuggestedFeed.css({ "display": "none" });
   $indexSuggestedBtn.css({ "font-weight": "normal", "font-size": "16px" });
   $indexFollowingBtn.css({ "font-weight": "bold", "font-size": "18px" });
});
/**********/

});

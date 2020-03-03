$(document).ready(function() {
   // Editor
   $('#editor').trumbowyg({
      svgPath: '/editorIcons/icons.svg',
      removeformatPasted: true,
      btnsDef: {
         image: {
            dropdown: ['insertImage', 'upload', 'insertAudio'],
            ico: 'upload'
         }
      },
      btns: [
         ['viewHTML'],
         ['formatting'],
         ['strong', 'em', 'del'],
         ['superscript', 'subscript'],
         ['link'],
         ['image'],
         ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
         ['unorderedList', 'orderedList'],
         ['horizontalRule'],
         ['removeformat'],
         ['historyUndo', 'historyRedo']
      ],
      plugins: {
         upload: {
            serverPath: '/p/upload',
            fileFieldName: 'editor_image'
         }
      }
   });

   $('.edit-project__form-btn').each(function() {
      $(this).click(function() {
         // Content of editor
         var contents = $('#editor').trumbowyg('html');

         // Take away html tags and line breaks
         var cleanUp = contents.replace(/<(?:.|\n)*?>/gm, '').replace(/(\r\n|\n|\r)/gm,"").replace('&nbsp;','');

         // Split apart each word
         var noSpaces = cleanUp.trim().split(/\s+/);

         // Count up the words
         var wordCount = noSpaces.length;

         if(wordCount < 1000 ) {
            $("#projectNotes").val(contents);
         }
      });
   });

   $('#editor').keyup(function() {
      // Content of editor
      var contents = $('#editor').trumbowyg('html');

      // Take away html tags and line breaks
      var cleanUp = contents.replace(/<(?:.|\n)*?>/gm, '').replace(/(\r\n|\n|\r)/gm,"").replace('&nbsp;','');

      // Split apart each word
      var noSpaces = cleanUp.trim().split(/\s+/);

      // Count up the words
      var wordCount = noSpaces.length;

      if(wordCount > 1000 ) {
         $('#edit-project__form-btn').attr("type","button");
         $('#edit-project__form-btn').addClass('noClick__btn');
         $('#wordCount').text(wordCount + ' / 1000 words | Too Many Words');
      } else {
         $('#edit-project__form-btn').attr("type","submit");
         $('#edit-project__form-btn').removeClass('noClick__btn');
         $('#wordCount').text(wordCount + ' / 1000 words');
      }
   });

});

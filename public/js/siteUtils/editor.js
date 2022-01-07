$(document).ready(function() {

  // Editor
  const toolbarOptions = [
    ['bold', 'italic', 'underline', 'strike'], // toggled buttons
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }], // custom button values
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }], // superscript/subscript
    [{ 'indent': '-1'}, { 'indent': '+1' }], // outdent/indent
    [{ 'direction': 'rtl' }], // text direction
    [{ 'size': ['small', false, 'large', 'huge'] }], // custom dropdown
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'color': [] }, { 'background': [] }], // dropdown with defaults from theme
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['clean'] // remove formatting button
  ];

  const options = {
    placeholder: 'Make something awesome :)',
    theme: 'snow'
  };

  const editor = new Quill('#text-editor', options);


  // Function to count up words
  const countWords = (content) => {
    // Take away html tags and line breaks
    const cleanUp = notes.replace(/<(?:.|\n)*?>/gm, '').replace(/(\r\n|\n|\r)/gm,"").replace('&nbsp;','');

    // Split apart each word
    const noSpaces = cleanUp.trim().split(/\s+/);

    // Count up the words
    const wordCount = noSpaces.length;

    return wordCount;
  }


  // On submit make sure there's less than 1,000 words
  $("#editorForm").on("submit", function(e) {

    // Editor content
    const notes = $("#text-editor").html();

    // Count up the words
    const wordCount = countWords(notes);

    // Only submit if word count is less than 1,000
    if (wordCount < 1000 ) {

      e.preventDefault();
      $("#editorNotes").val(notes);

    }

  });


  $("#editorForm").keyup(function(e) {

    // Editor content
    const notes = $('#text-editor').html();

    // Count up the words
    const wordCount = countWords(notes);

    // Disable submit if word count is more than 1,000
    if (wordCount > 1000 ) {

      e.preventDefault();
      $('#editorSubmit').attr("type","button");
      $('#editorSubmit').addClass('btn-disabled');
      $('#wordCount').text(wordCount + ' / 1000 words | Too Many Words');

    } else {

      $('#edit-project__form-btn').attr("type","submit");
      $('#edit-project__form-btn').removeClass('noClick__btn');
      $('#wordCount').text(wordCount + ' / 1000 words');

    }
  });

});

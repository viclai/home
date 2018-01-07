$(document).ready(function() {
  var offset = $('#about').offset();
  var scroll_start = 0;

  $(window).scroll(function() {
    scroll_start = $(this).scrollTop();

    if (scroll_start > offset.top) {
      $('.navbar').css('background-color', '#a2dafa');
      $('.navbar').css('opacity', '0.95');
    } else {
      $('.navbar').css('background-color', 'transparent');
      $('.navbar').css('opacity', 'inherit');
    }

    $(".slideanim").each(function(){
      var pos = $(this).offset().top;

      var winTop = $(window).scrollTop();
      if (pos < winTop + 600) {
        $(this).addClass("slide");
      }
    });
  });
});

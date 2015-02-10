// To use click-to-play GIFs, embed an <img> tag directly in the post.
// The `src` attribute should point to the animated version of the image.
// Add a `data-staticSrc` attribute that points to the static image, which
// should have a "play" symbol overlayed on it (e.g.,
// content/images/clicktoplay.png).
// Finally, put a script tag including this file (as
// ../res/clickToPlayGif.js) at the bottom of the post.
(function() {
  var STATIC_ATTR = 'data-staticSrc';
  var ANIM_ATTR = 'data-animatedSrc';

  function stopAll() {
    var images = document.querySelectorAll('img.clicktoplay');
    for (var i = 0; i < images.length; ++i) {
      stopPlaying(images[i]);
    }
  }

  function isPlaying(img) {
    return img.src === img.getAttribute(ANIM_ATTR);
  }

  function stopPlaying(img) {
    img.src = img.getAttribute(STATIC_ATTR);
    img.title = "Click to play";
  }

  function play(img) {
    img.src = img.getAttribute(ANIM_ATTR);
    img.title = "";
  }

  function handleClick(e) {
    var img = e.currentTarget;
    if (isPlaying(img)) {
      stopPlaying(img);
    } else {
      stopAll();
      play(img);
    }
  }

  // Images should be playing by default (progressive enhancement).
  // Find all click-to-play images, stop them from playing, and install a
  // clicking handler which can start them again.
  var images = document.querySelectorAll('img.clicktoplay');
  for (var i = 0; i < images.length; ++i) {
    var img = images[i];
    img.addEventListener('click', handleClick);
    img.setAttribute(ANIM_ATTR, img.src);
    if (!img.hasAttribute(STATIC_ATTR))
      console.warn("Click-to-play images should have a '" + STATIC_ATTR + "' attribute.");
    stopPlaying(img);
  }
})();

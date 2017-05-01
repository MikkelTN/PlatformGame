document.addEventListener('DOMContentLoaded', function(event) {
  window.onresize();

  const controls = document.querySelector(".controls");

  setTimeout(() => {
    controls.style.opacity = 0;
  }, 1000);
});

window.onresize = () => {
    document.body.height = window.innerHeight;
}
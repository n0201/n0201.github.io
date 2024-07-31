var i = 0;
var timer = setInterval(()=>{
  document.getElementById("img").style.left= `${i}px`;
  i = i + 1
  if(i > 1000) {
    clearInterval(timer);
  }
}, 30)
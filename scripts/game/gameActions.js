//The action handler handles touch or keyboard controls
const action = () => {
  const pressed = Object.create(null), 
        keys = {37: 'left', 38: 'up'};
  
  const touchHandler = event => {
    const length = event.touches.length;
    if(length >= 1) {
      event.preventDefault();
    }
    if(length == 1) {
      if(event.touches[0].pageX > window.innerWidth / 2) {
        pressed['up'] = true, pressed['left'] = false;
      } else {
        pressed['up'] = false, pressed['left'] = true;
      }
    } else if(length > 1) {
      for(let i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        touch.pageX > window.innerWidth / 2 ? pressed['up'] = true : pressed['left'] = true;
      }
    } else {
      pressed['up'] = false, pressed['left'] = false;
    }
  };
    
  const keyHandler = event => {
    if(keys.hasOwnProperty(event.keyCode)) {
      pressed[keys[event.keyCode]] = event.type == 'keydown';
      event.preventDefault();
    }
  };
  addEventListener('keydown', keyHandler);
  addEventListener('keyup', keyHandler);
  addEventListener('touchstart', touchHandler, {passive: false});
  addEventListener('touchend', touchHandler);
  return pressed;
};
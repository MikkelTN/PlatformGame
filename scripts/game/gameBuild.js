//Build the level from the levelplan
function Level(plan) {
  this.width = plan[0].length;
  this.height = plan.length;
  this.scale = Math.round(window.innerHeight / (this.height * 1.2));
  this.grid = [];
  this.elements = [];
  this.coins = 0;

  for(let y = 0; y < this.height; y++) {
    const line = plan[y],
          gridLine = [];
    for(let x = 0; x < this.width; x++) {
      const ch = line[x],
            Element = elementChars[ch];
      let fieldType = null;
      if(Element) {
        this.elements.push(new Element(new Vector(x, y), ch));
      }
      else {
        switch(ch) {
          case 'g':
            fieldType = 'grass';
            break;
          case 'd':
            fieldType = 'dirt';
            break;
          case 'w':
            fieldType = 'water';
            break;
          case 'x':
            fieldType = 'wall';
        }
      }
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }

  this.player = this.elements.filter(elm => elm.type == 'player')[0];
  this.status = this.finishDelay = null;

  this.isFinished = () => this.status != null && this.finishDelay < 0;
}

//The physics engine!
Level.prototype.obstacleAt = function(pos, size) {
  const xStart = Math.floor(pos.x),
        xEnd = Math.ceil(pos.x + size.x),
        yStart = Math.floor(pos.y),
        yEnd = Math.ceil(pos.y + size.y);
  if (xStart < 0 || xEnd > this.width || yStart < 0) {
    return 'wall';
  }
  for(let y = yStart; y < yEnd; y++) {
    for(let x = xStart; x < xEnd; x++) {
      const fieldType = this.grid[y][x];
      if(fieldType) {
        return fieldType;
      }
    }
  }
};

Level.prototype.elementAt = function(elm) {
  for(let i = 0; i < this.elements.length; i++) {
    const other = this.elements[i];
    if(other != elm &&
                elm.pos.x + elm.size.x > other.pos.x &&
                elm.pos.x < other.pos.x + other.size.x &&
                elm.pos.y + elm.size.y > other.pos.y &&
                elm.pos.y < other.pos.y + other.size.y)
      return other;
  }
};

Level.prototype.playerTouched = function(type, elm) {
  if((type == 'water' || type == 'floater' || type == 'jumper') && this.status == null) {
    this.status = 'lost';
    this.finishDelay = 0;
  } else if(type == 'coin') {
    this.elements = this.elements.filter(other => other != elm);
    this.coins++;
    this.coinText = document.querySelector('.coinCount');
    this.coinText.innerHTML = this.coins + (this.coins == 1 ? ' coin!' : ' coins!');
    if(this.coinText.style.opacity == 0) {
      this.coinText.style.opacity = 1;
    }
  } else if(type == 'victory') {
    this.elements = this.elements.filter(other => other != elm);
    this.status = 'won';
    this.finishDelay = 1;
  }
};

//Check if elements are inside the active range
Level.prototype.isActive = function(elm) {
  const width = window.innerWidth / this.scale,
        right = this.player.pos.x + width,
        left = this.player.pos.x - width / 4;
  if(elm.type == 'player' ||
     elm.type == 'floater' ||
    (elm.pos.x > left && elm.pos.x < right)) {
    return true;
  }
  return false;
};

//Animate the active elements
Level.prototype.animate = function(step, keys) {
  if(this.status != null) {
    this.finishDelay -= step;
  }
  while (step > 0) {
    const thisStep = Math.min(step, 0.05);
    this.elements.forEach(elm => {
      if(this.isActive(elm)) {
        elm.act(thisStep, this, keys), this;
      }
    });
    step -= thisStep;
  }
};

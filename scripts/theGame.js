const levelPlan = [
  "                      ",
  "  o  o                ",
  " xxxxxx               ",
  "                      ",
  "            xxxx      ",
  "                      ",
  "     xx               ",
  "                      ",
  "                      ",
  "        xx            ",
  "                      ",
  "             xxxxx    ",
  "                      ",
  "                      ",
  "                      ",
  "      xxxxx           ",
  "                      ",
  "  x              = x  ",
  "  x         o o    x  ",
  "  x @      xxxxx   x  ",
  "  xxxxx            x  ",
  "      xwwwwwwwwwwwwx  ",
  "      xxxxxxxxxxxxxx  ",
  "wwwwwwwwwwwwwwwwwwwwww"
];

//Build the level from the levelplan
function Level(plan) {
  this.width = plan[0].length;
  this.height = plan.length;
  this.grid = [];
  this.elements = [];
  
  for(y = 0; y < this.height; y++) {
    const line = plan[y], gridLine = [];
    for(x = 0; x < this.width; x++) {
      let ch = line[x], fieldType = null;
      const Element = elementChars[ch];
      if(Element)
        this.elements.push(new Element(new Vector(x, y), ch));
      else if(ch == "x")
        fieldType = "wall";
      else if(ch == "w")
        fieldType = "water";
      gridLine.push(fieldType);
    }
    this.grid.push(gridLine);
  }

  this.player = this.elements.filter(elm => elm.type == "player")[0];
  this.status = this.finishDelay = null;
}

Level.prototype.isFinished = function() {
  return this.status != null && this.finishDelay < 0;
};

//The vector is used for drawing, movement, positioning etc.
function Vector(x, y) {
  this.x = x; this.y = y;
}
Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};
Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};

//The elements are constructed from their char in the leveldrawing
const elementChars = {
  "@": Player,
  "o": Coin,
  "=": Lava, "|": Lava, "v": Lava
};

function Player(pos) {
  this.pos = pos.plus(new Vector(0, -0.5));
  this.size = new Vector(0.8, 1.5);
  this.speed = new Vector(0, 0);
}
Player.prototype.type = "player";

function Lava(pos, ch) {
  this.pos = pos;
  this.size = new Vector(1, 1);
  if(ch == "=") {
    this.speed = new Vector(2, 0);
  } else if(ch == "|") {
    this.speed = new Vector(0, 2);
  } else if(ch == "v") {
    this.speed = new Vector(0, 3);
    this.repeatPos = pos;
  }
}
Lava.prototype.type = "lava";

function Coin(pos) {
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
  this.size = new Vector(0.6, 0.6);
  this.wobble = Math.random() * Math.PI * 2;
}
Coin.prototype.type = "coin";

//For displaying the game I need a quick way of inserting html elements
function elt(name, className) {
  const elt = document.createElement(name);
  if(className)
    elt.className = className;
  return elt;
}

function DOMDisplay(parent, level) {
  this.wrap = parent.appendChild(elt("div", "game"));
  this.level = level;

  this.wrap.appendChild(this.drawBackground());
  this.elmLayer = null;
  this.drawFrame();
}

//Functions for drawing the game and the actors
const scale = Math.floor(Math.min(window.innerWidth, window.innerHeight) / 10);

DOMDisplay.prototype.drawBackground = function() {
  const table = elt("table", "background");
  table.style.width = this.level.width * scale + "px";
  this.level.grid.forEach(row => {
    const rowElt = table.appendChild(elt("tr"));
    rowElt.style.height = scale + "px";
    row.forEach(type => rowElt.appendChild(elt("td", type)));
  });
  return table;
};

DOMDisplay.prototype.drawElements = function() {
  const wrap = elt("div");
  this.level.elements.forEach(elm => {
    const rect = wrap.appendChild(elt("div", "element " + elm.type));
    rect.style.width = elm.size.x * scale + "px";
    rect.style.height = elm.size.y * scale + "px";
    rect.style.left = elm.pos.x * scale + "px";
    rect.style.top = elm.pos.y * scale + "px";
  });
  return wrap;
};

DOMDisplay.prototype.drawFrame = function() {
  if(this.elmLayer)
    this.wrap.removeChild(this.elmLayer);
  this.elmLayer = this.wrap.appendChild(this.drawElements());
  this.wrap.className = "game " + (this.level.status || "");
  this.scrollPlayerIntoView();
};

DOMDisplay.prototype.scrollPlayerIntoView = function() {
  const width = this.wrap.clientWidth,
        height = this.wrap.clientHeight,
        margin = width / 5,
  // The viewport
        left = this.wrap.scrollLeft,
        top = this.wrap.scrollTop,
        right = left + width,
        bottom = top + height,
        player = this.level.player,
        center = player.pos.plus(player.size.times(0.5)).times(scale);

  if(center.x < left + margin)
    this.wrap.scrollLeft = center.x - margin;
  else if(center.x > right - margin)
    this.wrap.scrollLeft = center.x + margin - width;
  if(center.y < top + margin)
    this.wrap.scrollTop = center.y - margin;
  else if(center.y > bottom - margin)
    this.wrap.scrollTop = center.y + margin - height;
};

DOMDisplay.prototype.clear = function() {
  this.wrap.parentNode.removeChild(this.wrap);
};

//The physics engine!
Level.prototype.obstacleAt = function(pos, size) {
  const xStart = Math.floor(pos.x);
  const xEnd = Math.ceil(pos.x + size.x);
  const yStart = Math.floor(pos.y);
  const yEnd = Math.ceil(pos.y + size.y);

  if(xStart < 0 || xEnd > this.width || yStart < 0)
    return "wall";
  if(yEnd > this.height)
    return "lava";
  for(y = yStart; y < yEnd; y++) {
    for(x = xStart; x < xEnd; x++) {
      const fieldType = this.grid[y][x];
      if(fieldType)
        return fieldType;
    }
  }
};

Level.prototype.elementAt = function(elm) {
  for(i = 0; i < this.elements.length; i++) {
    const other = this.elements[i];
    if(other != elm &&
                elm.pos.x + elm.size.x > other.pos.x &&
                elm.pos.x < other.pos.x + other.size.x &&
                elm.pos.y + elm.size.y > other.pos.y &&
                elm.pos.y < other.pos.y + other.size.y)
      return other;
  }
};


//Animate the game
Level.prototype.animate = function(step, keys) {
  if(this.status != null)
    this.finishDelay -= step;

  while (step > 0) {
    const thisStep = Math.min(step, 0.05);
    this.elements.forEach(elm => elm.act(thisStep, this, keys), this);
    step -= thisStep;
  }
};

Lava.prototype.act = function(step, level) {
  const newPos = this.pos.plus(this.speed.times(step));
  if(!level.obstacleAt(newPos, this.size))
    this.pos = newPos;
  else if(this.repeatPos)
    this.pos = this.repeatPos;
  else
    this.speed = this.speed.times(-1);
};

const wobbleSpeed = 6, wobbleDist = 0.10;

Coin.prototype.act = function(step) {
  this.wobble += step * wobbleSpeed;
  const wobblePos = Math.sin(this.wobble) * wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

const playerXSpeed = 6;

Player.prototype.moveX = function(step, level, keys) {
  this.speed.x = 0;
  if(keys.left)
    this.speed.x -= playerXSpeed;
  if(keys.right)
    this.speed.x += playerXSpeed;

  const motion = new Vector(this.speed.x * step, 0);
  const newPos = this.pos.plus(motion);
  const obstacle = level.obstacleAt(newPos, this.size);
  if(obstacle)
    level.playerTouched(obstacle);
  else
    this.pos = newPos;
};

const gravity = 30;
const jumpSpeed = 17;

Player.prototype.moveY = function(step, level, keys) {
  this.speed.y += step * gravity;
  const motion = new Vector(0, this.speed.y * step);
  const newPos = this.pos.plus(motion);
  const obstacle = level.obstacleAt(newPos, this.size);
  if(obstacle) {
    level.playerTouched(obstacle);
    if(keys.up && this.speed.y > 0)
      this.speed.y = -jumpSpeed;
    else
      this.speed.y = 0;
  } else {
    this.pos = newPos;
  }
};

Player.prototype.act = function(step, level, keys) {
  this.moveX(step, level, keys);
  this.moveY(step, level, keys);

  const otherActor = level.elementAt(this);
  if(otherActor)
    level.playerTouched(otherActor.type, otherActor);
};

Level.prototype.playerTouched = function(type, elm) {
  if((type == "lava" || type == "water") && this.status == null) {
    this.status = "lost";
    this.finishDelay = 0;
  } else if(type == "coin") {
    this.elements = this.elements.filter(other => other != elm);
    if(!this.elements.some(elm => elm.type == "coin")) {
      this.status = "won";
      this.finishDelay = 1;
    }
  }
};

const arrowCodes = {37: "left", 38: "up", 39: "right"};

function trackKeys(codes) {
  const pressed = Object.create(null);
  function handler(event) {
    if(codes.hasOwnProperty(event.keyCode)) {
      const down = event.type == "keydown";
      pressed[codes[event.keyCode]] = down;
      event.preventDefault();
    }
  }
  addEventListener("keydown", handler);
  addEventListener("keyup", handler);
  return pressed;
}

function runAnimation(frameFunc) {
  let lastTime = null;
  function frame(time) {
    let stop = false;
    if(lastTime != null) {
      const timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if(!stop)
      requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

const arrows = trackKeys(arrowCodes);

function runGame(plan) {
  const level = new Level(plan);
  const display = new DOMDisplay(document.body, level);
  runAnimation(step => {
    level.animate(step, arrows);
    display.drawFrame(step);
    if(level.isFinished()) {
      console.log(display);
      display.clear();
      level.status == 'lost' ? runGame(plan) : console.log('You win!');
    }
  });
}
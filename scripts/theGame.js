//Random level array
const levelArr = [
  [
  "                    ",
  "                    ",
  "                    ",
  " x                  ",
  " x                  ",
  " x                  ",
  " x                  ",
  " x @ x              ",
  " ggggggggg     ggggg",
  " ddddddddd     ddddd",
  " dddddddddlllllddddd"
  ], [
  "                    ",
  "                    ",
  "       |            ",
  "                    ",
  "                    ",
  "        o           ",
  "      o   o         ",
  "                    ",
  "gggggg   | gggg  ggg",
  "dddddd     dddd  ddd",
  "ddddddllllldddd  ddd"
  ], [
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "          o o       ",
  "    =    ggggg      ",
  "          ddd       ",
  "ggggggg        ggggg",
  "ddddddd        ddddd",
  "dddddddllllllllddddd"
  ], [
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "       =   o        ", 
  "                    ",
  "gggggggg   gggg |  g",
  "dddddddd   dddd    d",
  "dddddddd   ddddlllld"
  ], [
  "                    ",
  "                    ",
  "                    ",
  "                    ",
  "                o   ",
  "                    ",
  "         d  d  d    ",
  "      d             ",
  "ggggg   |  |  |  ggg",
  "ddddd            ddd",
  "dddddllllllllllllddd"
  ], [
  "                    ",
  "                    ",
  "                   x",
  "                   x",
  "                   x",
  "                 o x",
  "                gggg",
  "              ggdddd",
  "ggggggggggggggdddddd",
  "dddddddddddddddddddd",
  "dddddddddddddddddddd"
  ]
];

//Build the level from the levelplan
function Level(plan) {
  this.width = plan[0].length;
  this.height = plan.length;
  this.grid = [];
  this.elements = [];
  
  for(y = 0; y < this.height; y++) {
    const line = plan[y],
          gridLine = [];
    for(x = 0; x < this.width; x++) {
      const ch = line[x],
            Element = elementChars[ch];
      let fieldType = null;
      if(Element)
        this.elements.push(new Element(new Vector(x, y), ch));
      else {
        switch(ch) {
          case 'g':
            fieldType = 'grass';
            break;
          case 'd':
            fieldType = 'dirt';
            break;
          case 'l':
            fieldType = 'lava';
            break;
          case 'x':
            fieldType = 'wall';
        }
        gridLine.push(fieldType);
      }
    }
    this.grid.push(gridLine);
  }
  this.player = this.elements.filter(elm => elm.type == "player")[0];
  this.status = this.finishDelay = null;

  this.isFinished = () => this.status != null && this.finishDelay < 0;

  this.playerTouched = (type, elm) => {
    if((type == "lava") && this.status == null) {
      this.status = "lost";
      this.finishDelay = 0;
    } else if(type == "coin") {
      this.elements = this.elements.filter(other => other != elm);
      if(!this.elements.some(elm => elm.type == "coin")) {
        this.status = "won";
        this.finishDelay = 1;
      }
    }
  }
}

//The vector is used for drawing, movement, positioning etc.
function Vector(x, y) {
  this.x = x;
  this.y = y;

  this.plus = other => new Vector(this.x + other.x, this.y + other.y);
  this.times =  factor => new Vector(this.x * factor, this.y * factor);
}

//The elements are constructed from their char in the leveldrawing
const elementChars = {
  "@": Player,
  "o": Coin,
  "=": Lava, "|": Lava, "v": Lava
};

function Player(pos) {
  this.pos = pos.plus(new Vector(0, 0));
  this.size = new Vector(0.9, 0.9);
  this.speed = new Vector(0, 0);
}
Player.prototype.type = "player";

function Lava(pos, ch) {
  this.pos = pos;
  this.size = new Vector(1, 1);
  if(ch == "=") {
    this.speed = new Vector(Math.random() * 3 + 1, 0);
  } else if(ch == "|") {
    this.speed = new Vector(0, Math.random() * 3 + 1);
  } else if(ch == "v") {
    this.speed = new Vector(0, Math.random() * 3 + 2);
    this.repeatPos = pos;
  }

  this.act = (step, level) => {
    const newPos = this.pos.plus(this.speed.times(step));
    if(!level.obstacleAt(newPos, this.size))
      this.pos = newPos;
    else if(this.repeatPos)
      this.pos = this.repeatPos;
    else
      this.speed = this.speed.times(-1);
  }
};
Lava.prototype.type = "lava";

function Coin(pos) {
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
  this.size = new Vector(0.6, 0.6);
  this.wobble = Math.random() * Math.PI * 2;
  //Speed and dist are set as preferred
  this.wobbleSpeed = 6,
  this.wobbleDist = 0.10;

  this.act = step => {
    this.wobble += step * this.wobbleSpeed;
    const wobblePos = Math.sin(this.wobble) * this.wobbleDist;
    this.pos = this.basePos.plus(new Vector(0, wobblePos));
  }
};
Coin.prototype.type = "coin";

//For displaying the game I need a quick way of inserting html elements
function elt(name, className) {
  const elt = document.createElement(name);
  if(className)
    elt.className = className;
  return elt;
}

//Functions for displaying the game and the actors
function Display(parent, level) {
  this.wrap = parent.appendChild(elt("div", "game"));
  this.level = level;
  this.wrap.appendChild(this.drawBackground());
  this.elmLayer = null;
  this.drawFrame();
}

const scale = 50;

Display.prototype.drawBackground = function() {
  const table = elt("table", "background");
  table.style.width = this.level.width * scale + "px";
  this.level.grid.forEach(row => {
    const rowElt = table.appendChild(elt("tr"));
    rowElt.style.height = scale + "px";
    row.forEach(type => rowElt.appendChild(elt("td", type)));
  });
  return table;
};

Display.prototype.drawElements = function() {
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

Display.prototype.drawFrame = function() {
  if(this.elmLayer)
    this.wrap.removeChild(this.elmLayer);
  this.elmLayer = this.wrap.appendChild(this.drawElements());
  this.wrap.className = "game " + (this.level.status || "");
  this.scrollPlayerIntoView();
};

Display.prototype.scrollPlayerIntoView = function() {
  const width = this.wrap.clientWidth,
        margin = width / 4,
        left = this.wrap.scrollLeft,
        player = this.level.player,
        center = player.pos.plus(player.size.times(0.5)).times(scale);

  if(center.x > left + margin)
    this.wrap.scrollLeft = center.x - margin;
};

//The physics engine!
Level.prototype.obstacleAt = function(pos, size) {
  const xStart = Math.floor(pos.x),
        xEnd = Math.ceil(pos.x + size.x),
        yStart = Math.floor(pos.y),
        yEnd = Math.ceil(pos.y + size.y);

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

Player.prototype.move = function(step, level, keys) {
  this.speed.x = keys.left ? 4 : 8;

  const motion = new Vector(this.speed.x * step, 0),
        newPos = this.pos.plus(motion),
        obstacle = level.obstacleAt(newPos, this.size);

  obstacle ? level.playerTouched(obstacle) : this.pos = newPos;
};

const gravity = 30,
      jumpSpeed = 12;

Player.prototype.jump = function(step, level, keys) {
  this.speed.y += step * gravity;
  
  const motion = new Vector(0, this.speed.y * step),
        newPos = this.pos.plus(motion),
        obstacle = level.obstacleAt(newPos, this.size);

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
  this.move(step, level, keys);
  this.jump(step, level, keys);

  const otherActor = level.elementAt(this);
  if(otherActor)
    level.playerTouched(otherActor.type, otherActor);
};

function action() {
  const pressed = Object.create(null);
  const keys = {37: 'left', 38: 'up'};
  
  function touchHandler(event) {
    const length = event.touches.length;
    console.log(length);
    if(length >= 1)
      event.preventDefault();
    if(length == 1) {
      if(event.touches[0].pageX > window.innerWidth / 2) {
        pressed['up'] = true, pressed['left'] = false;
      } else {
        pressed['up'] = false, pressed['left'] = true;
      }
    } else if(length > 1) {
      for(i = 0; i < event.touches.length; i++) {
        const touch = event.touches[i];
        touch.pageX > window.innerWidth / 2 ? pressed['up'] = true : pressed['left'] = true;
      }
    } else {
      pressed['up'] = false, pressed['left'] = false;
    }
  }
    
  function keyHandler(event) {
    if(keys.hasOwnProperty(event.keyCode)) {
      pressed[keys[event.keyCode]] = event.type == 'keydown';
      event.preventDefault();
      console.log(pressed);
    }
  }
  addEventListener('keydown', keyHandler);
  addEventListener('keyup', keyHandler);
  addEventListener('touchstart', touchHandler, {passive: false});
  addEventListener('touchend', touchHandler);
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

const controls = action();

//Given an array of levelplans of equal size, will start at first plan, end at last plan and randomize the rest.
function levelRandomizer(levelPlan) {
  let randomLevel = levelPlan[0];
  for(i = 0; i < 1; i++) {
    const randomPlan = Math.floor(Math.random() * (levelPlan.length - 2) + 1);
    for(j = 0; j < randomLevel.length; j++)
      randomLevel[j] += levelPlan[randomPlan][j];
  }
  for(j = 0; j < randomLevel.length; j++)
      randomLevel[j] += levelPlan[levelPlan.length - 1][j];
  return randomLevel;
}

function runGame() {
  const level = new Level(levelRandomizer(levelArr));
  const display = new Display(document.body, level);
  runAnimation(step => {
    level.animate(step, controls);
    display.drawFrame(step);
    if(level.isFinished()) {
      display.wrap.parentNode.removeChild(display.wrap);
      level.status == 'lost' ? runGame() : console.log('You win!');
    }
  });
}
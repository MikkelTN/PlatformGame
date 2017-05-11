//The elements are constructed from their ch in the leveldrawing
const elementChars = {
  '@': Player,
  'o': Coin,
  'V': Victory,
  '=': Floater,
  '|': Jumper
};

//Player class and methods
function Player(pos) {
  this.type = 'player';
  this.pos = pos.plus(new Vector(0.1, 0.1));
  this.size = new Vector(0.9, 0.9);
  this.speed = new Vector(0, 0);
}

Player.prototype.move = function(step, level, keys) {
  this.speed.x = keys.left ? 2 : 8;

  const motion = new Vector(this.speed.x * step, 0),
        newPos = this.pos.plus(motion),
        obstacle = level.obstacleAt(newPos, this.size);

  obstacle ? level.playerTouched(obstacle) : this.pos = newPos;
};

//Physics constants are set manually
const gravity = 36,
      jumpSpeed = 13;

Player.prototype.jump = function(step, level, keys) {
  this.speed.y += step * gravity;
  
  const motion = new Vector(0, this.speed.y * step),
        newPos = this.pos.plus(motion),
        obstacle = level.obstacleAt(newPos, this.size);

  if(obstacle) {
    level.playerTouched(obstacle);
    if(keys.up && this.speed.y > 0) {
      this.speed.y = -jumpSpeed;
    } else {
      this.speed.y = 0;
    }
  } else {
    this.pos = newPos;
  }
};

Player.prototype.act = function(step, level, keys) {
  this.move(step, level, keys);
  this.jump(step, level, keys);

  const otherActor = level.elementAt(this);
  if(otherActor) {
    level.playerTouched(otherActor.type, otherActor);
  }
};

//Enemy classes and methods
function Floater(pos, ch) {
  this.type = 'floater';
  this.pos = pos.plus(new Vector(0.1, 0.2));
  this.size = new Vector(0.8, 0.8);
  this.speed = new Vector(Math.random() * 3 + 3, 0);
};

Floater.prototype.act = function(step, level) {
  const newPos = this.pos.plus(this.speed.times(step));
  if(!level.obstacleAt(newPos, this.size)) {
    this.pos = newPos;
  }
  else {
    this.speed = this.speed.times(-1);
  }
};

function Jumper(pos, ch) {
  this.type = 'jumper';
  this.pos = pos.plus(new Vector(0.1, 0.2));
  this.size = new Vector(0.8, 0.8);
  this.speed = new Vector(0, 0);
}


Jumper.prototype.act = function(step, level) {
  const motion = new Vector(0, this.speed.y * step),
        newPos = this.pos.plus(motion);
  this.speed.y += step * gravity / 2;

  if(level.obstacleAt(newPos.plus(new Vector(0, -1)), this.size)) {
    if(this.speed.y > 0) {
      this.speed.y = -(Math.random() * 6 + 11);
    }
    else {
      this.speed.y = 0;
    }
  } else {
    this.pos = newPos;
  }
};

//Collectible classes and methods
function Coin(pos) {
  this.type = 'coin';
  this.basePos = this.pos = pos.plus(new Vector(0.2, 0.1));
  this.size = new Vector(0.6, 0.6);
  this.wobble = Math.random() * Math.PI * 2;
  //Speed and dist are set as preferred
  this.wobbleSpeed = 6,
  this.wobbleDist = 0.10;
};

Coin.prototype.act = function(step) {
  this.wobble += step * this.wobbleSpeed;
  const wobblePos = Math.sin(this.wobble) * this.wobbleDist;
  this.pos = this.basePos.plus(new Vector(0, wobblePos));
};

function Victory(pos) {
  Coin.call(this, pos);
  this.type = 'victory';
  this.basePos = this.pos = pos.plus(new Vector(0.2, -0.4));
  this.size = new Vector(0, 1);
}
Victory.prototype = Object.create(Coin.prototype);
//For displaying the game I need a quick way of inserting html elements
const insElm = (name, className, text) => {
  const elm = document.createElement(name);
  if(className) {
    elm.className = className;
  }
  if(text) {
    elm.innerHTML = text;
  }
  return elm;
}

//The vector is used for drawing, movement, positioning etc.
function Vector(x, y) {
  this.x = x;
  this.y = y;
}

Vector.prototype.plus = function(other) {
  return new Vector(this.x + other.x, this.y + other.y);
};

Vector.prototype.times = function(factor) {
  return new Vector(this.x * factor, this.y * factor);
};

//Functions for displaying the game and the elements
function Display(parent, level) {
  this.wrap = parent.appendChild(insElm("div", "game"));
  this.level = level;
  this.wrap.appendChild(this.drawBackground());
  this.elmLayer = null;
  this.drawFrame();
}

Display.prototype.drawBackground = function() {
  const table = insElm("table", "background");
  table.style.width = this.level.width * this.level.scale + "px";
  this.level.grid.forEach(row => {
    const rowElt = table.appendChild(insElm("tr"));
    rowElt.style.height = this.level.scale + "px";
    row.forEach(type => {
      rowElt.appendChild(insElm("td", type));
    });
  });
  return table;
};

Display.prototype.drawElements = function() {
  const wrap = insElm('div');
  this.level.elements.forEach(elm => {
    if(this.level.isActive(elm)) {
      const rect = wrap.appendChild(insElm('div', 'element ' + elm.type));
      rect.style.width = elm.size.x * this.level.scale + 'px';
      rect.style.height = elm.size.y * this.level.scale + 'px';
      rect.style.left = elm.pos.x * this.level.scale + 'px';
      rect.style.top = elm.pos.y * this.level.scale + 'px';
      if(elm.type == 'victory') {
        rect.style.borderLeft = this.level.scale / 2 +'px solid transparent';
        rect.style.borderRight = this.level.scale / 2 + 'px solid transparent';
        rect.style.borderTop = this.level.scale + 'px solid rgb(241, 229, 89)';
      } else if (elm.type == 'coin') {
        rect.style.borderRadius = this.level.scale / 2 + 'px';
      }
    }
  });
  return wrap;
};

Display.prototype.drawFrame = function() {
  if(this.elmLayer) {
    this.wrap.removeChild(this.elmLayer);
  }
  this.elmLayer = this.wrap.appendChild(this.drawElements());
  this.wrap.className = "game " + (this.level.status || "");
  this.scrollPlayerIntoView();
};

Display.prototype.scrollPlayerIntoView = function() {
  const width = this.wrap.clientWidth,
        margin = width / 6,
        left = this.wrap.scrollLeft,
        player = this.level.player,
        center = player.pos.plus(player.size.times(0.5)).times(this.level.scale);
  if(center.x > left + margin) {
    this.wrap.scrollLeft = center.x - margin;
  }
};
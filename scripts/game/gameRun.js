const runAnimation = frameFunc => {
  let lastTime = null;
  const frame = time => {
    let stop = false;
    if(lastTime != null) {
      const timeStep = Math.min(time - lastTime, 100) / 1000;
      stop = frameFunc(timeStep) === false;
    }
    lastTime = time;
    if(!stop) {
      requestAnimationFrame(frame);
    }
  } 
  requestAnimationFrame(frame);
};

//Given a levelplan object, the randomizer will start at start plan, end at end plan and randomize the rest.
const levelRandomizer = levelPlan => {
  let randomLevel = levelPlan.start.slice(0);
  for(let i = 0; i < 10; i++) {
    const randomPlan = Math.round(Math.random() * (levelPlan.plains.length - 1));
    for(let j = 0; j < randomLevel.length; j++)
      randomLevel[j] = randomLevel[j].concat(levelPlan.plains[randomPlan][j]);
  }
  for(let i = 0; i < randomLevel.length; i++)
      randomLevel[i] = randomLevel[i].concat(levelPlan.end[i]);
  return randomLevel;
};

const controls = action();

const runGame = () => {
  const level = new Level(levelRandomizer(gamePlan)),
        display = new Display(document.body, level);
  runAnimation(step => {
    level.animate(step, controls);
    display.drawFrame();
    if(level.isFinished()) {
      if(level.coinText) {
        level.coinText.style.opacity = 0;
      }
      display.wrap.parentNode.removeChild(display.wrap);
      if(level.status == 'lost') {
        runGame();
      }
      else {
        document.body.appendChild(insElm('h1', 'winmsg', 'You finished the level, and you collected ' +
                                      level.coins +
                                      (level.coins == 1 ? ' coin!' : ' coins!')));
      }
      return false;
    }
  });
};
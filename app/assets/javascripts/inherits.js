(function (root){
  var Asteroids = root.Asteroids = ( root.Asteroids || {} );
  Function.prototype.inherits = function (SuperClass) {
    // this is sublcass
    function Surrogate() {}
    Surrogate.prototype = SuperClass.prototype;

    this.prototype = new Surrogate();
  }
})(this);

(function(global){
  var k,
    _handlers = {},
    _mods = { 16: false, 18: false, 17: false, 91: false },
    _scope = 'all',
    // modifier keys
    _MODIFIERS = {
      '⇧': 16, shift: 16,
      '⌥': 18, alt: 18, option: 18,
      '⌃': 17, ctrl: 17, control: 17,
      '⌘': 91, command: 91
    },
    // special keys
    _MAP = {
      backspace: 8, tab: 9, clear: 12,
      enter: 13, 'return': 13,
      esc: 27, escape: 27, space: 32,
      left: 37, up: 38,
      right: 39, down: 40,
      del: 46, 'delete': 46,
      home: 36, end: 35,
      pageup: 33, pagedown: 34,
      ',': 188, '.': 190, '/': 191,
      '`': 192, '-': 189, '=': 187,
      ';': 186, '\'': 222,
      '[': 219, ']': 221, '\\': 220
    },
    code = function(x){
      return _MAP[x] || x.toUpperCase().charCodeAt(0);
    },
    _downKeys = [];

  for(k=1;k<20;k++) _MAP['f'+k] = 111+k;

  // IE doesn't support Array#indexOf, so have a simple replacement
  function index(array, item){
    var i = array.length;
    while(i--) if(array[i]===item) return i;
    return -1;
  }

  // for comparing mods before unassignment
  function compareArray(a1, a2) {
    if (a1.length != a2.length) return false;
    for (var i = 0; i < a1.length; i++) {
        if (a1[i] !== a2[i]) return false;
    }
    return true;
  }

  var modifierMap = {
      16:'shiftKey',
      18:'altKey',
      17:'ctrlKey',
      91:'metaKey'
  };
  function updateModifierKey(event) {
      for(k in _mods) _mods[k] = event[modifierMap[k]];
  };

  // handle keydown event
  function dispatch(event) {
    var key, handler, k, i, modifiersMatch, scope;
    key = event.keyCode;

    if (index(_downKeys, key) == -1) {
        _downKeys.push(key);
    }

    // if a modifier key, set the key.<modifierkeyname> property to true and return
    if(key == 93 || key == 224) key = 91; // right command on webkit, command on Gecko
    if(key in _mods) {
      _mods[key] = true;
      // 'assignKey' from inside this closure is exported to window.key
      for(k in _MODIFIERS) if(_MODIFIERS[k] == key) assignKey[k] = true;
      return;
    }
    updateModifierKey(event);

    // see if we need to ignore the keypress (filter() can can be overridden)
    // by default ignore key presses if a select, textarea, or input is focused
    if(!assignKey.filter.call(this, event)) return;

    // abort if no potentially matching shortcuts found
    if (!(key in _handlers)) return;

    scope = getScope();

    // for each potential shortcut
    for (i = 0; i < _handlers[key].length; i++) {
      handler = _handlers[key][i];

      // see if it's in the current scope
      if(handler.scope == scope || handler.scope == 'all'){
        // check if modifiers match if any
        modifiersMatch = handler.mods.length > 0;
        for(k in _mods)
          if((!_mods[k] && index(handler.mods, +k) > -1) ||
            (_mods[k] && index(handler.mods, +k) == -1)) modifiersMatch = false;
        // call the handler and stop the event if neccessary
        if((handler.mods.length == 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91]) || modifiersMatch){
          if(handler.method(event, handler)===false){
            if(event.preventDefault) event.preventDefault();
              else event.returnValue = false;
            if(event.stopPropagation) event.stopPropagation();
            if(event.cancelBubble) event.cancelBubble = true;
          }
        }
      }
    }
  };

  // unset modifier keys on keyup
  function clearModifier(event){
    var key = event.keyCode, k,
        i = index(_downKeys, key);

    // remove key from _downKeys
    if (i >= 0) {
        _downKeys.splice(i, 1);
    }

    if(key == 93 || key == 224) key = 91;
    if(key in _mods) {
      _mods[key] = false;
      for(k in _MODIFIERS) if(_MODIFIERS[k] == key) assignKey[k] = false;
    }
  };

  function resetModifiers() {
    for(k in _mods) _mods[k] = false;
    for(k in _MODIFIERS) assignKey[k] = false;
  };

  // parse and assign shortcut
  function assignKey(key, scope, method){
    var keys, mods;
    keys = getKeys(key);
    if (method === undefined) {
      method = scope;
      scope = 'all';
    }

    // for each shortcut
    for (var i = 0; i < keys.length; i++) {
      // set modifier keys if any
      mods = [];
      key = keys[i].split('+');
      if (key.length > 1){
        mods = getMods(key);
        key = [key[key.length-1]];
      }
      // convert to keycode and...
      key = key[0]
      key = code(key);
      // ...store handler
      if (!(key in _handlers)) _handlers[key] = [];
      _handlers[key].push({ shortcut: keys[i], scope: scope, method: method, key: keys[i], mods: mods });
    }
  };

  // unbind all handlers for given key in current scope
  function unbindKey(key, scope) {
    var multipleKeys, keys,
      mods = [],
      i, j, obj;

    multipleKeys = getKeys(key);

    for (j = 0; j < multipleKeys.length; j++) {
      keys = multipleKeys[j].split('+');

      if (keys.length > 1) {
        mods = getMods(keys);
        key = keys[keys.length - 1];
      }

      key = code(key);

      if (scope === undefined) {
        scope = getScope();
      }
      if (!_handlers[key]) {
        return;
      }
      for (i in _handlers[key]) {
        obj = _handlers[key][i];
        // only clear handlers if correct scope and mods match
        if (obj.scope === scope && compareArray(obj.mods, mods)) {
          _handlers[key][i] = {};
        }
      }
    }
  };

  // Returns true if the key with code 'keyCode' is currently down
  // Converts strings into key codes.
  function isPressed(keyCode) {
      if (typeof(keyCode)=='string') {
        keyCode = code(keyCode);
      }
      return index(_downKeys, keyCode) != -1;
  }

  function getPressedKeyCodes() {
      return _downKeys.slice(0);
  }

  function filter(event){
    var tagName = (event.target || event.srcElement).tagName;
    // ignore keypressed in any elements that support keyboard data input
    return !(tagName == 'INPUT' || tagName == 'SELECT' || tagName == 'TEXTAREA');
  }

  // initialize key.<modifier> to false
  for(k in _MODIFIERS) assignKey[k] = false;

  // set current scope (default 'all')
  function setScope(scope){ _scope = scope || 'all' };
  function getScope(){ return _scope || 'all' };

  // delete all handlers for a given scope
  function deleteScope(scope){
    var key, handlers, i;

    for (key in _handlers) {
      handlers = _handlers[key];
      for (i = 0; i < handlers.length; ) {
        if (handlers[i].scope === scope) handlers.splice(i, 1);
        else i++;
      }
    }
  };

  // abstract key logic for assign and unassign
  function getKeys(key) {
    var keys;
    key = key.replace(/\s/g, '');
    keys = key.split(',');
    if ((keys[keys.length - 1]) == '') {
      keys[keys.length - 2] += ',';
    }
    return keys;
  }

  // abstract mods logic for assign and unassign
  function getMods(key) {
    var mods = key.slice(0, key.length - 1);
    for (var mi = 0; mi < mods.length; mi++)
    mods[mi] = _MODIFIERS[mods[mi]];
    return mods;
  }

  // cross-browser events
  function addEvent(object, event, method) {
    if (object.addEventListener)
      object.addEventListener(event, method, false);
    else if(object.attachEvent)
      object.attachEvent('on'+event, function(){ method(window.event) });
  };

  // set the handlers globally on document
  addEvent(document, 'keydown', function(event) { dispatch(event) }); // Passing _scope to a callback to ensure it remains the same by execution. Fixes #48
  addEvent(document, 'keyup', clearModifier);

  // reset modifiers to false whenever the window is (re)focused.
  addEvent(window, 'focus', resetModifiers);

  // store previously defined key
  var previousKey = global.key;

  // restore previously defined key and return reference to our key object
  function noConflict() {
    var k = global.key;
    global.key = previousKey;
    return k;
  }

  // set window.key and window.key.set/get/deleteScope, and the default filter
  global.key = assignKey;
  global.key.setScope = setScope;
  global.key.getScope = getScope;
  global.key.deleteScope = deleteScope;
  global.key.filter = filter;
  global.key.isPressed = isPressed;
  global.key.getPressedKeyCodes = getPressedKeyCodes;
  global.key.noConflict = noConflict;
  global.key.unbind = unbindKey;

  if(typeof module !== 'undefined') module.exports = key;

})(this);

(function(root) {
  var Asteroids = root.Asteroids = (root.Asteroids || {} );

  var MovingObject = Asteroids.MovingObject = function(pos, vel, radius, color){
    this.pos = pos;
    this.vel = vel;
    this.radius = radius;
    this.color = color;
  }

  MovingObject.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.strokeStyle = "white";
    ctx.lineWidth = "2";
    ctx.arc(
      this.pos[0],
      this.pos[1],
      this.radius,
      0,
      2 * Math.PI,
      false
    );

    ctx.fill();
    ctx.stroke();
  }

  MovingObject.prototype.move = function(){
    this.pos[0] += this.vel[0];
    this.pos[1] += this.vel[1];
  }

  MovingObject.prototype.isCollidedWith = function(otherObject) {
    var dist = Math.sqrt(Math.pow((otherObject.pos[0]-this.pos[0]),2) + Math.pow((otherObject.pos[1]-this.pos[1]),2));

    if((otherObject.radius + this.radius) > dist) {
      return true;
    } else {
      return false;
    }
  }
})(this);

(function(root) {
  var Asteroids = root.Asteroids = (root.Asteroids || {});

  var COLOR = "black";
  var RADIUS = 25;
  var SPEED = 15;

  var Asteroid = Asteroids.Asteroid = function(pos, vel, radius) {
		colors = ["red", "orange", 'blue', "purple"]
		color = colors[Math.round(Math.random() * colors.length)]
    Asteroids.MovingObject.call(this, pos, vel,
      Math.random() * RADIUS + 10, color);
    if (radius){this.radius = radius}
  }

  Asteroid.inherits(Asteroids.MovingObject);

  Asteroid.randAsteroid = function(dimX, dimY, radius) {
    var startPos = [dimX, dimY]
    var vel = Asteroids.randomVec((Math.random() * SPEED) - SPEED / 2, (Math.random()*SPEED) - SPEED / 2);
    return new Asteroid(startPos, vel, radius);
  }

  var randomVec = Asteroids.randomVec = function(x, y) {
    var startX = Math.random() * x;
    var startY = Math.random() * y;
    return [startX, startY];
  }
})(this);

(function(root) {
  var Asteroids = root.Asteroids = (root.Asteroids || {});

  var RADIUS = 12;
  var COLOR = "green";
  var MAX_VEL = 5;

  var Ship = Asteroids.Ship = function(pos, vel) {
    this.direction = Math.PI / 2
    Asteroids.MovingObject.call(this, pos, vel, RADIUS, COLOR);

  }

  Ship.inherits(Asteroids.MovingObject);

  Ship.prototype.draw = function (ctx) {
     ctx.beginPath();
     ctx.fillStyle = COLOR;
     ctx.strokeStyle = "white";

     ctx.moveTo(this.pos[0] - Math.sin(this.direction) * RADIUS / 1.5,
                this.pos[1] - Math.cos(this.direction) * RADIUS / 1.5);
     ctx.lineTo(this.pos[0] + Math.sin(this.direction) * RADIUS / 1.5,
                this.pos[1] + Math.cos(this.direction) * RADIUS / 1.5);
     ctx.lineTo(this.pos[0] + Math.cos(this.direction) * RADIUS * 2,
                this.pos[1] - Math.sin(this.direction) * RADIUS * 2);

     ctx.closePath();
     ctx.fill();
     ctx.stroke();
   };

   Ship.prototype.fireBullet = function() {
     var vel = [ Math.cos(this.direction) , -Math.sin(this.direction)]
     var dir = [vel[0] * 13, vel[1] * 13];
     var pos = [this.pos[0], this.pos[1]]
     return new Asteroids.Bullet(pos, dir);
   }

  Ship.prototype.power = function(impulse){
    if (this.vel[0] > MAX_VEL) {
         this.vel[0] = MAX_VEL;
       } else if (this.vel[0] < -MAX_VEL) {
         this.vel[0] = -MAX_VEL;
       } else {
         this.vel[0] -= Math.cos(this.direction) * impulse;
       }
       if (this.vel[1] > MAX_VEL) {
         this.vel[1] = MAX_VEL;
       } else if (this.vel[1] < -MAX_VEL) {
         this.vel[1] = -MAX_VEL;
       } else {
         this.vel[1] += Math.sin(this.direction) * impulse;
       }
     }
})(this);

(function(root) {
  var Asteroids = root.Asteroids = (root.Asteroids || {});

  var RADIUS = 2;
  var COLOR = "red";

  var Bullet = Asteroids.Bullet = function(pos, vel) {
    Asteroids.MovingObject.call(this, pos, vel, RADIUS, COLOR);
  };

  Bullet.inherits(Asteroids.MovingObject);

  Bullet.prototype.draw = function(ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.color;

    ctx.arc(
      this.pos[0],
      this.pos[1],
      this.radius,
      0,
      2 * Math.PI,
      false
    );

    ctx.fill();
  }

})(this);

(function(root) {
  var Asteroids = root.Asteroids = ( root.Asteroids || {} );
  var FPS = 25;
  var DIM_X = 700;
  var DIM_Y = 600;
  var buildAsteroids = 5;
  var score = 0;

  var Game = Asteroids.Game = function(ctx) {
    this.ctx = ctx;
    this.asteroids = [];
    this.ship = new Asteroids.Ship([DIM_X / 2, DIM_Y / 2], [0, 0]);
    this.bullets = [];
  };

  Game.prototype.addAsteroids = function(numAsteroids) {
    var that = this;
    for(var i = 0; i < numAsteroids; i++) {
      var createAsteroid = true
      while(createAsteroid){
        pos = Asteroids.randomVec(DIM_X, DIM_Y)
        if (Math.abs(pos[0] - that.ship.pos[0]) > 100 &&
            Math.abs(pos[1] - that.ship.pos[1]) > 100){
          that.asteroids.push(Asteroids.Asteroid.randAsteroid(pos[0], pos[1]));
          createAsteroid = false}
      }
    }
  };

  Game.prototype.bindKeyHandlers = function(){
    if(key.isPressed('up')){ this.ship.power(-0.5) };
    if(key.isPressed('down')){ this.ship.power(0.5) };
    if(key.isPressed('right')) { this.ship.direction -= 0.13 };
    if(key.isPressed('left')){ this.ship.direction += 0.13 };
    if(key.isPressed('space')){ this.fireBullet() };
  }

  Game.prototype.checkCollisions = function(interval) {
    var that = this;

    this.asteroids.forEach(function(asteroid) {
      if(asteroid.isCollidedWith(that.ship)) {
        alert("You've crashed your ship!");
        that.stop(interval);
      }
    })
  };

  Game.prototype.checkShip = function() {
    var cx = this.ship.pos[0];
    var cy = this.ship.pos[1];

    if(this.isOutOfBounds(this.ship)) {
      if(cx < 0) { this.ship.pos[0] = DIM_X; }
      else if (cx > DIM_X) { this.ship.pos[0] = 0; }
      else if (cy < 0) { this.ship.pos[1] = DIM_Y; }
      else if (cy > DIM_Y) { this.ship.pos[1] = 0; }
    }
  }

  Game.prototype.destroyAsteroids = function(asteroid){
    var ind = this.asteroids.indexOf(asteroid);
    var cx = asteroid.pos[0];
    var cy = asteroid.pos[1];

    if(this.hitBullets(asteroid)){
      this.splitAsteroid(asteroid)
      this.asteroids.splice(ind, 1);
      score += 1
    } else if(this.isOutOfBounds(asteroid)) {
      if(cx < 0) { asteroid.pos[0] = DIM_X; }
      else if (cx > DIM_X) { asteroid.pos[0] = 0; }
      else if (cy < 0) { asteroid.pos[1] = DIM_Y; }
      else if (cy > DIM_Y) { asteroid.pos[1] = 0; }
    }
  }

  Game.prototype.draw = function() {
    var ctx = this.ctx
    ctx.clearRect(0, 0, DIM_X, DIM_Y);

    this.asteroids.forEach(function(asteroid) {
      asteroid.draw(ctx);
    });

    this.ship.draw(ctx);

    this.bullets.forEach(function(bullet) {
      bullet.draw(ctx);
    });
  };

  Game.prototype.fireBullet = function() {
      this.bullets.push(this.ship.fireBullet());
  }

  Game.prototype.hitBullets = function(asteroid){
    var hit = false;
    var that = this;
    this.bullets.forEach(function(bullet) {
      if(bullet.isCollidedWith(asteroid)){
        that.removeBullet(bullet)
        hit =  true;
      }
    })
    return hit
  }

  Game.prototype.hitAsteroids = function(bullet){
    var hit = false
    this.asteroids.forEach(function(asteroid) {
      if(asteroid.isCollidedWith(bullet)){
        hit =  true;
      }
    })
    return hit
  }

  Game.prototype.isOutOfBounds = function(obj) {
    var cx = obj.pos[0];
    var cy = obj.pos[1];
    if(cx < 0 || cx > DIM_X || cy < 0 || cy > DIM_Y) {
      return true;
    } else {
      return false;
    };
  }

  Game.prototype.move = function() {
    this.asteroids.forEach(function(asteroid) {
      asteroid.move();
    })

    this.ship.move();
    this.bullets.forEach(function(bullet) {
      bullet.move();
    })
  };

  Game.prototype.printScore = function(){
    ctx = this.ctx
    ctx.font="30px Verdana";

    var gradient=ctx.createLinearGradient(0,0,500,0);
    gradient.addColorStop("0","magenta");
    gradient.addColorStop("0.5","blue");
    gradient.addColorStop("1.0","red");

    ctx.fillStyle=gradient;
    ctx.fillText("Score:" + score.toString() ,50 ,50);
  }

  Game.prototype.removeBullet = function(bullet){
    var ind = this.bullets.indexOf(bullet);
    if(this.isOutOfBounds(bullet) || this.hitAsteroids(bullet)) {
      this.bullets.splice(ind, 1);
    }
  }

  Game.prototype.splitAsteroid = function(asteroid){
    var pos = [asteroid.pos[0], asteroid.pos[1]]
    if(asteroid.radius > 20){
      this.asteroids.push(Asteroids.Asteroid.randAsteroid(pos[0]+ 20,
        pos[1] + 20,
        asteroid.radius / 2));
      this.asteroids.push(Asteroids.Asteroid.randAsteroid(pos[0],
        pos[1],
        asteroid.radius / 2));
    }
  }

  Game.prototype.step = function(interval) {
    var that = this;
    buildAsteroids += 0.03
    this.bindKeyHandlers();
    this.move();
    this.asteroids.forEach(function(asteroid){
      that.destroyAsteroids(asteroid);
    })
    this.checkShip();
    this.draw();
    this.printScore();
    this.checkCollisions(interval);
  };

  Game.prototype.start = function(){
    var that = this;
    this.addAsteroids(10);
    var interval =window.setInterval(function(){
      that.addAsteroids(Math.floor(buildAsteroids))
      }, 9000)
    var interval = window.setInterval(function() { that.step(interval); }, FPS);
  };

  Game.prototype.stop = function(interval) {
    window.clearInterval(interval)
  }
})(this);
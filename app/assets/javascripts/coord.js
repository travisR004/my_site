(function(root) {
  var SG = root.SG = (root.SG || {});
  var Coord = SG.Coord = function (x, y) {
    this.x = x;
    this.y = y;
    this.pos = [x,y]
    this.growth = false;
  };

  Coord.prototype.plus = function(dir) {
   switch (dir) {
     case "N":
       this.x -= 1;
       break;
     case "S":
       this.x += 1;
       break;
     case "W":
       this.y -= 1;
       break;
     case "E":
       this.y += 1;
       break;
   }
   this.pos = [this.x, this.y]
   return this;
  };
})(this);

(function(root) {
  var SG = root.SG = (root.SG || {});

  var Apple = SG.Apple = function () {
    console.log(SG.BOARD_SIZE)
    this.pos = [
      Math.floor(Math.random() * SG.BOARD_SIZE),
      Math.floor(Math.random() * SG.BOARD_SIZE)
    ]
  }
})(this);

(function(root) {
  var SG = root.SG = (root.SG || {});

  var BOARD_SIZE = SG.BOARD_SIZE = 20;

  var Snake = SG.Snake = function () {
    this.dir = "N";
    this.segments = [new SG.Coord(5, 5)];
  };

  Snake.prototype.checkSelfCollision = function (newCoord) {
    var hit = false
    this.segments.forEach(function(coord) {
      if (coord.pos + "" === newCoord.pos + "") {
        hit = true;
      }
    })
    return hit;
  };

  Snake.prototype.grow = function () {
    this.growth = true;
  };

  Snake.prototype.move = function () {
    var oldCoord = this.segments[0]
    var nextSpace = new SG.Coord(oldCoord.x, oldCoord.y);
    var newCoord = nextSpace.plus(this.dir);
    var hit = this.checkSelfCollision(newCoord);
    this.segments.unshift(newCoord)
    if (this.growth){ this.growth = false}
    else{ this.segments.pop() }
    return hit;
  };

  Snake.prototype.turn = function (dir) {
    this.dir = dir;
  };
})(this);

(function(root) {
  var SG = root.SG = (root.SG || {});

  var Board = SG.Board = function () {
   this.grid = this.makeGrid();
   this.snake = new SG.Snake();
   this.apple = new SG.Apple();
  };

  Board.prototype.checkSnakeOB = function () {
    var that = this;
    this.snake.segments.forEach(function(segment){
      if(segment.x === SG.BOARD_SIZE){
        segment.x = 0
      } else if (segment.x < 0){
        segment.x = SG.BOARD_SIZE - 1
      } else if (segment.y === SG.BOARD_SIZE){
        segment.y = 0
      } else if (segment.y < 0){
        segment.y = SG.BOARD_SIZE - 1
      }
    })
  };

  Board.prototype.makeGrid = function () {
   var grid = [];

   for (var i = 0; i < SG.BOARD_SIZE; i++) {
     grid[i] = []
     for (var j = 0; j < SG.BOARD_SIZE; j++) {
       grid[i].push(".")
     }
   }
   return grid;
  };

  Board.prototype.generateApple = function () {
    this.apple = new SG.Apple();
  };

  Board.prototype.appleCollision = function () {
    if (this.snake.segments[0].pos + "" === this.apple.pos + "") {
      this.snake.grow();
      this.generateApple();
    }
  };

  Board.prototype.render = function () {
   this.grid = this.makeGrid();
   var that = this;
   this.snake.segments.forEach(function(coord) {
     that.grid[coord.x][coord.y] = "S";
   })
   var appleX = this.apple.pos[0]
   var appleY = this.apple.pos[1]
   this.grid[appleX][appleY] = "A";
   return this.grid;
};

})(this);

(function(root) {

  var SG = root.SG = (root.SG || {});

  var View = SG.View = function($el){
    this.$el = $el
    this.start();
  };

  View.prototype.handleKeyEvent = function(event){
    var that = this;
    var keycode = event.keyCode
    switch (keycode) {
      case 38:
        that.board.snake.turn("N");
        break;
      case 40:
        that.board.snake.turn("S");
        break;
      case 37:
        that.board.snake.turn("W");
        break;
      case 39:
        that.board.snake.turn("E");
        break;
    }
  };

  View.prototype.makeNewDivs = function (grid) {
    var that = this;
    grid.forEach(function(row, rInd){
      row.forEach(function(el, cInd){
        if(grid[rInd][cInd] === "S"){
          $newDiv =  $("<div class='snake'></div>");
        } else if (grid[rInd][cInd] === "A") {
          $newDiv = $("<div class='apple'></div>");
        } else {
        $newDiv = $("<div class='blank'></div>");
      }
      that.$el.append($newDiv);
      })
    })
  };

  View.prototype.start = function(){
    var that = this;
    this.board = new SG.Board();
    $(document).keydown(function(event){
      that.handleKeyEvent(event);
    })
    var timer = window.setInterval(function(){ that.step(timer)}, 100);
  };

  View.prototype.step = function(timer){
    var grid = this.board.render();
    this.board.appleCollision();
    this.$el.html("")
    if(this.board.snake.move()){
      alert("You tried to eat yourself!")
      window.clearInterval(timer);
    }
    this.board.checkSnakeOB();
    this.makeNewDivs(grid);
  };
})(this);
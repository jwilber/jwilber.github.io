const me1 = "../images/me1.png";
const me2 = "../images/me2.png";
const me3 = "../images/me3.png";

function jareds(p) {
  const numImgs = 5;
  const spring = window.innerWidth < 900 ? 0.05 : 0.2;
  let canvas;
  let jareds = [];
  let img1, img2, img3, img4, img5;

  p.windowResized = () => {
    let height = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight
    );
    p.resizeCanvas(window.innerWidth * 0.98, height);
  };

  p.preload = () => {
    img1 = p.loadImage(me1);
    img2 = p.loadImage(me2);
    img3 = p.loadImage(me3);
  };

  p.setup = () => {
    let imgArray = [img1, img2, img3, img4, img5];
    let height = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight
    );
    canvas = p.createCanvas(p.windowWidth * 0.98, height);
    canvas.position(0, 0);
    canvas.style("z-index", -1);

    for (let i = 0; i < numImgs; i++) {
      jareds[i] = new Jared(
        imgArray[i],
        p.random(p.width),
        p.random(p.height / 2),
        p.random(30, 70),
        i,
        jareds
      );
      console.log(jareds[i]);
    }
    p.noStroke();
  };

  p.draw = () => {
    p.background("white");
    jareds.forEach((jared) => {
      jared.collide();
      jared.move();
      jared.display();
    });
  };

  class Jared {
    // set attributes
    constructor(img, xIndex, yIndex, din, idin, oin) {
      this.img = img;
      this.x = xIndex;
      this.y = yIndex;
      this.xVelocity = 4.5;
      this.yVelocity = 1.5;
      this.diameter = window.innerWidth < 1000 ? 150 : 220;
      this.id = idin;
      this.others = oin;
    }

    collide() {
      for (let i = this.id + 1; i < numImgs; i++) {
        let dx = this.others[i].x - this.x;
        let dy = this.others[i].y - this.y;
        let distance = p.sqrt(dx * dx + dy * dy);
        let minDist = this.others[i].diameter / 2 + this.diameter / 2;
        if (distance < minDist) {
          let angle = p.atan2(dy, dx);
          let targetX = this.x + p.cos(angle) * minDist;
          let targetY = this.y + p.sin(angle) * minDist;
          let ax = (targetX - this.others[i].x) * spring;
          let ay = (targetY - this.others[i].y) * spring;
          this.xVelocity -= ax;
          this.yVelocity -= ay;
          this.others[i].xVelocity += ax;
          this.others[i].yVelocity += ay;
        }
      }
    }

    move() {
      // move
      this.x += this.xVelocity;
      this.y += this.yVelocity;

      // take care of edge collisions
      if (this.x + this.diameter / 2 > p.width) {
        this.x = p.width - this.diameter / 2;
        this.xVelocity *= -1;
      } else if (this.x - this.diameter / 2 < 0) {
        this.x = this.diameter / 2;
        this.xVelocity *= -1;
      }
      if (this.y + this.diameter / 2 > p.height) {
        this.y = p.height - this.diameter / 2;
        this.yVelocity *= -1;
      } else if (this.y - this.diameter / 2 < 0) {
        this.y = this.diameter / 2;
        this.yVelocity *= -1;
      }
    }

    display() {
      p.image(this.img, this.x, this.y, this.diameter, this.diameter);
    }
  }
}

var myp5 = new p5(jareds);

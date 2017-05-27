/****************************************************************************
 * Code adopted from
 * "UCLA's Graphics Example Code (Javascript and C++ translations available),
 * by Garett Ridge for CS174a"
 *
 * The Scene_Component subclasses defined here describe different independent 
 * animation processes that you want to fire off each frame, by defining a 
 * display event and how to react to key and mouse input events. Create your 
 * own subclasses, and fill them in with all your shape drawing calls and any 
 * extra key / mouse controls.
 ****************************************************************************/


// DISCLAIMER: The collision method shown below is not used by anyone; it's
// just very quick to code. Making every collision body a stretched sphere is
// kind of a hack, and looping through a list of discrete sphere points to see
// if the volumes intersect is *really* a hack (there are perfectly good
// analytic expressions that can test if two ellipsoids intersect without
// discretizing them into points). On the other hand, for non-convex shapes
// you're usually going to have to loop through a list of discrete
// tetrahedrons defining the shape anyway.
Declare_Any_Class("Body",
  {
    'construct'(name, s, m, loc, scale = vec3(1, 1, 1), lv = vec3(),
                la = vec3(), av = 0, aa = 0, spin_axis = vec3(1, 0, 0))
      {
        this.define_data_members({
          name                  : name,
          shape                 : s,
          material              : m,
          scale                 : scale,
          location_matrix       : loc, 
          linear_velocity       : lv,
          linear_acceleration   : la,
          angular_velocity      : av,
          angular_acceleration  : aa,
          spin_axis             : spin_axis,

          prev_location_matrix  : null,
          prev_linear_velocity  : null,
          prev_angular_velocity : null,
          collided_last_frame   : false,
          collision_history     : [{"name":null, "collided":null}, {"name":null, "collided":null}]
        });
      },
    'advance'(t) // Do one timestep.
      {
        this.prev_location_matrix = this.location_matrix;
        if (Array.isArray(t) && t.length == 4) {
          this.location_matrix = t;
        } else {
          var delta_velocity = function(aVelocity, aAcceleration) {
            var i;
            var delta;

            for (i = 0; i < 3; i++) {
              delta = aVelocity[i] + aAcceleration[i];
              if ((aVelocity[i] > 0 && delta < 0) || // + -> - velocity
                (aVelocity[i] < 0 && delta > 0) ||   // - -> + velocity
                (aVelocity[i] === 0 && i != 2)) {    // 0 z-velocity
                aVelocity[i] = 0;
                if (i !== 2)
                  aAcceleration[i] = 0;
              }
              else
                aVelocity[i] = delta;
            }
            return aVelocity;
          }

          var delta;

          this.linear_velocity = delta_velocity(
            this.linear_velocity,
            this.linear_acceleration
          );
          this.prev_linear_velocity = this.linear_velocity;
          // Move proportionally to real time.
          delta = translation(scale_vec(t, this.linear_velocity));
          // Apply linear velocity - pre-multiply to keep translations together
          this.location_matrix = mult(delta, this.location_matrix);
          
          // Move proportionally to real time.
          delta = rotation(t * this.angular_velocity, this.spin_axis);
          // Apply angular velocity - post-multiply to keep rotations together
          this.location_matrix = mult(this.location_matrix, delta);
          this.prev_angular_velocity = this.angular_velocity;
        }
      },
    'check_if_colliding'(b, a_inv, shape)
      {
        if (this == b) // Nothing collides with itself
          return false;
        // Convert sphere b to a coordinate frame where a is a unit sphere
        var T = mult(a_inv, mult(b.location_matrix, scale(b.scale)));
        for (let p of shape.positions) { // For each vertex in that b,
          // Apply a_inv*b coordinate frame shift
          var Tp = mult_vec(T, p.concat(1)).slice(0, 3);

          // Check if in that coordinate frame it penetrates the unit sphere
          // at the origin.
          if (dot(Tp, Tp) < 1.2)
            return true;
        }
        return false;
      },
    'check_if_collided_with_plane'(b, a_inv, shape) // b is stationary
      {
        var intersect = function(point1, point2, plane) {
          var x1 = point1[0];
          var y1 = point1[1];
          var z1 = point1[2];

          var x2 = point2[0];
          var y2 = point2[1];
          var z2 = point2[2];

          var a = plane[0];
          var b = plane[1];
          var c = plane[2];
          var d = plane[3];

          var t = (d - (x1 * a) - (y1 * b) - (z1 * c)) / ((x2 * a) + (y2 * b) + (z2 * c) - (x1 * a) - (y1 * b) - (z1 * c));
          var px = x1 + (t * (x2 - x1));
          var py = y1 + (t * (y2 - y1));
          var pz = z1 + (t * (z2 - z1));
          return [px, py, pz];
        }

        var dist = function(point1, point2) {
          var x1 = point1[0];
          var y1 = point1[1];
          var z1 = point1[2];

          var x2 = point2[0];
          var y2 = point2[1];
          var z2 = point2[2];

          var zDiff = z2 - z1;
          var yDiff = y2 - y1;
          var xDiff = x2 - x1;
          var radicant = zDiff * zDiff + yDiff * yDiff + xDiff * xDiff;
          var result = Math.pow(radicant, 0.5);
          return result;
        }

        //console.log("Inside checking collision");
        var i;
        var p1 = mult_vec(this.prev_location_matrix, vec4(0, 0, 0, 1)).slice(0, 3);
        //if (b.name == "fence1") {
          //console.log("p1: ");
          //console.log(p1);
        //}
        var p2 = mult_vec(this.location_matrix, vec4(0, 0, 0, 1)).slice(0, 3);
        //if (b.name == "fence1") {
          //console.log("p2: ");
          //console.log(p2);
        //}
        var pVec = subtract(p1, p2);
        //console.log("pVec: ");
        //console.log(pVec);
        var bCenter = mult_vec(b.location_matrix, vec4(0, 0, 0, 1)).slice(0, 3);
        //if (b.name == "fence1") {
          //console.log("bCenter: ");
          //console.log(bCenter);
        //}
        var d = -((pVec[0] * -bCenter[0]) + (pVec[1] * - bCenter[1]) + (pVec[2] * -bCenter[2])); // Last component of plane
        var intersection = intersect(p1, p2, pVec.concat(d));
        //if (b.name == "fence1") {
          //console.log("Intersection: ");
          //console.log(intersection);
        //}
        var new_loc = translation(intersection);
        var new_a_inv = inverse(mult(new_loc, scale(this.scale)));
        var insideObj = false;
        var b_inv = inverse(mult( b.location_matrix, scale(b.scale)));
        //var T = mult(new_a_inv, mult(b.location_matrix, scale(b.scale)));
        var T = mult(b_inv, mult(new_loc, scale(this.scale)));
        for (let p of shape.positions) { // For each vertex in that b,
          // Apply a_inv*b coordinate frame shift
          var Tp = mult_vec(T, p.concat(1)).slice(0, 3);

          // Check if in that coordinate frame it penetrates the unit sphere
          // at the origin.
          if (dot(Tp, Tp) < 1.2) {
            insideObj = true;
            break;
          }
        }

        // Check that intersection point is between the two points
        //if (b.name == "fence1")
          //console.log("Distance 1: ");
        //if (b.name == "fence1")
          //console.log(dist(p1, intersection));
        //if (b.name == "fence1")
          //console.log("Distance 2: ");
        //if (b.name == "fence1")
          //console.log(dist(intersection, p2));
        //if (b.name == "fence1")
          //console.log("Real total distance: ");
        //if (b.name == "fence1")
          //console.log(dist(p1, p2));
        //if (this.collided_last_frame && dist(p1, bCenter) < dist(p2, bCenter))
          //return false;
        var betweenPoints = dist(p1, intersection) + dist(intersection, p2) === dist(p1, p2);
        //if (b.name == "fence1")
          //console.log("Between points: " + betweenPoints);
        //if (betweenPoints && (b.name == "fence1")) {
          //console.log("p1: " + p1);
          //console.log("Intersection: " + intersection);
          //console.log("p2: " + p2);
        //}
        if (betweenPoints && insideObj) {
          //console.log(this.collision_history);
          if (this.collision_history[1].name == b.name && this.collision_history[1].collided == true) {
            //console.log("Prevented double collision");
            return false;
          }
          //console.log("reverted");
          this.location_matrix = this.prev_location_matrix;
          this.linear_velocity = this.prev_linear_velocity;
          this.angular_velocity = this.prev_angular_velocity;
          return true;
        }
        else {
          return false;
        }
      },
    'collided'(b, a_inv, shape)
      {
        var res;
        res = this.check_if_colliding(b, a_inv, shape) || this.check_if_collided_with_plane(b, a_inv, shape);
        this.collided_last_frame = res;
        if (res) {
          this.collision_history.push({"name": b.name, "collided":res});
          this.collision_history.shift();
        }
        return res;
      }
  });

Declare_Any_Class("Baseball_Scene",
  {
    'construct'(context, canvas = context.canvas)
      {
        /*
         * Draws the baseball field.
         * @param {Object} oScene - The baseball scene.
         * @returns {Object[]} The transformation matrix to the surface of the
         *                     field.
         */
        var draw_field = function(oScene) {
          var tile_dimensions = {
            "length" : 2 * 150, // x
            "width"  : 2 * 150, // y
            "height" : 2 * 1    // z
          };
          var tilesX = 10;
          var tilesY = 10;
          var ground = vec3(tile_dimensions.length / 2, tile_dimensions.length / 2, 4);
          var ground_center = identity();
          var surface = mult(ground_center, translation(0, 0, 4));
          var partial_sphere = mult(surface, translation(1.5, 300, -4));
          var mound = vec3(30, 30, 10);
          var infield = mult(surface, translation(0, 50, 1.0001));
          var diamond = vec3(500, 500, 1);
          var chalk;
          var chalk_scale = vec3(500, 1, 1);
          var offset;
          var tile;
          var i;
          var j;
          var gate_start = mult(surface, translation(0, 45, 1.3));
          var transform;
          var gate_transform;
          var gate_scale = vec3(20, 5, 20);
          var pole;
          var pole_scale = vec3(5, 5, 300);
          var outfield_gate;
          var outfield_gate_scale = vec3(100, 5, 100);
          var base;
          var bat_box;

          // Draw grass
          /*for (i = 0; i < tile_dimensions.length * tilesX; i += tile_dimensions.length) {
            for (offset = 0; offset < tile_dimensions.width * tilesY; offset += tile_dimensions.width) {
              tile = mult(ground_center, translation(i, offset, 0));
              oScene.bodies.auto.push(new Body("grass", oScene.shapes.box, oScene.grass, tile, ground));
              if (i / tile_dimensions.length < 3 && offset / tile_dimensions.width < 6)
                oScene.bodies.ball_collision_items.push(new Body("grass", oScene.shapes.box, oScene.grass, tile, ground));

              if (offset !== 0) {
                tile = mult(ground_center, translation(i, -offset, 0));
                oScene.bodies.auto.push(new Body("grass", oScene.shapes.box, oScene.grass, tile, ground));
              }
            }

            if (i !== 0) {
              for (offset = 0; offset < tile_dimensions.width * tilesY; offset += tile_dimensions.width) {
                tile = mult(ground_center, translation(-i, offset, 0));
                oScene.bodies.auto.push(new Body("grass", oScene.shapes.box, oScene.grass, tile, ground));
                if (i / tile_dimensions.length < 3 && offset / tile_dimensions.width < 6)
                  oScene.bodies.ball_collision_items.push(new Body("grass", oScene.shapes.box, oScene.grass, tile, ground));

                if (offset !== 0) {
                  tile = mult(ground_center, translation(-i, -offset, 0));
                  oScene.bodies.auto.push(new Body("grass", oScene.shapes.box, oScene.grass, tile, ground));
                }
              }
            }
          }*/

          base = mult(translation(0, 515, 4.5), rotation(45, [0, 0, 1]));
          oScene.bodies.auto.push(new Body("base", oScene.shapes.box, oScene.base, base, vec3(6, 6, 1))); // Second base

          oScene.bodies.auto.push(new Body("base", oScene.shapes.base, oScene.base, translation(0, 120, 4.5), vec3(8, 8, 1))); // Home plate
          oScene.bodies.auto.push(new Body("grass", oScene.shapes.box, oScene.large_grass, ground_center, vec3(2800, 2800, 4)));
          //oScene.bodies.ball_collision_items.push(new Body("grass", oScene.shapes.box, oScene.large_grass, ground_center, vec3(1500, 1500, 4)));

          // Draw batter's boxes
          oScene.bodies.auto.push(new Body("base", oScene.shapes.dbox, oScene.chalk, translation(-10, 120, 4.1), vec3(6, 15, 1)));
          oScene.bodies.auto.push(new Body("base", oScene.shapes.dbox, oScene.chalk, translation(10, 120, 4.1), vec3(6, 15, 1)));

          // Draw pitcher's mound
          oScene.bodies.auto.push(new Body("mound", oScene.shapes.ball, oScene.infield_dirt, partial_sphere, mound));

          // Draw baseball diamond
          infield = mult(infield, rotation(45, [0,0,1]));
          oScene.bodies.auto.push(new Body("infield", oScene.shapes.diamond, oScene.infield_dirt, infield, diamond));
          //oScene.bodies.ball_collision_items.push(new Body("infield", oScene.shapes.diamond, oScene.infield_dirt, infield, diamond));

          // Draw baseline, bases, foul poles, and outfield fences
          chalk = mult(surface, translation(-17, 170, .1));
          chalk = mult(chalk, rotation(-45, [0, 0, 1]));
          pole = chalk;
          base = chalk;
          chalk = mult(chalk, translation(-500, 0, 0));
          oScene.bodies.auto.push(new Body("foul_line", oScene.shapes.box, oScene.chalk, chalk, chalk_scale));
          base = mult(base, translation(-240, 10, .5));
          pole = mult(pole, translation(-1000, 0, 0));
          oScene.bodies.auto.push(new Body("base", oScene.shapes.box, oScene.base, base, vec3(6, 6, 1))); // Third base
          oScene.bodies.auto.push(new Body("foul_pole", oScene.shapes.cylinder, oScene.yellow_paint, pole, pole_scale));
          outfield_gate = mult(pole, translation(0, 125, -70));
          outfield_gate = mult(outfield_gate, rotation(90, [0, 0, 1]));
          outfield_gate = mult(outfield_gate, rotation(45, [0, 1, 0]));
          oScene.bodies.auto.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          oScene.bodies.ball_collision_items.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          outfield_gate = mult(pole, translation(0, 387, -70));
          outfield_gate = mult(outfield_gate, rotation(90, [0, 0, 1]));
          outfield_gate = mult(outfield_gate, rotation(45, [0, 1, 0]));
          oScene.bodies.auto.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          oScene.bodies.ball_collision_items.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          outfield_gate = mult(pole, translation(0, 650, -70));
          outfield_gate = mult(outfield_gate, rotation(90, [0, 0, 1]));
          outfield_gate = mult(outfield_gate, rotation(45, [0, 1, 0]));
          oScene.bodies.auto.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          oScene.bodies.ball_collision_items.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          outfield_gate = mult(pole, translation(60, 864.5, -70));
          outfield_gate = mult(outfield_gate, rotation(50, [0, 0, 1]));
          outfield_gate = mult(outfield_gate, rotation(45, [0, 1, 0]));
          oScene.bodies.auto.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          oScene.bodies.ball_collision_items.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));

          chalk = mult(surface, translation(17, 170, .1));
          chalk = mult(chalk, rotation(45, [0, 0, 1]));
          pole = chalk;
          base = chalk;
          chalk = mult(chalk, translation(500, 0, 0));
          oScene.bodies.auto.push(new Body("foul_line", oScene.shapes.box, oScene.chalk, chalk, chalk_scale));
          base = mult(base, translation(240, 10, .5));
          pole = mult(pole, translation(1000, 0, 0));
          oScene.bodies.auto.push(new Body("base", oScene.shapes.box, oScene.base, base, vec3(6, 6, 1))); // First base
          oScene.bodies.auto.push(new Body("foul_pole", oScene.shapes.cylinder, oScene.yellow_paint, pole, pole_scale));
          outfield_gate = mult(pole, translation(0, 125, -70));
          outfield_gate = mult(outfield_gate, rotation(-90, [0, 0, 1]));
          outfield_gate = mult(outfield_gate, rotation(45, [0, 1, 0]));
          oScene.bodies.auto.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          oScene.bodies.ball_collision_items.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          outfield_gate = mult(pole, translation(0, 387, -70));
          outfield_gate = mult(outfield_gate, rotation(-90, [0, 0, 1]));
          outfield_gate = mult(outfield_gate, rotation(45, [0, 1, 0]));
          oScene.bodies.auto.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          oScene.bodies.ball_collision_items.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          outfield_gate = mult(pole, translation(0, 650, -70));
          outfield_gate = mult(outfield_gate, rotation(-90, [0, 0, 1]));
          outfield_gate = mult(outfield_gate, rotation(45, [0, 1, 0]));
          oScene.bodies.auto.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          oScene.bodies.ball_collision_items.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          outfield_gate = mult(pole, translation(-60, 864.5, -70));
          outfield_gate = mult(outfield_gate, rotation(-50, [0, 0, 1]));
          outfield_gate = mult(outfield_gate, rotation(45, [0, 1, 0]));
          oScene.bodies.auto.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));
          oScene.bodies.ball_collision_items.push(new Body("fence", oScene.shapes.fence, oScene.chain, outfield_gate, outfield_gate_scale));

          // Draw backstop
          gate_transform = mult(gate_start, translation(0, 0, 25));
          gate_transform = mult(gate_transform, rotation(45, [0, 1, 0]));
          oScene.bodies.auto.push(new Body("fence", oScene.shapes.fence, oScene.chain, gate_transform, gate_scale));
          oScene.bodies.ball_collision_items.push(new Body("fence1", oScene.shapes.fence, oScene.chain, gate_transform, gate_scale));
          
          gate_transform = mult(gate_start, translation(63 * Math.cos(radians(45)), 26 * Math.sin(radians(45)), 25));
          gate_transform = mult(gate_transform, rotation(45, [0, 0, 1]));
          gate_transform = mult(gate_transform, rotation(45, [0, 1, 0]));
          oScene.bodies.auto.push(new Body("fence", oScene.shapes.fence, oScene.chain, gate_transform, gate_scale));
          oScene.bodies.ball_collision_items.push(new Body("fence", oScene.shapes.fence, oScene.chain, gate_transform, gate_scale));

          gate_transform = mult(gate_start, translation(-63 * Math.cos(radians(45)), 26 * Math.sin(radians(45)), 25));
          gate_transform = mult(gate_transform, rotation(-45, [0, 0, 1]));
          gate_transform = mult(gate_transform, rotation(45, [0, 1, 0]));
          oScene.bodies.auto.push(new Body("fence", oScene.shapes.fence, oScene.chain, gate_transform, gate_scale));
          oScene.bodies.ball_collision_items.push(new Body("fence", oScene.shapes.fence, oScene.chain, gate_transform, gate_scale));

          return surface;
        };

        /*
         * Draws a baseball player as a batter.
         * @param {Object}   oScene   - The baseball scene.
         * @param {Object[]} mSurface - The transformation matrix to the 
         *                              surface of the ground.
         */
        var draw_batter = function(oScene, mSurface) {
          var body_top;
          var head_center;
          var head_dimensions = {
            "length" : 2 * 4,
            "width"  : 2 * 4,
            "height" : 2 * 4
          };
          var helmet_center;
          var helmet_pos;
          var helmet_size = vec3(
            head_dimensions.length / 2,
            head_dimensions.width / 2,
            head_dimensions.height / 2
          );

          /*
           * Draws the head of the player.
           * @param {Object}   oScene          - The baseball scene.
           * @param {Object[]} mBody           - The transformation matrix to
           *                                     the top of the body.
           * @param {Object}   oHeadDimensions - The dimensions of the head.
           * @returns {Object[]} The transformation matrix for the center of
           *                     the head.
           */
          var draw_head = function(oScene, mBody, oHeadDimensions) {
            var offset = -.35; // Extra offset to place the head nicely on the body
            var center = mult(mBody, translation(
              0,
              0,
              offset + oHeadDimensions.height / 2)
            );
            var eyes = mult(center, rotation(175, [0, 0, 1]));
            eyes = mult(eyes, rotation(-20, [0, 1, 0]));
            eyes = mult(eyes, rotation(-50, [1, 0, 0]));
            face = vec3(
              -oHeadDimensions.length / 2,
              oHeadDimensions.width / 2,
              oHeadDimensions.height / 2
            );
            oScene.bodies.auto.push(new Body(
              "head",
              oScene.shapes.sphere,
              oScene.face,
              eyes,
              face
            ));
            return center;
          };

          /*
           * Draws the body of the player.
           * @param {Object}   oScene   - The baseball scene.
           * @param {Object[]} mSurface - The transformation matrix to the 
           *                              surface of the ground.
           * @returns {Object[]} The transformation matrix for the top of
           *                     the body.
           */
          var draw_body = function(oScene, mSurface) {
            var body;
            var zScale = 8;
            var bodyScale = 6;
            var body_scale_transform = vec3(bodyScale, bodyScale, zScale);
            var bodyTop = mult(mSurface, translation(-10, 125, 8 + (zScale * .2)));
            var leftHinge;
            var rightHinge;
            var bat;
            var batScaled = vec3(7, 7, 7);
            var rot1;
            var rot2;
            var swing;
            var rotAngle;

            // Draw main body
            body = mult(mSurface, translation(-10, 125, 8));
            body = mult(body, rotation(90, [0, 0, 1]));
            oScene.bodies.auto.push(new Body(
              "body",
              oScene.shapes.tube,
              oScene.cloth,
              body,
              body_scale_transform
            ));

            return bodyTop;
          };

          /*
           * Draws the shoes of the player.
           * @param {Object}   oShape    - The Shape to draw.
           * @param {Object}   oMaterial - The material to use to color the
           *                               drawn shape.
           * @param {Object[]} mSurface  - The transformation matrix to the
           *                               surface of the ground.
           */
          var draw_shoes = function(oScene, mSurface) {
            var shoe_dimensions = {
              "length" : 2 * 2, // x
              "width"  : 2 * 4, // y
              "height" : 2      // z
            };
            var sizeShoe = vec3(
              shoe_dimensions.length / 2,
              shoe_dimensions.width / 2,
              shoe_dimensions.height
            );
            var pos = mult(mSurface, translation(-10, 120, 1));
            var flipShoe = rotation(180, [1, 0, 0]);

            flipShoe = mult(flipShoe, rotation(90, [0, 0, 1]));

            // First shoe
            pos = mult(pos, flipShoe);
            oScene.bodies.auto.push(new Body(
              "shoe",
              oScene.shapes.half_sphere,
              oScene.rubber,
              pos,
              sizeShoe
            ));

            // Second shoe
            pos = mult(mSurface, translation(-10, 130, 1));
            pos = mult(pos, flipShoe);
            oScene.bodies.auto.push(new Body(
              "shoe",
              oScene.shapes.half_sphere,
              oScene.rubber,
              pos,
              sizeShoe
            ));
          };

          draw_shoes(oScene, mSurface);
          body_top = draw_body(oScene, mSurface);
          head_center = draw_head(oScene, body_top, head_dimensions);

          // Helmet
          helmet_pos = mult(head_center, translation(
            -.15 * head_dimensions.length / 2,
            .1 * head_dimensions.width / 2,
            .9 * head_dimensions.height / 2)
          );
          helmet_pos = mult(helmet_pos, rotation(165, [0, 0, 1]));
          oScene.bodies.auto.push(new Body(
            "helmet",
            oScene.shapes.helmet,
            oScene.helmet_paint,
            helmet_pos,
            helmet_size
          ));
        };

        /*
         * Draws a baseball player as a fielder.
         * @param {Object}   oScene   - The baseball scene.
         * @param {Object[]} mSurface - The transformation matrix to the 
         *                              surface of the ground.
         */
        var draw_fielder = function(oScene, mSurface) {
          var body_top;
          var head_center;
          var head_dimensions = {
            "length" : 2 * 4,
            "width"  : 2 * 4,
            "height" : 2 * 4
          };
          var cap_pos;
          var cap_size;

          /*
           * Draws the head of the player.
           * @param {Object}   oScene          - The baseball scene
           * @param {Object[]} mBody           - The transformation matrix to
           *                                     the top of the body.
           * @param {Object}   oHeadDimensions - The dimensions of the head.
           * @returns {Object[]} The transformation matrix for the center of
           *                     the head.
           */
          var draw_head = function(oScene, mBody, oHeadDimensions) {
            var offset = -.35; // Extra offset to place the head nicely on the body
            var center = mult(mBody, translation(
              0,
              0,
              offset + oHeadDimensions.height / 2)
            );
            var eyes = mult(center, rotation(-40, [1, 0, 0]));
            eyes = mult(eyes, rotation(-30, [0, 1, 0]));
            face = vec3(
              -oHeadDimensions.length / 2,
              oHeadDimensions.width / 2,
              oHeadDimensions.height / 2
            );
            oScene.bodies.auto.push(new Body(
              "head",
              oScene.shapes.sphere,
              oScene.face,
              eyes,
              face
            ));
            return center;
          };

          /*
           * Draws the body of the player.
           * @param {Object}   oScene   - The baseball scene.
           * @param {Object[]} mSurface - The transformation matrix to the 
           *                              surface of the ground.
           * @returns {Object[]} The transformation matrix for the top of
           *                     the body.
           */
          var draw_body = function(oScene, mSurface) {
            var body;
            var zScale = 8;
            var bodyScale = 6;
            var body_scale_transform = vec3(bodyScale, bodyScale, zScale);
            var bodyTop = mult(mSurface, translation(1.5, 295, 12 + (zScale * .2)));
            var leftHinge;
            var rightHinge;
            var rot1;
            var rot2;
            var glove;
            var glove_size = vec3(1.5, 1.5, 1.5);
            var throwMotion;
            var gloveMotion;
            var rotAngle;

            /*
             * Draws an arm of the player.
             * @param {Object}   oScene  - The baseball scene.
             * @param {Object[]} mPos    - The transformation matrix to the
             *                             position to draw the arm.
             */
            var draw_arm = function(oScene, mPos) {
              var arm = mPos;
              var armScale = 8;

              armScale = vec3(1, 1, armScale);
              oScene.bodies.manual.push(new Body(
                "arm",
                oScene.shapes.tube,
                oScene.cloth,
                arm,
                armScale
              ));
            };

            // Draw main body
            body = mult(mSurface, translation(1.5, 295, 12));
            body = mult(body, rotation(90, [0, 0, 1]));
            oScene.bodies.auto.push(new Body(
              "body",
              oScene.shapes.tube,
              oScene.cloth,
              body,
              body_scale_transform
            ));

            return bodyTop;
          };

          /*
           * Draws the shoes of the player.
           * @param {Object}   oScene    - The baseball scene.
           * @param {Object[]} mSurface  - The transformation matrix to the
           *                               surface of the ground.
           */
          var draw_shoes = function(oScene, mSurface) {
            var shoe_dimensions = {
              "length" : 2 * 2, // x
              "width"  : 2 * 4, // y
              "height" : 2      // z
            };
            var sizeShoe = vec3(
              shoe_dimensions.length / 2,
              -shoe_dimensions.width / 2,
              shoe_dimensions.height
            );
            var pos = mult(mSurface, translation(1.5, 290, 5.5));
            var flipShoe = rotation(180, [1, 0, 0]);

            flipShoe = mult(flipShoe, rotation(90, [0, 0, 1]));

            // First shoe
            pos = mult(pos, flipShoe);
            oScene.bodies.auto.push(new Body(
              "shoe",
              oScene.shapes.half_sphere,
              oScene.rubber,
              pos,
              sizeShoe
            ));

            // Second shoe
            pos = mult(mSurface, translation(1.5, 300, 6));
            pos = mult(pos, flipShoe);
            oScene.bodies.auto.push(new Body(
              "shoe",
              oScene.shapes.half_sphere,
              oScene.rubber,
              pos,
              sizeShoe
            ));
          };

          draw_shoes(oScene, mSurface);
          body_top = draw_body(oScene, mSurface);
          head_center = draw_head(oScene, body_top, head_dimensions);

          // Cap
          cap_pos = mult(head_center, translation(
            -.01 * head_dimensions.length / 2,
            -.09 * head_dimensions.width / 2,
            .7 * head_dimensions.height / 2)
          );
          cap_pos = mult(cap_pos, rotation(90, [1, 0, 0]));
          cap_pos = mult(cap_pos, rotation(-90, [0, 1, 0]));
          cap_size = vec3(
            head_dimensions.length / 2,
            head_dimensions.width / 2,
            head_dimensions.height / 2
          );
          oScene.bodies.auto.push(new Body(
            "cap",
            oScene.shapes.cap,
            oScene.wool,
            cap_pos,
            cap_size
          ));
        };

        var surface;

        var shapes = {
          "box"         : new Cube(), 
          "dbox"        : new Donut_Box(),
          "ball"        : new Shape_From_File("resources/baseball.obj"),
          "base"        : new Base(),
          "sphere"      : new Subdivision_Sphere(5),
          "diamond"     : new Quarter_Circle_Diamond(),
          "bat"         : new Shape_From_File("resources/bat.obj"),
          "half_sphere" : new Half_Sphere(15, 15),
          "helmet"      : new Shape_From_File("resources/helmet.obj"),
          "tube"        : new Body_Tube(15, 15),
          "cap"         : new Shape_From_File("resources/cap.obj"),
          "mitt"        : new Shape_From_File("resources/glove.obj"),
          "square"      : new Square(),
          "sqhole"      : new Square_Hole(),
          "cylinder"    : new Rounded_Capped_Cylinder(20, 20),
          "fence"       : new Fence(20, 20)
        };
        this.submit_shapes(context, shapes);
        
        this.define_data_members({
          // Materials
          cork_stitch  :
            context.shaders_in_use["Phong_Model"].material(
              Color(0, 0, 0, 1), 1, 1,  0, 40,
              context.textures_in_use["stitching.jpg"]
            ),
          base         :
            context.shaders_in_use["Phong_Model"].material(
              Color(1, 1, 1, 1), .5, 1, .7, 40
            ),
          infield_dirt :
            context.shaders_in_use["Phong_Model"].material(
              Color(230/255, 204/255, 179/255, 1), .5, 1, .7, 40
            ),
          grass        :
            context.shaders_in_use["Phong_Model"].material(
              Color(0, 0, 0, 1), 1, 1, 0, 40, 
              context.textures_in_use["grass.jpg"]
            ),
          large_grass  :
            context.shaders_in_use["Phong_Model"].material(
              Color(0, 0, 0, 1), 1, 1, 0, 40, 
              context.textures_in_use["large_grass.png"]
            ),
          wood         :
            context.shaders_in_use["Phong_Model"].material(
              Color(0, 0, 0, 1), 1, 1, 0, 40
            ),
          helmet_paint :
            context.shaders_in_use["Phong_Model"].material(
              Color(0, 0, 0, 1), 1, 1, 0, 40, 
              context.textures_in_use["helmet_paint.jpg"]
            ),
          face :
            context.shaders_in_use["Phong_Model"].material(
              Color(0, 0, 0, 1), 1, 1, 0, 40, 
              context.textures_in_use["face.jpg"]
            ),
          rubber       :
            context.shaders_in_use["Phong_Model"].material(
              Color(0, 0, 0, 1), 1, 1, 0, 40,
              context.textures_in_use["shoe_color.jpg"]
            ),
          cloth        :
            context.shaders_in_use["Phong_Model"].material(
              Color(204/255, 204/255, 204/255, 1), .5, 1, .7, 40
            ),
          skin         :
            context.shaders_in_use["Phong_Model"].material(
              Color(255/255, 213/255, 105/255, 1), .9, 1, .7, 40
            ),
          wool         :
            context.shaders_in_use["Phong_Model"].material(
              Color(0, 0, 1, 1), .5, 1, .7, 40
            ),
          leather      :
            context.shaders_in_use["Phong_Model"].material(
              Color(0, 0, 0, 1), 1, 1, 0, 40, 
              context.textures_in_use["glove_leather.jpg"]
            ),
          chalk        :
            context.shaders_in_use["Phong_Model"].material(
              Color(1, 1, 1, 1), 1, 1, .7, 40
            ),
          chain        :
            context.shaders_in_use["Phong_Model"].material(
              Color(0, 0, 0, 1), 1, 1, 0, 40, 
              context.textures_in_use["chain.jpg"]
            ),
          yellow_paint :
            context.shaders_in_use["Phong_Model"].material(
              Color(1, 1, 0, 1), .5, 1, .7, 40
            ),

          // Miscellaneous
          surface             : null,
          ball_free           : false,
          ball_transform      : translation(0, 0, 10),//identity(),
          ball_camera         : false,
          bodies              : { 
            "auto"                 : [],
            //"manual"               : [],
            "baseball"             : null,
            "ball_collision_items" : [],
            "bat"                  : null
          },
          collider            : new Subdivision_Sphere(1),
          prev_anim_time      : 0.0,
          ball_start_time     : 0,
          events              : [
            {
              "contact_x_velocity" : { "value" : -.15, "isFactor" : false },
              "contact_y_velocity" : { "value" : -.8, "isFactor" : true }, // Multiply
              "contact_z_velocity" : { "value" : .01, "isFactor" : true }, // Add
              "release_y_velocity" : { "value" : -.06, "isFactor" : false },
              "gravity"            : { "value" : 0.00001 * -9.8, "isFactor" : false },
              "friction_x_acceleration" : { "value" : .0005, "isFactor": false },
              "friction_y_acceleration" : { "value" : .0005, "isFactor": false },
              "normal_z_acceleration" : { "value" : -.5, "isFactor": true } // Multiply
            },
            {
              "contact_x_velocity" : { "value" : .03, "isFactor" : false},
              "contact_y_velocity" : { "value" : -.8, "isFactor" : true}, // Multiply
              "contact_z_velocity" : { "value" : .01, "isFactor" : true}, // Add
              "release_y_velocity" : { "value" : -.09, "isFactor" : false},
              "gravity"            : { "value" : 0.00001 * -9.8, "isFactor" : false },
              "friction_x_acceleration" : { "value" : .0005, "isFactor": false },
              "friction_y_acceleration" : { "value" : .0005, "isFactor": false },
              "normal_z_acceleration" : { "value" : -.5, "isFactor": true } // Multiply
            },
            {
              "contact_x_velocity" : { "value" : 0, "isFactor" : false},
              "contact_y_velocity" : { "value" : -.9, "isFactor" : true}, // Multiply
              "contact_z_velocity" : { "value" : .03, "isFactor" : true}, // Add
              "release_y_velocity" : { "value" : -.09, "isFactor" : false},
              "gravity"            : { "value" : 0.000009 * -9.8, "isFactor" : false },
              "friction_x_acceleration" : { "value" : 0, "isFactor": false },
              "friction_y_acceleration" : { "value" : .0005, "isFactor": false },
              "normal_z_acceleration" : { "value" : -.4, "isFactor": true } // Multiply
            },
            {
              "contact_x_velocity" : { "value" : 0, "isFactor" : false},
              "contact_y_velocity" : { "value" : -.9, "isFactor" : true}, // Multiply
              "contact_z_velocity" : { "value" : .04, "isFactor" : true}, // Add
              "release_y_velocity" : { "value" : -.09, "isFactor" : false},
              "gravity"            : { "value" : 0.000009 * -9.8, "isFactor" : false },
              "friction_x_acceleration" : { "value" : 0, "isFactor": false },
              "friction_y_acceleration" : { "value" : .0005, "isFactor": false },
              "normal_z_acceleration" : { "value" : -.4, "isFactor": true } // Multiply
            },
            {
              "contact_x_velocity" : { "value" : .03, "isFactor" : false},
              "contact_y_velocity" : { "value" : -.9, "isFactor" : true}, // Multiply
              "contact_z_velocity" : { "value" : .03, "isFactor" : true}, // Add
              "release_y_velocity" : { "value" : -.09, "isFactor" : false},
              "gravity"            : { "value" : 0.000009 * -9.8, "isFactor" : false },
              "friction_x_acceleration" : { "value" : .0005, "isFactor": false },
              "friction_y_acceleration" : { "value" : .0005, "isFactor": false },
              "normal_z_acceleration" : { "value" : -.4, "isFactor": true } // Multiply
            },
            {
              "contact_x_velocity" : { "value" : -.03, "isFactor" : false},
              "contact_y_velocity" : { "value" : -.9, "isFactor" : true}, // Multiply
              "contact_z_velocity" : { "value" : .03, "isFactor" : true}, // Add
              "release_y_velocity" : { "value" : -.09, "isFactor" : false},
              "gravity"            : { "value" : 0.000009 * -9.8, "isFactor" : false },
              "friction_x_acceleration" : { "value" : .0005, "isFactor": false },
              "friction_y_acceleration" : { "value" : .0005, "isFactor": false },
              "normal_z_acceleration" : { "value" : -.4, "isFactor": true } // Multiply
            },
            {
              "contact_x_velocity" : { "value" : 0, "isFactor" : false},
              "contact_y_velocity" : { "value" : .8, "isFactor" : true}, // Multiply
              "contact_z_velocity" : { "value" : .02, "isFactor" : true}, // Add
              "release_y_velocity" : { "value" : -.11, "isFactor" : false},
              "gravity"            : { "value" : 0.00001 * -9.8, "isFactor" : false },
              "friction_x_acceleration" : { "value" : .0005, "isFactor": false },
              "friction_y_acceleration" : { "value" : .0005, "isFactor": false },
              "normal_z_acceleration" : { "value" : -.5, "isFactor": true } // Multiply
            },
            {
              "contact_x_velocity" : { "value" : .008, "isFactor" : false},
              "contact_y_velocity" : { "value" : .1, "isFactor" : true}, // Multiply
              "contact_z_velocity" : { "value" : .05, "isFactor" : true}, // Add
              "release_y_velocity" : { "value" : -.11, "isFactor" : false},
              "gravity"            : { "value" : 0.00001 * -9.8, "isFactor" : false },
              "friction_x_acceleration" : { "value" : .0005, "isFactor": false },
              "friction_y_acceleration" : { "value" : .0005, "isFactor": false },
              "normal_z_acceleration" : { "value" : -.3, "isFactor": true } // Multiply
            },
            {
              "contact_x_velocity" : { "value" : .02, "isFactor" : false},
              "contact_y_velocity" : { "value" : -.9, "isFactor" : true}, // Multiply
              "contact_z_velocity" : { "value" : .04, "isFactor" : true}, // Add
              "release_y_velocity" : { "value" : -.09, "isFactor" : false},
              "gravity"            : { "value" : 0.000009 * -9.8, "isFactor" : false },
              "friction_x_acceleration" : { "value" : 0, "isFactor": false },
              "friction_y_acceleration" : { "value" : .0005, "isFactor": false },
              "normal_z_acceleration" : { "value" : -.4, "isFactor": true } // Multiply
            },
            {
              "contact_x_velocity" : { "value" : -.04, "isFactor" : false},
              "contact_y_velocity" : { "value" : -1.9, "isFactor" : true}, // Multiply
              "contact_z_velocity" : { "value" : .001, "isFactor" : true}, // Add
              "release_y_velocity" : { "value" : -.09, "isFactor" : false},
              "gravity"            : { "value" : 0.000009 * -9.8, "isFactor" : false },
              "friction_x_acceleration" : { "value" : .1, "isFactor": false },
              "friction_y_acceleration" : { "value" : .0005, "isFactor": false },
              "normal_z_acceleration" : { "value" : -.4, "isFactor": true } // Multiply
            },
          ]
        });

        context.globals.graphics_state.set(
          lookAt([1.58, 287, 15], [0, 260, 15], [0, 0, 1]),
          perspective(45, context.width/context.height, .1, 1000),
          0
        );
        this.define_data_members({
          graphics_state : context.globals.graphics_state,
          thrust         : vec3(),
          origin         : vec3(0, 0, 0),
          looking        : false
        });

        // *** Mouse controls: ***
        this.mouse = { "from_center": vec2() }; // Measure mouse steering, for rotating the fly-around camera:
        var mouse_position = function(e) {
          return vec2(e.clientX - context.width/2, e.clientY - context.height/2);
        };   
        canvas.addEventListener("mouseup", (function(self) {
          return function(e) {
            e = e || window.event;
            self.mouse.anchor = undefined;
          }
        }) (this), false);
        canvas.addEventListener("mousedown", (function(self) {
          return function(e) {
            e = e || window.event;
            self.mouse.anchor = mouse_position(e);
          }
        }) (this), false);
        canvas.addEventListener("mousemove", (function(self) {
          return function(e) {
            e = e || window.event;
            self.mouse.from_center = mouse_position(e);
          }
        }) (this), false);
        canvas.addEventListener("mouseout", (function(self) { // Stop steering if the
          return function(e) {                                // mouse leaves the canvas.
            self.mouse.from_center = vec2();
          };
        }) (this), false);

        this.origin = mult_vec(
          inverse(this.graphics_state.camera_transform),
          vec4(0,0,0,1)
        ).slice(0,3);

        this.surface = draw_field(this);
        draw_batter(this, this.surface);
        draw_fielder(this, this.surface);
        this.bodies.bat = (new Body("bat", this.shapes.bat, this.wood, null, vec3(2, 2, 2)));
        
        /*this.bodies.baseball = (new Body(
                    "baseball",
                    this.shapes.ball,
                    this.cork_stitch,
                    translation(0, 80, 10),
                    vec3(.75, .75, .75),
                    vec3(0, -.05, 0),
                    vec3(0, 0, 0),
                    1,
                    0,
                    vec3(0, 1, 0)
                  ));*/
      },
    'init_keys'(controls)
      {
        controls.add("b", this, function() { // Follow ball
          this.ball_camera = true;
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });

        /*controls.add("m", this, function() { // TODO: Remove later!
          this.ball_camera = false;
          this.graphics_state.camera_transform = lookAt(
            [.7, 223, 15], [0, 300, 15], [0, 0, 1]
          );
        });
        controls.add("r", this, function() { // 3rd base
          this.ball_camera = false;
          this.graphics_state.camera_transform = lookAt(
            [0, 0, 15], [0, 10, 15], [0, 0, 1]
          );
          //this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });*/

        // TODO: Remove these later!
        /*controls.add("Space", this, function() { this.thrust[1] = -1; });
        controls.add("Space", this, function() { this.thrust[1] =  0; }, {'type':'keyup'});
        controls.add("z",     this, function() { this.thrust[1] =  1; });
        controls.add("z",     this, function() { this.thrust[1] =  0; }, {'type':'keyup'});
        controls.add("w",     this, function() { this.thrust[2] =  1; });
        controls.add("w",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'});
        controls.add("a",     this, function() { this.thrust[0] =  1; } );
        controls.add("a",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'});
        controls.add("s",     this, function() { this.thrust[2] = -1; } );
        controls.add("s",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'});
        controls.add("d",     this, function() { this.thrust[0] = -1; } );
        controls.add("d",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'});
        controls.add("o", this, function() {
          this.origin = mult_vec(
            inverse(this.graphics_state.camera_transform),
            vec4(0,0,0,1)
          ).slice(0,3);
        });*/

        controls.add("1", this, function() { // Pitcher's mound
          this.ball_camera = false;
          this.graphics_state.camera_transform = lookAt(
            [1.58, 287, 15], [0, 260, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("2", this, function() { // Home plate
          this.ball_camera = false;
          this.graphics_state.camera_transform = lookAt(
            [-.6, 81, 15], [0, 90, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("3", this, function() { // 1st base
          this.ball_camera = false;
          this.graphics_state.camera_transform = lookAt(
            [190, 379, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("4", this, function() { // 2nd base
          this.ball_camera = false;
          this.graphics_state.camera_transform = lookAt(
            [127, 485, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("5", this, function() { // 3rd base
          this.ball_camera = false;
          this.graphics_state.camera_transform = lookAt(
            [-193, 372, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("6", this, function() { // Shortstop
          this.ball_camera = false;
          this.graphics_state.camera_transform = lookAt(
            [-87, 538, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("7", this, function() { // Left field
          this.ball_camera = false;
          this.graphics_state.camera_transform = lookAt(
            [-506, 735, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("8", this, function() { // Center field
          this.ball_camera = false;
          this.graphics_state.camera_transform = lookAt(
            [39, 960, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("9", this, function() { // Right field
          this.ball_camera = false;
          this.graphics_state.camera_transform = lookAt(
            [372, 695, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
      },
    'display'(graphics_state)
      {
        /*
         * Draws the baseball field.
         * @param {Object} oScene - The baseball scene.
         * @returns {Object[]} The transformation matrix to the surface of the
         *                     field.
         */
        var draw_field = function(oScene) {
          var tile_dimensions = {
            "length" : 2 * 150, // x
            "width"  : 2 * 150, // y
            "height" : 2 * 1    // z
          };
          var tilesX = 10;
          var tilesY = 10;
          var ground;
          var ground_center = identity();
          var surface = mult(ground_center, translation(0, 0, 1));
          var partial_sphere = mult(surface, translation(1.5, 300, -4));
          var infield = mult(surface, translation(0, 50, 1.0001));
          var chalk;
          var offset;
          var tile;
          var i;
          var j;
          var gate_start = mult(surface, translation(0, 45, 1.3));
          var transform;
          var gate_transform;
          var pole;

          // Draw grass
          for (i = 0; i < tile_dimensions.length * tilesX; i += tile_dimensions.length) {
            for (offset = 0; offset < tile_dimensions.width * tilesY; offset += tile_dimensions.width) {
              tile = mult(ground_center, translation(i, offset, 0));
              ground = mult(tile, scale(tile_dimensions.length / 2, tile_dimensions.length / 2, 1));
              oScene.shapes.box.draw(graphics_state, ground, oScene.grass);

              if (offset !== 0) {
                tile = mult(ground_center, translation(i, -offset, 0));
                ground = mult(tile, scale(tile_dimensions.length / 2, tile_dimensions.length / 2, 1));
                oScene.shapes.box.draw(graphics_state, ground, oScene.grass);
              }
            }

            if (i !== 0) {
              for (offset = 0; offset < tile_dimensions.width * tilesY; offset += tile_dimensions.width) {
                tile = mult(ground_center, translation(-i, offset, 0));
                ground = mult(tile, scale(tile_dimensions.length / 2, tile_dimensions.length / 2, 1));
                oScene.shapes.box.draw(graphics_state, ground, oScene.grass);

                if (offset !== 0) {
                  tile = mult(ground_center, translation(-i, -offset, 0));
                  ground = mult(tile, scale(tile_dimensions.length / 2, tile_dimensions.length / 2, 1));
                  oScene.shapes.box.draw(graphics_state, ground, oScene.grass);
                }
              }
            }
          }

          // Draw pitcher's mound
          partial_sphere = mult(partial_sphere, scale(30,30,10));
          oScene.shapes.ball.draw(graphics_state, partial_sphere, oScene.infield_dirt);

          // Draw baseball diamond
          infield = mult(infield, rotation(45, [0,0,1]));
          infield = mult(infield, scale(500, 500, 1));
          oScene.shapes.diamond.draw(graphics_state, infield, oScene.infield_dirt);

          // Draw baseline and foul poles
          chalk = mult(surface, translation(-17, 160, .1));
          chalk = mult(chalk, rotation(-45, [0, 0, 1]));
          pole = chalk;
          chalk = mult(chalk, translation(-500, 0, 0));
          chalk = mult(chalk, scale(500, 1, 1));
          oScene.shapes.box.draw(graphics_state, chalk, oScene.chalk);
          pole = mult(pole, translation(-1000, 0, 0));
          pole = mult(pole, scale(5, 5, 500));
          oScene.shapes.cylinder.draw(graphics_state, pole, oScene.yellow_paint);

          chalk = mult(surface, translation(17, 160, .1));
          chalk = mult(chalk, rotation(45, [0, 0, 1]));
          pole = chalk;
          chalk = mult(chalk, translation(500, 0, 0));
          chalk = mult(chalk, scale(500, 1, 1));
          oScene.shapes.box.draw(graphics_state, chalk, oScene.chalk);
          pole = mult(pole, translation(1000, 0, 0));
          pole = mult(pole, scale(5, 5, 500));
          oScene.shapes.cylinder.draw(graphics_state, pole, oScene.yellow_paint);

          // Draw backstop
          gate_transform = mult(gate_start, translation(0, 0, 25));
          gate_transform = mult(gate_transform, rotation(45, [0, 1, 0]));
          gate_transform = mult(gate_transform, scale(20, 1, 20));
          oScene.shapes.fence.draw(graphics_state, gate_transform, oScene.chain);
          
          gate_transform = mult(gate_start, translation(63 * Math.cos(radians(45)), 25 * Math.sin(radians(45)), 25));
          gate_transform = mult(gate_transform, rotation(45, [0, 0, 1]));
          gate_transform = mult(gate_transform, rotation(45, [0, 1, 0]));
          gate_transform = mult(gate_transform, scale(20, 1, 20));
          oScene.shapes.fence.draw(graphics_state, gate_transform, oScene.chain);

          gate_transform = mult(gate_start, translation(-63 * Math.cos(radians(45)), 25 * Math.sin(radians(45)), 25));
          gate_transform = mult(gate_transform, rotation(-45, [0, 0, 1]));
          gate_transform = mult(gate_transform, rotation(45, [0, 1, 0]));
          gate_transform = mult(gate_transform, scale(20, 1, 20));
          oScene.shapes.fence.draw(graphics_state, gate_transform, oScene.chain);

          return surface;
        };

        /*
         * Draws a baseball player as a better.
         * @param {Object}   oScene   - The baseball scene.
         * @param {Object[]} mSurface - The transformation matrix to the 
         *                              surface of the ground.
         * @param {Number}   iTime    - The scaled animation time.
         */
        var draw_batter = function(oScene, mSurface, iTime, oEvent) {
          var body_top;
          var head_top;
          var helmet_center;
          var head_dimensions = {
            "length" : 2 * 4,
            "width"  : 2 * 4,
            "height" : 2 * 4
          };

          /*
           * Draws the head of the player.
           * @param {Object}   oShape          - The Shape to draw.
           * @param {Object}   oMaterial       - The material to use to color
           *                                     the drawn shape.
           * @param {Object[]} mBody           - The transformation matrix to
           *                                     the top of the body.
           * @param {Object}   oHeadDimensions - The dimensions of the head.
           * @returns {Object[]} The transformation matrix for the center of
           *                     the head.
           */
          var draw_head = function(oShape, oMaterial, mBody, oHeadDimensions) {
            var offset = -.35; // Extra offset to place the head nicely on the body
            var center = mult(mBody, translation(
              0,
              0,
              offset + oHeadDimensions.height / 2)
            );
            face = mult(center, scale(
              oHeadDimensions.length / 2,
              oHeadDimensions.width / 2,
              oHeadDimensions.height / 2)
            );
            oShape.draw(graphics_state, face, oMaterial);
            return center;
          };

          /*
           * Draws the body of the player.
           * @param {Object}   oScene   - The baseball scene.
           * @param {Object[]} mSurface - The transformation matrix to the 
           *                              surface of the ground.
           * @param {Number}   iTime    - The scaled animation time.
           * @returns {Object[]} The transformation matrix for the top of
           *                     the body.
           */
          var draw_body = function(oScene, mSurface, iTime) {
            var body;
            var zScale = 8;
            var bodyScale = 6;
            var bodyTop = mult(mSurface, translation(-10, 125, 8 + (zScale * .2)));
            var leftHinge;
            var rightHinge;
            var bat;
            var rot1;
            var rot2;
            var swing;
            var rotAngle;

            /*
             * Draws an arm of the player.
             * @param {Object}   oScene - The baseball scene.
             * @param {Object[]} mPos   - The transformation matrix to the
             *                             position to draw the arm.
             */
            var draw_arm = function(oScene, mPos) {
              var arm = mPos;
              var armScale = 8;

              /*
               * Draw a hand of the player.
               * @param {Object}   oScene - The baseball scene.
               * @param {Object[]} mPos   - The transformation matrix to the
               *                            position to draw the hand.
               */
              var draw_hand = function(oScene, mPos) {
                var hand_radius = 1;
                var hand_center = mult(mPos, translation(0, 0, -hand_radius));
                //oScene.bodies.manual.push(new Body("hand", oScene.shapes.sphere, oScene.skin, hand_center));
                oScene.shapes.sphere.draw(graphics_state, hand_center, 
                  oScene.skin);
              };

              draw_hand(oScene, mult(arm, translation(0, 0, -armScale * .5)));
              //oScene.bodies.manual.push(new Body("arm", oScene.shapes.tube, oScene.cloth, arm, vec3(1, 1, armScale)));
              arm = mult(arm, scale(1, 1, armScale));
              oScene.shapes.tube.draw(graphics_state, arm, oScene.cloth);
            };

            // Draw main body
            body = mult(mSurface, translation(-10, 125, 8));
            body = mult(body, rotation(90, [0, 0, 1]));
            body = mult(body, scale(bodyScale, bodyScale, zScale));
            //oScene.shapes.tube.draw(graphics_state, body, oScene.cloth);

            rotAngle = .04 * (iTime - oScene.ball_start_time);
            if (rotAngle >= 180)
              rotAngle = 180;
            swing = mult(bodyTop, rotation(rotAngle, [0, 0, 1]));
            leftHinge = mult(swing, translation(0, -bodyScale * .25, 0));
            rightHinge = mult(swing, translation(bodyScale * .25, 0, 0));

            // Draw bat
            bat = mult(leftHinge, translation(0, -.25*6, 0));
            bat = mult(bat, translation(
              8*0.5*Math.sin(radians(30)),
              8*0.5*Math.sin(radians(-70)),
              0)
            );
            bat = mult(bat, translation(-2, -1.5, -1.5));
            bat = mult(bat, rotation(-45, [0, 0, 1]));
            bat = mult(bat, rotation(180, [1, 0, 0]));
            //oScene.bodies.manual.push(new Body("bat", oScene.shapes.bat, oScene.wood, bat, vec3(2, 2, 2)));
            //oScene.bodies.ball_collision_items.push(new Body("bat", oScene.shapes.bat, oScene.wood, bat, vec3(2, 2, 2)));
            oScene.bodies.bat.location_matrix = bat;
            bat = mult(bat, scale(7, 7, 7));
            oScene.shapes.bat.draw(graphics_state, bat, oScene.wood);

            rot1 = mult(rotation(-70, [1, 0, 0]), rotation(-30, [0, 1, 0]));
            draw_arm(oScene, mult(leftHinge, rot1));
            rot2 = mult(rotation(-70, [1, 0, 0]), rotation(-25, [0, 1, 0]));
            draw_arm(oScene, mult(rightHinge, rot2));

            return bodyTop;
          };

          /*
           * Draws the shoes of the player.
           * @param {Object}   oShape    - The Shape to draw.
           * @param {Object}   oMaterial - The material to use to color the
           *                               drawn shape.
           * @param {Object[]} mSurface  - The transformation matrix to the
           *                               surface of the ground.
           */
          var draw_shoes = function(oShape, oMaterial, mSurface) {
            var shoe_dimensions = {
              "length" : 2 * 4, // x
              "width"  : 2 * 2, // y
              "height" : 2      // z
            };
            var sizeShoe = scale(
              shoe_dimensions.length / 2,
              shoe_dimensions.width / 2,
              shoe_dimensions.height
            );
            var pos = mult(mSurface, translation(-10, 120, 1));
            var flipShoe = rotation(180, [1, 0, 0]);

            flipShoe = mult(flipShoe, rotation(180, [0, 0, 1]));

            // First shoe
            pos = mult(pos, flipShoe);
            pos = mult(pos, sizeShoe);
            oShape.draw(graphics_state, pos, oMaterial);

            // Second shoe
            pos = mult(mSurface, translation(-10, 130, 1));
            pos = mult(pos, flipShoe);
            pos = mult(pos, sizeShoe);
            oShape.draw(graphics_state, pos, oMaterial);
          };

          //draw_shoes(oScene.shapes.half_sphere, oScene.rubber, mSurface);
          body_top = draw_body(oScene, mSurface, iTime);
          //head_center = draw_head(oScene.shapes.sphere, oScene.skin, body_top,
            //head_dimensions);

          // Helmet
          /*helmet_pos = mult(head_center, translation(
            -.15 * head_dimensions.length / 2,
            .1 * head_dimensions.width / 2,
            .9 * head_dimensions.height / 2)
          );
          helmet_pos = mult(helmet_pos, rotation(165, [0, 0, 1]));
          helmet_pos = mult(helmet_pos, scale(
            head_dimensions.length / 2,
            head_dimensions.width / 2,
            head_dimensions.height / 2)
          );
          oScene.shapes.helmet.draw(graphics_state, helmet_pos, oScene.helmet_paint);*/
        };

        /*
         * Draws a baseball player as a fielder.
         * @param {Object}   oScene   - The baseball scene.
         * @param {Object[]} mSurface - The transformation matrix to the 
         *                              surface of the ground.
         * @param {Number}   iTime    - The scaled animation time.
         */
        var draw_fielder = function(oScene, mSurface, iTime, oEvent) {
          var body_top;
          var head_center;
          var head_dimensions = {
            "length" : 2 * 4,
            "width"  : 2 * 4,
            "height" : 2 * 4
          };
          var cap_pos;

          /*
           * Draws the head of the player.
           * @param {Object}   oShape          - The Shape to draw.
           * @param {Object}   oMaterial       - The material to use to color
           *                                     the drawn shape.
           * @param {Object[]} mBody           - The transformation matrix to
           *                                     the top of the body.
           * @param {Object}   oHeadDimensions - The dimensions of the head.
           * @returns {Object[]} The transformation matrix for the center of
           *                     the head.
           */
          var draw_head = function(oShape, oMaterial, mBody, oHeadDimensions) {
            var offset = -.35; // Extra offset to place the head nicely on the body
            var center = mult(mBody, translation(
              0,
              0,
              offset + oHeadDimensions.height / 2)
            );
            face = mult(center, scale(
              oHeadDimensions.length / 2,
              oHeadDimensions.width / 2,
              oHeadDimensions.height / 2)
            );
            oShape.draw(graphics_state, face, oMaterial);
            return center;
          };

          /*
           * Draws the body of the player.
           * @param {Object}   oScene   - The baseball scene.
           * @param {Object[]} mSurface - The transformation matrix to the 
           *                              surface of the ground.
           * @param {Number}   iTime    - The scaled animation time.
           * @returns {Object[]} The transformation matrix for the top of
           *                     the body.
           */
          var draw_body = function(oScene, mSurface, iTime, oEvent) {
            var body;
            var zScale = 8;
            var bodyScale = 6;
            var bodyTop = mult(mSurface, translation(1.5, 295, 12 + (zScale * .2)));
            var leftHinge;
            var rightHinge;
            var rot1;
            var rot2;
            var glove;
            var throwMotion;
            var gloveMotion;
            var rotAngle;

            /*
             * Draws an arm of the player.
             * @param {Object}   oScene  - The baseball scene.
             * @param {Object[]} mPos    - The transformation matrix to the
             *                             position to draw the arm.
             * @param {boolean}  bIsLeft - The hand to draw is the left.
             */
            var draw_arm = function(oScene, mPos, bIsLeft, iTime, oEvent) {
              var arm = mPos;
              var armScale = 8;

              /*
               * Draw a hand (with baseball) of the player.
               * @param {Object}   oScene  - The baseball scene.
               * @param {Object[]} mPos    - The transformation matrix to the
               *                             position to draw the hand.
               */
              var draw_hand = function(oScene, mPos, iTime, oEvent) {
                var hand_radius = 1;
                var hand_center = mult(mPos, translation(0, 0, -hand_radius));
                var ball_transform;

                //oScene.bodies.manual.push(new Body("hand", oScene.shapes.sphere, oScene.skin, hand_center));
                oScene.shapes.sphere.draw(graphics_state, hand_center,
                  oScene.skin);

                if (oScene.ball_free)
                  return;

                if (.05 * (iTime - oScene.ball_start_time) < 90) {
                  ball_transform = mult(hand_center, translation(
                    0,
                    -(hand_radius + .2),
                    0)
                  );
                }
                else {
                  /*oScene.bodies.auto.push(new Body(
                    "baseball",
                    oScene.shapes.ball,
                    oScene.cork_stitch,
                    oScene.ball_transform,
                    vec3(.75, .75, .75),
                    vec3(0, -.05, 0),
                    vec3(0, 0, oScene.gravity),
                    1,
                    0,
                    vec3(0, 1, 0)
                  ));*/

                  // Uncomment this later
                  
                  oScene.bodies.baseball = (new Body(
                    "baseball",
                    oScene.shapes.ball,
                    oScene.cork_stitch,
                    oScene.ball_transform,
                    vec3(.75, .75, .75),
                    vec3(0, oEvent.release_y_velocity.value, 0),
                    vec3(0, 0, oEvent.gravity.value),
                    1,
                    0,
                    vec3(0, 1, 0)
                  ));
                  oScene.ball_free = true;
                  return;
                }
                /*oScene.bodies.manual.push(new Body("baseball",
                  oScene.shapes.ball,
                  oScene.cork_stitch,
                  ball_transform,
                  vec3(.75, .75, .75)
                ));*/

                // Uncomment this later
                
                oScene.ball_transform = ball_transform;
                ball_transform = mult(ball_transform, scale(.75, .75, .75));

                oScene.shapes.ball.draw(
                  graphics_state,
                  ball_transform,
                  oScene.cork_stitch
                );
              };

              if (!bIsLeft)
                draw_hand(oScene, mult(arm, translation(0, 0, -armScale * .5)), iTime, oEvent);
              //oScene.bodies.manual.push(new Body("arm", oScene.shapes.tube, oScene.cloth, arm, vec3(1, 1, armScale)));
              arm = mult(arm, scale(1, 1, armScale));
              oScene.shapes.tube.draw(graphics_state, arm, oScene.cloth);
            };

            // Draw main body
            body = mult(mSurface, translation(1.5, 295, 12));
            body = mult(body, rotation(90, [0, 0, 1]));
            body = mult(body, scale(bodyScale, bodyScale, zScale));
            //oScene.shapes.tube.draw(graphics_state, body, oScene.cloth);

            rotAngle = .05 * (iTime - oScene.ball_start_time);
            if (rotAngle >= 135)
              rotAngle = 135;
            throwMotion = mult(bodyTop, rotation(rotAngle, [1, 0, 0]));

            rotAngle = (.05 * (iTime - oScene.ball_start_time));
            if (rotAngle >= 90)
              rotAngle = 90;
            gloveMotion = mult(bodyTop, rotation(rotAngle, [0, 0, 1]));

            leftHinge = mult(gloveMotion, translation(-.08 * bodyScale, -bodyScale * .1, 0));
            rightHinge = mult(throwMotion, translation((-bodyScale * .25) /*- (.2 * bodyScale)*/, 0, 0));

            // Draw mitt (glove)
            glove = mult(leftHinge, translation((-bodyScale * 0.7)-2, -1, 0));
            glove = mult(glove, mult(rotation(-180, [0, 1, 0]), rotation(-90, [0, 0, 1])));
            glove = mult(glove, rotation(-90, [0,1,0]));
            //oScene.bodies.manual.push(new Body("mitt", oScene.shapes.mitt, oScene.leather, glove, vec3(1.5, 1.5, 1.5)));
            glove = mult(glove, scale(1.5, 1.5, 1.5));
            oScene.shapes.mitt.draw(graphics_state, glove, oScene.leather);

            rot1 = rotation(90, [0, 1, 0]);
            draw_arm(oScene, mult(leftHinge, rot1), true, iTime, oEvent);
            rot2 = mult(rotation(90, [0, 1, 0]), rotation(45, [1, 0, 0]));
            draw_arm(oScene, mult(rightHinge, rot2), false, iTime, oEvent);

            return bodyTop;
          };

          /*
           * Draws the shoes of the player.
           * @param {Object}   oShape    - The Shape to draw.
           * @param {Object}   oMaterial - The material to use to color the
           *                               drawn shape.
           * @param {Object[]} mSurface  - The transformation matrix to the
           *                               surface of the ground.
           */
          var draw_shoes = function(oShape, oMaterial, mSurface) {
            var shoe_dimensions = {
              "length" : 2 * 4, // x
              "width"  : 2 * 2, // y
              "height" : 2      // z
            };
            var sizeShoe = scale(
              shoe_dimensions.length / 2,
              shoe_dimensions.width / 2,
              shoe_dimensions.height
            );
            var pos = mult(mSurface, translation(1.5, 290, 5.5));
            var flipShoe = rotation(180, [1, 0, 0]);

            flipShoe = mult(flipShoe, rotation(180, [0, 0, 1]));

            // First shoe
            pos = mult(pos, flipShoe);
            pos = mult(pos, sizeShoe);
            oShape.draw(graphics_state, pos, oMaterial);

            // Second shoe
            pos = mult(mSurface, translation(1.5, 300, 6));
            pos = mult(pos, flipShoe);
            pos = mult(pos, sizeShoe);
            oShape.draw(graphics_state, pos, oMaterial);
          };

          //draw_shoes(oScene.shapes.half_sphere, oScene.rubber, mSurface);
          body_top = draw_body(oScene, mSurface, iTime, oEvent);
          /*head_center = draw_head(oScene.shapes.sphere, oScene.skin, body_top,
            head_dimensions);

          // Cap
          cap_pos = mult(head_center, translation(
            -.01 * head_dimensions.length / 2,
            -.09 * head_dimensions.width / 2,
            .7 * head_dimensions.height / 2)
          );
          cap_pos = mult(cap_pos, rotation(90, [1, 0, 0]));
          cap_pos = mult(cap_pos, rotation(-90, [0, 1, 0]));
          cap_pos = mult(cap_pos, scale(
            head_dimensions.length / 2,
            head_dimensions.width / 2,
            head_dimensions.height / 2)
          );
          oScene.shapes.cap.draw(graphics_state, cap_pos, oScene.wool);*/
        };

        var pick_event = function(oScene) {
          var n = oScene.events.length;
          var i = Math.floor(Math.random() * n);
          return oScene.events[i]; // TODO: Insert i
        }

        var model_transform = identity();
        var t = graphics_state.animation_time;
        var ball_pos;
        var collider;
        var a_inv;
        var b_inv;
        var collision_items;
        var event;

        graphics_state.lights = [
          new Light(vec4(0, 500, 1000, 1), Color(1, 1, 1, 1), 900000)
        ];

        //this.bodies.manual = [];

        event = pick_event(this);
        
        model_transform = this.surface;
        draw_batter(this, model_transform, t);
        draw_fielder(this, model_transform, t, event);

        for (let b of this.bodies.auto) {
          b.shape.draw(graphics_state, mult(b.location_matrix, scale(b.scale)), b.material);
        }

        if (this.bodies.baseball != null)
          this.bodies.baseball.shape.draw(graphics_state, mult(this.bodies.baseball.location_matrix, scale(this.bodies.baseball.scale)), this.bodies.baseball.material);

        if (t > this.prev_anim_time && this.bodies.baseball != null) {
          this.bodies.baseball.advance(graphics_state.animation_delta_time);
          //console.log(graphics_state.animation_delta_time);
          this.ball_transform = this.bodies.baseball.location_matrix;
          //console.log("Position: " + mult_vec(this.ball_transform, vec4(0, 0, 0, 1)));
        }

        collision_items = this.bodies.ball_collision_items.concat(this.bodies.bat);
        ball_pos = mult_vec(this.ball_transform, vec4(0, 0, 0, 1));

        if (t > this.prev_anim_time && this.bodies.baseball != null) {
          // Ground collision
          if (this.bodies.baseball.location_matrix[2][3] < 5.6 && this.bodies.baseball.linear_velocity[2] < 0) {
            // Ground normal force
            this.bodies.baseball.linear_velocity[2] = event.normal_z_acceleration.value * this.bodies.baseball.linear_velocity[2];

            // Ground friction
            if (this.bodies.baseball.linear_velocity[1] !== 0) {
              if (this.bodies.baseball.linear_velocity[1] > 0)
                this.bodies.baseball.linear_acceleration[1] = -event.friction_y_acceleration.value;
              else
                this.bodies.baseball.linear_acceleration[1] = event.friction_y_acceleration.value;
              this.bodies.baseball.angular_velocity = .6 * this.bodies.baseball.angular_velocity;
            }
            if (this.bodies.baseball.linear_velocity[0] !== 0) {
              if (this.bodies.baseball.linear_velocity[0] > 0)
                this.bodies.baseball.linear_acceleration[0] = -event.friction_x_acceleration.value;
              else
                this.bodies.baseball.linear_acceleration[0] = event.friction_x_acceleration.value;
            }
          }
          else if (this.bodies.baseball.location_matrix[2][3] < 5.6 &&
                   this.bodies.baseball.linear_velocity[2] == 0 &&
                   this.bodies.baseball.linear_velocity[1] == 0 &&
                   this.bodies.baseball.linear_velocity[0] == 0) {
            this.bodies.baseball.linear_acceleration[2] = 0;
            this.bodies.baseball.angular_velocity = 0;

            // Reset and spawn new ball
            this.ball_free = false;
            this.bodies.auto.push(this.bodies.baseball);
            this.ball_start_time = t;
            this.bodies.baseball = null;
            return;
          }

          for (let b of collision_items) {
            a_inv = inverse(mult(this.bodies.baseball.location_matrix, scale(this.bodies.baseball.scale)));
            b_inv = inverse(mult(b.location_matrix, scale(b.scale)));

            collider = this.collider;

            if (this.bodies.baseball.collided(b, a_inv, collider)) {
              if (b.name === "bat") {
                //console.log("Collided with bat!");
                this.bodies.baseball.linear_velocity[0] = event.contact_x_velocity.value;
                this.bodies.baseball.linear_velocity[1] = event.contact_y_velocity.value * this.bodies.baseball.linear_velocity[1];
                this.bodies.baseball.linear_velocity[2] = event.contact_z_velocity.value + this.bodies.baseball.linear_velocity[2];
                this.bodies.baseball.angular_velocity = -this.bodies.baseball.angular_velocity;
              } else if (b.name === "fence" || b.name === "fence1") {
                //console.log("Past fence!");
                if (this.bodies.baseball.linear_velocity[2] > 0)
                  this.bodies.baseball.linear_velocity[2] = -1 * this.bodies.baseball.linear_velocity[2];
                else
                  this.bodies.baseball.linear_velocity[2] = 1 * this.bodies.baseball.linear_velocity[2];
                this.bodies.baseball.linear_velocity[1] = 0;
                this.bodies.baseball.linear_velocity[0] = 0;
                this.bodies.baseball.angular_velocity = .3 * this.bodies.baseball.angular_velocity;
                //this.bodies.baseball.linear_acceleration[1] = .;
              }
            }

            else if ((b.name === "fence" || b.name === "fence1") && b.check_if_colliding(this.bodies.baseball, b_inv, collider)) {
              //console.log("Collided with fence!");
              if (this.bodies.baseball.linear_velocity[1] !== 0) {
                if (this.bodies.baseball.linear_velocity[2] > 0)
                  this.bodies.baseball.linear_velocity[2] = -1 * this.bodies.baseball.linear_velocity[2];
                else
                  this.bodies.baseball.linear_velocity[2] = 1 * this.bodies.baseball.linear_velocity[2];
              }
              this.bodies.baseball.linear_velocity[1] = 0;
              this.bodies.baseball.linear_velocity[0] = 0;
              this.bodies.baseball.angular_velocity = .5 * this.bodies.baseball.angular_velocity;
            }
          }
        }

        if (this.ball_camera) {
          ball_pos = mult_vec(this.ball_transform, vec4(0, 0, 0, 1));
          this.graphics_state.camera_transform = lookAt(
            [ball_pos[0], ball_pos[1] - 20, ball_pos[2]],
            [ball_pos[0], ball_pos[1], ball_pos[2]],
            [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        }

        this.prev_anim_time = t;
      }
  }, Scene_Component);

  
// ******************************************************************
// The rest of this file is more code that powers the included demos.

// An example of a Scene_Component that our Canvas_Manager can manage.
// Displays a text user interface.
Declare_Any_Class("Debug_Screen",
  {
    'construct'(context)
      {
        this.define_data_members({
          string_map:    context.globals.string_map, start_index: 0, tick: 0, visible: false, graphics_state: new Graphics_State(),
          text_material: context.shaders_in_use["Phong_Model"].material(Color(0, 0, 0, 1), 1, 0, 0, 40, context.textures_in_use["text.png"])
        });
        var shapes = {
          'debug_text': new Text_Line(35),
          'cube'      : new Cube()
        };
        this.submit_shapes(context, shapes);
      },
    'init_keys'(controls)
      {
        controls.add("t",    this, function() { this.visible ^= 1;                                                                                                  } );
        controls.add("up",   this, function() { this.start_index = ( this.start_index + 1 ) % Object.keys( this.string_map ).length;                                } );
        controls.add("down", this, function() 
                                    { this.start_index = ( this.start_index - 1   + Object.keys( this.string_map ).length ) % Object.keys( this.string_map ).length; } );
        this.controls = controls;
      },
    'update_strings'(debug_screen_object) // Strings that this Scene_Component contributes to the UI:
      {
        debug_screen_object.string_map["tick"]              = "Frame: " + this.tick++;
        debug_screen_object.string_map["text_scroll_index"] = "Text scroll index: " + this.start_index;
      },
    'display'(global_graphics_state) // Leave these 3D global matrices unused, because this class is instead making a 2D user interface.
      {
        if (!this.visible)
          return;
        var font_scale = scale(.02, .04, 1),
            model_transform = mult(translation(-.95, -.9, 0), font_scale),
            strings = Object.keys(this.string_map);
  
        for (var i = 0, idx = this.start_index; i < 4 && i < strings.length; i++, idx = (idx + 1) % strings.length) {
          this.shapes.debug_text.set_string(this.string_map[strings[idx]]);
          this.shapes.debug_text.draw( this.graphics_state, model_transform, this.text_material ); // Draw some UI text (each live-updated 
          model_transform = mult(translation(0, .08, 0), model_transform);                         // logged value in each Scene_Component)
        }
        model_transform   = mult(translation(.7, .9, 0), font_scale);
        this.  shapes.debug_text.set_string("Controls:");
        this.  shapes.debug_text.draw(this.graphics_state, model_transform, this.text_material); // Draw some UI text

        for (let k of Object.keys(this.controls.all_shortcuts)) {
          model_transform = mult(translation(0, -0.08, 0), model_transform);
          this.shapes.debug_text.set_string(k);
          this.shapes.debug_text.draw(this.graphics_state, model_transform, this.text_material); // Draw some UI text (the canvas's key controls)
        }
      }
  }, Scene_Component);

Declare_Any_Class("Camera",
  {
    'construct'(context, canvas = context.canvas)
      { // 1st parameter below is our starting camera matrix. 2nd is the projection: The matrix that determines how depth is treated. It projects 3D points onto a plane.
        context.globals.graphics_state.set(
          lookAt([1.58, 287, 15], [0, 260, 15], [0, 0, 1]),
          perspective(45, context.width/context.height, .1, 1000),
          0
        );
        this.define_data_members({
          graphics_state : context.globals.graphics_state,
          thrust         : vec3(),
          origin         : vec3(0, 0, 0),
          looking        : false
        });

        // *** Mouse controls: ***
        this.mouse = { "from_center": vec2() }; // Measure mouse steering, for rotating the fly-around camera:
        var mouse_position = function(e) {
          return vec2(e.clientX - context.width/2, e.clientY - context.height/2);
        };   
        canvas.addEventListener("mouseup", (function(self) {
          return function(e) {
            e = e || window.event;
            self.mouse.anchor = undefined;
          }
        }) (this), false);
        canvas.addEventListener("mousedown", (function(self) {
          return function(e) {
            e = e || window.event;
            self.mouse.anchor = mouse_position(e);
          }
        }) (this), false);
        canvas.addEventListener("mousemove", (function(self) {
          return function(e) {
            e = e || window.event;
            self.mouse.from_center = mouse_position(e);
          }
        }) (this), false);
        canvas.addEventListener("mouseout", (function(self) { // Stop steering if the
          return function(e) {                                // mouse leaves the canvas.
            self.mouse.from_center = vec2();
          };
        }) (this), false);

        this.origin = mult_vec(
            inverse(this.graphics_state.camera_transform),
            vec4(0,0,0,1)
          ).slice(0,3);
      },
    'init_keys'(controls) // init_keys(): Define any extra keyboard shortcuts here
      {
        // TODO: Remove these later!
        /*controls.add("Space", this, function() { this.thrust[1] = -1; });
        controls.add("Space", this, function() { this.thrust[1] =  0; }, {'type':'keyup'});
        controls.add("z",     this, function() { this.thrust[1] =  1; });
        controls.add("z",     this, function() { this.thrust[1] =  0; }, {'type':'keyup'});
        controls.add("w",     this, function() { this.thrust[2] =  1; });
        controls.add("w",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'});
        controls.add("a",     this, function() { this.thrust[0] =  1; } );
        controls.add("a",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'});
        controls.add("s",     this, function() { this.thrust[2] = -1; } );
        controls.add("s",     this, function() { this.thrust[2] =  0; }, {'type':'keyup'});
        controls.add("d",     this, function() { this.thrust[0] = -1; } );
        controls.add("d",     this, function() { this.thrust[0] =  0; }, {'type':'keyup'});
        controls.add("o", this, function() {
          this.origin = mult_vec(
            inverse(this.graphics_state.camera_transform),
            vec4(0,0,0,1)
          ).slice(0,3);
        });*/

        controls.add("b", this, function() { // Follow ball
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });

        controls.add("1", this, function() { // Pitcher's mound
          this.graphics_state.camera_transform = lookAt(
            [1.58, 287, 15], [0, 260, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("2", this, function() { // Home plate
          this.graphics_state.camera_transform = lookAt(
            [-.6, 81, 15], [0, 90, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("3", this, function() { // 1st base
          this.graphics_state.camera_transform = lookAt(
            [190, 379, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("4", this, function() { // 2nd base
          this.graphics_state.camera_transform = lookAt(
            [127, 485, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("5", this, function() { // 3rd base
          this.graphics_state.camera_transform = lookAt(
            [-193, 372, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("6", this, function() { // Shortstop
          this.graphics_state.camera_transform = lookAt(
            [-87, 538, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("7", this, function() { // Left field
          this.graphics_state.camera_transform = lookAt(
            [-506, 735, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("8", this, function() { // Center field
          this.graphics_state.camera_transform = lookAt(
            [39, 960, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
        controls.add("9", this, function() { // Right field
          this.graphics_state.camera_transform = lookAt(
            [372, 695, 15], [-.6, 81, 15], [0, 0, 1]
          );
          this.origin = mult_vec(inverse(this.graphics_state.camera_transform), vec4(0,0,0,1)).slice(0,3);
        });
      },
    'update_strings'(user_interface_string_manager) // Strings that this Scene_Component contributes to the UI:
      {
        var C_inv = inverse(this.graphics_state.camera_transform), pos = mult_vec(C_inv, vec4( 0, 0, 0, 1 )),
                                                                  z_axis = mult_vec(C_inv, vec4( 0, 0, 1, 0 ));
        user_interface_string_manager.string_map["origin" ] = "Center of rotation: " 
                                                              + this.origin[0].toFixed(0) + ", " + this.origin[1].toFixed(0) + ", " + this.origin[2].toFixed(0);
        user_interface_string_manager.string_map["cam_pos"] = "Cam Position: "
                                                              + pos[0].toFixed(2) + ", " + pos[1].toFixed(2) + ", " + pos[2].toFixed(2);    
        user_interface_string_manager.string_map["facing" ] = "Facing: " + ( ( z_axis[0] > 0 ? "West " : "East ") // (Actually affected by the left hand rule)
                                                               + ( z_axis[1] > 0 ? "Down " : "Up " ) + ( z_axis[2] > 0 ? "North" : "South" ) );
      },
    'display'(graphics_state)
      {
        var leeway = 70,  degrees_per_frame = .0004 * graphics_state.animation_delta_time,
                          meters_per_frame  =   .01 * graphics_state.animation_delta_time;
        if (this.mouse.anchor) {                                                     // Third-person "arcball" camera mode: Is a mouse drag occurring?
          var dragging_vector = subtract(this.mouse.from_center, this.mouse.anchor); // Spin the scene around the world origin on a user-determined axis.
          if (length(dragging_vector) > 0) {
            graphics_state.camera_transform = mult(graphics_state.camera_transform,  // Post-multiply so we rotate the scene instead of the camera.
                mult(translation( this.origin ),
                mult(rotation(.05 * length(dragging_vector), dragging_vector[1], 0, dragging_vector[0]),
                    translation(scale_vec( -1, this.origin ) ) ) ) );
          }
        }
        // First-person flyaround mode: Determine camera rotation movement when the mouse is past a minimum distance (leeway) from the canvas's center.
        var offsets = { plus:  [ this.mouse.from_center[0] + leeway, this.mouse.from_center[1] + leeway ],
                        minus: [ this.mouse.from_center[0] - leeway, this.mouse.from_center[1] - leeway ] };
        if (this.looking) {
          for (var i = 0; i < 2; i++) { // Steer according to "mouse_from_center" vector, but don't start increasing until outside a leeway window from the center.
            var velocity = ( ( offsets.minus[i] > 0 && offsets.minus[i] ) || ( offsets.plus[i] < 0 && offsets.plus[i] ) ) * degrees_per_frame;  // &&'s might zero these out.
            graphics_state.camera_transform = mult( rotation( velocity, i, 1-i, 0 ), graphics_state.camera_transform );   // On X step, rotate around Y axis, and vice versa.
          }
        }
        // Now apply translation movement of the camera, in the newest local coordinate frame
        graphics_state.camera_transform = mult(translation(scale_vec(meters_per_frame, this.thrust)), graphics_state.camera_transform);
      }
  }, Scene_Component);

// A class that just interacts with the keyboard and reports strings
Declare_Any_Class("Flag_Toggler",
  {
    'construct'(context)
      {
        this.globals    = context.globals;
      },
    'init_keys'(controls) //  Desired keyboard shortcuts
      {
        //controls.add( "ALT+g", this, function() { this.globals.graphics_state.gouraud       ^= 1; } ); // Make the keyboard toggle some
        //controls.add( "ALT+n", this, function() { this.globals.graphics_state.color_normals ^= 1; } ); // GPU flags on and off.
        controls.add( "ALT+a", this, function() { this.globals.animate                      ^= 1; } );
      },
    'update_strings'(user_interface_string_manager) // Strings that this Scene_Component contributes to the UI:
      {
        user_interface_string_manager.string_map["time"]    = "Animation Time: " + Math.round( this.globals.graphics_state.animation_time )/1000 + "s";
        user_interface_string_manager.string_map["animate"] = "Animation " + (this.globals.animate ? "on" : "off") ;
      },
  }, Scene_Component);

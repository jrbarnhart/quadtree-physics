import {
  ParticleInterface,
  PositiveInteger,
  Rectangle,
  QuadTree,
} from "./defs";
import createRectangle from "./createRectangle";

// Constants for tuning gravitational attraction and movement
const G = 3;
const MAX_VELOCITY = 0.1;

// Fn for checking if rectangle contains a point
export const rectContains = (
  rectangle: Rectangle,
  point: ParticleInterface
) => {
  return (
    rectangle.left <= point.x &&
    point.x <= rectangle.right &&
    rectangle.top <= point.y &&
    point.y <= rectangle.bottom
  );
};

// Calculates distance between two points
export const calculateDistance = (
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
) => {
  const dx = p1x - p2x;
  const dy = p1y - p2y;
  const distSq = dx * dx + dy * dy;
  const distance = Math.sqrt(distSq);
  return { distance, distSq, dx, dy };
};

// Calculates gravity between two bodies
export const calculateAttraction = (
  dx: number,
  dy: number,
  distSq: number,
  distance: number,
  b1mass: number,
  b2mass: number,
  G: number
) => {
  const force = (G * b1mass * b2mass) / distSq;
  const fx = -(force * (dx / distance));
  const fy = -(force * (dy / distance));
  return { x: fx, y: fy };
};

// Updates particle positions given gravForce from A to B
export const updatePositions = (
  pointA: ParticleInterface,
  pointB: ParticleInterface,
  gravForce: { x: number; y: number }
) => {
  pointA.vx = Math.max(
    -MAX_VELOCITY,
    Math.min(pointA.vx + gravForce.x / pointA.mass, MAX_VELOCITY)
  );
  pointA.vy = Math.max(
    -MAX_VELOCITY,
    Math.min(pointA.vy + gravForce.y / pointA.mass, MAX_VELOCITY)
  );
  // Use inverse force to update pointB
  pointB.vx = Math.max(
    -MAX_VELOCITY,
    Math.min(pointB.vx - gravForce.x / pointB.mass, MAX_VELOCITY)
  );
  pointB.vy = Math.max(
    -MAX_VELOCITY,
    Math.min(pointB.vy - gravForce.y / pointB.mass, MAX_VELOCITY)
  );

  // Update positions of particles based on new velocity
  pointA.x += pointA.vx;
  pointA.y += pointA.vy;
  pointB.x += pointB.vx;
  pointB.y += pointB.vy;
};

const createQuadTree = (
  boundary: Rectangle,
  capacity: PositiveInteger,
  depth?: number | undefined
) => {
  // Array used to reference child quadrants
  const quads: ["northwest", "northeast", "southeast", "southwest"] = [
    "northwest",
    "northeast",
    "southeast",
    "southwest",
  ];

  // Fn for subdividing
  const subdivide = () => {
    // Define new boundaries
    const nw: Rectangle = createRectangle(
      boundary.x - boundary.width / 4,
      boundary.y - boundary.height / 4,
      boundary.height / 2,
      boundary.width / 2
    );

    const ne: Rectangle = createRectangle(
      boundary.x + boundary.width / 4,
      boundary.y - boundary.height / 4,
      boundary.height / 2,
      boundary.width / 2
    );

    const se: Rectangle = createRectangle(
      boundary.x + boundary.width / 4,
      boundary.y + boundary.height / 4,
      boundary.height / 2,
      boundary.width / 2
    );

    const sw: Rectangle = createRectangle(
      boundary.x - boundary.width / 4,
      boundary.y + boundary.height / 4,
      boundary.height / 2,
      boundary.width / 2
    );

    // Create the child nodes
    quads.forEach((quad) => {
      quadTree[quad] = createQuadTree(
        // Assign correct rectangle
        quad === "northwest"
          ? nw
          : quad === "northeast"
          ? ne
          : quad === "southeast"
          ? se
          : sw,
        quadTree.capacity,
        quadTree.depth + 1
      );
    });

    quadTree.divided = true;
  };

  // Method for inserting into tree
  const insert = (point: ParticleInterface) => {
    // Return if the point is not within boundary
    if (!rectContains(boundary, point)) return false;

    // If center of mass is not null and therefore node has particle(s)
    if (quadTree.massCenterX !== null && quadTree.massCenterY !== null) {
      // Update center of mass
      quadTree.massCenterX =
        (quadTree.massCenterX * quadTree.massTotal + point.x * point.mass) /
        (quadTree.massTotal + point.mass);
      quadTree.massCenterY =
        (quadTree.massCenterY * quadTree.massTotal + point.y * point.mass) /
        (quadTree.massTotal + point.mass);
    } else {
      quadTree.massCenterX = point.x;
      quadTree.massCenterY = point.y;
    }
    // Update total mass
    quadTree.massTotal += point.mass;

    // Add point if there is room and the node is not divided
    if (quadTree.points.length < quadTree.capacity && !quadTree.divided) {
      quadTree.points.push(point);
      // Update nodes total and center of mass
      return true;
    } else {
      // If there isn't room, the quad tree is not divided, and max depth is not yet reached
      if (!quadTree.divided && quadTree.depth < quadTree.maxDepth) {
        // Subdivide the quadtree, adding child quadtrees
        subdivide();

        // Recursively add the parent node's points to new child nodes
        quadTree.points.forEach((point) => {
          if (quadTree.northwest?.insert(point)) return true;
          if (quadTree.northeast?.insert(point)) return true;
          if (quadTree.southeast?.insert(point)) return true;
          if (quadTree.southwest?.insert(point)) return true;
        });
      }

      // If max depth has been reached
      if (quadTree.depth >= quadTree.maxDepth) {
        // Add the point to this quadtree and return true
        quadTree.points.push(point);
        return true;
      }

      // Clear points from parent node as it is now a divided node
      quadTree.points = [];

      // Add the point to the children nodes
      if (quadTree.northwest?.insert(point)) return true;
      if (quadTree.northeast?.insert(point)) return true;
      if (quadTree.southeast?.insert(point)) return true;
      if (quadTree.southwest?.insert(point)) return true;
    }
    throw new Error(
      "Default false return should never happen. Point not inserted. Check insertion logic."
    );
  };

  // Method for finding first edge node
  const findFirstLeaf = () => {
    // If this node a leaf node with points in it
    if (!quadTree.divided && quadTree.points.length > 0) {
      return quadTree;
      // Else if it is an internal node with a northwest child
    } else if (quadTree.divided) {
      for (const quad of quads) {
        const foundNode = quadTree[quad]?.findFirstLeaf();
        if (foundNode) return foundNode;
      }
    }
    // Otherwise no leaf node with a point in it was fonund
    return null;
  };

  // Barnes-Hut gravity calculation
  const gravity = () => {
    // 1. Find first leaf with helper fn
    const queryNode = quadTree.findFirstLeaf();
    // If there is no queryNode found then the tree has no more nodes to proces so exit
    if (!queryNode) return;
    // 2. Process the query node
    /*
      if (query node has multiple points) {
        brute force gravity calcs and updates for these points
      }

      Apply gravity using Barnes-Hut approach
      for each (particle in query node) {
        start at root of quad tree
        if (node is an internal node) {
          check distance between particle and nodes center of mass
          if (distance > threshold) {
            calc and update force between particle and center of mass
            apply opposite force to all particles in the node
          } else if (distance <= threshold) {
            recursively check child nodes
          }
        } else if (node is a leaf node) {
          calc and update force between particle and particles in leaf node
        }
      }
    */
    // First, apply gravity b/w all of queryNode's own particles
    if (queryNode.points.length > 1) {
      // For each point
      for (let i = 0; i < queryNode.points.length; i++) {
        const pointA = queryNode.points[i];

        // Calculate gravity between A and points w/ higher indicies
        for (let j = i + 1; j < queryNode.points.length; j++) {
          const pointB = queryNode.points[j];

          // Get distance info
          const { distance, distSq, dx, dy } = calculateDistance(
            pointA.x,
            pointA.y,
            pointB.x,
            pointB.y
          );

          const gravForce = calculateAttraction(
            dx,
            dy,
            distSq,
            distance,
            pointA.mass,
            pointB.mass,
            G
          );

          // Use this force to update pointA velocity
          updatePositions(pointA, pointB, gravForce);
        }
      }
    }
    // 3. After processed, set node to undefined
    // 4. Find next query node and repeat process
    quadTree.gravity();
  };
  // Create and return quadtree object
  const quadTree: QuadTree = {
    boundary,
    capacity,
    points: [],
    massTotal: 0,
    massCenterX: null,
    massCenterY: null,
    divided: false,
    depth: depth ?? 0,
    maxDepth: 8,
    insert,
    findFirstLeaf,
    gravity,
  };
  return quadTree;
};

export default createQuadTree;

export interface ParticleInterface {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
}

export interface QuadtreeBoundary {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type PositiveInteger = number extends infer T
  ? T extends number
    ? T extends 0
      ? never
      : T
    : never
  : never;

export interface Quadtree {
  particles: ParticleInterface[];
  children: Quadtree[];
  boundary: QuadtreeBoundary;
  parent: Quadtree | undefined;
  mass: number;
  massCenter: { x: number | null; y: number | null };
  treeForce: (particles: ParticleInterface[]) => void;
}

// Above are old interfaces to be replaced with interfaces with data that can be stored in typed arrays
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  m: number;
  r: number;
  color: { r: number; g: number; b: number; a: number };
}

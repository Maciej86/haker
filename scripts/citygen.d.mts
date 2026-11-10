export function rng(seed: number): () => number;
export function hashStr(s: string): number;
export const SCENE_KEYS: string[];
export const SHOPS: string[];
export const OFFICES: string[];
export const FLOOR: number;
export function generateAll(): Record<string, unknown>;
export function serialize(data: unknown): string;

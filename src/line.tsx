import {Line, Rect, CircleProps, Circle} from '@motion-canvas/2d';
import {
  createComputed,
  Vector2,
  SignalValue,
  PossibleVector2,
  createSignal,
  map,
} from '@motion-canvas/core';
import {computedFillOppositeExtreme} from './color';

export function distance(v1: Vector2, v2: Vector2) {
  return Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
}

export function computedLength(line: Line) {
  return createComputed(
    () =>
      line.points().reduce(
        ([prev, currentDistance], next) => {
          const prevV = new Vector2(typeof prev == 'function' ? prev() : prev);
          const nextV = new Vector2(typeof next == 'function' ? next() : next);
          return [next, currentDistance + distance(prevV, nextV)] as [
            SignalValue<PossibleVector2>,
            number,
          ];
        },
        [line.points()[0], 0] as [SignalValue<PossibleVector2>, number],
      )[1],
  );
}

export function* circleAlongLine(
  parent: Rect,
  line: Line,
  duration: number,
  size: number = 20,
  props?: CircleProps,
) {
  const color = computedFillOppositeExtreme(parent);
  const percent = createSignal(0);
  const length = computedLength(line);
  const offset = createComputed(() => size / 2 / length());
  const position = createComputed(
    () =>
      line.getPointAtPercentage(map(offset(), 1 - offset(), percent()))
        .position,
  );
  const opacity = createSignal(0);
  parent.add(
    <Circle
      fill={color}
      opacity={opacity}
      position={position}
      {...props}
      size={size}
    ></Circle>,
  );
  yield* opacity(1, duration / 8);
  yield* percent(1, (duration / 8) * 7);
  opacity(0);
}

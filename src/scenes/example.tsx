import {makeScene2D, Layout, Rect, Txt} from '@motion-canvas/2d';
import {
  Color,
  Vector2,
  all,
  createRef,
  linear,
  waitFor,
} from '@motion-canvas/core';
import {GraphInit, RGB, createGraph} from '../graph';
import {circleAlongLine} from '../line';
import {computedFillOppositeExtreme, computedOppositeExtreme} from '../color';

const graphInit: {[key: string]: GraphInit} = {
  'node-0': {
    fn: (): RGB => [173, 173, 173],
    position: new Vector2(-500, 0),
    name: 'Value',
  },
  'node-1': {
    position: new Vector2(0, 300),
    name: 'Invert',
    fn: ([[r, g, b], ...rest]: RGB[]): RGB => [255 - r, 255 - g, 255 - b],
    connections: ['node-0'],
  },
  'node-2': {
    position: new Vector2(-200, -200),
    name: 'Pick Red',
    fn: ([[r, g, b], ...rest]: RGB[]): RGB => [r, 0, 0],
    connections: ['node-0'],
  },
  'node-3': {
    position: new Vector2(-400, 200),
    name: 'Value',
    fn: (): RGB => [255, 0, 255],
  },
  'node-4': {
    position: new Vector2(200, -200),
    name: 'Desaturate',
    connections: ['node-2'],
    fn: ([[r, g, b], ...rest]: RGB[]): RGB =>
      new Color(r, g, b).desaturate(255),
  },
  'node-5': {
    position: new Vector2(300, 50),
    name: 'Average',
    connections: ['node-1', 'node-2', 'node-3', 'node-4'],
    fn: (input: RGB[]): RGB => [
      input.reduce((current, [r, g, b]) => current + r, 0) / input.length,
      input.reduce((current, [r, g, b]) => current + g, 0) / input.length,
      input.reduce((current, [r, g, b]) => current + b, 0) / input.length,
    ],
  },
};

export default makeScene2D(function* (view) {
  view.fill('#222');
  const opposite = computedFillOppositeExtreme(view);

  const parentRef = createRef<Rect>();
  view.add(
    <Rect ref={parentRef} size={view.size} fill={view.fill} x={100}></Rect>,
  );
  const parent = parentRef();

  const titleRef = createRef<Txt>();
  view.add(
    <Txt
      ref={titleRef}
      fontFamily={'Montserrat'}
      fontWeight={500}
      fill={opposite}
      y={-450}
    ></Txt>,
  );
  const title = titleRef();
  title.text('1. Set Value');

  const graph = createGraph(graphInit, parentRef());
  yield* waitFor(3);
  yield* graph['node-0'].color('#adff5c', 2);
  yield* graph['node-0'].pulse(2, '#adff5c');

  yield* title.text('2. Recalculate', 2);
  yield* waitFor(2);

  yield* all(
    circleAlongLine(parent, graph['node-1'].connectionRefs['node-0'], 2),
    circleAlongLine(parent, graph['node-2'].connectionRefs['node-0'], 2),
  );

  yield graph['node-1'].calculate(3);
  yield* graph['node-2'].calculate(3);

  yield* title.text('3. Check for Changes', 2);
  yield* waitFor(2);
  yield* graph['node-1'].pulse(3, opposite());

  yield* title.text('4. Recalculate', 2);
  yield* waitFor(2);
  yield* all(
    circleAlongLine(parent, graph['node-5'].connectionRefs['node-1'], 2),
  );
  yield graph['node-5'].calculate(3);

  yield* title.text('5. Check for Changes', 2);
  yield* waitFor(2);
  yield* graph['node-5'].pulse(3, opposite());
  yield* waitFor(3);
  yield* title.text('6. Wait for Changes', 2);
  yield* waitFor(3);

  yield* waitFor(3);
  yield* graph['node-0'].color('#fab000', 2);
  yield graph['node-1'].calculate(2);
  yield* graph['node-2'].calculate(2);
  yield* graph['node-4'].calculate(2);
  yield* graph['node-5'].calculate(2);
  yield* waitFor(3);

  yield* waitFor(3);
  yield* graph['node-0'].color('#000000', 2);
  yield graph['node-1'].calculate(2);
  yield* graph['node-2'].calculate(2);
  yield* graph['node-4'].calculate(2);
  yield* graph['node-5'].calculate(2);
  yield* waitFor(3);

  yield* graph['node-0'].color('#adadad', 2);
  yield graph['node-1'].calculate(2);
  yield* graph['node-2'].calculate(2);
  yield* graph['node-4'].calculate(2);
  yield* graph['node-5'].calculate(2);
  yield* waitFor(3);
  yield* title.text('1. Set Value', 2);
});

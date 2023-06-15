import {Layout, Circle, Txt, Line, Rect} from '@motion-canvas/2d';
import {
  Vector2,
  ColorSignal,
  TimingFunction,
  ThreadGenerator,
  createComputed,
  Color,
  createSignal,
  all,
  easeInCubic,
  easeOutCubic,
  any,
  createRef,
  useLogger,
  makeRef,
  useScene,
  chain,
  PossibleColor,
} from '@motion-canvas/core';
import {
  computedOppositeExtreme,
  computedFillOppositeExtreme as computedOppositeExtremeFill,
} from './color';

export type RGB = [number, number, number];
export type GraphInit = {
  position: Vector2;
  name: string;
  fn?: (params: RGB[] | undefined) => RGB;
  connections?: string[];
  diameter?: number;
};

export type GraphResult = {
  container: Layout;
  circle: Circle;
  text: Txt;
  title: Txt;
  color: ColorSignal<void>;
  connectionRefs: Record<string, Line>;
  calculate: (
    duration: number,
    timingFunction?: TimingFunction,
  ) => ThreadGenerator;
  pulse: (duration: number, color?: PossibleColor) => ThreadGenerator;
} & GraphInit;

export function createGraph<R extends Record<string, GraphInit>>(
  graph: R,
  parent: Rect,
  psuSize: number = 1080,
): Record<keyof R, GraphResult> & {
  $lines: Layout;
  $nodes: Layout;
  $text: Layout;
} {
  const lineLayerRef = createRef<Layout>();
  const nodeLayerRef = createRef<Layout>();
  const textLayerRef = createRef<Layout>();
  parent.add(
    <Layout ref={lineLayerRef} width={'100%'} height={'100%'}></Layout>,
  );
  parent.add(
    <Layout ref={nodeLayerRef} width={'100%'} height={'100%'}></Layout>,
  );
  parent.add(
    <Layout ref={textLayerRef} width={'100%'} height={'100%'}></Layout>,
  );
  const lineLayer = lineLayerRef();
  const nodeLayer = nodeLayerRef();
  const textLayer = textLayerRef();

  // Allow for scale-invariant sizing
  const parentSizeUnit = parent.size.y() / psuSize;

  const invertedParentFillColor = computedOppositeExtremeFill(parent);

  return {
    $lines: lineLayer,
    $nodes: nodeLayer,
    $text: textLayer,
    ...((Object.entries(graph) as [string, GraphInit][]).reduce(
      (found, [id, params]) => {
        const {position, name, fn, connections, diameter} = {
          ...params,
          diameter: 100,
        };
        const parents = new Map<string, GraphResult>(
          connections
            ?.map(id => found[id] && ([id, found[id]] as [string, GraphResult]))
            ?.filter(item => !!item),
        );

        const maybeParents = [...parents.values()];

        const colorCompute = createComputed(() => {
          const parentColors = maybeParents.length
            ? maybeParents.map(parent => parent.color().rgb())
            : ([[0, 0, 0]] as RGB[]);
          // @ts-ignore -- this is allowed by chroma.js spec, but not types (yet)
          return new Color(fn?.(parentColors));
        });
        const color = Color.createSignal(new Color(colorCompute()));
        const shadow = createSignal(0);
        const pulse = (duration: number, providedColor?: PossibleColor) => {
          circle().shadowColor(providedColor ?? colorCompute());
          return shadow(
            parentSizeUnit * 40 * (1.5 - circle().shadowColor().luminance()),
            (duration / 8) * 3,
            easeInCubic,
          )
            .wait((duration / 8) * 2)
            .back((duration / 8) * 3, easeOutCubic);
        };

        const calculate = (duration: number, timingFunction?: TimingFunction) =>
          chain(
            color(colorCompute(), duration / 3, timingFunction),
            pulse((duration * 2) / 3),
          );

        const container = createRef<Layout>();
        const circle = createRef<Circle>();
        const txt = createRef<Txt>();
        const nameRef = createRef<Txt>();

        textLayer.add(
          <Layout
            ref={container}
            position={position}
            direction={'column'}
            layout
          >
            <Circle
              size={diameter * parentSizeUnit}
              ref={circle}
              fill={color}
              strokeFirst={true}
              stroke={invertedParentFillColor}
              lineWidth={diameter / 10}
              shadowBlur={shadow}
              shadowColor={color}
            />
          </Layout>,
        );

        textLayer.add(
          <>
            <Txt
              text={name}
              ref={nameRef}
              position={() =>
                circle()
                  .absolutePosition()
                  .transform(circle().localToWorld().inverse())
                  .add(parent.size().scale(-0.5))
                  .add(parent.position().scale(-1))
                  .addY(parentSizeUnit * diameter * 0.8)
              }
              fontFamily={'Montserrat'}
              fontSize={(diameter * parentSizeUnit) / 5}
              textAlign={'center'}
              width={'100%'}
              fill={invertedParentFillColor}
            ></Txt>
            <Txt
              text={() => color().hex()}
              ref={txt}
              fontFamily={'monospace'}
              fontSize={diameter / 5}
              textAlign={'center'}
              width={(diameter * parentSizeUnit) / 5}
              position={() =>
                circle()
                  .absolutePosition()
                  .transform(circle().localToWorld().inverse())
                  .add(parent.position().scale(-1))
                  .add(parent.size().scale(-0.5))
              }
              fill={computedOppositeExtreme(color)}
            ></Txt>
            ,
          </>,
        );

        const connectionRefs: Record<string, Line> = {};
        if (connections) {
          for (const connectionId of connections) {
            const padding = 0;
            const connection = found[connectionId];
            if (!connection) {
              useLogger().warn(
                `Trying to connect to nonexistent node ${connectionId}. Is it initialized first?`,
              );
              continue;
            }

            const direction = connection.container
              .position()
              .add(container().position().scale(-1));
            const unitDirection = direction.normalized;

            lineLayer.add(
              <Line
                layout={false}
                ref={makeRef(connectionRefs, connectionId)}
                points={() => [
                  connection.circle
                    .absolutePosition()
                    .transform(connection.circle.localToWorld().inverse())
                    .add(
                      unitDirection
                        // 1.1 to account for stroke above = diameter / 10
                        .scale(
                          -(
                            10 * parentSizeUnit +
                            (connection.circle.size.x() * 1.1) / 2
                          ),
                        ),
                    )
                    .add(parent.position().scale(-1))
                    .add(parent.size().scale(-0.5)),
                  circle()
                    .absolutePosition()
                    .transform(connection.circle.localToWorld().inverse())
                    .add(
                      unitDirection
                        // 1.1 to account for stroke above = diameter / 10
                        .scale(
                          10 * parentSizeUnit +
                            (connection.circle.size.x() * 1.1) / 2,
                        ),
                    )
                    .add(parent.position().scale(-1))
                    .add(parent.size().scale(-0.5)),
                ]}
                endArrow={true}
                arrowSize={10}
                stroke={invertedParentFillColor}
                lineWidth={3}
              ></Line>,
            );
          }
        }

        found[id] = {
          container: container(),
          circle: circle(),
          title: nameRef(),
          text: txt(),
          color: color,
          calculate,
          pulse,
          connectionRefs,
          diameter,
          ...params,
        } as GraphResult;
        return found;
      },
      {} as Record<string, GraphResult>,
    ) as Record<keyof R, GraphResult>),
  };
}

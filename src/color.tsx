import {Shape} from '@motion-canvas/2d';
import {Color, createComputed} from '@motion-canvas/core';

export function computedOppositeExtreme(color: () => Color) {
  return createComputed(() => {
    return color()
      .saturate(0)
      .luminance(color().luminance() >= 0.5 ? 0 : 1);
  });
}

export function computedFillOppositeExtreme(
  parent: Shape,
  def = new Color('#000000'),
) {
  const parentColor = () => {
    const parentFill = parent.fill();
    return parentFill instanceof Color ? parentFill : def;
  };
  return computedOppositeExtreme(parentColor);
}

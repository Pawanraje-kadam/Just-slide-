import type { Category, ColorFamily, IconName } from '../types';
import { Icon } from './Icons';

export function CategoryGlyph({
  category,
  size = 'md',
  icon,
  family,
}: {
  category?: Category;
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  family?: ColorFamily;
}) {
  const glyphFamily = family ?? category?.family ?? 'lavender';
  return (
    <span
      className={`glyph glyph--${glyphFamily} glyph--${size}`}
      aria-hidden="true"
    >
      <Icon name={icon ?? category?.icon ?? 'spark'} size={size === 'lg' ? 30 : size === 'sm' ? 16 : 22} />
    </span>
  );
}

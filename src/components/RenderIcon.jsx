import { ICON_MAP } from './iconMap';

export default function RenderIcon({ iconKey, className = "w-4 h-4" }) {
  const IconComponent = ICON_MAP[iconKey];
  if (IconComponent) {
    return <IconComponent className={className} />;
  }
  return <span className={className}>{iconKey || '🔗'}</span>;
}
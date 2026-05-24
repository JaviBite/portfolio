interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  weight?: number;
  fill?: boolean;
}

export function Icon({ name, size = 24, className = "", style = {}, weight = 400, fill = false }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontWeight: weight,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}`,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

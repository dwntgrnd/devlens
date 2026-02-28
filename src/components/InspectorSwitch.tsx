'use client';

interface InspectorSwitchProps {
  checked: boolean;
  onChange: () => void;
  labelOn?: string;
  labelOff?: string;
  compact?: boolean;
}

export function InspectorSwitch({
  checked,
  onChange,
  labelOn = 'Selecting',
  labelOff = 'Select',
  compact = false,
}: InspectorSwitchProps) {
  const trackSize = compact
    ? { width: 28, height: 16 }
    : { width: 36, height: 20 };
  const thumbSize = compact ? 12 : 16;
  const thumbOffset = compact ? 2 : 2;
  const translateX = checked
    ? trackSize.width - thumbSize - thumbOffset * 2
    : 0;

  return (
    <button
      type="button"
      className={`te-switch ${compact ? 'te-switch-compact' : ''} ${checked ? 'te-switch-active' : ''}`}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
    >
      <span
        className="te-switch-track"
        style={{
          width: trackSize.width,
          height: trackSize.height,
          background: checked ? '#89b4fa' : '#313244',
        }}
      >
        <span
          className="te-switch-thumb"
          style={{
            width: thumbSize,
            height: thumbSize,
            transform: `translateX(${translateX}px)`,
          }}
        />
      </span>
      <span
        className="te-switch-label"
        style={{ color: checked ? '#89b4fa' : '#a6adc8' }}
      >
        {checked ? labelOn : labelOff}
      </span>
    </button>
  );
}

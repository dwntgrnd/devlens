import { DevLens } from 'devlens';
import { devlensConfig } from '../../../devlens.config';

export default function DevLensDetachedPage() {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        <DevLens {...devlensConfig} forceEnable />
      </body>
    </html>
  );
}

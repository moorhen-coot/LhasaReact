import { useState, useEffect } from 'react'
import { LhasaComponent } from './Lhasa'
import type { LhasaComponentProps } from './Lhasa'
import type { MainModule } from './types'

export interface LhasaEmbedderProps extends Omit<LhasaComponentProps, 'Lhasa'> {
  /** Base URL where lhasa.js, lhasa.wasm, icons/, and Components-inchikey.ich are served from. */
  assetsBaseUrl?: string;
  /** Custom loading indicator. Defaults to a simple "Loading Lhasa..." div. */
  loadingComponent?: React.ReactNode;
  /** Custom error display. Receives the Error object. */
  errorComponent?: (error: Error) => React.ReactNode;
}

export function LhasaEmbedder({
  assetsBaseUrl = '',
  loadingComponent,
  errorComponent,
  icons_path_prefix,
  data_path_prefix,
  ...lhasaProps
}: LhasaEmbedderProps) {
  const [module, setModule] = useState<MainModule | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const base = assetsBaseUrl
      ? (assetsBaseUrl.endsWith('/') ? assetsBaseUrl : assetsBaseUrl + '/')
      : '';

    const initModule = () => {
      const LhasaFactory = (window as any).Lhasa;
      if (!LhasaFactory) {
        if (!cancelled) {
          setError(new Error('Lhasa factory function not found after loading lhasa.js'));
          setLoading(false);
        }
        return;
      }

      LhasaFactory({
        locateFile: (filename: string) => base + filename,
      })
        .then((mod: MainModule) => {
          if (!cancelled) {
            setModule(mod);
            setLoading(false);
          }
        })
        .catch((e: any) => {
          if (!cancelled) {
            setError(new Error(`Failed to initialize Lhasa WASM module: ${e}`));
            setLoading(false);
          }
        });
    };

    // If the Lhasa global already exists (script was previously loaded), skip script injection
    if ((window as any).Lhasa) {
      initModule();
      return () => { cancelled = true; };
    }

    // Load lhasa.js via script tag injection
    const script = document.createElement('script');
    script.src = base + 'lhasa.js';

    script.onload = () => initModule();
    script.onerror = () => {
      if (!cancelled) {
        setError(new Error(`Failed to load lhasa.js from ${base}lhasa.js`));
        setLoading(false);
      }
    };

    document.head.appendChild(script);

    return () => { cancelled = true; };
  }, [assetsBaseUrl]);

  if (loading) {
    return <>{loadingComponent ?? <div>Loading Lhasa...</div>}</>;
  }

  if (error) {
    return <>{errorComponent ? errorComponent(error) : <div>Error: {error.message}</div>}</>;
  }

  if (!module) {
    return null;
  }

  // Compute default asset paths from assetsBaseUrl unless explicitly overridden
  const base = assetsBaseUrl
    ? (assetsBaseUrl.endsWith('/') ? assetsBaseUrl : assetsBaseUrl + '/')
    : '';
  const resolvedIconsPrefix = icons_path_prefix ?? (base + 'icons');
  const resolvedDataPrefix = data_path_prefix ?? base;

  return (
    <LhasaComponent
      Lhasa={module}
      icons_path_prefix={resolvedIconsPrefix}
      data_path_prefix={resolvedDataPrefix}
      {...lhasaProps}
    />
  );
}

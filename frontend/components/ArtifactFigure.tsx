import { useState } from "react";

import { resolveApiBaseUrl } from "../lib/api";

type ArtifactFigureProps = {
  plotKey: string;
  urlPath: string;
};

export default function ArtifactFigure({ plotKey, urlPath }: ArtifactFigureProps) {
  const [failed, setFailed] = useState(false);
  const base = resolveApiBaseUrl();
  const src = `${base}${urlPath}`;

  if (failed) {
    return (
      <figure className="artifact-card artifact-card--missing" key={plotKey}>
        <div className="artifact-placeholder">
          <span>Plot not generated yet</span>
          <small>{plotKey.replaceAll("_", " ")}</small>
        </div>
        <figcaption>{plotKey.replaceAll("_", " ")}</figcaption>
      </figure>
    );
  }

  return (
    <figure className="artifact-card" key={plotKey}>
      <img
        alt={plotKey}
        className="artifact-image"
        src={src}
        onError={() => setFailed(true)}
      />
      <figcaption>{plotKey.replaceAll("_", " ")}</figcaption>
    </figure>
  );
}

import CMS from "decap-cms-app";
import type { CmsConfig } from "decap-cms-core";
import config from "./config.yml";
import styles from "./main.css";

import { Uuid } from "./widgets/uuid";
// import { YouTube } from "./widgets/editor/youtube";
import { ArticlePreview, ArticlePreviewStyles } from "./preview/article";

export default function init() {
  const useTestBackend = Boolean(process.env.CMS_BACKEND === "test");

  const mutableConfig = config as Record<string, unknown>;
  delete mutableConfig.__constants;

  if (useTestBackend) {
    mutableConfig.backend = { name: "test-repo" };
  }

  CMS.init({ config: mutableConfig as unknown as CmsConfig });
  CMS.registerWidget("uuid", Uuid);
  // CMS.registerEditorComponent(YouTube)
  CMS.registerPreviewTemplate("content", ArticlePreview);
  CMS.registerPreviewStyle(ArticlePreviewStyles.toString(), { raw: true });
}

document.addEventListener("DOMContentLoaded", init);

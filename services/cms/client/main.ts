import CMS from "decap-cms-app";
import type { CmsConfig } from "decap-cms-core";
import config from "./config.yml";
import styles from "./main.css";

import { Uuid } from "./widgets/uuid";
import { ArticlePreview, ArticlePreviewStyles } from "./preview/article";
import { makeColumnsEditorComponent } from "./widgets/editor/columns";
import columnsStyles from "@alexwilson/ds-columns/src/columns.scss";
import { BrokeredGitHubBackend } from "./backends/brokered-github";

export default function init() {
  const useTestBackend = Boolean(process.env.CMS_BACKEND === "test");

  const mutableConfig = config as Record<string, unknown>;
  delete mutableConfig.__constants;

  const locales = (config as { i18n?: { locales?: string[] } }).i18n
    ?.locales ?? ["en"];

  if (useTestBackend) {
    mutableConfig.backend = { name: "test-repo" };
  }

  CMS.registerBackend("github-app", BrokeredGitHubBackend);
  CMS.init({ config: mutableConfig as unknown as CmsConfig });
  CMS.registerWidget("uuid", Uuid);
  CMS.registerEditorComponent(makeColumnsEditorComponent(locales));
  CMS.registerPreviewTemplate("content", ArticlePreview);
  CMS.registerPreviewStyle(ArticlePreviewStyles.toString(), { raw: true });
  CMS.registerPreviewStyle(columnsStyles.toString(), { raw: true });
}

document.addEventListener("DOMContentLoaded", init);

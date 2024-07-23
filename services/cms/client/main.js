import CMS from "decap-cms-app";
import config from "./config.yml";
import styles from "./main.css";

import { Uuid } from "./widgets/uuid.jsx";
// import {YouTube} from "./widgets/editor/youtube.jsx";
//
import { ArticlePreview, ArticlePreviewStyles } from "./preview/article.jsx";

export default function init() {
  const useTestBackend = Boolean(process.env.CMS_BACKEND === "test");

  // Remove constants.
  delete config.__constants;

  if (useTestBackend) {
    config.backend = {
      name: "test-repo",
    };
  }

  CMS.init({ config });
  CMS.registerWidget("uuid", Uuid);
  //CMS.registerEditorComponent(YouTube)
  CMS.registerPreviewTemplate("blog", ArticlePreview);
  CMS.registerPreviewStyle(ArticlePreviewStyles.toString(), { raw: true });
}

document.addEventListener("DOMContentLoaded", init);

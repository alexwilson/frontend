import CMS from 'netlify-cms-app';
import config from './config.yml';

import {Uuid} from "./widgets/uuid";
import {YouTube} from "./widgets/editor/youtube";


export default function init() {
    const useTestBackend = Boolean(process?.env?.CMS_BACKEND?.toLowerCase() === "test")

    // Remove constants.
    delete config.__constants;

    if (useTestBackend) {
        config.backend = {
            name: 'test-repo'
        }
    }

    CMS.init({ config });
    CMS.registerWidget('uuid', Uuid)
    CMS.registerEditorComponent(YouTube)
}

document.addEventListener('DOMContentLoaded', init)
import CMS from 'netlify-cms-app';
import config from './config.yml';

import {Uuid} from "./widgets/uuid";
import {YouTube} from "./widgets/editor/youtube";


function init() {
    const env = process?.env?.NODE_ENV || 'development'
    const useTestBackend = Boolean(process?.env?.CMS_BACKEND?.toLowerCase() === "test")

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

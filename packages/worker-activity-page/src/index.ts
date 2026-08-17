import {renderToString} from "react-dom/server"
import ActivityController from "./controllers/activity"

const renderToDocument = (component: React.ReactElement): string => `<!DOCTYPE html>${renderToString(component)}`


//@ts-ignore
const activityController = new ActivityController(EXISTIO_TOKEN)
self.addEventListener("fetch", (event) => {
  event.respondWith(new Promise(async (resolve) => {

    const result = await activityController.getActivity()
    resolve(new Response(renderToDocument(result.view), {
      status: result.status,
      statusText: "OK",
      headers: {
        'content-type': 'text/html'
      }
    }))

  }));
});


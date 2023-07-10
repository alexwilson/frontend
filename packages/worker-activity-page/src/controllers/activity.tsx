import {ActivityPage} from "../components/activity-page" 
import {ErrorPage} from "../components/error-page"

export default class Activity {

    private _existToken: string;

    constructor(existToken: string) {
        this._existToken = existToken;
    }


    async getActivity() {
        const query = [
            'attributes=events,commits,tweets',
            'limit=31'
        ]

        try {
            const activities = await fetch(`https://exist.io/api/1/users/$self/attributes/?${query.join('&')}`, {
                method: "GET",
                headers: {
                    "Authorization": `Token ${this._existToken}`,
                    "Content-Type": "application/json"
                }
            }).then(res => res.json())
            
            return {
                status: 200,
                view: ActivityPage({ activities })
            }
        } catch(e) {
            return {
                status: 503,
                view: ErrorPage()
            }
        }

    }
}
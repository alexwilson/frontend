import React from "react"

import Layout from "./layout"

export const ActivityPage = ({activities}: any) => {
    return <Layout title="Activity">
        {activities.map((activity: any) => (
            <React.Fragment key={activity.attribute}>
                <h2>{activity.label}</h2>
                <ul>{activity.values.map((value: any) => (
                    <li key={value.date}>{`${value.date}: ${value.value}`}</li>
                ))}</ul>
            </React.Fragment>
        ))}
    </Layout>
}

export default ActivityPage
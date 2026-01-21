import React from "react"

export const Layout = (props: any) => {
    return <html>
        <head>
            <title>{props.title}</title>
        </head>
        <body>{props.children}</body>
    </html>
}
  
export const TestPage = () => {
    return <Layout title="test">
        <div>Activity</div>
    </Layout>
}


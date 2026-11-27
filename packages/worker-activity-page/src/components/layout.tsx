import React from "react"

export const Layout = (props: any) => {
    return <html>
        <head>
            <title>{props.title}</title>
        </head>
        <body>{props.children}</body>
    </html>
}

export default Layout
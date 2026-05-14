import { v4 } from 'uuid';
import React, { Component } from 'react';
import type { CmsWidgetControlProps } from 'decap-cms-core';

export class Uuid extends Component<CmsWidgetControlProps<string>> {
    constructor(props: CmsWidgetControlProps<string>) {
        super(props)
        if (props.value) return
        this.generateUuid()
    }

    componentDidUpdate() {
        if (this.props.value) return
        this.generateUuid()
    }

    generateUuid() {
        this.props.onChange(v4())
    }

    render() {
        const { forID, classNameWrapper, value } = this.props;
        return (
            <div className={classNameWrapper}>
                <input type="hidden" id={forID} value={value} />
                <code>{value}</code>
            </div>
        );
    }
}
import { v4 } from 'uuid';
import React, {Component} from 'react';

export class Uuid extends Component {
    constructor(props) {
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
                <tt>{value}</tt>
            </div>
        );
    }
}
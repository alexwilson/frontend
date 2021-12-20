import React, {Component} from 'react'

export default class Footer extends Component {
  render() {
    return (
      <footer className="footer">
        <div className="container align-center">
            <span className="text-muted">
            &copy; Alex Wilson {new Date().getFullYear()}
            </span>
        </div>
      </footer>
    )
  }
}

export class ConsultFooter extends Footer {
  render() {
    return (
      <footer className="consultancy-footer">
        <div>
          &copy; Alex Labs Ltd 2019-{new Date().getFullYear()} • Alex Labs Ltd is a company registered in England and Wales • Registered number: 11828775 • VAT registration number: GB319351212
        </div>
      </footer>
    )
  }
}


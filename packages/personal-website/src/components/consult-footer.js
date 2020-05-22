import React from 'react'

import Footer from './footer'

class ConsultFooter extends Footer {
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

export default ConsultFooter

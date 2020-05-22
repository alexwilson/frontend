import React, {Component} from 'react'

class Footer extends Component {
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

export default Footer

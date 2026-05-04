import React from 'react';

const Link = React.forwardRef(({ to, children, ...props }, ref) => (
  <a href={to} ref={ref} {...props}>
    {children}
  </a>
));

Link.displayName = 'Link';

export { Link };

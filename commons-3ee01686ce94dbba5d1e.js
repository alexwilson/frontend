(self.webpackChunk_alexwilson_personal_website=self.webpackChunk_alexwilson_personal_website||[]).push([[351],{8746:function(t,e,n){"use strict";var r=n(5318);e.__esModule=!0,e.navigate=e.default=void 0,e.withAssetPrefix=function(t){return v(t,m())},e.withPrefix=v;var o=r(n(7316)),a=r(n(1506)),i=r(n(5354)),u=r(n(7154)),c=r(n(3950)),s=r(n(7294)),l=n(5951),f=n(166);e.parsePath=f.parsePath;var h=n(1280),p=n(3772),d=["to","getProps","onClick","onMouseEnter","activeClassName","activeStyle","innerRef","partiallyActive","state","replace","_location"];function v(t,e){var n,r;if(void 0===e&&(e=g()),!(0,h.isLocalLink)(t))return t;if(t.startsWith("./")||t.startsWith("../"))return t;var o=null!==(n=null!==(r=e)&&void 0!==r?r:m())&&void 0!==n?n:"/";return""+(null!=o&&o.endsWith("/")?o.slice(0,-1):o)+(t.startsWith("/")?t:"/"+t)}var m=function(){return""},g=function(){return""};var y={activeClassName:c.default.string,activeStyle:c.default.object,partiallyActive:c.default.bool};function w(t){return s.default.createElement(l.Location,null,(function(e){var n=e.location;return s.default.createElement(b,(0,u.default)({},t,{_location:n}))}))}var b=function(t){function e(e){var n;(n=t.call(this,e)||this).defaultGetProps=function(t){var e=t.isPartiallyCurrent,r=t.isCurrent;return(n.props.partiallyActive?e:r)?{className:[n.props.className,n.props.activeClassName].filter(Boolean).join(" "),style:(0,u.default)({},n.props.style,n.props.activeStyle)}:null};var r=!1;return"undefined"!=typeof window&&window.IntersectionObserver&&(r=!0),n.state={IOSupported:r},n.abortPrefetch=null,n.handleRef=n.handleRef.bind((0,a.default)(n)),n}(0,i.default)(e,t);var n=e.prototype;return n._prefetch=function(){var t=window.location.pathname+window.location.search;this.props._location&&this.props._location.pathname&&(t=this.props._location.pathname+this.props._location.search);var e=(0,p.rewriteLinkPath)(this.props.to,t),n=(0,f.parsePath)(e),r=n.pathname+n.search;if(t!==r)return ___loader.enqueue(r)},n.componentWillUnmount=function(){if(this.io){var t=this.io,e=t.instance,n=t.el;this.abortPrefetch&&this.abortPrefetch.abort(),e.unobserve(n),e.disconnect()}},n.handleRef=function(t){var e,n,r,o=this;this.props.innerRef&&Object.prototype.hasOwnProperty.call(this.props.innerRef,"current")?this.props.innerRef.current=t:this.props.innerRef&&this.props.innerRef(t),this.state.IOSupported&&t&&(this.io=(e=t,n=function(t){t?o.abortPrefetch=o._prefetch():o.abortPrefetch&&o.abortPrefetch.abort()},(r=new window.IntersectionObserver((function(t){t.forEach((function(t){e===t.target&&n(t.isIntersecting||t.intersectionRatio>0)}))}))).observe(e),{instance:r,el:e}))},n.render=function(){var t=this,e=this.props,n=e.to,r=e.getProps,a=void 0===r?this.defaultGetProps:r,i=e.onClick,c=e.onMouseEnter,v=(e.activeClassName,e.activeStyle,e.innerRef,e.partiallyActive,e.state),m=e.replace,g=e._location,y=(0,o.default)(e,d);var w=(0,p.rewriteLinkPath)(n,g.pathname);return(0,h.isLocalLink)(w)?s.default.createElement(l.Link,(0,u.default)({to:w,state:v,getProps:a,innerRef:this.handleRef,onMouseEnter:function(t){c&&c(t);var e=(0,f.parsePath)(w);___loader.hovering(e.pathname+e.search)},onClick:function(e){if(i&&i(e),!(0!==e.button||t.props.target||e.defaultPrevented||e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)){e.preventDefault();var n=m,r=encodeURI(w)===g.pathname;"boolean"!=typeof m&&r&&(n=!0),window.___navigate(w,{state:v,replace:n})}return!0}},y)):s.default.createElement("a",(0,u.default)({href:w},y))},e}(s.default.Component);b.propTypes=(0,u.default)({},y,{onClick:c.default.func,to:c.default.string.isRequired,replace:c.default.bool,state:c.default.object});var E=s.default.forwardRef((function(t,e){return s.default.createElement(w,(0,u.default)({innerRef:e},t))}));e.default=E;e.navigate=function(t,e){window.___navigate((0,p.rewriteLinkPath)(t,window.location.pathname),e)}},1280:function(t,e){"use strict";e.__esModule=!0,e.isLocalLink=void 0;var n=/^[a-zA-Z][a-zA-Z\d+\-.]*?:/;e.isLocalLink=function(t){if("string"==typeof t)return!function(t){return n.test(t)}(t)}},166:function(t,e){"use strict";e.__esModule=!0,e.parsePath=function(t){var e=t||"/",n="",r="",o=e.indexOf("#");-1!==o&&(r=e.slice(o),e=e.slice(0,o));var a=e.indexOf("?");-1!==a&&(n=e.slice(a),e=e.slice(0,a));return{pathname:e,search:"?"===n?"":n,hash:"#"===r?"":r}}},3772:function(t,e,n){"use strict";e.__esModule=!0,e.rewriteLinkPath=void 0;var r=n(7005),o=n(883),a=n(166),i=n(1280),u=n(8746),c=function(t){return null==t?void 0:t.startsWith("/")},s=function(){return"undefined"!=typeof __TRAILING_SLASH__?__TRAILING_SLASH__:void 0};e.rewriteLinkPath=function(t,e){if("number"==typeof t)return t;if(!(0,i.isLocalLink)(t))return t;var n=(0,a.parsePath)(t),l=n.pathname,f=n.search,h=n.hash,p=s(),d=t;"always"!==p&&"never"!==p||(d=""+(0,o.applyTrailingSlashOption)(l,p)+f+h);return c(d)?(0,u.withPrefix)(d):function(t,e){if(c(t))return t;var n=s(),a=(0,r.resolve)(t,e);return"always"===n||"never"===n?(0,o.applyTrailingSlashOption)(a,n):a}(d,e)}},2277:function(t){"use strict";t.exports=function(t,e,n,r,o,a,i,u){if(!t){var c;if(void 0===e)c=new Error("Minified exception occurred; use the non-minified dev environment for the full error message and additional helpful warnings.");else{var s=[n,r,o,a,i,u],l=0;(c=new Error(e.replace(/%s/g,(function(){return s[l++]})))).name="Invariant Violation"}throw c.framesToPop=1,c}}},7757:function(t,e,n){t.exports=n(5666)},5951:function(t,e,n){"use strict";n.r(e),n.d(e,{Link:function(){return Y},Location:function(){return A},LocationProvider:function(){return M},Match:function(){return X},Redirect:function(){return Q},Router:function(){return F},ServerLocation:function(){return T},createHistory:function(){return x},createMemorySource:function(){return _},globalHistory:function(){return L},isRedirect:function(){return V},matchPath:function(){return s},navigate:function(){return k},redirectTo:function(){return z},useLocation:function(){return tt},useMatch:function(){return rt},useNavigate:function(){return et},useParams:function(){return nt}});var r=n(7294),o=n(2277),a=n.n(o),i=n(3639),u=function(t,e){return t.substr(0,e.length)===e},c=function(t,e){for(var n=void 0,r=void 0,o=e.split("?")[0],i=g(o),u=""===i[0],c=m(t),s=0,l=c.length;s<l;s++){var f=!1,p=c[s].route;if(p.default)r={route:p,params:{},uri:e};else{for(var v=g(p.path),y={},b=Math.max(i.length,v.length),E=0;E<b;E++){var x=v[E],_=i[E];if(d(x)){y[x.slice(1)||"*"]=i.slice(E).map(decodeURIComponent).join("/");break}if(void 0===_){f=!0;break}var P=h.exec(x);if(P&&!u){-1===w.indexOf(P[1])||a()(!1);var L=decodeURIComponent(_);y[P[1]]=L}else if(x!==_){f=!0;break}}if(!f){n={route:p,params:y,uri:"/"+i.slice(0,E).join("/")};break}}}return n||r||null},s=function(t,e){return c([{path:t}],e)},l=function(t,e){if(u(t,"/"))return t;var n=t.split("?"),r=n[0],o=n[1],a=e.split("?")[0],i=g(r),c=g(a);if(""===i[0])return y(a,o);if(!u(i[0],".")){var s=c.concat(i).join("/");return y(("/"===a?"":"/")+s,o)}for(var l=c.concat(i),f=[],h=0,p=l.length;h<p;h++){var d=l[h];".."===d?f.pop():"."!==d&&f.push(d)}return y("/"+f.join("/"),o)},f=function(t,e){var n=t.split("?"),r=n[0],o=n[1],a=void 0===o?"":o,i="/"+g(r).map((function(t){var n=h.exec(t);return n?e[n[1]]:t})).join("/"),u=e.location,c=(u=void 0===u?{}:u).search,s=(void 0===c?"":c).split("?")[1]||"";return i=y(i,a,s)},h=/^:(.+)/,p=function(t){return h.test(t)},d=function(t){return t&&"*"===t[0]},v=function(t,e){return{route:t,score:t.default?0:g(t.path).reduce((function(t,e){return t+=4,!function(t){return""===t}(e)?p(e)?t+=2:d(e)?t-=5:t+=3:t+=1,t}),0),index:e}},m=function(t){return t.map(v).sort((function(t,e){return t.score<e.score?1:t.score>e.score?-1:t.index-e.index}))},g=function(t){return t.replace(/(^\/+|\/+$)/g,"").split("/")},y=function(t){for(var e=arguments.length,n=Array(e>1?e-1:0),r=1;r<e;r++)n[r-1]=arguments[r];return t+((n=n.filter((function(t){return t&&t.length>0})))&&n.length>0?"?"+n.join("&"):"")},w=["uri","path"],b=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t},E=function(t){var e=t.location,n=e.search,r=e.hash,o=e.href,a=e.origin,i=e.protocol,u=e.host,c=e.hostname,s=e.port,l=t.location.pathname;!l&&o&&P&&(l=new URL(o).pathname);return{pathname:encodeURI(decodeURI(l)),search:n,hash:r,href:o,origin:a,protocol:i,host:u,hostname:c,port:s,state:t.history.state,key:t.history.state&&t.history.state.key||"initial"}},x=function(t,e){var n=[],r=E(t),o=!1,a=function(){};return{get location(){return r},get transitioning(){return o},_onTransitionComplete:function(){o=!1,a()},listen:function(e){n.push(e);var o=function(){r=E(t),e({location:r,action:"POP"})};return t.addEventListener("popstate",o),function(){t.removeEventListener("popstate",o),n=n.filter((function(t){return t!==e}))}},navigate:function(e){var i=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},u=i.state,c=i.replace,s=void 0!==c&&c;if("number"==typeof e)t.history.go(e);else{u=b({},u,{key:Date.now()+""});try{o||s?t.history.replaceState(u,null,e):t.history.pushState(u,null,e)}catch(f){t.location[s?"replace":"assign"](e)}}r=E(t),o=!0;var l=new Promise((function(t){return a=t}));return n.forEach((function(t){return t({location:r,action:"PUSH"})})),l}}},_=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"/",e=t.indexOf("?"),n={pathname:e>-1?t.substr(0,e):t,search:e>-1?t.substr(e):""},r=0,o=[n],a=[null];return{get location(){return o[r]},addEventListener:function(t,e){},removeEventListener:function(t,e){},history:{get entries(){return o},get index(){return r},get state(){return a[r]},pushState:function(t,e,n){var i=n.split("?"),u=i[0],c=i[1],s=void 0===c?"":c;r++,o.push({pathname:u,search:s.length?"?"+s:s}),a.push(t)},replaceState:function(t,e,n){var i=n.split("?"),u=i[0],c=i[1],s=void 0===c?"":c;o[r]={pathname:u,search:s},a[r]=t},go:function(t){var e=r+t;e<0||e>a.length-1||(r=e)}}}},P=!("undefined"==typeof window||!window.document||!window.document.createElement),L=x(P?window:_()),k=L.navigate,C=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var n=arguments[e];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(t[r]=n[r])}return t};function O(t,e){var n={};for(var r in t)e.indexOf(r)>=0||Object.prototype.hasOwnProperty.call(t,r)&&(n[r]=t[r]);return n}function R(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function j(t,e){if(!t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return!e||"object"!=typeof e&&"function"!=typeof e?t:e}function I(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function, not "+typeof e);t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),e&&(Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e)}var N=function(t,e){var n=(0,r.createContext)(e);return n.displayName=t,n},S=N("Location"),A=function(t){var e=t.children;return r.createElement(S.Consumer,null,(function(t){return t?e(t):r.createElement(M,null,e)}))},M=function(t){function e(){var n,r;R(this,e);for(var o=arguments.length,a=Array(o),i=0;i<o;i++)a[i]=arguments[i];return n=r=j(this,t.call.apply(t,[this].concat(a))),r.state={context:r.getContext(),refs:{unlisten:null}},j(r,n)}return I(e,t),e.prototype.getContext=function(){var t=this.props.history;return{navigate:t.navigate,location:t.location}},e.prototype.componentDidCatch=function(t,e){if(!V(t))throw t;(0,this.props.history.navigate)(t.uri,{replace:!0})},e.prototype.componentDidUpdate=function(t,e){e.context.location!==this.state.context.location&&this.props.history._onTransitionComplete()},e.prototype.componentDidMount=function(){var t=this,e=this.state.refs,n=this.props.history;n._onTransitionComplete(),e.unlisten=n.listen((function(){Promise.resolve().then((function(){requestAnimationFrame((function(){t.unmounted||t.setState((function(){return{context:t.getContext()}}))}))}))}))},e.prototype.componentWillUnmount=function(){var t=this.state.refs;this.unmounted=!0,t.unlisten()},e.prototype.render=function(){var t=this.state.context,e=this.props.children;return r.createElement(S.Provider,{value:t},"function"==typeof e?e(t):e||null)},e}(r.Component);M.defaultProps={history:L};var T=function(t){var e=t.url,n=t.children,o=e.indexOf("?"),a=void 0,i="";return o>-1?(a=e.substring(0,o),i=e.substring(o)):a=e,r.createElement(S.Provider,{value:{location:{pathname:a,search:i,hash:""},navigate:function(){throw new Error("You can't call navigate on the server.")}}},n)},W=N("Base",{baseuri:"/",basepath:"/",navigate:L.navigate}),F=function(t){return r.createElement(W.Consumer,null,(function(e){return r.createElement(A,null,(function(n){return r.createElement(U,C({},e,n,t))}))}))},U=function(t){function e(){return R(this,e),j(this,t.apply(this,arguments))}return I(e,t),e.prototype.render=function(){var t=this.props,e=t.location,n=t.navigate,o=t.basepath,a=t.primary,i=t.children,u=(t.baseuri,t.component),s=void 0===u?"div":u,f=O(t,["location","navigate","basepath","primary","children","baseuri","component"]),h=r.Children.toArray(i).reduce((function(t,e){var n=at(o)(e);return t.concat(n)}),[]),p=e.pathname,d=c(h,p);if(d){var v=d.params,m=d.uri,g=d.route,y=d.route.value;o=g.default?o:g.path.replace(/\*$/,"");var w=C({},v,{uri:m,location:e,navigate:function(t,e){return n(l(t,m),e)}}),b=r.cloneElement(y,w,y.props.children?r.createElement(F,{location:e,primary:a},y.props.children):void 0),E=a?D:s,x=a?C({uri:m,location:e,component:s},f):f;return r.createElement(W.Provider,{value:{baseuri:m,basepath:o,navigate:w.navigate}},r.createElement(E,x,b))}return null},e}(r.PureComponent);U.defaultProps={primary:!0};var Z=N("Focus"),D=function(t){var e=t.uri,n=t.location,o=t.component,a=O(t,["uri","location","component"]);return r.createElement(Z.Consumer,null,(function(t){return r.createElement(q,C({},a,{component:o,requestFocus:t,uri:e,location:n}))}))},G=!0,H=0,q=function(t){function e(){var n,r;R(this,e);for(var o=arguments.length,a=Array(o),i=0;i<o;i++)a[i]=arguments[i];return n=r=j(this,t.call.apply(t,[this].concat(a))),r.state={},r.requestFocus=function(t){!r.state.shouldFocus&&t&&t.focus()},j(r,n)}return I(e,t),e.getDerivedStateFromProps=function(t,e){if(null==e.uri)return C({shouldFocus:!0},t);var n=t.uri!==e.uri,r=e.location.pathname!==t.location.pathname&&t.location.pathname===t.uri;return C({shouldFocus:n||r},t)},e.prototype.componentDidMount=function(){H++,this.focus()},e.prototype.componentWillUnmount=function(){0===--H&&(G=!0)},e.prototype.componentDidUpdate=function(t,e){t.location!==this.props.location&&this.state.shouldFocus&&this.focus()},e.prototype.focus=function(){var t=this.props.requestFocus;t?t(this.node):G?G=!1:this.node&&(this.node.contains(document.activeElement)||this.node.focus())},e.prototype.render=function(){var t=this,e=this.props,n=(e.children,e.style),o=(e.requestFocus,e.component),a=void 0===o?"div":o,i=(e.uri,e.location,O(e,["children","style","requestFocus","component","uri","location"]));return r.createElement(a,C({style:C({outline:"none"},n),tabIndex:"-1",ref:function(e){return t.node=e}},i),r.createElement(Z.Provider,{value:this.requestFocus},this.props.children))},e}(r.Component);(0,i.O)(q);var K=function(){},B=r.forwardRef;void 0===B&&(B=function(t){return t});var Y=B((function(t,e){var n=t.innerRef,o=O(t,["innerRef"]);return r.createElement(W.Consumer,null,(function(t){t.basepath;var a=t.baseuri;return r.createElement(A,null,(function(t){var i=t.location,c=t.navigate,s=o.to,f=o.state,h=o.replace,p=o.getProps,d=void 0===p?K:p,v=O(o,["to","state","replace","getProps"]),m=l(s,a),g=encodeURI(m),y=i.pathname===g,w=u(i.pathname,g);return r.createElement("a",C({ref:e||n,"aria-current":y?"page":void 0},v,d({isCurrent:y,isPartiallyCurrent:w,href:m,location:i}),{href:m,onClick:function(t){if(v.onClick&&v.onClick(t),it(t)){t.preventDefault();var e=h;if("boolean"!=typeof h&&y){var n=C({},i.state),r=(n.key,O(n,["key"]));o=C({},f),a=r,e=(u=Object.keys(o)).length===Object.keys(a).length&&u.every((function(t){return a.hasOwnProperty(t)&&o[t]===a[t]}))}c(m,{state:f,replace:e})}var o,a,u}}))}))}))}));function $(t){this.uri=t}Y.displayName="Link";var V=function(t){return t instanceof $},z=function(t){throw new $(t)},J=function(t){function e(){return R(this,e),j(this,t.apply(this,arguments))}return I(e,t),e.prototype.componentDidMount=function(){var t=this.props,e=t.navigate,n=t.to,r=(t.from,t.replace),o=void 0===r||r,a=t.state,i=(t.noThrow,t.baseuri),u=O(t,["navigate","to","from","replace","state","noThrow","baseuri"]);Promise.resolve().then((function(){var t=l(n,i);e(f(t,u),{replace:o,state:a})}))},e.prototype.render=function(){var t=this.props,e=(t.navigate,t.to),n=(t.from,t.replace,t.state,t.noThrow),r=t.baseuri,o=O(t,["navigate","to","from","replace","state","noThrow","baseuri"]),a=l(e,r);return n||z(f(a,o)),null},e}(r.Component),Q=function(t){return r.createElement(W.Consumer,null,(function(e){var n=e.baseuri;return r.createElement(A,null,(function(e){return r.createElement(J,C({},e,{baseuri:n},t))}))}))},X=function(t){var e=t.path,n=t.children;return r.createElement(W.Consumer,null,(function(t){var o=t.baseuri;return r.createElement(A,null,(function(t){var r=t.navigate,a=t.location,i=l(e,o),u=s(i,a.pathname);return n({navigate:r,location:a,match:u?C({},u.params,{uri:u.uri,path:e}):null})}))}))},tt=function(){var t=(0,r.useContext)(S);if(!t)throw new Error("useLocation hook was used but a LocationContext.Provider was not found in the parent tree. Make sure this is used in a component that is a child of Router");return t.location},et=function(){var t=(0,r.useContext)(W);if(!t)throw new Error("useNavigate hook was used but a BaseContext.Provider was not found in the parent tree. Make sure this is used in a component that is a child of Router");return t.navigate},nt=function(){var t=(0,r.useContext)(W);if(!t)throw new Error("useParams hook was used but a LocationContext.Provider was not found in the parent tree. Make sure this is used in a component that is a child of Router");var e=tt(),n=s(t.basepath,e.pathname);return n?n.params:null},rt=function(t){if(!t)throw new Error("useMatch(path: string) requires an argument of a string to match against");var e=(0,r.useContext)(W);if(!e)throw new Error("useMatch hook was used but a LocationContext.Provider was not found in the parent tree. Make sure this is used in a component that is a child of Router");var n=tt(),o=l(t,e.baseuri),a=s(o,n.pathname);return a?C({},a.params,{uri:a.uri,path:t}):null},ot=function(t){return t.replace(/(^\/+|\/+$)/g,"")},at=function t(e){return function(n){if(!n)return null;if(n.type===r.Fragment&&n.props.children)return r.Children.map(n.props.children,t(e));var o,i,u;if(n.props.path||n.props.default||n.type===Q||a()(!1),n.type!==Q||n.props.from&&n.props.to||a()(!1),n.type===Q&&(o=n.props.from,i=n.props.to,u=function(t){return p(t)},g(o).filter(u).sort().join("/")!==g(i).filter(u).sort().join("/"))&&a()(!1),n.props.default)return{value:n,default:!0};var c=n.type===Q?n.props.from:n.props.path,s="/"===c?e:ot(e)+"/"+ot(c);return{value:n,default:n.props.default,path:n.props.children?ot(s)+"/*":s}}},it=function(t){return!t.defaultPrevented&&0===t.button&&!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey)}},7005:function(t,e,n){"use strict";e.__esModule=!0,e.shallowCompare=e.validateRedirect=e.insertParams=e.resolve=e.match=e.pick=e.startsWith=void 0;var r,o=n(2277),a=(r=o)&&r.__esModule?r:{default:r};var i=function(t,e){return t.substr(0,e.length)===e},u=function(t,e){for(var n=void 0,r=void 0,o=e.split("?")[0],i=p(o),u=""===i[0],s=h(t),f=0,d=s.length;f<d;f++){var m=!1,g=s[f].route;if(g.default)r={route:g,params:{},uri:e};else{for(var y=p(g.path),w={},b=Math.max(i.length,y.length),E=0;E<b;E++){var x=y[E],_=i[E];if(l(x)){w[x.slice(1)||"*"]=i.slice(E).map(decodeURIComponent).join("/");break}if(void 0===_){m=!0;break}var P=c.exec(x);if(P&&!u){-1===v.indexOf(P[1])||(0,a.default)(!1);var L=decodeURIComponent(_);w[P[1]]=L}else if(x!==_){m=!0;break}}if(!m){n={route:g,params:w,uri:"/"+i.slice(0,E).join("/")};break}}}return n||r||null},c=/^:(.+)/,s=function(t){return c.test(t)},l=function(t){return t&&"*"===t[0]},f=function(t,e){return{route:t,score:t.default?0:p(t.path).reduce((function(t,e){return t+=4,!function(t){return""===t}(e)?s(e)?t+=2:l(e)?t-=5:t+=3:t+=1,t}),0),index:e}},h=function(t){return t.map(f).sort((function(t,e){return t.score<e.score?1:t.score>e.score?-1:t.index-e.index}))},p=function(t){return t.replace(/(^\/+|\/+$)/g,"").split("/")},d=function(t){for(var e=arguments.length,n=Array(e>1?e-1:0),r=1;r<e;r++)n[r-1]=arguments[r];return t+((n=n.filter((function(t){return t&&t.length>0})))&&n.length>0?"?"+n.join("&"):"")},v=["uri","path"];e.startsWith=i,e.pick=u,e.match=function(t,e){return u([{path:t}],e)},e.resolve=function(t,e){if(i(t,"/"))return t;var n=t.split("?"),r=n[0],o=n[1],a=e.split("?")[0],u=p(r),c=p(a);if(""===u[0])return d(a,o);if(!i(u[0],".")){var s=c.concat(u).join("/");return d(("/"===a?"":"/")+s,o)}for(var l=c.concat(u),f=[],h=0,v=l.length;h<v;h++){var m=l[h];".."===m?f.pop():"."!==m&&f.push(m)}return d("/"+f.join("/"),o)},e.insertParams=function(t,e){var n=t.split("?"),r=n[0],o=n[1],a=void 0===o?"":o,i="/"+p(r).map((function(t){var n=c.exec(t);return n?e[n[1]]:t})).join("/"),u=e.location,s=(u=void 0===u?{}:u).search,l=(void 0===s?"":s).split("?")[1]||"";return i=d(i,a,l)},e.validateRedirect=function(t,e){var n=function(t){return s(t)};return p(t).filter(n).sort().join("/")===p(e).filter(n).sort().join("/")},e.shallowCompare=function(t,e){var n=Object.keys(t);return n.length===Object.keys(e).length&&n.every((function(n){return e.hasOwnProperty(n)&&t[n]===e[n]}))}},883:function(t,e){"use strict";e.__esModule=!0,e.applyTrailingSlashOption=void 0;e.applyTrailingSlashOption=function(t,e){void 0===e&&(e="legacy");var n=t.endsWith(".html"),r=t.endsWith(".xml"),o=t.endsWith(".pdf");return"/"===t?t:((n||r||o)&&(e="never"),"always"===e?t.endsWith("/")?t:t+"/":"never"===e&&t.endsWith("/")?t.slice(0,-1):t)}},5628:function(t,e,n){"use strict";t.exports=n.g.fetch},2679:function(t,e,n){"use strict";n.d(e,{DE:function(){return i},ZP:function(){return u}});var r=n(1721),o=n(7294),a=function(t){function e(){return t.apply(this,arguments)||this}return(0,r.Z)(e,t),e.prototype.render=function(){return o.createElement("footer",{className:"footer"},o.createElement("div",{className:"container align-center"},o.createElement("span",{className:"text-muted"},"© Alex Wilson ",(new Date).getFullYear())))},e}(o.Component),i=function(t){function e(){return t.apply(this,arguments)||this}return(0,r.Z)(e,t),e.prototype.render=function(){return o.createElement("footer",{className:"consultancy-footer"},o.createElement("div",null,"© Alex Labs Ltd 2019-",(new Date).getFullYear()," • Alex Labs Ltd is a company registered in England and Wales • Registered number: 11828775 • VAT registration number: GB319351212"))},e}(a),u=a},511:function(t,e,n){"use strict";n.d(e,{Z:function(){return y}});var r=n(5861),o=n(1721),a=n(7757),i=n.n(a),u=n(8746),c=n(7294),s=function(t){var e=t instanceof HTMLImageElement||t instanceof Image,n=e?t:new Image;return e||(n.src=t),new Promise((function(e,r){n.addEventListener("load",(function(n){return e(t)})),n.addEventListener("error",r),n.complete&&e(t)}))},l=n(5628),f=n.n(l),h=function(t){var e=t.url,n=t.children,r=t.rel;return/^(https?:)?\/\//.test(e)?c.createElement("a",{rel:r,href:e},n):c.createElement(u.default,{to:e},n)},p=function(t){var e=t.url,n=t.rel,r=t.active,o=t.children;return c.createElement("li",{className:"alex-header__nav-item "+(r?"alex-header__nav-item--active":null)},c.createElement(h,{rel:n,url:e},o))},d=function(){return c.createElement("li",{className:"alex-header__nav-item alex-header__nav-item--spacer"})},v=function(t){var e=t.src,n=t.title;return c.createElement("img",{src:e,alt:n,className:"large",height:"1em"})},m=function(t){function e(e){var n;return(n=t.call(this,e)||this).state={preloadedImage:void 0},n}(0,o.Z)(e,t);var n=e.prototype;return n.preloadImage=function(t){var e=this,n=this.imageService(this.props.src,["quality=high","format=jpg","width=1920"]);s(new Image(n)).then((function(){return e.setState({preloadedImage:n})})).catch((function(){}))},n.imageService=function(t,e){return void 0===e&&(e=[]),"https://imagecdn.app/v2/image/"+encodeURIComponent(t)+"?"+e.join("&")},n.render=function(){var t=this.props.src;return c.createElement("div",{className:"alex-header-image"},c.createElement("picture",{className:"alex-header-image--container"},c.createElement("img",{alt:"Header",className:"alex-header-image__blur",onLoad:this.preloadImage.bind(this,t),src:null!==t?this.imageService(t,["width=100","height=60","quality=low","format=jpg"]):null}),c.createElement("img",{alt:"Header",className:"alex-header-image__main",src:this.state.preloadedImage,style:{opacity:void 0!==this.state.preloadedImage?1:0}})))},e}(c.Component),g=function(t){function e(e){var n;return(n=t.call(this,e)||this).header=c.createRef(),n.headerNav=c.createRef(),n.state={backgroundImage:e.image,backgroundImageLoaded:!1},n}(0,o.Z)(e,t);var n=e.prototype;return n.componentDidMount=function(){this.header.current.style.top="-"+(this.header.current.offsetHeight-this.headerNav.current.offsetHeight)+"px",this.header.current.style.position="sticky",this.state.backgroundImage&&null!==this.state.backgroundImage||this.fetchRandomImage()},n.fetchRandomImage=function(){var t=(0,r.Z)(i().mark((function t(){var e,n,r,o;return i().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,f()("https://source.unsplash.com/collection/33719360/0x0");case 3:(e=t.sent).ok&&e.url&&(n=new URL(e.url),r=n.origin,o=n.pathname,this.setState({backgroundImage:""+r+o})),t.next=9;break;case 7:t.prev=7,t.t0=t.catch(0);case 9:case"end":return t.stop()}}),t,this,[[0,7]])})));return function(){return t.apply(this,arguments)}}(),n.render=function(){var t=this.props.location.pathname,e=this.props.name?this.props.name:"Alex Wilson",n=this.props.intro?this.props.intro:"Software Engineer, Technical Architect — Helping build a better, faster internet.";return c.createElement("header",{role:"banner",className:"alex-header",ref:this.header},c.createElement(m,{src:this.state.backgroundImage}),c.createElement("div",{className:"alex-header--container"},c.createElement("div",{className:"alex-header__about"},c.createElement("h1",{className:"alex-header__name"},e),c.createElement("span",{className:"alex-header__intro"},n)),c.createElement("nav",null,c.createElement("ul",{className:"alex-header__nav",id:"menu",ref:this.headerNav},c.createElement(p,{url:"/",active:"/"===t},"Home"),c.createElement(p,{url:"/about-me/",active:t.startsWith("/about-me/")},"About Me"),c.createElement(p,{url:"/blog/",active:t.startsWith("/blog/")},"Blog"),c.createElement(p,{url:"/talks/",active:t.startsWith("/talks/")},"Talks"),c.createElement(p,{url:"/consultancy/",active:t.startsWith("/consultancy/")},"Hire Me"),c.createElement(d,null),c.createElement(p,{url:"https://twitter.com/AlexWilsonV1",rel:"me"},c.createElement(v,{src:"/svg/twitter.svg",title:"Twitter"})),c.createElement(p,{url:"https://www.linkedin.com/in/alex-/",rel:"me"},c.createElement(v,{src:"/svg/linkedin.svg",title:"LinkedIn"})),c.createElement(p,{url:"https://github.com/alexwilson",rel:"me"},c.createElement(v,{src:"/svg/github.svg",title:"Github"}))))))},e}(c.Component);g.defaultProps={siteTitle:"Alex Wilson",image:null};var y=g},7198:function(t,e,n){"use strict";var r=n(7294),o=n(511),a=n(2679);e.Z=function(t){var e=t.location,n=t.children,i=r.createElement(o.Z,{location:e}),u=r.createElement(a.ZP,null),c=r.Children.toArray(n).filter((function(t){return t.type===o.Z||o.Z.isPrototypeOf(t.type)?(i=t,!1):t.type!==a.ZP&&!a.ZP.isPrototypeOf(t.type)||(u=t,!1)}));return r.createElement(r.Fragment,null,i,r.createElement("main",null,c),u)}},5666:function(t){var e=function(t){"use strict";var e,n=Object.prototype,r=n.hasOwnProperty,o="function"==typeof Symbol?Symbol:{},a=o.iterator||"@@iterator",i=o.asyncIterator||"@@asyncIterator",u=o.toStringTag||"@@toStringTag";function c(t,e,n){return Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{c({},"")}catch(I){c=function(t,e,n){return t[e]=n}}function s(t,e,n,r){var o=e&&e.prototype instanceof m?e:m,a=Object.create(o.prototype),i=new O(r||[]);return a._invoke=function(t,e,n){var r=f;return function(o,a){if(r===p)throw new Error("Generator is already running");if(r===d){if("throw"===o)throw a;return j()}for(n.method=o,n.arg=a;;){var i=n.delegate;if(i){var u=L(i,n);if(u){if(u===v)continue;return u}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(r===f)throw r=d,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);r=p;var c=l(t,e,n);if("normal"===c.type){if(r=n.done?d:h,c.arg===v)continue;return{value:c.arg,done:n.done}}"throw"===c.type&&(r=d,n.method="throw",n.arg=c.arg)}}}(t,n,i),a}function l(t,e,n){try{return{type:"normal",arg:t.call(e,n)}}catch(I){return{type:"throw",arg:I}}}t.wrap=s;var f="suspendedStart",h="suspendedYield",p="executing",d="completed",v={};function m(){}function g(){}function y(){}var w={};w[a]=function(){return this};var b=Object.getPrototypeOf,E=b&&b(b(R([])));E&&E!==n&&r.call(E,a)&&(w=E);var x=y.prototype=m.prototype=Object.create(w);function _(t){["next","throw","return"].forEach((function(e){c(t,e,(function(t){return this._invoke(e,t)}))}))}function P(t,e){function n(o,a,i,u){var c=l(t[o],t,a);if("throw"!==c.type){var s=c.arg,f=s.value;return f&&"object"==typeof f&&r.call(f,"__await")?e.resolve(f.__await).then((function(t){n("next",t,i,u)}),(function(t){n("throw",t,i,u)})):e.resolve(f).then((function(t){s.value=t,i(s)}),(function(t){return n("throw",t,i,u)}))}u(c.arg)}var o;this._invoke=function(t,r){function a(){return new e((function(e,o){n(t,r,e,o)}))}return o=o?o.then(a,a):a()}}function L(t,n){var r=t.iterator[n.method];if(r===e){if(n.delegate=null,"throw"===n.method){if(t.iterator.return&&(n.method="return",n.arg=e,L(t,n),"throw"===n.method))return v;n.method="throw",n.arg=new TypeError("The iterator does not provide a 'throw' method")}return v}var o=l(r,t.iterator,n.arg);if("throw"===o.type)return n.method="throw",n.arg=o.arg,n.delegate=null,v;var a=o.arg;return a?a.done?(n[t.resultName]=a.value,n.next=t.nextLoc,"return"!==n.method&&(n.method="next",n.arg=e),n.delegate=null,v):a:(n.method="throw",n.arg=new TypeError("iterator result is not an object"),n.delegate=null,v)}function k(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function C(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function O(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(k,this),this.reset(!0)}function R(t){if(t){var n=t[a];if(n)return n.call(t);if("function"==typeof t.next)return t;if(!isNaN(t.length)){var o=-1,i=function n(){for(;++o<t.length;)if(r.call(t,o))return n.value=t[o],n.done=!1,n;return n.value=e,n.done=!0,n};return i.next=i}}return{next:j}}function j(){return{value:e,done:!0}}return g.prototype=x.constructor=y,y.constructor=g,g.displayName=c(y,u,"GeneratorFunction"),t.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===g||"GeneratorFunction"===(e.displayName||e.name))},t.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,y):(t.__proto__=y,c(t,u,"GeneratorFunction")),t.prototype=Object.create(x),t},t.awrap=function(t){return{__await:t}},_(P.prototype),P.prototype[i]=function(){return this},t.AsyncIterator=P,t.async=function(e,n,r,o,a){void 0===a&&(a=Promise);var i=new P(s(e,n,r,o),a);return t.isGeneratorFunction(n)?i:i.next().then((function(t){return t.done?t.value:i.next()}))},_(x),c(x,u,"Generator"),x[a]=function(){return this},x.toString=function(){return"[object Generator]"},t.keys=function(t){var e=[];for(var n in t)e.push(n);return e.reverse(),function n(){for(;e.length;){var r=e.pop();if(r in t)return n.value=r,n.done=!1,n}return n.done=!0,n}},t.values=R,O.prototype={constructor:O,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=e,this.done=!1,this.delegate=null,this.method="next",this.arg=e,this.tryEntries.forEach(C),!t)for(var n in this)"t"===n.charAt(0)&&r.call(this,n)&&!isNaN(+n.slice(1))&&(this[n]=e)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var n=this;function o(r,o){return u.type="throw",u.arg=t,n.next=r,o&&(n.method="next",n.arg=e),!!o}for(var a=this.tryEntries.length-1;a>=0;--a){var i=this.tryEntries[a],u=i.completion;if("root"===i.tryLoc)return o("end");if(i.tryLoc<=this.prev){var c=r.call(i,"catchLoc"),s=r.call(i,"finallyLoc");if(c&&s){if(this.prev<i.catchLoc)return o(i.catchLoc,!0);if(this.prev<i.finallyLoc)return o(i.finallyLoc)}else if(c){if(this.prev<i.catchLoc)return o(i.catchLoc,!0)}else{if(!s)throw new Error("try statement without catch or finally");if(this.prev<i.finallyLoc)return o(i.finallyLoc)}}}},abrupt:function(t,e){for(var n=this.tryEntries.length-1;n>=0;--n){var o=this.tryEntries[n];if(o.tryLoc<=this.prev&&r.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var a=o;break}}a&&("break"===t||"continue"===t)&&a.tryLoc<=e&&e<=a.finallyLoc&&(a=null);var i=a?a.completion:{};return i.type=t,i.arg=e,a?(this.method="next",this.next=a.finallyLoc,v):this.complete(i)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),v},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var n=this.tryEntries[e];if(n.finallyLoc===t)return this.complete(n.completion,n.afterLoc),C(n),v}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var n=this.tryEntries[e];if(n.tryLoc===t){var r=n.completion;if("throw"===r.type){var o=r.arg;C(n)}return o}}throw new Error("illegal catch attempt")},delegateYield:function(t,n,r){return this.delegate={iterator:R(t),resultName:n,nextLoc:r},"next"===this.method&&(this.arg=e),v}},t}(t.exports);try{regeneratorRuntime=e}catch(n){Function("r","regeneratorRuntime = r")(e)}},5861:function(t,e,n){"use strict";function r(t,e,n,r,o,a,i){try{var u=t[a](i),c=u.value}catch(s){return void n(s)}u.done?e(c):Promise.resolve(c).then(r,o)}function o(t){return function(){var e=this,n=arguments;return new Promise((function(o,a){var i=t.apply(e,n);function u(t){r(i,o,a,u,c,"next",t)}function c(t){r(i,o,a,u,c,"throw",t)}u(void 0)}))}}n.d(e,{Z:function(){return o}})}}]);
//# sourceMappingURL=commons-3ee01686ce94dbba5d1e.js.map
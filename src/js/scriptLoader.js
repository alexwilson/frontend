const scriptLoader = function scriptLoader(url) {
    return new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        script.async = true;
        script.addEventListener("load", resolve)
        script.addEventListener("error", reject)
        document.body.appendChild(script);
    });
}

export default scriptLoader;

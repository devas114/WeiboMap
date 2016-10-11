"use strict";
var ripples = $(".side-nav"),
    rippleContainer,
    ripple,
    current = $(".side-map");

var len = ripples.length;

var cleanUp = function() {
    console.log(this);
    var container = this.rippleContainer;
    while(this.rippleContainer.firstChild) {
        container.removeChild(container.firstChild);
    }
};

var debounce = function(func, delay) {
    var inDebounce = undefined;
    return function(){
        var context = this,
            args = arguments;
        clearTimeout(inDebounce);
        return inDebounce = setTimeout(function(){
            return func.apply(context, args);
        }, delay);
    }
};

var showRipple = function(e) {
    var ripple = $(this),
        size = ripple.width(),
        rippler = document.createElement("span"),
        pos = ripple[0].getBoundingClientRect(),
        x = e.clientX - pos.left - (size / 2),
        y = e.clientY - pos.top - (size/2),
        style = "top:" + y + "px; left:" + x + "px; height:" + size + "px; width:" + size + "px;",
        target = ripple.attr("to");
    rippler.style.cssText = style;
    $(".ripple", ripple).append(rippler);
    if (ripple.attr("to") !== current.attr("to")) {
        ripple.addClass("active");
        current.removeClass("active");
        current = ripple;
    }
    $("html, body").animate({
        scrollTop: $(".content-" + target).offset().top - 80
    }, 500);
    debounce(cleanUp, 2000);
}

for (var i=0; i<len; i++) {
    ripple = $(ripples[i]);
    rippleContainer = document.createElement("div");
    rippleContainer.className = "ripple";
    ripple.click(showRipple);
    ripple.rippleContainer = rippleContainer;
    ripple.prepend(rippleContainer);
}

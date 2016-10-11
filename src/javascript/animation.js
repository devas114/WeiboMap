"use strict";
module.exports = {
    In: function(){
        var overlay = $(".overlay"),
            contents = $(".content");
        overlay.addClass("active");
        contents.css("display", "block");
    },

    Out: function() {
        var overlay = $(".overlay"),
            sideNav = $(".sidebar"),
            intro = $(".intro"),
            box_map = $(".content-map"),
            box_time = $(".content-time"),
            box_tree = $(".content-tree"),
            footer = $("footer"),
            viewportWidth = $(window).width();

        var TimeLineOut = new TimelineLite();
        intro.css("display", "none");
        footer.css("display", "none");
        overlay.removeClass("active");
        setTimeout(function(){overlay.css("display", "none");}, 300);
        if (viewportWidth >= 1024) {
            TimeLineOut.to(sideNav, 0.5, {transform: "none"}, "+=0.3")
                .to(box_map, 0.5, {rotation: 0, top: 0})
                .to(box_time, 0.5, {rotation: 0, top: 0}, "-=0.4")
                .to(box_tree, 0.5, {rotation: 0, top: 0}, "-=0.4");
        } else {
            TimeLineOut.to(box_map, 0.5, {rotation: 0, top: 0})
                .to(box_time, 0.5, {rotation: 0, top: 0}, "-=0.4")
                .to(box_tree, 0.5, {rotation: 0, top: 0}, "-=0.4");
        }
    },

    Jump: function() {
        var input = $("#entry-file + label");
        input.css("animation", "shake 0.82s cubic-bezier(.36,.07,.19,.97) both");
        setTimeout(function() {
            input.css("animation", "");
        }, 1000);
    }
}

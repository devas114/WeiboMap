"use strict";
var nav_bar = $("#nav"),
    nav_menu = $(".mobile-open"),
    nav_close = $(".mobile-close");

nav_menu.click(function() {
    $(this).removeClass("active");
    nav_bar.addClass("active");
    nav_close.addClass("active");
});

nav_close.click(function() {
    nav_bar.removeClass("active");
    $(this).removeClass("active");
    nav_menu.addClass("active");
});

/*jshint esversion: 9 */
/* global console,document,chrome,localStorage */
"use strict";

var translator = {
    do: function () {

        var data = document.querySelectorAll('[data-innertrans]');
        data.forEach(element => {
            element.innerHTML = chrome.i18n.getMessage(element.dataset.innertrans).replace(/\n/g, "<br>") || "[translation error]";
        });

        data = document.querySelectorAll('[data-titletrans]');
        data.forEach(element => {
            element.dataset.bsTitle = chrome.i18n.getMessage(element.dataset.titletrans) || "[translation error]";
            element.dataset.bsToggle = "tooltip";
        });

    }
};
/*jshint esversion: 11 */
/* global console, document, menu */
"use strict";

var UI = {

    addClassAll: function (selector, className) {
        var items = document.querySelectorAll(selector);
        items.forEach(element => {
            element.classList.add(className);
        });
    },

    removeClassAll: function (selector, className) {
        var items = document.querySelectorAll(selector);
        items.forEach(element => {
            element.classList.remove(className);
        });
    },

    tips: {
        handle: function () {
            var tipsElementList = [].slice.call(document.querySelectorAll('.section_intro'));
            console.log("tips", tips, tipsElementList);

            let tipsList = tipsElementList.map(function (tipEl) {
                // console.log("tipEl", tipEl);

                // let showButton = tipEl.parentNode.querySelector("[data-infotoggle]");
                // let hideButton = tipEl.querySelector("[data-infotoggle]")

                // console.log("tips[tipEl.id]", tipEl.id, tips[tipEl.id])

                // default is show
                if (tips[tipEl.id] == "hide") {
                    tipEl.classList.remove("visible");
                }

            });
        }
    },

    tabs: {
        select: function (name) {
            console.log("tabs select")
            let el
            if (name) {
                el = document.querySelector(`[data-action="set_tab"][data-tabname="${name}"]`)
                if (!el) {
                    el = document.querySelector(`[data-action="set_tab"]`) // get first
                }
            } else {
                el = document.querySelector(`[data-action="set_tab"]`)
            }

            el.click()

        }
    },

    collapsibles: {
        handle: function () {
            var collapseElementList = [].slice.call(document.querySelectorAll('.collapse'));
            console.log("menu", menu, collapseElementList);

            var collapseList = collapseElementList.map(function (collapseEl) {

                // hide is useless, default is hide
                if (menu["toggle_" + collapseEl.id] == "show") {
                    collapseEl.classList.add("show");
                    document.querySelector(`[data-bs-id=${collapseEl.id}]`).classList.remove("collapsed");
                }

                collapseEl.addEventListener('hide.bs.collapse', function (e) {
                    e.stopPropagation();
                    menu["toggle_" + this.id] = "hide";
                    storeMenu();
                });
                collapseEl.addEventListener('show.bs.collapse', function (e) {
                    e.stopPropagation();
                    menu["toggle_" + this.id] = "show";
                    storeMenu();
                });
                return collapseEl;
            });
            // Ui2.collapsibles.list = collapseList;
            return collapseList;
        },

        openAll: function () {
            UI.addClassAll('.collapse', "show");
            UI.removeClassAll('[data-bs-toggle=collapse]', "collapsed");
            for (var i = 0, len = toggableSections.length; i < len; i++) {
                menu[toggableSections[i]] = "show";
            }
        },

        closeAll: function () {
            UI.removeClassAll('.collapse.show', "show");
            UI.addClassAll('[data-bs-toggle=collapse]', "collapsed");
            for (var i = 0, len = toggableSections.length; i < len; i++) {
                menu[toggableSections[i]] = "hide";
            }
        }

    }
};
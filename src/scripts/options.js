/*jshint esversion: 9 */
/* global console, chrome, document, bootstrap */
"use strict";

// Saves options to chrome.storage
function save_options() {
    // var color = document.getElementById('color').value;
    var debug_mode = document.getElementById('debug_mode').checked;
    var hide_changelog = document.getElementById('hide_changelog').checked;

    chrome.storage.sync.set({
        // favoriteColor: color,
        debug_mode: debug_mode,
        hide_changelog: hide_changelog
    }, function () {
        var myAlert = document.getElementById('toastNotice'); //select id of toast
        document.querySelector("#toastNotice .toast-body").innerHTML = "Options saved";
        var bsAlert = new bootstrap.Toast(myAlert); //inizialize it
        bsAlert.show(); //show it
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    chrome.storage.sync.get({
        // favoriteColor: 'red',
        debug_mode: false,
        hide_changelog: false
    }, function (items) {
        // document.getElementById('color').value = items.favoriteColor;
        document.getElementById('debug_mode').checked = items.debug_mode;
        document.getElementById('hide_changelog').checked = items.hide_changelog;
    });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
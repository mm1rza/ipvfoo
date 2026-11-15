// COLOR THEME
var theme_button = document.querySelector("#toggleTheme");
var currentTheme = localStorage.getItem('theme') ? localStorage.getItem('theme') : null;
if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
}
if (theme_button) {
    theme_button.onclick = function(e) {
        currentTheme = (currentTheme == "light" ? "dark" : "light");
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
    };
}

// TEXT THEME
var text_button = document.querySelector("#toggleText");
var currentText = localStorage.getItem('text') ? localStorage.getItem('text') : null;
if (currentText) {
    document.documentElement.setAttribute('data-text', currentText);
}
if (text_button) {
    text_button.onclick = function(e) {
        console.log(toggleText);
        currentText = (currentText == "small" ? "large" : "small");
        document.documentElement.setAttribute('data-text', currentText);
        localStorage.setItem('text', currentText);
    };
}
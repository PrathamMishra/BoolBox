const themeContainer = document.querySelector("#theme");
const themeIcon = document.querySelector("#theme-icon");
const themeText = document.querySelector("#theme-text");
const html = document.documentElement;

function setTheme(newTheme) {
    localStorage.setItem('theme', newTheme);
    html.setAttribute('data-theme', newTheme);
    if (newTheme == 'light') {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        themeText.innerText = 'Day';
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        themeText.innerText = 'Night';
    }
}
setTheme(html.getAttribute('data-theme'));
themeContainer.onclick = function () {
    const currentTheme = html.dataset.theme;
    const newTheme = currentTheme == 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}
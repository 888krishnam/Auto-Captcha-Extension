document.getElementById('data').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    chrome.storage.local.set({ email: email, password: password }, () => {
        window.open('https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp', '_self');
    });
});

// Password input field eye icon functionality
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePassword.addEventListener('click', function () {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    this.classList.toggle('fa-eye-slash');
});
import { recognize } from "tesseract.js";

const currentUrl = window.location.href;
const loginUrl = "https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp";

if (currentUrl.startsWith(loginUrl)) {
    window.addEventListener("load", async () => {
        const imgElement = document.getElementsByClassName("col-sm-4")[0].querySelector("img");

        if (!imgElement.complete) {
            await new Promise((resolve) => {
                imgElement.onload = resolve;
            });
        }

        const canvas = document.createElement("canvas");
        canvas.width = imgElement.clientWidth;
        canvas.height = imgElement.clientHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imgElement, 0, 0, imgElement.clientWidth, imgElement.clientHeight);
        const image = canvas.toDataURL();

        let email, password, c;
        chrome.storage.local.get(['email', 'password', 'c'], result => {
            email = result.email;
            password = result.password;
            c = result.c
            if (email) {
                document.getElementById("login").value = email;
                document.getElementById("passwd").value = password;
            }
        });

        /* Recognize and fill the captcha, then submit the form if email is set
           If c is greater than or equal to 5, alert the user to enter email and password again */
        try {
            const input = document.getElementById("ccode");
            const out = await recognize(image, 'eng');
            input.value = out.data.text;
            chrome.storage.local.set({ c: c + 1 });
            if (c > 5) {
                alert("Wrong Email or Password. Enter your email and password again by clicking on the extension. If this doesn't work, try it again after a few minutes.");
            }
            if (c <= 5 && email) document.getElementsByClassName("btn-block")[0].click();
        } catch (err) {
            console.error("Error during recognition:", err);
        }
    })
};

// Reset c to 0 if got logged in
window.addEventListener('popstate', () => chrome.storage.local.set({ c: 0 }));
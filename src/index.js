import { recognize } from "tesseract.js";

const currentUrl = window.location.href;
const loginUrl = "https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp";

if (currentUrl.startsWith(loginUrl)) {
    window.addEventListener("load", async () => {
        const imgElement =
            document.querySelector('div.col-sm-5 img[src*="SCaptchaServlet"]') ||
            document.querySelector('img[src*="SCaptchaServlet"]') ||
            document.querySelector("div.col-sm-5 img");

        if (!imgElement) {
            console.error("Captcha image not found on the page.");
            return;
        }

        console.log("Selected captcha image:", {
            src: imgElement.currentSrc || imgElement.src,
            alt: imgElement.alt,
            element: imgElement
        });

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

        let email, password;
        chrome.storage.local.get(['email', 'password'], result => {
            email = result.email;
            password = result.password;
            if (email) {
                const usernameInput =
                    document.getElementById("username") ||
                    document.getElementById("login") ||
                    document.querySelector('input[name="username"]');
                const passwordInput =
                    document.getElementById("password") ||
                    document.getElementById("passwd") ||
                    document.querySelector('input[name="password"]');

                if (usernameInput) usernameInput.value = email;
                if (passwordInput) passwordInput.value = password || "";
            }
        });

        try {
            const input =
                document.getElementById("captcha") ||
                document.getElementById("ccode") ||
                document.querySelector('input[name="captcha"]') ||
                document.querySelector('input[name="ccode"]') ||
                document.querySelector('input[id*="captcha" i]');

            if (!input) {
                console.error("Captcha input field not found on the page.");
                return;
            }

            const out = await recognize(image, 'eng');
            input.value = out.data.text;
        } catch (err) {
            console.error("Error during recognition:", err);
        }
    })
};

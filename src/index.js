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

        if (!imgElement.complete) {
            await new Promise((resolve) => {
                imgElement.onload = resolve;
            });
        }

        const usernameInput = document.getElementById("username") || document.getElementById("login") || document.querySelector('input[name="username"]');
        const passwordInput = document.getElementById("password") || document.getElementById("passwd") || document.querySelector('input[name="password"]');

        if (usernameInput && passwordInput) {
            // Load and Autofill credentials
            chrome.storage.local.get(['email', 'password'], result => {
                if (result.email) usernameInput.value = result.email;
                if (result.password) passwordInput.value = result.password;
            });

            // Auto-save credentials when typed
            const saveCredentials = () => {
                const emailVal = usernameInput.value;
                const passVal = passwordInput.value;
                if (emailVal && passVal) {
                    chrome.storage.local.set({ email: emailVal, password: passVal });
                }
            };

            const form = usernameInput.closest('form');
            if (form) {
                form.addEventListener('submit', saveCredentials);
            }
            
            // Listen specifically to the known login button
            const loginBtn = document.getElementById("btnLogin");
            if (loginBtn) {
                loginBtn.addEventListener('click', saveCredentials);
            }

            document.addEventListener('click', (e) => {
                const trg = e.target;
                if (trg.tagName === 'BUTTON' || trg.type === 'submit' || (trg.id && trg.id.toLowerCase().includes('login'))) {
                    saveCredentials();
                }
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') saveCredentials();
            });
        }

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

            const aiModel = window.ai?.languageModel || window.LanguageModel;
            if (!aiModel) {
                console.error("Prompt API is not available.");
                return;
            }

            const modelOptions = {
                expectedInputs: [
                    { type: "text", languages: ["en"] },
                    { type: "image" }
                ],
                expectedOutputs: [
                    { type: "text", languages: ["en"] }
                ]
            };

            const availability = await aiModel.availability(modelOptions);
            let session;

            try {
                // Attempt to create the session directly. 
                // If it is already downloaded, this will succeed.
                session = await aiModel.create(modelOptions);
            } catch (createErr) {
                // If it requires a user gesture to download, Chrome throws a NotAllowedError
                if (createErr.name === 'NotAllowedError' || createErr.message.includes('user gesture')) {
                    console.warn(`Model requires a user gesture to start downloading. Catching:`, createErr);
                    
                    // Create a temporary button to capture user gesture
                    const btn = document.createElement("button");
                    btn.textContent = "Download AI Model for Auto-Captcha";
                    btn.style.cssText = "position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-weight: bold;";
                    document.body.appendChild(btn);

                    session = await new Promise((resolve) => {
                        btn.addEventListener("click", async () => {
                            btn.disabled = true;
                            btn.textContent = "Loading AI Model... (this may take a while)";
                            try {
                                const newSession = await aiModel.create({
                                    ...modelOptions,
                                    monitor(m) {
                                        m.addEventListener('downloadprogress', (e) => {
                                            const progress = Math.round((e.loaded / e.total) * 100);
                                            btn.textContent = `Downloading AI Model: ${progress}%`;
                                        });
                                    }
                                });
                                btn.remove();
                                resolve(newSession);
                            } catch (e) {
                                console.error("Failed to create model session:", e);
                                btn.textContent = "Error loading model.";
                                btn.style.background = "red";
                            }
                        });
                    });
                } else {
                    throw createErr;
                }
            }

            if (!session) return;

            const response = await session.prompt([
                {
                    role: "user",
                    content: [
                        { type: "text", value: "Extract the exact text from this captcha image. Keep in mind of upper case letters, lower case letters, and numbers only. Output only the text from the image without any extra characters, explanation, or markdown." },
                        { type: "image", value: imgElement }
                    ]
                }
            ]);

            input.value = response.trim();
        } catch (err) {
            console.error("Error during recognition:", err);
        }
    })
};

const currentUrl = window.location.href;
const loginUrl = "https://sp.srmist.edu.in/srmiststudentportal/students/loginManager/youLogin.jsp";

if (currentUrl.startsWith(loginUrl)) {
    const initCaptchaAutomation = async () => {
        // Poll until the captcha image is fully loaded with its blob: URL
        const waitForCaptchaImage = () => {
            return new Promise((resolve) => {
                let attempts = 0;
                const check = () => {
                    attempts++;
                    const img = document.getElementById("secure_captcha") ||
                                document.querySelector('img[data-src*="SCaptchaServlet"]') ||
                                document.querySelector('img[src*="SCaptchaServlet"]');
                    
                    if (img && img.src && (img.src.includes('blob:') || img.src.includes('SCaptchaServlet'))) {
                        if (img.complete && img.naturalWidth > 0) {
                            resolve(img);
                        } else {
                            img.addEventListener('load', () => resolve(img), { once: true });
                        }
                    } else if (attempts < 40) {
                        setTimeout(check, 250);
                    } else {
                        console.error("Auto-Captcha: Image timed out loading.");
                        resolve(null);
                    }
                };
                check();
            });
        };

        const imgElement = await waitForCaptchaImage();
        if (!imgElement) return;

        console.log("Auto-Captcha: Image found -", imgElement.src.substring(0, 60) + "...");

        const usernameInput = document.getElementById("username") || document.getElementById("login") || document.querySelector('input[name="username"]');
        const passwordInput = document.getElementById("password") || document.getElementById("passwd") || document.querySelector('input[name="password"]');

        if (usernameInput && passwordInput) {
            const saveCredentials = () => {
                const emailVal = usernameInput.value;
                const passVal = passwordInput.value;
                if (emailVal && passVal) {
                    chrome.storage.local.set({ email: emailVal, password: passVal });
                }
            };

            const form = usernameInput.closest('form');
            if (form) form.addEventListener('submit', saveCredentials);
            
            const loginBtn = document.getElementById("btnLogin");
            if (loginBtn) loginBtn.addEventListener('click', saveCredentials);

            document.addEventListener('click', (e) => {
                const trg = e.target;
                if (trg && (trg.tagName === 'BUTTON' || trg.type === 'submit' || (trg.id && trg.id.toLowerCase().includes('login')))) {
                    saveCredentials();
                }
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') saveCredentials();
            });
        }

        const input =
            document.getElementById("captcha") ||
            document.getElementById("ccode") ||
            document.querySelector('input[name="captcha"]') ||
            document.querySelector('input[name="ccode"]') ||
            document.querySelector('input[id*="captcha" i]');

        if (!input) {
            console.error("Auto-Captcha: Input field not found.");
            return;
        }

        // Status badge
        const showStatusBadge = (msg, type = "info") => {
            let box = document.getElementById("auto-captcha-status-box");
            if (!box) {
                box = document.createElement("div");
                box.id = "auto-captcha-status-box";
                box.style.cssText = "position: fixed; top: 15px; right: 15px; z-index: 999999; padding: 10px 16px; background: #181824; color: #ffffff; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.3); font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 500; border: 1px solid #33334d;";
                document.body.appendChild(box);
            }
            const bgColor = type === "error" ? "#dc3545" : type === "success" ? "#28a745" : "#007bff";
            box.innerHTML = `<span style="padding: 2px 6px; background: ${bgColor}; border-radius: 4px; font-weight: bold; margin-right: 8px; font-size: 11px;">AUTO-CAPTCHA</span> ${msg}`;
            if (type === "success" || type === "error") {
                setTimeout(() => box?.remove(), 4000);
            }
        };

        const tryPromptAPI = async (imgEl) => {
            // Try to get the LanguageModel API
            let aiModel = null;
            if (typeof LanguageModel !== "undefined") {
                aiModel = LanguageModel;
            } else if (typeof self !== "undefined" && self.ai?.languageModel) {
                aiModel = self.ai.languageModel;
            } else if (typeof window !== "undefined" && window.ai?.languageModel) {
                aiModel = window.ai.languageModel;
            }

            if (!aiModel) {
                console.error("Auto-Captcha: Prompt API (LanguageModel) not available in this browser.");
                return null;
            }

            console.log("Auto-Captcha: LanguageModel API found.");

            try {
                // Check availability
                let availability;
                if (typeof aiModel.availability === "function") {
                    availability = await aiModel.availability({
                        expectedInputs: [{ type: "image" }],
                    });
                    console.log("Auto-Captcha: Model availability =", availability);
                }

                if (availability === "no" || availability === "unavailable") {
                    console.error("Auto-Captcha: Model is not available on this device.");
                    return null;
                }

                // Create session with multimodal support
                const session = await aiModel.create({
                    systemPrompt: "You are a precise OCR tool. You will be given a captcha image. Output ONLY the exact alphanumeric characters visible in the captcha. No spaces, no explanations, no formatting. Just the raw characters.",
                    expectedInputs: [
                        { type: "text", languages: ["en"] },
                        { type: "image" },
                    ],
                    expectedOutputs: [
                        { type: "text", languages: ["en"] },
                    ],
                });

                console.log("Auto-Captcha: Session created successfully.");

                try {
                    // Pass the HTMLImageElement directly — no canvas needed!
                    // The Prompt API natively accepts HTMLImageElement, avoiding
                    // tainted canvas issues with cross-origin blob: URLs.
                    const response = await Promise.race([
                        session.prompt([
                            {
                                role: "user",
                                content: [
                                    { type: "text", value: "Read the captcha text in this image. Output ONLY the exact characters, nothing else." },
                                    { type: "image", value: imgEl },
                                ],
                            },
                        ]),
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("Prompt API timeout")), 30000)
                        ),
                    ]);

                    console.log("Auto-Captcha: Raw AI response:", JSON.stringify(response));

                    let cleaned = response.replace(/[^a-zA-Z0-9]/g, "").trim();

                    // Reject hallucinated output
                    if (cleaned.length < 4 || cleaned.length > 7) {
                        console.warn("Auto-Captcha: Bad length:", cleaned.length, "->", cleaned);
                        return null;
                    }
                    if (/(.)\1{3,}/.test(cleaned) || /^(..)\1+$/.test(cleaned)) {
                        console.warn("Auto-Captcha: Repetitive hallucination detected:", cleaned);
                        return null;
                    }

                    return cleaned;
                } finally {
                    if (session && typeof session.destroy === "function") {
                        session.destroy();
                    }
                }
            } catch (e) {
                console.error("Auto-Captcha: Prompt API error:", e.name, e.message);
                return null;
            }
        };

        showStatusBadge("Solving captcha with AI...", "info");

        chrome.storage.local.get(['email', 'password'], async result => {
            const email = result.email;
            const password = result.password;

            if (email && usernameInput) usernameInput.value = email;
            if (password && passwordInput) passwordInput.value = password;

            try {
                // Pass the <img> element directly to the Prompt API
                let text = await tryPromptAPI(imgElement);

                if (text) {
                    if (text.length > 6) text = text.substring(0, 6);
                    input.value = text;
                    showStatusBadge(`Captcha Filled: ${text}`, "success");
                    console.log("Auto-Captcha: Filled successfully:", text);
                } else {
                    showStatusBadge("AI unable to read captcha. Please type manually.", "error");
                    console.warn("Auto-Captcha: AI returned no usable text.");
                }
            } catch (err) {
                console.error("Auto-Captcha: Execution error:", err);
                showStatusBadge("Captcha recognition error.", "error");
            }
        });
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
        initCaptchaAutomation();
    } else {
        window.addEventListener("load", initCaptchaAutomation);
    }
}

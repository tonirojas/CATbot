// Configuración
        const N8N_WEBHOOK_URL = 'my webhook';
        
        let messageCount = 0;
        let userScrolledUp = false;
        let userName = '';
        let userAvatarLetter = 'U'; 
        // Referencias a elementos DOM
        const startupPopup = document.getElementById('startupPopup');
        const userNameInput = document.getElementById('userNameInput');
        const startupButton = document.getElementById('startupButton');
        
        const chatHeader = document.getElementById('chatHeader');
        const chatContainer = document.getElementById('chatContainer');
        const chatInputContainer = document.getElementById('chatInputContainer');
        
        const messagesContainer = document.getElementById('messagesContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');

        function initializeChat() {
            userName = userNameInput.value.trim();
            const passwordInput = document.getElementById('passwordInput');
            const userPassword = passwordInput ? passwordInput.value.trim() : "";

            // Validar que solo se permita el usuario "jordi" (en cualquiera de sus variantes) con la contraseña "1234"
            if (userName.toLowerCase() !== 'jordi' || userPassword !== '1234') {
                alert("Acceso denegado. Usuario o contraseña incorrectos.");
                return;
            }

            if (userName && userName.length > 0) {
                userAvatarLetter = userName.charAt(0).toUpperCase();
            } else {
                userName = "Usuario"; 
                userAvatarLetter = "U";
            }

            startupPopup.classList.add('hidden');
            
            chatHeader.style.display = 'flex'; 
            chatContainer.style.display = 'flex'; 
            chatInputContainer.style.display = 'flex'; 

            void chatHeader.offsetWidth;
            void chatContainer.offsetWidth;
            void chatInputContainer.offsetWidth;

            chatHeader.classList.add('visible');
            chatContainer.classList.add('visible');
            chatInputContainer.classList.add('visible');

            messageInput.focus();
            scrollToBottom(); 
        }
        
        startupButton.addEventListener('click', initializeChat);
        userNameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                initializeChat();
            }
        });

        messagesContainer.addEventListener('scroll', function() {
            const isAtBottom = messagesContainer.scrollTop + messagesContainer.clientHeight >= messagesContainer.scrollHeight - 50;
            userScrolledUp = !isAtBottom;
        });

        messageInput.addEventListener('input', function() {
            this.style.height = 'auto'; 
            this.style.height = Math.min(this.scrollHeight, 120) + 'px'; 
        });

        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        function renderMarkdown(md) {
            let html = md;
            html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
                const safeCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return `<pre><code${lang ? ` class="language-${lang}"` : ''}>${safeCode.trim()}</code></pre>`;
            });
            html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
            html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
            html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
            html = html.replace(/_(.*?)_/g, '<em>$1</em>');
            html = html.replace(/\[(.*?)\]\((.*?)\)/g, (match, text, url) => {
                const safeUrl = url.replace(/"/g, '&quot;');
                return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            });
            html = html.replace(/^\s*[-*] (.*$)/gim, '<li>$1</li>');
            html = html.replace(/<ul>\s*<li>/g, '<ul><li>'); 
            html = html.replace(/(<li>(?:(?!<li>).)*<\/li>\s*)+/g, '<ul>$&</ul>'); // Improved list wrapping
            html = html.replace(/^\s*\d+\. (.*$)/gim, '<li>$1</li>');
            html = html.replace(/<ol>\s*<li>/g, '<ol><li>'); 
            html = html.replace(/(<li>(?:(?!<li>).)*<\/li>\s*)+/g, (match) => { 
                if (!match.includes('<ul>') && !match.startsWith('<ol>')) { // Avoid double wrapping
                    return '<ol>' + match + '</ol>';
                }
                return match;
            });
            html = html.replace(/<\/ul>\s*<ul>/g, '');
            html = html.replace(/<\/ol>\s*<ol>/g, '');
            // Ensure lists within lists are not re-wrapped incorrectly
            html = html.replace(/<\/ul>\s*<\/li>/g, '</li></ul>');
            html = html.replace(/<\/ol>\s*<\/li>/g, '</li></ol>');
            html = html.replace(/<li>\s*<ul>/g, '<li><ul>');
            html = html.replace(/<li>\s*<ol>/g, '<li><ol>');


            html = html.replace(/`(.*?)`/g, '<code>$1</code>');
            html = html.split(/\n\s*\n/).map(paragraph => {
                if (paragraph.startsWith('<h3>') || paragraph.startsWith('<h2>') || paragraph.startsWith('<h1>') || paragraph.startsWith('<ul>') || paragraph.startsWith('<ol>') || paragraph.startsWith('<pre>')) {
                    return paragraph; 
                }
                return paragraph.trim() ? `<p>${paragraph.replace(/\n/g, '<br>')}</p>` : '';
            }).join('');
            if (!html.includes('<p>') && (html.includes('<li>') || html.includes('<br>') === false) && !html.startsWith('<h') && !html.startsWith('<ul') && !html.startsWith('<ol>') && !html.startsWith('<pre>')) {
                if (!html.endsWith('</p>')) { 
                    html = html.replace(/\n/g, '<br>');
                }
            }
            html = html.replace(/<li>(.*?)<br><\/li>/g, '<li>$1</li>');
            html = html.replace(/<p><\/p>/g, '');
            return html.trim();
        }

        async function sendMessage() {
            const messageText = messageInput.value.trim();
            if (!messageText) return;

            setInputState(false);
            addMessage(messageText, 'user');
            messageInput.value = '';
            messageInput.style.height = 'auto'; 

            showTypingIndicator();

            try {
                const response = await fetch(N8N_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: messageText,
                        userName: userName, 
                        timestamp: new Date().toISOString(),
                        sessionId: getSessionId()
                    })
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
                }

                const data = await response.json();
                hideTypingIndicator();
                
                let botResponse = '';
                if (data.output) botResponse = data.output;
                else if (data.response) botResponse = data.response;
                else if (data.message) botResponse = data.message;
                else if (data.text) botResponse = data.text;
                else if (data.reply) botResponse = data.reply;
                else if (data.answer) botResponse = data.answer;
                else if (typeof data === 'string') botResponse = data;
                else {
                    console.warn('Respuesta del bot no encontrada en campos esperados. Usando JSON completo.', data);
                    botResponse = `Respuesta no procesada: ${JSON.stringify(data)}`;
                }
                
                addMessage(botResponse, 'bot');

            } catch (error) {
                console.error('Error al enviar/recibir mensaje:', error);
                hideTypingIndicator();
                addMessage(`Lo siento, hubo un error: ${error.message}`, 'bot');
            }

            setInputState(true);
        }

        function addMessage(content, sender) {
            const messageElement = document.createElement('div');
            messageElement.className = `message ${sender}`;
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            
            if (sender === 'bot') {
                const avatarImg = document.createElement('img');
                avatarImg.src = '/images/CatBotLogo.png'; 
                avatarImg.alt = 'CATbot';
                avatarImg.onerror = function() { this.src='https://placehold.co/40x40/FFFFFF/764ba2?text=CB'; };
                avatar.appendChild(avatarImg);
            } else {
                avatar.textContent = userAvatarLetter; 
            }
            
            const messageContentWrapper = document.createElement('div');
            messageContentWrapper.className = 'message-content';
            
            if (sender === 'bot') {
                messageContentWrapper.innerHTML = renderMarkdown(content);
            } else {
                const p = document.createElement('p');
                p.textContent = content;
                messageContentWrapper.appendChild(p);
            }
            
            const messageTime = document.createElement('div');
            messageTime.className = 'message-time';
            messageTime.textContent = new Date().toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            messageContentWrapper.appendChild(messageTime); 
            
            messageElement.appendChild(avatar);
            messageElement.appendChild(messageContentWrapper);
            
            messageElement.style.animationDelay = `${messageCount * 0.05}s`; 
            
            messagesContainer.appendChild(messageElement);
            
            if (!userScrolledUp || sender === 'user') { 
                scrollToBottom();
            }
            
            messageCount++;
        }

        function showTypingIndicator() {
            if (document.getElementById('typingIndicator')) return; 

            const typingIndicatorContainer = document.createElement('div');
            typingIndicatorContainer.className = 'message bot typing-indicator-container'; 
            typingIndicatorContainer.id = 'typingIndicator';
            
            const avatar = document.createElement('div');
            avatar.className = 'message-avatar';
            const avatarImg = document.createElement('img');
            avatarImg.src = '/images/CatBotLogo.png';
            avatarImg.alt = 'CATbot';
            avatarImg.onerror = function() { this.src='https://placehold.co/40x40/FFFFFF/764ba2?text=CB'; };
            avatar.appendChild(avatarImg);
            
            const typingContent = document.createElement('div');
            typingContent.className = 'typing-indicator'; 
            typingContent.style.display = 'flex'; 
            typingContent.innerHTML = `
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                </div>
                <span style="margin-left: 0.5rem; color: #666; font-size: 0.875rem;">CATbot está escribiendo...</span>
            `;
            
            typingIndicatorContainer.appendChild(avatar);
            typingIndicatorContainer.appendChild(typingContent);
            
            messagesContainer.appendChild(typingIndicatorContainer);
            
            if (!userScrolledUp) {
                scrollToBottom();
            }
        }

        function hideTypingIndicator() {
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }

        function setInputState(enabled) {
            messageInput.disabled = !enabled;
            sendButton.disabled = !enabled;
            
            if (enabled) {
                messageInput.focus();
            }
        }

        function scrollToBottom() {
            setTimeout(() => {
                if (messagesContainer) { 
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
                userScrolledUp = false; 
            }, 50); 
        }

        function getSessionId() {
            let sessionId = sessionStorage.getItem('catbot-session-id');
            if (!sessionId) {
                sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
                sessionStorage.setItem('catbot-session-id', sessionId);
            }
            return sessionId;
        }

        document.addEventListener('DOMContentLoaded', function() {
            if(startupPopup) {
                startupPopup.classList.remove('hidden'); 
            }
            if(chatHeader) chatHeader.style.display = 'none';
            if(chatContainer) chatContainer.style.display = 'none';
            if(chatInputContainer) chatInputContainer.style.display = 'none';
        });

        function keepHeaderVisible() {
            const header = document.getElementById('chatHeader');
            const inputs = document.querySelectorAll('.message-input, .startup-input');
            
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    header.style.position = 'fixed';
                    header.style.top = '0';
                    header.style.left = '0';
                    header.style.width = '100%';
                    header.style.zIndex = '1000';
                });
                input.addEventListener('blur', () => {
                    // Al salir del foco, remover estilos para que use el estilo original
                    header.style.position = '';
                    header.style.top = '';
                    header.style.left = '';
                    header.style.width = '';
                    header.style.zIndex = '';
                });
            });
        }

        document.addEventListener('DOMContentLoaded', function () {
            const header = document.getElementById('chatHeader');
            const welcomeMessage = document.querySelector('.welcome-message');
            if (header && welcomeMessage) {
                const headerHeight = header.offsetHeight;
                welcomeMessage.style.marginTop = (headerHeight + 125) + 'px';
            }
        });

        keepHeaderVisible();

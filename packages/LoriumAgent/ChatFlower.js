/**
 * ChatFlower.js - AI Assistant Logic with History & Grouping
 */

const fs = require('fs');
const path = require('path');

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggle-sidebar');
    const chatInput = document.getElementById('chat-input');
    const inputContainer = document.querySelector('.input-container');
    const sendBtn = document.getElementById('send-btn');
    const expandInputBtn = document.getElementById('expand-input-btn');
    const chatWindow = document.getElementById('chat-window');
    const historyContainer = document.getElementById('history-container');
    const sidebarSearchInput = document.getElementById('sidebar-search');
    const newChatBtn = document.getElementById('new-chat');
    const newChatFloatingBtn = document.getElementById('new-chat-floating');
    const contextMenu = document.getElementById('context-menu');
    const ctxRename = document.getElementById('ctx-rename');
    const ctxDelete = document.getElementById('ctx-delete');
    const renameModal = document.getElementById('rename-modal-overlay');
    const renameInput = document.getElementById('rename-input');
    const renameCancel = document.getElementById('rename-cancel');
    const renameConfirm = document.getElementById('rename-confirm');
    const debugBtn = document.getElementById('debug-btn');
    const mainChat = document.getElementById('main-chat');
    const inputWrapper = document.querySelector('.input-wrapper');
    const welcomeOverlay = document.getElementById('welcome-overlay');
    const welcomeGreetingEl = document.getElementById('welcome-greeting');
    const welcomeSubtitleEl = document.getElementById('welcome-subtitle');

    let currentChatId = null;
    let rightClickedId = null;
    let chatsDir = path.join(__dirname, 'chats');

    // Ensure chats directory exists
    if (!fs.existsSync(chatsDir)) {
        fs.mkdirSync(chatsDir, { recursive: true });
    }

    // --- WELCOME GREETING SYSTEM ---

    const userName = 'User'; // TODO: Replace with actual user name when available

    function getTimeGreeting() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'Good Morning';
        if (hour >= 12 && hour < 17) return 'Good Afternoon';
        if (hour >= 17 && hour < 21) return 'Good Evening';
        return 'Good Night';
    }

    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getGreetingText() {
        const greetings = [
            `${getTimeGreeting()}, ${userName}`,
            `Have a Nice Day, ${userName}`,
            `Welcome, ${userName}`,
            `Hey there, ${userName}`,
            `Hello, ${userName}`,
        ];
        return pickRandom(greetings);
    }

    function getSubtitleText() {
        const subtitles = [
            'How can I help you today?',
            "Let's start a conversation",
            "What's on your mind today?",
            'Ask me anything you like',
            "I'm here to help you",
            "What would you like to talk about?",
            "Ready when you are",
        ];
        return pickRandom(subtitles);
    }

    function showWelcomeOverlay() {
        if (!welcomeOverlay || !welcomeGreetingEl || !welcomeSubtitleEl || !mainChat) return;
        // Reset animations by re-inserting elements
        welcomeGreetingEl.textContent = getGreetingText();
        welcomeSubtitleEl.textContent = getSubtitleText();

        // Force re-trigger animation
        welcomeGreetingEl.style.animation = 'none';
        welcomeSubtitleEl.style.animation = 'none';
        if (inputWrapper) inputWrapper.style.animation = 'none';

        void welcomeGreetingEl.offsetWidth; // reflow

        welcomeGreetingEl.style.animation = '';
        welcomeSubtitleEl.style.animation = '';
        if (inputWrapper) inputWrapper.style.animation = '';

        mainChat.classList.add('is-new-chat');
    }

    function hideWelcomeOverlay() {
        if (!welcomeOverlay || !mainChat) return;
        mainChat.classList.remove('is-new-chat');
    }

    // --- UI HELPERS ---

    const INPUT_LINE_HEIGHT = 22;
    const MAX_COLLAPSED_INPUT_LINES = 8;

    function toggleSidebarState() {
        if (!sidebar) return;
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        document.body.classList.toggle('sidebar-hidden', isCollapsed);
        
        // Ikonun yönünü veya tipini burada değiştirebilirsin, şimdilik sabit kalıyor
    }

    function adjustTextareaHeight() {
        if (!chatInput || !inputContainer) return;
        const isExpanded = inputContainer.classList.contains('expanded');
        const collapsedMaxHeight = INPUT_LINE_HEIGHT * MAX_COLLAPSED_INPUT_LINES;
        const expandedMaxHeight = Math.min(Math.round(window.innerHeight * 0.48), 430);
        const maxHeight = isExpanded ? expandedMaxHeight : collapsedMaxHeight;

        chatInput.style.height = 'auto';
        const nextHeight = isExpanded ? maxHeight : Math.min(chatInput.scrollHeight, maxHeight);

        chatInput.style.height = `${nextHeight}px`;
        chatInput.style.overflowY = chatInput.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }

    function appendMessage(role, content) {
        if (!chatWindow) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role === 'user' ? 'user-message' : 'ai-message'}`;
        msgDiv.textContent = content;
        chatWindow.appendChild(msgDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    // --- HISTORY SYSTEM ---

    function getRelativeDateLabel(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return 'Unknown Date';
        
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // 1. Today
        if (checkDate.getTime() === today.getTime()) return 'Today';
        
        // 2. Yesterday
        if (checkDate.getTime() === yesterday.getTime()) return 'Yesterday';

        // 3. Same Month (Daily grouping)
        if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) {
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        }

        // 4. Last Month
        const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstOfLastMonth = new Date(firstOfThisMonth);
        firstOfLastMonth.setMonth(firstOfLastMonth.getMonth() - 1);
        
        if (date.getFullYear() === firstOfLastMonth.getFullYear() && date.getMonth() === firstOfLastMonth.getMonth()) {
            return 'Last Month';
        }
        
        // 5. Older Months
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString('en-US', { month: 'long' });
        }
        
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    function loadHistory() {
        if (!historyContainer) return;
        historyContainer.innerHTML = '';
        
        // Update New Chat active state
        if (newChatBtn) {
            newChatBtn.classList.toggle('active', currentChatId === null);
        }

        const files = fs.readdirSync(chatsDir).filter(f => f.endsWith('.json'));
        
        const sessions = files.reduce((items, fileName) => {
            const filePath = path.join(chatsDir, fileName);
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                const dataTimestamp = Number(data.timestamp);
                const fileTimestamp = Number.parseInt(fileName.replace('.json', ''), 10);
                items.push({
                    id: fileName.replace('.json', ''),
                    title: data.title || 'New Chat',
                    timestamp: Number.isFinite(dataTimestamp) ? dataTimestamp : (Number.isFinite(fileTimestamp) ? fileTimestamp : 0),
                    messages: Array.isArray(data.messages) ? data.messages : [],
                });
            } catch (err) {
                console.error(`Skipping unreadable chat file: ${fileName}`, err);
            }
            return items;
        }, []).sort((a, b) => b.timestamp - a.timestamp);

        const groups = {};
        sessions.forEach(session => {
            const label = getRelativeDateLabel(session.timestamp);
            if (!groups[label]) groups[label] = [];
            groups[label].push(session);
        });

        for (const [label, items] of Object.entries(groups)) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'history-group';
            groupDiv.innerHTML = `<div class="history-label">${label}</div>`;
            
            items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = `history-item ${item.id === currentChatId ? 'active' : ''}`;
                itemDiv.innerHTML = `<div class="history-item-icon"></div><span>${item.title || 'New Chat'}</span>`;
                itemDiv.onclick = () => loadChat(item.id);
                
                // --- Context Menu ---
                itemDiv.oncontextmenu = (e) => {
                    e.preventDefault();
                    rightClickedId = item.id;
                    contextMenu.style.display = 'block';
                    contextMenu.style.left = `${e.pageX}px`;
                    contextMenu.style.top = `${e.pageY}px`;
                };

                groupDiv.appendChild(itemDiv);
            });
            
            historyContainer.appendChild(groupDiv);
        }

        applyHistoryFilter();
    }

    function applyHistoryFilter() {
        if (!historyContainer) return;
        const query = (sidebarSearchInput?.value || '').trim().toLowerCase();
        const groups = historyContainer.querySelectorAll('.history-group');

        groups.forEach(group => {
            const items = Array.from(group.querySelectorAll('.history-item'));
            let visibleCount = 0;

            items.forEach(item => {
                const matches = !query || item.textContent.toLowerCase().includes(query);
                item.style.display = matches ? '' : 'none';
                if (matches) visibleCount += 1;
            });

            group.style.display = visibleCount > 0 ? '' : 'none';
        });
    }

    function saveChat() {
        if (!chatWindow) return;
        if (!currentChatId) {
            currentChatId = Date.now().toString();
        }

        const filePath = path.join(chatsDir, `${currentChatId}.json`);
        let existingData = {};
        if (fs.existsSync(filePath)) {
            try {
                existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            } catch (e) {
                console.error("Error reading existing chat data:", e);
            }
        }

        const messages = Array.from(chatWindow.querySelectorAll('.message')).map(div => {
            return {
                role: div.classList.contains('ai-message') ? 'ai' : 'user',
                text: div.textContent
            };
        });

        // Preserve custom title if it exists and isn't a default/empty one
        let title = existingData.title || 'New Chat';
        
        // If it's a default title, try to generate one from the first user message
        if (title === 'New Chat') {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg) {
                title = firstUserMsg.text.substring(0, 25);
                if (firstUserMsg.text.length > 25) title += '...';
            }
        }

        const chatData = {
            title: title,
            timestamp: existingData.timestamp || parseInt(currentChatId),
            messages: messages
        };

        fs.writeFileSync(filePath, JSON.stringify(chatData, null, 2));
        loadHistory();
    }

    function loadChat(id) {
        currentChatId = id;
        const filePath = path.join(chatsDir, `${id}.json`);
        let data;
        try {
            data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch (err) {
            console.error(`Could not load chat: ${id}`, err);
            currentChatId = null;
            startNewChat();
            return;
        }
        
        chatWindow.innerHTML = '';
        const messages = Array.isArray(data.messages) ? data.messages : [];
        messages.forEach(msg => appendMessage(msg.role, msg.text));
        hideWelcomeOverlay();
        loadHistory();
    }

    function startNewChat() {
        currentChatId = null;
        chatWindow.innerHTML = '';
        showWelcomeOverlay();
        loadHistory();
    }

    // --- CONTEXT MENU ACTIONS ---

    window.addEventListener('click', () => {
        contextMenu.style.display = 'none';
    });

    ctxDelete.addEventListener('click', () => {
        if (!rightClickedId) return;
        const filePath = path.join(chatsDir, `${rightClickedId}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            if (currentChatId === rightClickedId) {
                startNewChat();
            } else {
                loadHistory();
            }
        }
    });

    ctxRename.addEventListener('click', (e) => {
        e.stopPropagation();
        contextMenu.style.display = 'none';
        if (!rightClickedId) return;

        const filePath = path.join(chatsDir, `${rightClickedId}.json`);
        if (!fs.existsSync(filePath)) return;

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            renameInput.value = data.title || '';
            renameModal.style.display = 'flex';
            renameInput.focus();
            renameInput.select();
        } catch (err) {
            console.error("Could not open chat for rename:", err);
        }
    });

    renameCancel.addEventListener('click', () => {
        renameModal.style.display = 'none';
        rightClickedId = null;
    });

    renameConfirm.addEventListener('click', () => {
        const newTitle = renameInput.value.trim();
        if (newTitle && rightClickedId) {
            const filePath = path.join(chatsDir, `${rightClickedId}.json`);
            try {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                data.title = newTitle;
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                loadHistory();
            } catch (err) {
                console.error("Rename failed:", err);
            }
        }
        renameModal.style.display = 'none';
        rightClickedId = null;
    });

    if (sidebarSearchInput) {
        sidebarSearchInput.addEventListener('input', applyHistoryFilter);
    }

    renameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            renameConfirm.click();
        } else if (e.key === 'Escape') {
            renameCancel.click();
        }
    });

    // --- EVENT LISTENERS ---

    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebarState();
        });
    }

    if (debugBtn) {
        debugBtn.addEventListener('click', () => {
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('toggle-devtools');
        });
    }

    if (chatInput && sendBtn) {
        chatInput.addEventListener('input', () => {
            sendBtn.disabled = !chatInput.value.trim();
            adjustTextareaHeight();
        });
    }

    if (expandInputBtn && inputContainer && chatInput) {
        expandInputBtn.addEventListener('click', () => {
            inputContainer.classList.toggle('expanded');
            expandInputBtn.setAttribute(
                'aria-label',
                inputContainer.classList.contains('expanded') ? 'Shrink input' : 'Expand input'
            );
            adjustTextareaHeight();
            chatInput.focus();
        });
    }

    window.addEventListener('resize', adjustTextareaHeight);

    if (sendBtn && chatInput) {
        sendBtn.addEventListener('click', () => {
            const text = chatInput.value.trim();
            if (text) {
                appendMessage('user', text);
                chatInput.value = '';
                sendBtn.disabled = true;
                adjustTextareaHeight();

                // Save immediately after user message
                saveChat();
                hideWelcomeOverlay();

                // AI Response simulation
                setTimeout(() => {
                    appendMessage('ai', "I'm processing your request in the Flower Matrix. (Functional JSON saving active)");
                    saveChat();
                }, 800);
            }
        });

        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBtn.click();
            }
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', startNewChat);
    }
    if (newChatFloatingBtn) {
        newChatFloatingBtn.addEventListener('click', startNewChat);
    }

    // Initial Load
    loadHistory();
    // Default state
    document.body.classList.remove('sidebar-hidden');
    // Show greeting on initial load (new chat state)
    showWelcomeOverlay();
});

class XToast {
    constructor() {
        this.containers = new Map();
        this.toastInstances = new Map();
        this.plugins = new Map();
        this.templates = new Map();
        this.state = new Map();
        this.toastHistory = [];
        this.offlineQueue = [];
        this.abTests = new Map();
        this.featureFlags = new Map();
        this.easterEggs = new Map();
        this.performanceMetrics = {
            renderTime: 0,
            memoryUsage: 0
        };

        this.defaultOptions = {
            duration: 4000,
            position: "top-center",
            radius: "rounded-2xl",
            type: "info"
        };

        this.config = {
            version: "4.0.0",
            silentMode: false,
            maxToasts: 8,
            enableAI: false,
            security: {
                maxToastsPerMinute: 120,
                allowedDomains: ['*'],
                contentFilters: [],
                encryptSensitive: false
            },
            performance: {
                virtualization: true,
                lazyLoad: true,
                compression: true
            },
            animations: {
                enter: "translate-y-[-150%] opacity-0",
                leave: "translate-y-[-150%] opacity-0",
                duration: 500
            },
            responsive: {
                mobile: "bottom-center",
                tablet: "top-right",
                desktop: "top-right",
                breakpoints: { mobile: 768, tablet: 1024 }
            },
            integrations: {
                analytics: null,
                crm: null,
                helpdesk: null
            },
            ai: {
                optimizePosition: true,
                predictDismiss: true,
                personalizeContent: true
            }
        };

        this.allowedPositions = ["top-center", "top-left", "top-right", "bottom-center", "bottom-left", "bottom-right"];
        this.allowedRadius = ["rounded-none", "rounded-lg", "rounded-xl", "rounded-2xl", "rounded-3xl", "rounded-full"];

        this.icons = {
            success: "text-emerald-400",
            error: "text-red-400",
            warning: "text-amber-400",
            info: "text-blue-400",
            loading: "text-purple-400"
        };

        this.ringColors = {
            success: "stroke-emerald-400",
            error: "stroke-red-400",
            warning: "stroke-amber-400",
            info: "stroke-blue-400",
            loading: "stroke-purple-400"
        };

        this.init();
    }

    init() {
        this.loadConfig();
        this.initContainers();
        this.setupEventListeners();
        this.loadPlugins();
        this.initAI();

        if (!this.config.silentMode) {
            this.checkForUpdates();
        }
    }

    loadConfig() {
        const userConfig = window.XTOAST_CONFIG || {};
        this.config = { ...this.config, ...userConfig };
    }

    initContainers() {
        this.allowedPositions.forEach(position => {
            const containerId = `xtoast-${position.replace('-', '')}`;
            let container = document.getElementById(containerId);

            if (!container) {
                container = document.createElement("div");
                container.id = containerId;
                container.className = this.getContainerClass(position);
                container.setAttribute('data-xtoast-container', 'true');
                document.body.appendChild(container);
            }

            this.containers.set(position, container);
        });
    }

    getContainerClass(position) {
        const positions = {
            "top-center": "fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-3 px-4 pointer-events-none",
            "top-left": "fixed top-4 left-4 z-[9999] flex flex-col items-start gap-3 pointer-events-none",
            "top-right": "fixed top-4 right-4 z-[9999] flex flex-col items-end gap-3 pointer-events-none",
            "bottom-center": "fixed inset-x-0 bottom-4 z-[9999] flex flex-col items-center gap-3 px-4 pointer-events-none",
            "bottom-left": "fixed bottom-4 left-4 z-[9999] flex flex-col items-start gap-3 pointer-events-none",
            "bottom-right": "fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-3 pointer-events-none"
        };

        return positions[position] || positions["top-center"];
    }

    setupEventListeners() {
        window.addEventListener('online', () => this.processOfflineQueue());
        window.addEventListener('offline', () => { this.isOnline = false; });

        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.currentBreakpoint = this.getCurrentBreakpoint();
            }, 250);
        });
    }

    loadPlugins() {
        this.plugins.forEach(hooks => {
            if (hooks.onInit) hooks.onInit();
        });
    }

    initAI() {
        if (this.config.enableAI) {
            this.setupAIOptimization();
        }
    }

    setupAIOptimization() {
        console.log("Otimização por IA ativada");
    }

    checkForUpdates() {
        const lastVersion = localStorage.getItem('xtoast-version');
        if (this.config.version !== lastVersion) {
            setTimeout(() => {
                this.create({
                    message: `XToast atualizado para v${this.config.version}`,
                    type: "info",
                    position: "top-right",
                    duration: 5000
                });
            }, 1000);
            localStorage.setItem('xtoast-version', this.config.version);
        }
    }

    getCurrentBreakpoint() {
        if (typeof window === 'undefined') return 'desktop';
        const width = window.innerWidth;
        const breakpoints = this.config.responsive.breakpoints;
        if (width < breakpoints.mobile) return 'mobile';
        if (width < breakpoints.tablet) return 'tablet';
        return 'desktop';
    }

    getResponsivePosition(requestedPosition) {
        const breakpoint = this.currentBreakpoint || this.getCurrentBreakpoint();
        const responsivePosition = this.config.responsive[breakpoint];
        return this.allowedPositions.includes(responsivePosition) ? responsivePosition : requestedPosition;
    }

    parseArguments(message, position, duration, options = {}) {
        const result = { message };

        if (typeof position === 'string' && this.allowedPositions.includes(position)) {
            result.position = position;
        } else if (typeof position === 'number') {
            result.duration = position;
            result.position = this.defaultOptions.position;
        } else {
            result.position = this.defaultOptions.position;
        }

        if (typeof duration === 'number') {
            result.duration = duration;
        } else if (typeof duration === 'string' && this.allowedPositions.includes(duration)) {
            result.position = duration;
        }

        return { ...result, ...options };
    }

    validateOptions(opts) {
        const validated = { ...this.defaultOptions, ...opts };

        if (!this.allowedPositions.includes(validated.position)) {
            validated.position = this.defaultOptions.position;
        }

        if (!this.allowedRadius.includes(validated.radius)) {
            validated.radius = this.defaultOptions.radius;
        }

        validated.duration = Math.max(0, parseInt(validated.duration) || this.defaultOptions.duration);

        return validated;
    }

    sanitizeHTML(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    generateUniqueId() {
        return 'xtoast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    getIconSVG(type) {
        const icons = {
            success: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 15-5.5 5.5L9 18"/><path d="M5 17.743A7 7 0 1 1 15.71 10h1.79a4.5 4.5 0 0 1 1.5 8.742"/></svg>`,
            error: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`,
            warning: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
            info: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
            loading: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`
        };
        return icons[type] || icons.info;
    }

    createProgressRing(duration, type) {
        const circumference = 2 * Math.PI * 20;
        const ringColor = this.ringColors[type];

        if (type === "loading" || duration === 0) {
            return `<svg class="w-12 h-12" aria-hidden="true"><circle cx="24" cy="24" r="20" stroke="#1f2937" stroke-width="7" fill="none"/></svg>`;
        }

        return `
            <svg class="w-12 h-12 -rotate-90" aria-hidden="true">
                <circle cx="24" cy="24" r="20" stroke="#1f2937" stroke-width="7" fill="none"/>
                <circle cx="24" cy="24" r="20" stroke="" class="${ringColor} progress-ring" stroke-width="5" stroke-linecap="round"
                    fill="none" stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}">
                    <animate attributeName="stroke-dashoffset" from="${circumference}" to="0" dur="${duration}ms" fill="freeze"/>
                </circle>
            </svg>
        `;
    }

    createActionButtons(actions, toastId) {
        if (!actions || !Array.isArray(actions) || actions.length === 0) return '';

        return `
            <div class="flex gap-2 mt-3">
                ${actions.map((action, index) => `
                    <button
                        class="px-3 py-1.5 text-xs font-medium rounded-lg border border-white/20 hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                        onclick="window.handleXToastAction('${toastId}', ${index})"
                        type="button"
                    >
                        ${action.text}
                    </button>
                `).join('')}
            </div>
        `;
    }

    createProgressBar(progress, toastId) {
        if (progress === undefined) return '';

        const percentage = `
            <div class="text-xs text-white/70 mt-1 text-right">${progress}%</div>
        `;

        return `
            <div class="w-full mt-3">
                <div class="w-full bg-white/20 rounded-full h-2">
                    <div
                        class="bg-emerald-400 h-2 rounded-full transition-all duration-300 progress-bar"
                        style="width: ${progress}%"
                        data-toast-id="${toastId}"
                    ></div>
                </div>
                ${percentage}
            </div>
        `;
    }

    createRichMedia(content) {
        if (!content) return '';

        let mediaHTML = '';
        const hasAvatar = content.avatar;
        const hasImage = content.image;
        const hasTitle = content.title;
        const hasSubtitle = content.subtitle;

        if (hasAvatar || hasImage) {
            mediaHTML += '<div class="flex items-start gap-3 mb-2">';

            if (hasAvatar) {
                mediaHTML += `<img src="${content.avatar}" class="w-10 h-10 rounded-full flex-shrink-0" alt="Avatar">`;
            }

            mediaHTML += '<div class="flex-1 min-w-0">';

            if (hasTitle) {
                mediaHTML += `<div class="font-semibold text-sm text-white">${content.title}</div>`;
            }

            if (hasSubtitle) {
                mediaHTML += `<div class="text-xs text-white/70 mt-1">${content.subtitle}</div>`;
            }

            mediaHTML += '</div>';

            if (hasImage && !hasAvatar) {
                mediaHTML += `<img src="${content.image}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="Preview">`;
            }

            mediaHTML += '</div>';
        }

        return mediaHTML;
    }

    create(opts) {
        if (this.config.silentMode && opts.type !== 'error') {
            return { remove: () => {}, updateProgress: () => {}, morph: () => {} };
        }

        const safeOpts = typeof opts === 'string' ? { message: opts } : opts;
        const validatedOpts = this.validateOptions(safeOpts);

        const o = {
            ...validatedOpts,
            position: this.getResponsivePosition(validatedOpts.position),
            message: this.config.security.sanitizeHTML ? this.sanitizeHTML(validatedOpts.message || '') : validatedOpts.message
        };

        const container = this.containers.get(o.position);
        if (!container) {
            return { remove: () => {}, updateProgress: () => {}, morph: () => {} };
        }

        const toast = document.createElement("div");
        const toastId = this.generateUniqueId();

        const actionButtons = this.createActionButtons(o.actions, toastId);
        const progressBar = this.createProgressBar(o.progress, toastId);
        const richMedia = this.createRichMedia(o.richMedia);

        toast.id = toastId;
        toast._actions = o.actions;

        const animationClass = this.config.animations.enter;

        toast.className = `pointer-events-auto relative bg-gray-900/95 backdrop-blur-xl border border-white/10 ${o.radius} shadow-2xl overflow-hidden w-full max-w-sm p-4 text-white cursor-pointer transform ${animationClass} transition-all duration-500`;

        toast.setAttribute('data-xtoast-element', 'true');
        toast.setAttribute('data-position', o.position);

        const hasRichMedia = o.richMedia && (o.richMedia.avatar || o.richMedia.image);

        toast.innerHTML = `
            <div class="flex items-start gap-3 w-full">
                <div class="relative flex-shrink-0">
                    ${this.createProgressRing(o.duration, o.type)}
                    <div class="absolute inset-0 flex items-center justify-center ${this.icons[o.type]}" aria-hidden="true">
                        ${this.getIconSVG(o.type)}
                    </div>
                </div>

                <div class="flex-1 min-w-0">
                    ${hasRichMedia ? richMedia : ''}

                    <div class="text-sm font-medium ${hasRichMedia ? 'mt-2' : ''}">${o.message}</div>

                    ${progressBar}
                    ${actionButtons}
                </div>

                <button class="flex-shrink-0 w-5 h-5 opacity-50 hover:opacity-100 transition-opacity mt-1"
                        aria-label="Fechar notificação"
                        onclick="window.xtoast.handleClose('${toastId}')">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 4L4 12M4 4l8 8"/>
                    </svg>
                </button>
            </div>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            if (document.body.contains(toast)) {
                toast.classList.remove(...animationClass.split(' '));
                toast.classList.add("translate-y-0", "opacity-100");
            }
        });

        this.toastHistory.push({
            id: toastId,
            type: o.type,
            message: o.message,
            position: o.position,
            timestamp: Date.now()
        });

        if (this.toastHistory.length > 100) {
            this.toastHistory.shift();
        }

        let timer;
        const start = performance.now();

        if (o.duration > 0 && o.type !== "loading") {
            timer = setTimeout(() => {
                if (document.body.contains(toast)) {
                    this.removeToast(toast);
                }
            }, o.duration);
        }

        const safeMouseEnter = () => {
            if (o.type !== "loading") {
                clearTimeout(timer);
            }
        };

        const safeMouseLeave = () => {
            if (o.duration > 0 && o.type !== "loading" && document.body.contains(toast)) {
                const elapsed = performance.now() - start;
                const remain = o.duration - elapsed;
                if (remain > 0) {
                    timer = setTimeout(() => {
                        if (document.body.contains(toast)) {
                            this.removeToast(toast);
                        }
                    }, remain);
                }
            }
        };

        if (o.type !== "loading") {
            toast.addEventListener('mouseenter', safeMouseEnter);
            toast.addEventListener('mouseleave', safeMouseLeave);
        }

        this.triggerPluginHook('toastCreated', { toast, options: o });

        return {
            remove: () => {
                if (document.body.contains(toast)) {
                    this.removeToast(toast);
                }
            },
            updateProgress: (progress) => {
                this.updateProgress(toastId, progress);
            },
            morph: (newOptions) => {
                this.morphToast(toastId, newOptions);
            },
            id: toastId
        };
    }

    removeToast(toast) {
        if (!toast || !document.body.contains(toast)) return;

        toast.classList.replace("translate-y-0", "translate-y-[-150%]");
        toast.classList.replace("opacity-100", "opacity-0");

        const removeElement = () => {
            if (document.body.contains(toast)) {
                toast.remove();
                this.triggerPluginHook('toastRemoved', { toast });
            }
        };

        toast.addEventListener("transitionend", removeElement, { once: true });
        setTimeout(removeElement, 1000);
    }

    updateProgress(toastId, progress) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        const progressBar = toast.querySelector('.progress-bar');
        const percentageText = toast.querySelector('.text-xs');

        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        if (percentageText) {
            percentageText.textContent = `${progress}%`;
        }

        if (progress >= 100) {
            setTimeout(() => this.removeToast(toast), 1000);
        }
    }

    morphToast(toastId, newOptions) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        this.removeToast(toast);
        setTimeout(() => {
            this.create(newOptions);
        }, 300);
    }

    handleClose(toastId) {
        const toast = document.getElementById(toastId);
        if (toast) {
            this.removeToast(toast);
        }
    }

    handleAction(toastId, actionIndex) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        const action = toast._actions?.[actionIndex];
        if (action && action.onClick) {
            action.onClick();
        }

        if (action?.dismiss !== false) {
            this.removeToast(toast);
        }
    }

    triggerPluginHook(hookName, data) {
        this.plugins.forEach(hooks => {
            if (hooks[hookName]) {
                hooks[hookName](data);
            }
        });
    }

    processOfflineQueue() {
        while (this.offlineQueue.length > 0) {
            const queuedToast = this.offlineQueue.shift();
            this.create(queuedToast);
        }
    }

    setState(key, value) {
        this.state.set(key, value);
        this.triggerPluginHook('stateChanged', { key, value });
    }

    getState(key) {
        return this.state.get(key);
    }

    navigation(message, position, duration, options = {}) {
        const parsed = this.parseArguments(message, position, duration, options);
        return this.create({
            ...parsed,
            actions: [
                ...(parsed.actions || []),
                {
                    text: parsed.routeText || "Abrir",
                    onClick: () => {
                        if (parsed.onNavigate) {
                            parsed.onNavigate(parsed.route, parsed.params);
                        } else if (parsed.route) {
                            window.location.href = parsed.route;
                        }
                    }
                }
            ]
        });
    }

    createInstance(name, config = {}) {
        const instance = {
            config: { ...this.config, ...config },
            create: (opts) => this.create({ ...opts, _instance: name })
        };
        this.toastInstances.set(name, instance);
        return instance;
    }

    conditional(message, position, duration, options = {}) {
        const parsed = this.parseArguments(message, position, duration, options);

        if (options.conditions && !this.checkConditions(options.conditions)) {
            return { remove: () => {}, updateProgress: () => {}, morph: () => {} };
        }

        return this.create(parsed);
    }

    checkConditions(conditions) {
        return true;
    }

    registerTemplate(name, template) {
        this.templates.set(name, template);
    }

    useTemplate(name, variables = {}) {
        const template = this.templates.get(name);
        if (!template) return null;

        let message = template.message;
        Object.keys(variables).forEach(key => {
            message = message.replace(`{${key}}`, variables[key]);
        });

        return this.create({ ...template, message, ...variables });
    }

    carousel(messages, position, duration, options = {}) {
        const carouselId = `carousel-${Date.now()}`;
        let currentIndex = 0;

        const showSlide = (index) => {
            const slide = messages[index];
            this.create({
                ...options,
                ...slide,
                position,
                duration,
                _carousel: carouselId,
                actions: [
                    ...(slide.actions || []),
                    {
                        text: "Próximo",
                        onClick: () => showSlide((index + 1) % messages.length)
                    }
                ]
            });
        };

        showSlide(0);
        return carouselId;
    }

    showMiniMap() {
        const miniMap = document.createElement('div');
        miniMap.className = 'fixed bottom-4 left-4 z-[10000] bg-gray-900/90 p-4 rounded-lg backdrop-blur-xl border border-white/10';
        miniMap.innerHTML = '<h3 class="text-white font-semibold mb-2 text-sm">Toasts Ativos</h3>';

        this.containers.forEach((container, position) => {
            const toasts = container.querySelectorAll('[data-xtoast-element]');
            if (toasts.length > 0) {
                const positionEl = document.createElement('div');
                positionEl.className = 'text-white text-xs mb-1';
                positionEl.textContent = `${position}: ${toasts.length}`;
                miniMap.appendChild(positionEl);
            }
        });

        document.body.appendChild(miniMap);
        setTimeout(() => miniMap.remove(), 5000);
    }

    celebration(message, position, duration, options = {}) {
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }

        const parsed = this.parseArguments(`${message} 🎉`, position, duration, options);
        return this.create({
            ...parsed,
            type: 'success',
            duration: 5000
        });
    }

    rich(message, mediaOptions, position, duration, options = {}) {
        const parsed = this.parseArguments(message, position, duration, options);
        return this.create({
            ...parsed,
            richMedia: mediaOptions
        });
    }

    payment(message, position, duration, options = {}) {
        const parsed = this.parseArguments(message, position, duration, options);
        return this.create({
            ...parsed,
            type: 'success',
            actions: [
                ...(parsed.actions || []),
                { text: "Recibo", onClick: () => console.log("Mostrar recibo") }
            ]
        });
    }

    helpdesk(message, position, duration, options = {}) {
        const parsed = this.parseArguments(message, position, duration, options);
        return this.create({
            ...parsed,
            type: 'info',
            actions: [
                ...(parsed.actions || []),
                { text: "Ver Ticket", onClick: () => console.log("Abrir ticket") }
            ]
        });
    }

    registerPlugin(name, hooks) {
        this.plugins.set(name, hooks);
    }

    enableVoiceCommands(commands) {
        console.log("Comandos de voz ativados:", commands);
    }

    enableGestureControls(gestures) {
        console.log("Controles por gesto ativados:", gestures);
    }

    enableGDPRMode() {
        this.config.security.gdprCompliant = true;
    }

    triggerHaptic(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }

    registerEasterEgg(name, sequence, action) {
        this.easterEggs.set(name, { sequence, action });
    }

    show(message, position, duration, options = {}) {
        const parsed = this.parseArguments(message, position, duration, options);
        return this.create(parsed);
    }

    success(message, position, duration, options = {}) {
        const parsed = this.parseArguments(message, position, duration, options);
        return this.create({ ...parsed, type: "success" });
    }

    error(message, position, duration, options = {}) {
        const parsed = this.parseArguments(message, position, duration, options);
        return this.create({ ...parsed, type: "error" });
    }

    warning(message, position, duration, options = {}) {
        const parsed = this.parseArguments(message, position, duration, options);
        return this.create({ ...parsed, type: "warning" });
    }

    info(message, position, duration, options = {}) {
        const parsed = this.parseArguments(message, position, duration, options);
        return this.create({ ...parsed, type: "info" });
    }

    loading(message = "Carregando...", position, duration, options = {}) {
        const parsed = this.parseArguments(message, position, duration, options);
        return this.create({ ...parsed, type: "loading", duration: 0 });
    }

    destroy() {
        this.containers.forEach(container => {
            const toasts = container.querySelectorAll('[data-xtoast-element]');
            toasts.forEach(toast => toast.remove());
        });
    }
}

if (!window.xtoast) {
    window.xtoast = new XToast();
    window.handleXToastAction = (toastId, actionIndex) => {
        window.xtoast.handleAction(toastId, actionIndex);
    };
    window.handleXToastClose = (toastId) => {
        window.xtoast.handleClose(toastId);
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = XToast;
}

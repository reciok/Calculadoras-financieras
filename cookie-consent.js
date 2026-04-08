/*
 * Banner de cookies minimalista y no bloqueante.
 * Cumplimiento: no se activa ninguna cookie no técnica antes del consentimiento.
 */
(function () {
    const STORAGE_KEY = 'zyvola_cookie_consent_v1';

    function readConsent() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (_) {
            return null;
        }
    }

    function saveConsent(consent) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    }

    function applyConsent(consent) {
        // Solo se cargarían scripts opcionales si existen y el usuario los acepta.
        const optionalScripts = document.querySelectorAll('script[data-cookie-category]');
        optionalScripts.forEach((script) => {
            const category = script.getAttribute('data-cookie-category');
            const allowed = category && consent && consent[category] === true;
            if (allowed && !script.dataset.loaded && script.dataset.src) {
                const s = document.createElement('script');
                s.src = script.dataset.src;
                s.async = true;
                document.head.appendChild(s);
                script.dataset.loaded = 'true';
            }
        });
    }

    function removeBanner() {
        const el = document.getElementById('cookieBannerZyvola');
        if (el) el.remove();
    }

    function buildBanner() {
        const banner = document.createElement('aside');
        banner.id = 'cookieBannerZyvola';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Gestión de cookies');
        banner.style.position = 'fixed';
        banner.style.left = '16px';
        banner.style.right = '16px';
        banner.style.bottom = '16px';
        banner.style.zIndex = '9999';
        banner.style.background = 'rgba(20,20,20,0.96)';
        banner.style.border = '1px solid rgba(212,175,55,0.35)';
        banner.style.borderRadius = '12px';
        banner.style.padding = '14px';
        banner.style.boxShadow = '0 10px 28px rgba(0,0,0,0.28)';
        banner.style.color = '#f5f5f5';
        banner.style.fontFamily = 'Manrope, sans-serif';
        banner.style.maxWidth = '980px';
        banner.style.margin = '0 auto';

        banner.innerHTML = [
            '<p style="margin:0 0 10px 0; font-size:14px; line-height:1.45;">',
            'Usamos cookies técnicas para el funcionamiento de la web y cookies opcionales solo con tu consentimiento. ',
            '<a href="politica-cookies.html" style="color:#d4af37;">Más información</a>.',
            '</p>',
            '<div id="cookieConfigPanelZyvola" hidden style="margin:0 0 10px 0; padding:10px; border:1px solid rgba(212,175,55,0.25); border-radius:10px;">',
            '<label style="display:flex; gap:8px; align-items:center; margin-bottom:8px;"><input type="checkbox" checked disabled> Cookies técnicas (obligatorias)</label>',
            '<label style="display:flex; gap:8px; align-items:center; margin-bottom:8px;"><input id="cookieAnalyticsZyvola" type="checkbox"> Cookies de analítica</label>',
            '<label style="display:flex; gap:8px; align-items:center;"><input id="cookieMarketingZyvola" type="checkbox"> Cookies de marketing</label>',
            '</div>',
            '<div style="display:flex; flex-wrap:wrap; gap:8px;">',
            '<button id="cookieAcceptZyvola" type="button" style="padding:8px 12px; border:0; border-radius:8px; background:#8f6a1a; color:#fff; cursor:pointer;">Aceptar</button>',
            '<button id="cookieRejectZyvola" type="button" style="padding:8px 12px; border:1px solid rgba(212,175,55,0.4); border-radius:8px; background:transparent; color:#f5f5f5; cursor:pointer;">Rechazar</button>',
            '<button id="cookieConfigZyvola" type="button" style="padding:8px 12px; border:1px solid rgba(212,175,55,0.4); border-radius:8px; background:transparent; color:#f5f5f5; cursor:pointer;">Configurar</button>',
            '<button id="cookieSaveZyvola" type="button" hidden style="padding:8px 12px; border:0; border-radius:8px; background:#d4af37; color:#111; cursor:pointer;">Guardar configuración</button>',
            '</div>'
        ].join('');

        document.body.appendChild(banner);

        const panel = document.getElementById('cookieConfigPanelZyvola');
        const btnConfig = document.getElementById('cookieConfigZyvola');
        const btnSave = document.getElementById('cookieSaveZyvola');
        const btnAccept = document.getElementById('cookieAcceptZyvola');
        const btnReject = document.getElementById('cookieRejectZyvola');

        btnConfig.addEventListener('click', function () {
            const open = panel.hasAttribute('hidden');
            if (open) {
                panel.removeAttribute('hidden');
                btnSave.hidden = false;
            } else {
                panel.setAttribute('hidden', 'hidden');
                btnSave.hidden = true;
            }
        });

        btnAccept.addEventListener('click', function () {
            const consent = { technical: true, analytics: true, marketing: true, timestamp: Date.now() };
            saveConsent(consent);
            applyConsent(consent);
            removeBanner();
        });

        btnReject.addEventListener('click', function () {
            const consent = { technical: true, analytics: false, marketing: false, timestamp: Date.now() };
            saveConsent(consent);
            removeBanner();
        });

        btnSave.addEventListener('click', function () {
            const analytics = !!document.getElementById('cookieAnalyticsZyvola')?.checked;
            const marketing = !!document.getElementById('cookieMarketingZyvola')?.checked;
            const consent = { technical: true, analytics: analytics, marketing: marketing, timestamp: Date.now() };
            saveConsent(consent);
            applyConsent(consent);
            removeBanner();
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        const existing = readConsent();
        if (existing) {
            applyConsent(existing);
            return;
        }
        buildBanner();
    });
})();

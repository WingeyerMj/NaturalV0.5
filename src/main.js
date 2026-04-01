/**
 * ═══════════════════════════════════════════════════════════
 * NATURALFOOD - Main Entry Point
 * Agricultural Management Platform
 * 
 * Architecture: MVC (Model-View-Controller)
 * ═══════════════════════════════════════════════════════════
 */

import './styles/main.css';
import './styles/new_landing.css';
import { AppController } from './controllers/AppController.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new AppController();
    app.init();

    // Scroll Management for New Header
    const handleScroll = (e) => {
        const header = document.getElementById('mainHeader');
        if (!header) return;

        // Check scroll from window OR the target element (if internal scroll is happening)
        const scrollTop = window.scrollY || e.target.scrollTop || 0;

        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    // Mobile Menu Toggle for New Landing (delegation since it's dynamic)
    document.addEventListener('click', (e) => {
        if (e.target.id === 'btnMenu') {
            const nav = document.querySelector('.menu-menu-principal-container');
            if (nav) nav.classList.toggle('open');
        }
    });

    // Check for charts and show mobile portrait rotation suggestion
    // Use MutationObserver instead of setInterval for better performance
    const observer = new MutationObserver(() => {
        const suggestion = document.getElementById('rotate-device-suggestion');
        if (!suggestion || suggestion.style.display === 'none') return;

        const hasCharts = document.querySelector('canvas') || document.querySelector('.chart-container');
        if (hasCharts) {
            suggestion.classList.add('active');
        } else {
            suggestion.classList.remove('active');
        }
    });
    observer.observe(document.getElementById('app'), { childList: true, subtree: true });
});

(() => {
  'use strict';
  const root = document.documentElement;
  const languageButton = document.querySelector('#language-toggle');
  const menuButton = document.querySelector('#menu-toggle');
  const navigation = document.querySelector('#site-navigation');
  const dialog = document.querySelector('#citation-dialog');
  const citationContent = document.querySelector('#citation-content');
  const copyStatus = document.querySelector('#copy-status');
  const citations = JSON.parse(document.querySelector('#citation-data').textContent);
  let currentCitation = null;
  let lastCitationButton = null;
  const isChinese = () => root.dataset.language === 'zh';

  function setLanguage(language, persist = true) {
    const chinese = language === 'zh';
    root.dataset.language = chinese ? 'zh' : 'en';
    root.lang = chinese ? 'zh-CN' : 'en';
    languageButton.textContent = chinese ? 'EN' : '中文';
    languageButton.setAttribute('aria-label', chinese ? 'Switch to English' : 'Switch to Chinese');
    navigation.setAttribute('aria-label', chinese ? '主导航' : 'Main navigation');
    document.querySelector('#close-citation').setAttribute('aria-label', chinese ? '关闭引用' : 'Close citation');
    document.title = chinese ? 'Yifan Bai · 优化与形式化推理' : 'Yifan Bai · Optimization & Formal Reasoning';
    document.querySelector('.portrait-card img').alt = chinese ? 'Yifan Bai 的照片' : 'Portrait of Yifan Bai';
    copyStatus.textContent = '';
    updateMenuLabel();
    if (persist) { try { localStorage.setItem('yb-language', chinese ? 'zh' : 'en'); } catch (_) {} }
  }
  languageButton.addEventListener('click', () => setLanguage(isChinese() ? 'en' : 'zh'));

  function updateMenuLabel() {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-label', isChinese() ? (open ? '关闭导航' : '打开导航') : (open ? 'Close navigation' : 'Open navigation'));
    menuButton.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  }
  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
    updateMenuLabel();
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('click', (event) => { if (!event.target.closest('.site-header')) setMenu(false); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); }
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', (event) => { if (event.matches) setMenu(false); });

  document.querySelector('.publication-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-citation]');
    if (!button) return;
    currentCitation = { id: button.dataset.citation, ...citations[button.dataset.citation] };
    lastCitationButton = button;
    document.querySelector('#citation-title').textContent = currentCitation.title;
    citationContent.textContent = currentCitation.bibtex;
    copyStatus.textContent = '';
    dialog.showModal();
    document.body.classList.add('dialog-open');
  });
  document.querySelector('#close-citation').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    lastCitationButton?.focus({ preventScroll: true });
  });

  document.querySelector('#copy-citation').addEventListener('click', async () => {
    if (!currentCitation) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(currentCitation.bibtex);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = currentCitation.bibtex;
        textarea.style.cssText = 'position:fixed;left:-9999px;top:0';
        dialog.append(textarea);
        textarea.select();
        let copied;
        try { copied = document.execCommand('copy'); } finally { textarea.remove(); }
        if (!copied) throw new Error('Copy unavailable');
        document.querySelector('#copy-citation').focus();
      }
      copyStatus.textContent = isChinese() ? '已复制到剪贴板。' : 'Copied to clipboard.';
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(citationContent);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = isChinese() ? '请按 ⌘C / Ctrl+C 复制选中的引用，或下载 .bib 文件。' : 'Press ⌘C / Ctrl+C to copy the selected reference, or download the .bib file.';
    }
  });
  document.querySelector('#download-citation').addEventListener('click', () => {
    if (!currentCitation) return;
    const url = URL.createObjectURL(new Blob([`${currentCitation.bibtex}\n`], { type: 'application/x-bibtex;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentCitation.id}.bib`;
    dialog.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const navigationSections = [...document.querySelectorAll('#about, #publications, #code, #mathlib')];
  let navigationUpdatePending = false;
  function updateActiveNavigation() {
    let activeSection = navigationSections[0];
    navigationSections.forEach((section) => {
      if (section.getBoundingClientRect().top <= window.innerHeight * 0.3) activeSection = section;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) activeSection = navigationSections.at(-1);
    navigation.querySelectorAll('a').forEach((link) => {
      if (link.hash === `#${activeSection.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    navigationUpdatePending = false;
  }
  function scheduleNavigationUpdate() {
    if (navigationUpdatePending) return;
    navigationUpdatePending = true;
    requestAnimationFrame(updateActiveNavigation);
  }
  window.addEventListener('scroll', scheduleNavigationUpdate, { passive: true });
  window.addEventListener('resize', scheduleNavigationUpdate);
  window.addEventListener('load', scheduleNavigationUpdate);
  updateActiveNavigation();
  setLanguage(root.dataset.language, false);
})();

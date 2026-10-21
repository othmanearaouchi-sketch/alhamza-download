/**
 * ==========================================================================
 * تطبيق الهمزة (alHamza) - الموقع الرسمي وصفحة التنزيل المستقلة
 * سكريبت إدارة التحميل المباشر مع ميديافاير، المعاينة، والأسئلة الشائعة
 * ==========================================================================
 */

// إعدادات وتكوين رابط التحميل المباشر
const APP_DOWNLOAD_CONFIG = {
  appName: "الهمزة - سوق المستعمل في المغرب",
  version: "Beta 1.0.0",
  fileSize: "72.65 ميغابايت",
  
  // رابط ميديافاير (MediaFire) الرئيسي المباشر - الرابط الرسمي
  mediafireUrl: "https://www.mediafire.com/file/zskswvqn3llii6t/app-user-release.apk/file"
};

document.addEventListener('DOMContentLoaded', () => {
  initDownloadHandlers();
  initFaqAccordion();
  initQrCodeModal();
  initMobileMenu();
  initLegalTocSpy();
});

/**
 * 1. إدارة نقرات وأزرار التحميل مع ميديافاير ومودال العد التنازلي
 */
function initDownloadHandlers() {
  const downloadModal = document.getElementById('downloadModal');
  const modalCloseBtn = document.getElementById('closeModalBtn');
  const countdownNumber = document.getElementById('countdownNumber');
  const countdownCircle = document.getElementById('countdownCircle');
  const directLinkBtn = document.getElementById('directDownloadFallbackBtn');
  const copyDownloadUrlBtn = document.getElementById('copyDownloadUrlBtn');
  const copyDownloadUrlBtnDirect = document.getElementById('copyDownloadUrlBtnDirect');
  
  // أزرار بدء تحميل ميديافاير
  const mediafireTriggers = document.querySelectorAll('.trigger-mediafire-download');
  const downloadClickCounter = document.getElementById('downloadClickCounter');

  let countdownInterval = null;

  const updateDownloadCounter = (count) => {
    if (downloadClickCounter && Number.isFinite(count)) {
      downloadClickCounter.textContent = `إجمالي نقرات التحميل: ${count}`;
    }
  };

  const trackDownloadClick = async () => {
    // يحتفظ المتصفح بعداده الخاص كنسخة احتياطية بسيطة عند انقطاع الشبكة.
    const localCount = Number.parseInt(localStorage.getItem('download_clicks') || '0', 10) + 1;
    localStorage.setItem('download_clicks', String(localCount));

    // التوافق مع أي إصدار مستقبلي من Beacon يدعم الأحداث المخصصة.
    if (window.cloudflareBeacon?.trackEvent) {
      window.cloudflareBeacon.trackEvent('mediafire_download_click');
    }

    try {
      const response = await fetch('/api/track-download', {
        method: 'POST',
        keepalive: true
      });
      const result = await response.json();
      if (result.success) updateDownloadCounter(result.total_downloads);
    } catch {
      updateDownloadCounter(localCount);
    }
  };

  fetch('/api/track-download')
    .then(response => response.json())
    .then(result => {
      if (result.success) updateDownloadCounter(result.total_downloads);
    })
    .catch(() => {
      const localCount = Number.parseInt(localStorage.getItem('download_clicks') || '0', 10);
      updateDownloadCounter(localCount);
    });

  // فتح نافذة التحميل والبدء التلقائي
  const startDownloadFlow = (targetUrl, serverName, downloadWindow) => {
    if (!downloadModal) {
      if (downloadWindow) {
        downloadWindow.location.href = targetUrl;
      } else {
        window.open(targetUrl, '_blank');
      }
      return;
    }

    if (directLinkBtn) {
      directLinkBtn.href = targetUrl;
    }

    const serverLabel = document.getElementById('activeServerLabel');
    if (serverLabel) {
      serverLabel.textContent = serverName || "MediaFire Fast Server";
    }

    downloadModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    let timeLeft = 3;
    if (countdownNumber) countdownNumber.textContent = timeLeft;
    if (countdownCircle) countdownCircle.classList.remove('completed');

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      timeLeft -= 1;
      if (countdownNumber) countdownNumber.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        if (countdownCircle) countdownCircle.classList.add('completed');
        if (countdownNumber) countdownNumber.textContent = "✓";

        setTimeout(() => {
          if (downloadWindow) {
            downloadWindow.location.href = targetUrl;
          } else {
            window.location.href = targetUrl;
          }
          closeDownloadModal();
        }, 500);
      }
    }, 1000);
  };

  // ربط الأزرار
  mediafireTriggers.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const customUrl = btn.getAttribute('data-url') || APP_DOWNLOAD_CONFIG.mediafireUrl;
      const downloadWindow = window.open('about:blank', '_blank');
      if (downloadWindow) downloadWindow.opener = null;
      trackDownloadClick();
      startDownloadFlow(customUrl, "سيرفر MediaFire السريع", downloadWindow);
    });
  });

  if (directLinkBtn) {
    directLinkBtn.addEventListener('click', () => {
      trackDownloadClick();
    });
  }

  // إغلاق المودال
  const closeDownloadModal = () => {
    if (downloadModal) {
      downloadModal.classList.remove('active');
      document.body.style.overflow = '';
      if (countdownInterval) clearInterval(countdownInterval);
    }
  };

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeDownloadModal);
  if (downloadModal) {
    downloadModal.addEventListener('click', (e) => {
      if (e.target === downloadModal) closeDownloadModal();
    });
  }

  // نسخ رابط التحميل
  if (copyDownloadUrlBtn) {
    copyDownloadUrlBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(APP_DOWNLOAD_CONFIG.mediafireUrl);
        const originalText = copyDownloadUrlBtn.textContent;
        copyDownloadUrlBtn.textContent = 'تم نسخ رابط التحميل! ✓';
        setTimeout(() => {
          copyDownloadUrlBtn.textContent = originalText;
        }, 2500);
      } catch (err) {
        alert('رابط التحميل: ' + APP_DOWNLOAD_CONFIG.mediafireUrl);
      }
    });
  }

  // زر المشاركة
  const sharePageBtn = document.getElementById('sharePageBtn');
  if (sharePageBtn) {
    sharePageBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'تطبيق الهمزة - بيع واشترِ من جيرانك في المغرب',
        text: 'حمّل تطبيق الهمزة الرسمي مجاناً بدون وسيط وبدون أي عمولة!',
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (e) {
          // إلغاء المشاركة من قبل المستخدم
        }
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('تم نسخ رابط صفحة التحميل لمشاركتها مع أصدقائك!');
      }
    });
  }
}

/**
 * 2. الأسئلة الشائعة (FAQ Accordion)
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question-btn');
    const answer = item.querySelector('.faq-answer');

    if (questionBtn && answer) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');

        // إغلاق كافة العناصر الأخرى
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
            const otherAnswer = otherItem.querySelector('.faq-answer');
            if (otherAnswer) otherAnswer.style.maxHeight = null;
          }
        });

        // تبديل العنصر الحالي
        if (isOpen) {
          item.classList.remove('active');
          answer.style.maxHeight = null;
        } else {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + "px";
        }
      });
    }
  });
}

// إغلاق النوافذ المنبثقة عند الضغط على زر Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const downloadModal = document.getElementById('downloadModal');
    if (downloadModal) downloadModal.classList.remove('active');
    const qrModal = document.getElementById('qrModal');
    if (qrModal) qrModal.classList.remove('active');
    document.body.style.overflow = '';
  }
});

/**
 * 4. نافذة مسح رمز الاستجابة السريعة (QR Code)
 */
function initQrCodeModal() {
  const qrTriggerBtn = document.getElementById('openQrModalBtn');
  const qrModal = document.getElementById('qrModal');
  const qrCloseBtn = document.getElementById('closeQrModalBtn');
  const qrImage = document.getElementById('qrCodeImage');

  if (!qrModal) return;

  if (qrTriggerBtn) {
    qrTriggerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (qrImage) {
        // توليد QR code ديناميكي برابط التحميل
        const targetUrl = encodeURIComponent(APP_DOWNLOAD_CONFIG.mediafireUrl);
        qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${targetUrl}&bgcolor=ffffff&color=070d17&margin=2`;
      }
      qrModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  const closeQr = () => {
    qrModal.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (qrCloseBtn) qrCloseBtn.addEventListener('click', closeQr);
  qrModal.addEventListener('click', (e) => {
    if (e.target === qrModal) closeQr();
  });
}

/**
 * 5. قائمة الهاتف المحمول (Mobile Menu)
 */
function initMobileMenu() {
  const menuToggle = document.getElementById('mobileMenuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-open');
    });

    // إغلاق القائمة عند النقر على أي رابط
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
      });
    });
  }
}

/**
 * 6. تمييز وتتبع فهرس الصفحات القانونية (Privacy & Terms TOC Spy)
 */
function initLegalTocSpy() {
  const tocLinks = document.querySelectorAll('.legal-toc-link');
  const sections = document.querySelectorAll('.legal-section-block');

  if (tocLinks.length === 0 || sections.length === 0) return;

  window.addEventListener('scroll', () => {
    let currentId = '';
    const scrollPosition = window.scrollY + 140;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPosition >= top && scrollPosition < top + height) {
        currentId = section.getAttribute('id');
      }
    });

    if (currentId) {
      tocLinks.forEach(link => {
        if (link.getAttribute('href') === `#${currentId}`) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  });
}
